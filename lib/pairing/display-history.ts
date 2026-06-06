import type { Player } from "@prisma/client";
import { pairKey, type PairingHistory } from "./history";

export type SerializablePairingHistory = {
  partners: string[];
  opponents: string[];
};

export function toPairingHistory(
  history: SerializablePairingHistory
): PairingHistory {
  return {
    partners: new Set(history.partners),
    opponents: new Set(history.opponents),
  };
}

export function serializePairingHistory(
  history: PairingHistory
): SerializablePairingHistory {
  return {
    partners: [...history.partners],
    opponents: [...history.opponents],
  };
}

export type PlayerPairingSummary = {
  partners: string[];
  opponents: string[];
};

export function buildPlayerPairingSummary(
  players: Pick<Player, "id" | "name">[],
  history: PairingHistory
): Record<string, PlayerPairingSummary> {
  const nameById = new Map(players.map((p) => [p.id, p.name]));
  const summary: Record<string, PlayerPairingSummary> = {};

  for (const player of players) {
    summary[player.id] = { partners: [], opponents: [] };
  }

  for (const key of history.partners) {
    const [a, b] = key.split("|");
    const nameA = nameById.get(a);
    const nameB = nameById.get(b);
    if (nameA && nameB) {
      summary[a]?.partners.push(nameB);
      summary[b]?.partners.push(nameA);
    }
  }

  for (const key of history.opponents) {
    const [a, b] = key.split("|");
    const nameA = nameById.get(a);
    const nameB = nameById.get(b);
    if (nameA && nameB) {
      summary[a]?.opponents.push(nameB);
      summary[b]?.opponents.push(nameA);
    }
  }

  for (const id of Object.keys(summary)) {
    summary[id].partners.sort();
    summary[id].opponents.sort();
  }

  return summary;
}

export function repeatPartnerWarning(
  teamA: [string, string],
  teamB: [string, string],
  history: PairingHistory
): string | null {
  const warnings: string[] = [];
  if (history.partners.has(pairKey(teamA[0], teamA[1]))) {
    warnings.push("Team A played together before");
  }
  if (history.partners.has(pairKey(teamB[0], teamB[1]))) {
    warnings.push("Team B played together before");
  }
  let opponentRepeat = false;
  outer: for (const a of teamA) {
    for (const b of teamB) {
      if (history.opponents.has(pairKey(a, b))) {
        opponentRepeat = true;
        break outer;
      }
    }
  }
  if (opponentRepeat) {
    warnings.push("These teams faced each other before");
  }
  return warnings.length ? warnings.join(" · ") : null;
}
