import { pairKey, type PairingHistory } from "./history";

export type GeneratedMatch = {
  player1Id: string;
  player2Id: string;
  player3Id: string;
  player4Id: string;
  court: number;
};

const TEAM_SPLITS: [number, number, number, number][] = [
  [0, 1, 2, 3],
  [0, 2, 1, 3],
  [0, 3, 1, 2],
];

function penaltyForMatch(
  ids: [string, string, string, string],
  split: [number, number, number, number],
  history: PairingHistory
): number {
  const p1 = ids[split[0]];
  const p2 = ids[split[1]];
  const p3 = ids[split[2]];
  const p4 = ids[split[3]];
  let score = 0;
  if (history.partners.has(pairKey(p1, p2))) score += 2;
  if (history.partners.has(pairKey(p3, p4))) score += 2;
  for (const a of [p1, p2]) {
    for (const b of [p3, p4]) {
      if (history.opponents.has(pairKey(a, b))) score += 1;
    }
  }
  return score;
}

function combinations4<T>(arr: T[]): T[][] {
  const result: T[][] = [];
  const n = arr.length;
  for (let i = 0; i < n - 3; i++) {
    for (let j = i + 1; j < n - 2; j++) {
      for (let k = j + 1; k < n - 1; k++) {
        for (let l = k + 1; l < n; l++) {
          result.push([arr[i], arr[j], arr[k], arr[l]]);
        }
      }
    }
  }
  return result;
}

function bestQuartet(
  remaining: string[],
  history: PairingHistory
): { ids: string[]; split: [number, number, number, number]; score: number } | null {
  let best: {
    ids: string[];
    split: [number, number, number, number];
    score: number;
  } | null = null;

  for (const quartet of combinations4(remaining)) {
    const ids = quartet as [string, string, string, string];
    for (const split of TEAM_SPLITS) {
      const score = penaltyForMatch(ids, split, history);
      if (!best || score < best.score) {
        best = { ids: [...quartet], split, score };
      }
    }
  }

  return best;
}

export function generateRoundMatches(
  playerIds: string[],
  history: PairingHistory,
  courtCount: number
): GeneratedMatch[] {
  if (playerIds.length % 4 !== 0) {
    throw new Error("Player count must be divisible by 4");
  }

  const remaining = [...playerIds];
  const matches: GeneratedMatch[] = [];
  let courtIndex = 0;

  while (remaining.length >= 4) {
    const best = bestQuartet(remaining, history);
    if (!best) break;

    const { ids, split } = best;
    const match: GeneratedMatch = {
      player1Id: ids[split[0]],
      player2Id: ids[split[1]],
      player3Id: ids[split[2]],
      player4Id: ids[split[3]],
      court: (courtIndex % courtCount) + 1,
    };
    matches.push(match);
    courtIndex++;

    history.partners.add(pairKey(match.player1Id, match.player2Id));
    history.partners.add(pairKey(match.player3Id, match.player4Id));
    for (const a of [match.player1Id, match.player2Id]) {
      for (const b of [match.player3Id, match.player4Id]) {
        history.opponents.add(pairKey(a, b));
      }
    }

    for (const id of ids) {
      const idx = remaining.indexOf(id);
      if (idx >= 0) remaining.splice(idx, 1);
    }
  }

  return matches;
}
