import type { Match, Player } from "@prisma/client";

export type RoundRecord = {
  points: number;
  wins: number;
  losses: number;
  ties: number;
};

export type StandingRow = {
  rank: number;
  playerId: string;
  name: string;
  points: number;
  played: number;
  wins: number;
  losses: number;
  ties: number;
  rounds: Record<number, RoundRecord>;
};

type RoundWithMatches = {
  number: number;
  matches: Match[];
};

function emptyRecord(): RoundRecord {
  return { points: 0, wins: 0, losses: 0, ties: 0 };
}

function applyMatchResult(
  stats: Map<string, StandingRow>,
  playerIds: string[],
  teamPoints: number,
  opponentPoints: number,
  roundNumber: number
) {
  const outcome =
    teamPoints > opponentPoints
      ? "win"
      : teamPoints < opponentPoints
        ? "loss"
        : "tie";

  for (const id of playerIds) {
    const row = stats.get(id);
    if (!row) continue;

    const round = row.rounds[roundNumber] ?? emptyRecord();
    round.points += teamPoints;
    if (outcome === "win") {
      round.wins += 1;
      row.wins += 1;
    } else if (outcome === "loss") {
      round.losses += 1;
      row.losses += 1;
    } else {
      round.ties += 1;
      row.ties += 1;
    }
    row.rounds[roundNumber] = round;
    row.points += teamPoints;
    row.played += 1;
  }
}

export function computeStandings(
  players: Player[],
  rounds: RoundWithMatches[]
): StandingRow[] {
  const stats = new Map<string, StandingRow>();

  for (const p of players) {
    stats.set(p.id, {
      playerId: p.id,
      name: p.name,
      points: 0,
      played: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      rounds: {},
      rank: 0,
    });
  }

  for (const round of rounds) {
    for (const m of round.matches) {
      if (m.completedAt == null || m.teamAPoints == null || m.teamBPoints == null) {
        continue;
      }
      applyMatchResult(
        stats,
        [m.player1Id, m.player2Id],
        m.teamAPoints,
        m.teamBPoints,
        round.number
      );
      applyMatchResult(
        stats,
        [m.player3Id, m.player4Id],
        m.teamBPoints,
        m.teamAPoints,
        round.number
      );
    }
  }

  const rows = [...stats.values()].map((row) => ({
    ...row,
    rank: 0,
  }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.played - a.played;
    });

  let rank = 1;
  for (let i = 0; i < rows.length; i++) {
    if (i > 0 && rows[i].points === rows[i - 1].points && rows[i].played === rows[i - 1].played) {
      rows[i].rank = rows[i - 1].rank;
    } else {
      rows[i].rank = rank;
    }
    rank++;
  }

  return rows;
}
