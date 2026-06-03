"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { setPinVerified, verifyPin } from "@/lib/pin";

export async function verifyTournamentPin(
  tournamentId: string,
  pin: string
): Promise<{ error?: string }> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) return { error: "Tournament not found" };
  if (!tournament.pinHash) {
    await setPinVerified(tournamentId);
    return {};
  }

  const valid = await verifyPin(pin, tournament.pinHash);
  if (!valid) return { error: "Invalid PIN" };

  await setPinVerified(tournamentId);
  revalidatePath(`/t/${tournamentId}/manage`);
  return {};
}
