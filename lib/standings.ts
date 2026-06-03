import type { Match, Player } from "@prisma/client";

export type StandingRow = {
  rank: number;
  playerId: string;
  name: string;
  points: number;
  played: number;
};

type MatchWithPlayers = Match & {
  player1: Player;
  player2: Player;
  player3: Player;
  player4: Player;
};

export function computeStandings(
  players: Player[],
  matches: MatchWithPlayers[]
): StandingRow[] {
  const stats = new Map<string, { points: number; played: number; name: string }>();

  for (const p of players) {
    stats.set(p.id, { points: 0, played: 0, name: p.name });
  }

  for (const m of matches) {
    if (m.completedAt == null || m.teamAPoints == null || m.teamBPoints == null) {
      continue;
    }
    const teamA = [m.player1Id, m.player2Id];
    const teamB = [m.player3Id, m.player4Id];
    for (const id of teamA) {
      const s = stats.get(id);
      if (s) {
        s.points += m.teamAPoints;
        s.played += 1;
      }
    }
    for (const id of teamB) {
      const s = stats.get(id);
      if (s) {
        s.points += m.teamBPoints;
        s.played += 1;
      }
    }
  }

  const rows = [...stats.entries()]
    .map(([playerId, s]) => ({
      playerId,
      name: s.name,
      points: s.points,
      played: s.played,
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
