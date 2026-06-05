"use client";

import { useState, useTransition } from "react";
import type { Player } from "@prisma/client";
import { addPlayer, removePlayer, startTournament } from "@/lib/actions/players";
import { validatePlayerCount } from "@/lib/validations";
import { RoundConditions } from "@/components/RoundConditions";
import { ManualPairingPanel } from "@/components/ManualPairingPanel";

const emptyHistory = { partners: [] as string[], opponents: [] as string[] };

function emptyPairingSummary(players: Player[]) {
  return Object.fromEntries(
    players.map((p) => [p.id, { partners: [] as string[], opponents: [] as string[] }])
  );
}

export function PlayerManager({
  tournamentId,
  players,
  needsPin,
  totalRounds,
  courtCount,
  scoringMode,
  pointsPerMatch,
  durationMinutes,
}: {
  tournamentId: string;
  players: Player[];
  needsPin: boolean;
  totalRounds: number;
  courtCount: number;
  scoringMode: "FIXED" | "TIMED";
  pointsPerMatch: number;
  durationMinutes: number | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [pending, startTransition] = useTransition();
  const countError = validatePlayerCount(players.length);

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addPlayer(tournamentId, formData);
      if (result.error) setError(result.error);
    });
  }

  function handleRemove(playerId: string) {
    setError(null);
    const pin = needsPin ? prompt("Enter organizer PIN") ?? undefined : undefined;
    startTransition(async () => {
      const result = await removePlayer(tournamentId, playerId, pin);
      if (result.error) setError(result.error);
    });
  }

  function handleStart() {
    setError(null);
    const pin = needsPin ? prompt("Enter organizer PIN") ?? undefined : undefined;
    if (needsPin && !pin) return;
    startTransition(async () => {
      const result = await startTournament(tournamentId, pin);
      if (result.error) setError(result.error);
      else window.location.reload();
    });
  }

  return (
    <div className="space-y-4">
      <form action={handleAdd} className="flex gap-2">
        <input
          name="name"
          required
          placeholder="Player name"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
        />
        {needsPin && (
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="PIN"
            className="w-20 rounded-lg border border-zinc-300 px-2 py-3 dark:border-zinc-600 dark:bg-zinc-900"
          />
        )}
        <button
          type="submit"
          disabled={pending || players.length >= 16}
          className="rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Add
        </button>
      </form>

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
        {players.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-zinc-500">
            Add players (4, 8, 12, or 16)
          </li>
        )}
        {players.map((p) => (
          <li key={p.id} className="flex items-center justify-between px-4 py-3">
            <span className="font-medium">{p.name}</span>
            <button
              type="button"
              onClick={() => handleRemove(p.id)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <p className="text-sm text-zinc-500">
        {players.length} player{players.length !== 1 ? "s" : ""}
        {countError ? ` — ${countError}` : " — ready to start"}
      </p>

      {!countError && players.length > 0 && (
        <>
          <RoundConditions
            totalRounds={totalRounds}
            courtCount={courtCount}
            scoringMode={scoringMode}
            pointsPerMatch={pointsPerMatch}
            durationMinutes={durationMinutes}
            roundNumber={1}
          />

          <p className="text-sm text-zinc-500">
            Round 1: players choose who plays together. Rounds 2 and onward are
            paired automatically.
          </p>

          <button
            type="button"
            onClick={() => setShowManual((v) => !v)}
            disabled={pending || !!countError}
            className="w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {showManual ? "Hide round 1 pairings" : "Choose round 1 pairings"}
          </button>

          <button
            type="button"
            onClick={handleStart}
            disabled={pending || !!countError}
            className="w-full text-sm text-zinc-500 hover:text-zinc-700 hover:underline dark:hover:text-zinc-300"
          >
            Or auto-pair round 1 instead
          </button>

          {showManual && (
            <ManualPairingPanel
              tournamentId={tournamentId}
              players={players}
              pairingSummary={emptyPairingSummary(players)}
              pairingHistory={emptyHistory}
              courtCount={courtCount}
              roundNumber={1}
              totalRounds={totalRounds}
              scoringMode={scoringMode}
              pointsPerMatch={pointsPerMatch}
              durationMinutes={durationMinutes}
              needsPin={needsPin}
              mode="start"
              onCancel={() => setShowManual(false)}
            />
          )}
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
