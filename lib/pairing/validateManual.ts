export type MatchSlot = {
  teamA: [string, string];
  teamB: [string, string];
};

export type ManualMatchInput = {
  player1Id: string;
  player2Id: string;
  player3Id: string;
  player4Id: string;
  court: number;
};

export function validateManualMatches(
  playerIds: string[],
  matches: ManualMatchInput[]
): string | null {
  if (playerIds.length % 4 !== 0) {
    return "Player count must be divisible by 4";
  }

  const expected = playerIds.length / 4;
  if (matches.length !== expected) {
    return `Assign all players into ${expected} match${expected > 1 ? "es" : ""}`;
  }

  const validIds = new Set(playerIds);
  const used = new Set<string>();

  for (const match of matches) {
    const ids = [
      match.player1Id,
      match.player2Id,
      match.player3Id,
      match.player4Id,
    ];
    for (const id of ids) {
      if (!id) return "Every team slot must have a player";
      if (!validIds.has(id)) return "Invalid player selected";
      if (used.has(id)) return "A player cannot appear in more than one match";
      used.add(id);
    }
    if (new Set(ids).size !== 4) {
      return "Each match needs four different players";
    }
  }

  if (used.size !== playerIds.length) {
    return "Every player must be assigned to exactly one match";
  }

  return null;
}

export function emptyMatchSlots(count: number): MatchSlot[] {
  return Array.from({ length: count }, () => ({
    teamA: ["", ""] as [string, string],
    teamB: ["", ""] as [string, string],
  }));
}

export function slotsFromMatches(
  matches: Pick<
    ManualMatchInput,
    "player1Id" | "player2Id" | "player3Id" | "player4Id"
  >[]
): MatchSlot[] {
  return matches.map((m) => ({
    teamA: [m.player1Id, m.player2Id],
    teamB: [m.player3Id, m.player4Id],
  }));
}

export function manualMatchesFromSlots(
  slots: MatchSlot[],
  courtCount: number
): ManualMatchInput[] {
  return slots.map((slot, index) => ({
    player1Id: slot.teamA[0],
    player2Id: slot.teamA[1],
    player3Id: slot.teamB[0],
    player4Id: slot.teamB[1],
    court: (index % courtCount) + 1,
  }));
}
