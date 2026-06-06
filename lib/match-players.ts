import type { Match, Player } from "@prisma/client";

export type MatchWithPlayers = Match & {
  player1: Player;
  player2: Player;
  player3: Player;
  player4: Player;
};

export function buildPlayerLookup(players: Player[]): Map<string, Player> {
  return new Map(players.map((p) => [p.id, p]));
}

export function attachPlayersToMatch<T extends Match>(
  match: T,
  lookup: Map<string, Player>
): MatchWithPlayers & Omit<T, keyof Match> {
  const player1 = lookup.get(match.player1Id);
  const player2 = lookup.get(match.player2Id);
  const player3 = lookup.get(match.player3Id);
  const player4 = lookup.get(match.player4Id);
  if (!player1 || !player2 || !player3 || !player4) {
    throw new Error("Match references unknown player");
  }
  return { ...match, player1, player2, player3, player4 };
}

export function attachPlayersToMatches<T extends Match>(
  matches: T[],
  lookup: Map<string, Player>
): (MatchWithPlayers & Omit<T, keyof Match>)[] {
  return matches.map((match) => attachPlayersToMatch(match, lookup));
}
