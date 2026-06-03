"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPin } from "@/lib/pin";
import {
  addRecentTournamentId,
  getRecentTournamentIds,
  removeRecentTournamentId,
} from "@/lib/recent-cookies";
import { actionErrorMessage } from "@/lib/action-error";
import { createTournamentSchema, playerNameSchema } from "@/lib/validations";

export type CreateTournamentState = { error?: string } | null;

export async function createTournament(
  _prev: CreateTournamentState,
  formData: FormData
): Promise<CreateTournamentState> {
  const raw = {
    name: formData.get("name"),
    totalRounds: formData.get("totalRounds"),
    scoringMode: formData.get("scoringMode"),
    pointsPerMatch: formData.get("pointsPerMatch") || 24,
    durationMinutes: formData.get("durationMinutes") || undefined,
    courtCount: formData.get("courtCount") || 1,
    pin: formData.get("pin") || "",
    autoAdvanceRounds: formData.get("autoAdvanceRounds") === "on",
  };

  const parsed = createTournamentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Please check all fields and try again." };
  }

  const data = parsed.data;
  const pinHash =
    data.pin && data.pin.length === 4 ? await hashPin(data.pin) : null;

  let tournament;
  try {
    tournament = await prisma.tournament.create({
      data: {
        name: data.name,
        totalRounds: data.totalRounds,
        scoringMode: data.scoringMode,
        pointsPerMatch:
          data.scoringMode === "FIXED" ? (data.pointsPerMatch ?? 24) : 24,
        durationMinutes:
          data.scoringMode === "TIMED" ? data.durationMinutes : null,
        courtCount: data.courtCount,
        pinHash,
        autoAdvanceRounds: data.autoAdvanceRounds ?? true,
      },
    });
  } catch (error) {
    return { error: actionErrorMessage(error) };
  }

  try {
    await addRecentTournamentId(tournament.id);
  } catch (error) {
    console.error("Failed to save recent tournament cookie:", error);
  }

  redirect(`/t/${tournament.id}/manage`);
}

export async function getRecentTournaments() {
  const ids = await getRecentTournamentIds();
  if (ids.length === 0) return [];
  return prisma.tournament.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      status: true,
      currentRound: true,
      totalRounds: true,
      createdAt: true,
    },
  });
}

export async function endTournament(
  tournamentId: string,
  pin?: string
): Promise<{ error?: string }> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) return { error: "Tournament not found" };
  if (tournament.status === "ENDED") return { error: "Already ended" };

  const { verifyPin, requirePinAccess } = await import("@/lib/pin");
  const access = await requirePinAccess(tournamentId, tournament.pinHash);
  if (!access.ok) {
    if (pin) {
      const valid = await verifyPin(pin, tournament.pinHash);
      if (!valid) return { error: "Invalid PIN" };
      await import("@/lib/pin").then((m) => m.setPinVerified(tournamentId));
    } else {
      return { error: "PIN required" };
    }
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: "ENDED" },
  });

  revalidatePath(`/t/${tournamentId}`);
  revalidatePath(`/t/${tournamentId}/manage`);
  revalidatePath(`/t/${tournamentId}/final`);
  redirect(`/t/${tournamentId}/final`);
}

export async function updateTournamentName(
  tournamentId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const nameResult = playerNameSchema.safeParse(formData.get("name"));
  if (!nameResult.success) return { error: "Invalid name" };

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) return { error: "Tournament not found" };

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { name: nameResult.data },
  });

  revalidatePath("/");
  revalidatePath(`/t/${tournamentId}`);
  revalidatePath(`/t/${tournamentId}/manage`);
  revalidatePath(`/t/${tournamentId}/final`);
  return {};
}

export async function deleteTournament(
  tournamentId: string,
  pin?: string
): Promise<{ error?: string }> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) return { error: "Tournament not found" };

  const { verifyPin, requirePinAccess } = await import("@/lib/pin");
  const access = await requirePinAccess(tournamentId, tournament.pinHash);
  if (!access.ok) {
    if (!pin) return { error: "PIN required" };
    const valid = await verifyPin(pin, tournament.pinHash);
    if (!valid) return { error: "Invalid PIN" };
  }

  await prisma.$transaction([
    prisma.match.deleteMany({
      where: { round: { tournamentId } },
    }),
    prisma.round.deleteMany({ where: { tournamentId } }),
    prisma.player.deleteMany({ where: { tournamentId } }),
    prisma.tournament.delete({ where: { id: tournamentId } }),
  ]);

  await removeRecentTournamentId(tournamentId);
  revalidatePath("/");
  return {};
}
