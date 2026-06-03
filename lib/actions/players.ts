"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePinAccess, verifyPin, setPinVerified } from "@/lib/pin";
import { playerNameSchema, validatePlayerCount } from "@/lib/validations";

async function ensureDraftManage(
  tournamentId: string,
  pin?: string
): Promise<{ error?: string }> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true },
  });
  if (!tournament) return { error: "Tournament not found" };
  if (tournament.status !== "DRAFT") return { error: "Tournament already started" };

  const access = await requirePinAccess(tournamentId, tournament.pinHash);
  if (!access.ok) {
    if (!pin) return { error: "PIN required" };
    const valid = await verifyPin(pin, tournament.pinHash);
    if (!valid) return { error: "Invalid PIN" };
    await setPinVerified(tournamentId);
  }
  return {};
}

export async function addPlayer(
  tournamentId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const pin = (formData.get("pin") as string) || undefined;
  const check = await ensureDraftManage(tournamentId, pin);
  if (check.error) return check;

  const nameResult = playerNameSchema.safeParse(formData.get("name"));
  if (!nameResult.success) return { error: "Invalid player name" };

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true },
  });
  if (!tournament) return { error: "Tournament not found" };

  if (tournament.players.length >= 16) {
    return { error: "Maximum 16 players" };
  }

  await prisma.player.create({
    data: {
      tournamentId,
      name: nameResult.data,
      sortOrder: tournament.players.length,
    },
  });

  revalidatePath(`/t/${tournamentId}/manage`);
  return {};
}

export async function removePlayer(
  tournamentId: string,
  playerId: string,
  pin?: string
): Promise<{ error?: string }> {
  const check = await ensureDraftManage(tournamentId, pin);
  if (check.error) return check;

  await prisma.player.delete({
    where: { id: playerId, tournamentId },
  });

  revalidatePath(`/t/${tournamentId}/manage`);
  return {};
}

export async function startTournament(
  tournamentId: string,
  pin?: string
): Promise<{ error?: string }> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { players: true },
  });
  if (!tournament) return { error: "Tournament not found" };
  if (tournament.status !== "DRAFT") return { error: "Already started" };

  const access = await requirePinAccess(tournamentId, tournament.pinHash);
  if (!access.ok) {
    if (!pin) return { error: "PIN required" };
    const valid = await verifyPin(pin, tournament.pinHash);
    if (!valid) return { error: "Invalid PIN" };
    await setPinVerified(tournamentId);
  }

  const countError = validatePlayerCount(tournament.players.length);
  if (countError) return { error: countError };

  const { generateNextRoundInternal } = await import("@/lib/actions/rounds");
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "ACTIVE" },
  });

  const roundResult = await generateNextRoundInternal(tournamentId);
  if (roundResult.error) return roundResult;

  revalidatePath(`/t/${tournamentId}`);
  revalidatePath(`/t/${tournamentId}/manage`);
  return {};
}
