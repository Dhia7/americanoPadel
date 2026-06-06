import { prisma } from "@/lib/db";

type VersionInput = {
  status: string;
  currentRound: number;
  rounds: { matches: { completedAt: Date | null }[] }[];
};

export function tournamentLiveVersion(tournament: VersionInput): string {
  let completedCount = 0;
  let lastCompletedAt = 0;

  for (const round of tournament.rounds) {
    for (const match of round.matches) {
      if (match.completedAt) {
        completedCount += 1;
        lastCompletedAt = Math.max(
          lastCompletedAt,
          match.completedAt.getTime()
        );
      }
    }
  }

  return `${tournament.status}:${tournament.currentRound}:${completedCount}:${lastCompletedAt}`;
}

export async function fetchTournamentLiveVersion(
  tournamentId: string
): Promise<string | null> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      status: true,
      currentRound: true,
      rounds: {
        select: {
          matches: {
            select: { completedAt: true },
          },
        },
      },
    },
  });

  if (!tournament) return null;
  return tournamentLiveVersion(tournament);
}
