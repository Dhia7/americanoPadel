import { prisma } from "@/lib/db";

export async function getTournamentFull(id: string) {
  return prisma.tournament.findUnique({
    where: { id },
    include: {
      players: { orderBy: { sortOrder: "asc" } },
      rounds: {
        orderBy: { number: "asc" },
        include: {
          matches: {
            orderBy: [{ court: "asc" }, { id: "asc" }],
          },
        },
      },
    },
  });
}

export async function getAllCompletedMatches(tournamentId: string) {
  return prisma.match.findMany({
    where: {
      round: { tournamentId },
      completedAt: { not: null },
    },
    include: {
      player1: true,
      player2: true,
      player3: true,
      player4: true,
    },
  });
}

export async function getMatchById(matchId: string) {
  return prisma.match.findUnique({
    where: { id: matchId },
    include: {
      round: { include: { tournament: true } },
      player1: true,
      player2: true,
      player3: true,
      player4: true,
    },
  });
}

export type TournamentFull = NonNullable<
  Awaited<ReturnType<typeof getTournamentFull>>
>;
