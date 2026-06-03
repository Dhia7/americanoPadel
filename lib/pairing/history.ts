import type { Match } from "@prisma/client";

export type PairingHistory = {
  partners: Set<string>;
  opponents: Set<string>;
};

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function buildHistoryFromMatches(
  matches: Pick<
    Match,
    "player1Id" | "player2Id" | "player3Id" | "player4Id" | "completedAt"
  >[]
): PairingHistory {
  const partners = new Set<string>();
  const opponents = new Set<string>();

  for (const m of matches) {
    if (!m.completedAt) continue;
    const teamA = [m.player1Id, m.player2Id];
    const teamB = [m.player3Id, m.player4Id];
    partners.add(pairKey(teamA[0], teamA[1]));
    partners.add(pairKey(teamB[0], teamB[1]));
    for (const a of teamA) {
      for (const b of teamB) {
        opponents.add(pairKey(a, b));
      }
    }
  }

  return { partners, opponents };
}
