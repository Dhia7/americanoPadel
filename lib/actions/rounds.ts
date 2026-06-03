"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { buildHistoryFromMatches } from "@/lib/pairing/history";
import { generateRoundMatches } from "@/lib/pairing/generateRound";
import { requirePinAccess, verifyPin, setPinVerified } from "@/lib/pin";

async function ensureActiveManage(
  tournamentId: string,
  pin?: string
): Promise<{ error?: string; tournament?: Awaited<ReturnType<typeof prisma.tournament.findUnique>> }> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      players: { orderBy: { sortOrder: "asc" } },
      rounds: {
        orderBy: { number: "desc" },
        include: { matches: true },
        take: 1,
      },
    },
  });
  if (!tournament) return { error: "Tournament not found" };
  if (tournament.status !== "ACTIVE") return { error: "Tournament not active" };

  const access = await requirePinAccess(tournamentId, tournament.pinHash);
  if (!access.ok) {
    if (!pin) return { error: "PIN required" };
    const valid = await verifyPin(pin, tournament.pinHash);
    if (!valid) return { error: "Invalid PIN" };
    await setPinVerified(tournamentId);
  }
  return { tournament };
}

export async function generateNextRoundInternal(
  tournamentId: string
): Promise<{ error?: string }> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      players: { orderBy: { sortOrder: "asc" } },
      rounds: {
        orderBy: { number: "asc" },
        include: { matches: true },
      },
    },
  });

  if (!tournament) return { error: "Tournament not found" };
  if (tournament.status !== "ACTIVE") return { error: "Tournament not active" };

  const nextRoundNum = tournament.currentRound + 1;
  if (nextRoundNum > tournament.totalRounds) {
    return { error: "All rounds already generated" };
  }

  if (tournament.currentRound > 0) {
    const current = tournament.rounds.find(
      (r) => r.number === tournament.currentRound
    );
    if (!current) return { error: "Current round missing" };
    const incomplete = current.matches.some((m) => !m.completedAt);
    if (incomplete) return { error: "Complete all matches in the current round first" };
  }

  const priorMatches = await prisma.match.findMany({
    where: { round: { tournamentId }, completedAt: { not: null } },
  });
  const history = buildHistoryFromMatches(priorMatches);

  const playerIds = tournament.players.map((p) => p.id);
  const generated = generateRoundMatches(
    playerIds,
    history,
    tournament.courtCount
  );

  await prisma.$transaction(async (tx) => {
    const round = await tx.round.create({
      data: { tournamentId, number: nextRoundNum },
    });
    await tx.match.createMany({
      data: generated.map((m) => ({
        roundId: round.id,
        court: m.court,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        player3Id: m.player3Id,
        player4Id: m.player4Id,
      })),
    });
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { currentRound: nextRoundNum },
    });
  });

  revalidatePath(`/t/${tournamentId}`);
  revalidatePath(`/t/${tournamentId}/manage`);
  return {};
}

export async function generateNextRound(
  tournamentId: string,
  pin?: string
): Promise<{ error?: string }> {
  const check = await ensureActiveManage(tournamentId, pin);
  if (check.error) return { error: check.error };
  return generateNextRoundInternal(tournamentId);
}

export async function regenerateCurrentRound(
  tournamentId: string,
  pin?: string
): Promise<{ error?: string }> {
  const check = await ensureActiveManage(tournamentId, pin);
  if (check.error) return { error: check.error };

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      players: { orderBy: { sortOrder: "asc" } },
      rounds: {
        where: { number: { gt: 0 } },
        orderBy: { number: "desc" },
        take: 1,
        include: { matches: true },
      },
    },
  });

  if (!tournament || tournament.currentRound === 0) {
    return { error: "No round to regenerate" };
  }

  const round = tournament.rounds[0];
  if (!round) return { error: "Round not found" };
  if (round.matches.some((m) => m.completedAt)) {
    return { error: "Cannot regenerate after scores are entered" };
  }

  const priorMatches = await prisma.match.findMany({
    where: {
      round: { tournamentId },
      completedAt: { not: null },
    },
  });
  const history = buildHistoryFromMatches(priorMatches);
  const playerIds = tournament.players.map((p) => p.id);
  const generated = generateRoundMatches(
    playerIds,
    history,
    tournament.courtCount
  );

  await prisma.$transaction(async (tx) => {
    await tx.match.deleteMany({ where: { roundId: round.id } });
    await tx.match.createMany({
      data: generated.map((m) => ({
        roundId: round.id,
        court: m.court,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        player3Id: m.player3Id,
        player4Id: m.player4Id,
      })),
    });
  });

  revalidatePath(`/t/${tournamentId}`);
  revalidatePath(`/t/${tournamentId}/manage`);
  return {};
}

export async function tryAutoAdvanceRound(tournamentId: string): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      rounds: {
        where: { number: { gt: 0 } },
        orderBy: { number: "desc" },
        take: 1,
        include: { matches: true },
      },
    },
  });

  if (
    !tournament ||
    tournament.status !== "ACTIVE" ||
    !tournament.autoAdvanceRounds
  ) {
    return;
  }

  if (tournament.currentRound >= tournament.totalRounds) return;

  const round = tournament.rounds[0];
  if (!round || round.number !== tournament.currentRound) return;

  const allDone = round.matches.every((m) => m.completedAt);
  if (!allDone) return;

  await generateNextRoundInternal(tournamentId);
}
