"use client";

import { useMemo, useState, useTransition } from "react";
import type { Player } from "@prisma/client";
import {
  repeatPartnerWarning,
  toPairingHistory,
  type PlayerPairingSummary,
  type SerializablePairingHistory,
} from "@/lib/pairing/display-history";
import {
  emptyMatchSlots,
  manualMatchesFromSlots,
  validateManualMatches,
  type MatchSlot,
} from "@/lib/pairing/validateManual";
import { startTournamentManual } from "@/lib/actions/players";
import {
  createManualRound,
  regenerateManualRound,
} from "@/lib/actions/rounds";
import { RoundConditions } from "@/components/RoundConditions";

const emptyPlayerPairing: PlayerPairingSummary = {
  partners: [],
  opponents: [],
};

function getPlayerPairing(
  pairingSummary: Record<string, PlayerPairingSummary>,
  playerId: string
): PlayerPairingSummary {
  return pairingSummary[playerId] ?? emptyPlayerPairing;
}

function PlayerSelect({
  value,
  onChange,
  players,
  usedElsewhere,
  label,
  pairingSummary,
}: {
  value: string;
  onChange: (id: string) => void;
  players: Player[];
  usedElsewhere: Set<string>;
  label: string;
  pairingSummary: Record<string, PlayerPairingSummary>;
}) {
  return (
    <label className="block">
      <span className="text-xs text-zinc-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
      >
        <option value="">Select player</option>
        {players.map((p) => {
          const disabled = usedElsewhere.has(p.id) && p.id !== value;
          const info = getPlayerPairing(pairingSummary, p.id);
          const historyHint =
            info && (info.partners.length || info.opponents.length)
              ? ` — partners: ${info.partners.join(", ") || "none"}`
              : "";
          return (
            <option key={p.id} value={p.id} disabled={disabled}>
              {p.name}
              {historyHint}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export function ManualPairingPanel({
  tournamentId,
  players,
  pairingSummary,
  pairingHistory: pairingHistoryRaw,
  courtCount,
  roundNumber,
  totalRounds,
  scoringMode,
  pointsPerMatch,
  durationMinutes,
  needsPin,
  mode,
  initialSlots,
  originalSlots,
  onCancel,
}: {
  tournamentId: string;
  players: Player[];
  pairingSummary: Record<string, PlayerPairingSummary>;
  pairingHistory: SerializablePairingHistory;
  courtCount: number;
  roundNumber: number;
  totalRounds: number;
  scoringMode: "FIXED" | "TIMED";
  pointsPerMatch: number;
  durationMinutes: number | null;
  needsPin: boolean;
  mode: "start" | "next" | "regenerate";
  initialSlots?: MatchSlot[];
  originalSlots?: MatchSlot[];
  onCancel?: () => void;
}) {
  const pairingHistory = useMemo(
    () => toPairingHistory(pairingHistoryRaw),
    [pairingHistoryRaw]
  );
  const matchCount = players.length / 4;
  const [slots, setSlots] = useState<MatchSlot[]>(
    () => initialSlots ?? emptyMatchSlots(matchCount)
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const usedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const slot of slots) {
      for (const id of [...slot.teamA, ...slot.teamB]) {
        if (id) ids.add(id);
      }
    }
    return ids;
  }, [slots]);

  function clearMatch(matchIndex: number) {
    setSlots((prev) => {
      const next = [...prev];
      next[matchIndex] = { teamA: ["", ""], teamB: ["", ""] };
      return next;
    });
  }

  function swapTeams(matchIndex: number) {
    setSlots((prev) => {
      const next = [...prev];
      const slot = next[matchIndex];
      next[matchIndex] = {
        teamA: [...slot.teamB] as [string, string],
        teamB: [...slot.teamA] as [string, string],
      };
      return next;
    });
  }

  function resetToCurrent() {
    setSlots(initialSlots ?? emptyMatchSlots(matchCount));
    setError(null);
  }

  function resetToOriginal() {
    if (!originalSlots) return;
    setSlots(originalSlots);
    setError(null);
  }

  function updateSlot(
    matchIndex: number,
    team: "teamA" | "teamB",
    playerIndex: 0 | 1,
    playerId: string
  ) {
    setSlots((prev) => {
      const next = [...prev];
      const slot = { ...next[matchIndex] };
      const teamCopy: [string, string] = [...slot[team]];
      teamCopy[playerIndex] = playerId;
      slot[team] = teamCopy;
      next[matchIndex] = slot;
      return next;
    });
  }

  function handleSubmit() {
    setError(null);
    const matches = manualMatchesFromSlots(slots, courtCount);
    const validationError = validateManualMatches(
      players.map((p) => p.id),
      matches
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    const pin = needsPin ? prompt("Enter organizer PIN") ?? undefined : undefined;
    if (needsPin && !pin) return;

    startTransition(async () => {
      let result: { error?: string } | undefined;
      if (mode === "start") {
        result = await startTournamentManual(tournamentId, matches, pin);
      } else if (mode === "next") {
        result = await createManualRound(tournamentId, matches, pin);
      } else {
        result = await regenerateManualRound(tournamentId, matches, pin);
      }
      if (result?.error) {
        setError(result.error);
      } else {
        window.location.reload();
      }
    });
  }

  const submitLabel =
    mode === "start"
      ? "Start tournament with these pairings"
      : mode === "regenerate"
        ? `Save fixed pairings for round ${roundNumber}`
        : `Create round ${roundNumber} with these pairings`;

  const isEditing = mode === "regenerate" && !!initialSlots;

  return (
    <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">
            {isEditing ? "Edit pairings" : "Manual pairings"}
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {isEditing
              ? "Change any player or team, then save. You can clear a match, swap teams, or reset all."
              : "Choose who plays together in round 1. All later rounds will be paired automatically."}
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 text-sm text-zinc-500 hover:underline"
          >
            Cancel
          </button>
        )}
      </div>

      <RoundConditions
        totalRounds={totalRounds}
        courtCount={courtCount}
        scoringMode={scoringMode}
        pointsPerMatch={pointsPerMatch}
        durationMinutes={durationMinutes}
        roundNumber={roundNumber}
      />

      <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Players — past pairings
        </p>
        <ul className="mt-2 space-y-2">
          {players.map((p) => {
            const info = getPlayerPairing(pairingSummary, p.id);
            const hasHistory =
              info.partners.length > 0 || info.opponents.length > 0;
            return (
              <li key={p.id} className="text-sm">
                <span className="font-medium">{p.name}</span>
                {hasHistory ? (
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {info.partners.length > 0 && (
                      <span className="text-emerald-700 dark:text-emerald-400">
                        Partnered with: {info.partners.join(", ")}
                      </span>
                    )}
                    {info.partners.length > 0 && info.opponents.length > 0 && (
                      <span> · </span>
                    )}
                    {info.opponents.length > 0 && (
                      <span className="text-amber-700 dark:text-amber-400">
                        Faced: {info.opponents.join(", ")}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="ml-2 text-xs text-zinc-400">
                    No prior matches
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        {originalSlots && (
          <button
            type="button"
            onClick={resetToOriginal}
            className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 dark:border-blue-800 dark:text-blue-400"
          >
            Reset to original round 1
          </button>
        )}
        <button
          type="button"
          onClick={resetToCurrent}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-600"
        >
          {isEditing ? "Reset to saved pairings" : "Clear all matches"}
        </button>
      </div>

      <div className="space-y-4">
        {slots.map((slot, matchIndex) => {
          const court = (matchIndex % courtCount) + 1;
          const warning =
            slot.teamA[0] &&
            slot.teamA[1] &&
            slot.teamB[0] &&
            slot.teamB[1]
              ? repeatPartnerWarning(
                  slot.teamA as [string, string],
                  slot.teamB as [string, string],
                  pairingHistory
                )
              : null;

          return (
            <div
              key={matchIndex}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  Match {matchIndex + 1} — Court {court}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => swapTeams(matchIndex)}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Swap teams
                  </button>
                  <button
                    type="button"
                    onClick={() => clearMatch(matchIndex)}
                    className="text-xs text-zinc-500 hover:underline"
                  >
                    Clear match
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  <p className="text-xs font-medium text-zinc-500">Team A</p>
                  <PlayerSelect
                    value={slot.teamA[0]}
                    onChange={(id) => updateSlot(matchIndex, "teamA", 0, id)}
                    players={players}
                    usedElsewhere={usedIds}
                    label="Player 1"
                    pairingSummary={pairingSummary}
                  />
                  <PlayerSelect
                    value={slot.teamA[1]}
                    onChange={(id) => updateSlot(matchIndex, "teamA", 1, id)}
                    players={players}
                    usedElsewhere={usedIds}
                    label="Player 2"
                    pairingSummary={pairingSummary}
                  />
                </div>
                <div className="space-y-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                  <p className="text-xs font-medium text-zinc-500">Team B</p>
                  <PlayerSelect
                    value={slot.teamB[0]}
                    onChange={(id) => updateSlot(matchIndex, "teamB", 0, id)}
                    players={players}
                    usedElsewhere={usedIds}
                    label="Player 3"
                    pairingSummary={pairingSummary}
                  />
                  <PlayerSelect
                    value={slot.teamB[1]}
                    onChange={(id) => updateSlot(matchIndex, "teamB", 1, id)}
                    players={players}
                    usedElsewhere={usedIds}
                    label="Player 4"
                    pairingSummary={pairingSummary}
                  />
                </div>
              </div>
              {warning && (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                  {warning}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}
