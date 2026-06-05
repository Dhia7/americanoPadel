import type { ManualMatchInput } from "@/lib/pairing/validateManual";
import { slotsFromMatches } from "@/lib/pairing/validateManual";

export function parseRound1Snapshot(
  value: unknown
): ManualMatchInput[] | null {
  if (!value || !Array.isArray(value)) return null;

  const matches: ManualMatchInput[] = [];
  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("player1Id" in item) ||
      !("player2Id" in item) ||
      !("player3Id" in item) ||
      !("player4Id" in item) ||
      !("court" in item)
    ) {
      return null;
    }
    const m = item as ManualMatchInput;
    matches.push({
      player1Id: String(m.player1Id),
      player2Id: String(m.player2Id),
      player3Id: String(m.player3Id),
      player4Id: String(m.player4Id),
      court: Number(m.court),
    });
  }

  return matches.length > 0 ? matches : null;
}

export function snapshotToSlots(snapshot: ManualMatchInput[]) {
  return slotsFromMatches(snapshot);
}
