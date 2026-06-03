"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePinAccess, verifyPin, setPinVerified } from "@/lib/pin";
import { tryAutoAdvanceRound } from "@/lib/actions/rounds";
import { scoreSchema } from "@/lib/validations";

export async function saveScore(
  formData: FormData
): Promise<{ error?: string }> {
  const raw = {
    matchId: formData.get("matchId"),
    teamAPoints: formData.get("teamAPoints"),
    teamBPoints: formData.get("teamBPoints"),
    pin: formData.get("pin") || undefined,
  };

  const parsed = scoreSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid score" };

  const match = await prisma.match.findUnique({
    where: { id: parsed.data.matchId },
    include: { round: { include: { tournament: true } } },
  });

  if (!match) return { error: "Match not found" };
  const tournament = match.round.tournament;
  if (tournament.status !== "ACTIVE") {
    return { error: "Tournament is not active" };
  }

  const access = await requirePinAccess(tournament.id, tournament.pinHash);
  if (!access.ok) {
    const pin = parsed.data.pin;
    if (!pin) return { error: "PIN required" };
    const valid = await verifyPin(pin, tournament.pinHash);
    if (!valid) return { error: "Invalid PIN" };
    await setPinVerified(tournament.id);
  }

  const { teamAPoints, teamBPoints } = parsed.data;

  if (tournament.scoringMode === "FIXED") {
    if (teamAPoints + teamBPoints !== tournament.pointsPerMatch) {
      return {
        error: `Scores must add up to ${tournament.pointsPerMatch}`,
      };
    }
  }

  await prisma.match.update({
    where: { id: match.id },
    data: {
      teamAPoints,
      teamBPoints,
      completedAt: new Date(),
    },
  });

  await tryAutoAdvanceRound(tournament.id);

  revalidatePath(`/t/${tournament.id}`);
  revalidatePath(`/t/${tournament.id}/manage`);
  revalidatePath(`/t/${tournament.id}/match/${match.id}`);
  return {};
}
