"use client";

import { useState, useTransition } from "react";
import { updateTournamentSettings } from "@/lib/actions/tournament";

export function EditTournamentSettings({
  tournamentId,
  needsPin,
  name,
  totalRounds,
  unlimitedRounds: initialUnlimitedRounds,
  courtCount,
  scoringMode: initialScoringMode,
  pointsPerMatch,
  durationMinutes,
  autoAdvanceRounds,
}: {
  tournamentId: string;
  needsPin: boolean;
  name: string;
  totalRounds: number;
  unlimitedRounds: boolean;
  courtCount: number;
  scoringMode: "FIXED" | "TIMED";
  pointsPerMatch: number;
  durationMinutes: number | null;
  autoAdvanceRounds: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"FIXED" | "TIMED">(initialScoringMode);
  const [unlimitedRounds, setUnlimitedRounds] = useState(initialUnlimitedRounds);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateTournamentSettings(tournamentId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      window.location.reload();
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border-2 border-amber-400 bg-amber-50 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/60"
      >
        {open ? "Hide tournament settings" : "Edit tournament settings"}
      </button>

      {open && (
        <form
          action={handleSubmit}
          className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
        >
          <label className="block">
            <span className="text-sm font-medium">Name</span>
            <input
              name="name"
              required
              defaultValue={name}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
            />
          </label>

          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              name="unlimitedRounds"
              checked={unlimitedRounds}
              onChange={(e) => setUnlimitedRounds(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">
              <span className="font-medium">Open-ended rounds</span>
              <span className="mt-0.5 block text-zinc-500">
                Keep generating rounds until you end the tournament.
              </span>
            </span>
          </label>

          {!unlimitedRounds && (
            <label className="block">
              <span className="text-sm font-medium">Number of rounds</span>
              <input
                name="totalRounds"
                type="number"
                min={1}
                max={20}
                defaultValue={totalRounds || 6}
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
              />
            </label>
          )}

          <fieldset>
            <legend className="text-sm font-medium">Scoring mode</legend>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scoringMode"
                  value="FIXED"
                  checked={mode === "FIXED"}
                  onChange={() => setMode("FIXED")}
                />
                Fixed
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="scoringMode"
                  value="TIMED"
                  checked={mode === "TIMED"}
                  onChange={() => setMode("TIMED")}
                />
                Timed
              </label>
            </div>
          </fieldset>

          {mode === "FIXED" && (
            <label className="block">
              <span className="text-sm font-medium">Points per match</span>
              <input
                name="pointsPerMatch"
                type="number"
                min={1}
                max={50}
                defaultValue={pointsPerMatch}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
              />
            </label>
          )}

          {mode === "TIMED" && (
            <label className="block">
              <span className="text-sm font-medium">Match duration (minutes)</span>
              <input
                name="durationMinutes"
                type="number"
                min={1}
                max={60}
                defaultValue={durationMinutes ?? 15}
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium">Courts</span>
            <select
              name="courtCount"
              defaultValue={courtCount}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} court{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="autoAdvanceRounds"
              defaultChecked={autoAdvanceRounds}
            />
            <span className="text-sm">
              Auto-generate next round when all scores entered
            </span>
          </label>

          {needsPin && (
            <label className="block">
              <span className="text-sm font-medium">Organizer PIN</span>
              <input
                name="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                required
                placeholder="4 digits"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
              />
            </label>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-zinc-900 py-3 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {pending ? "Saving…" : "Save settings"}
          </button>
        </form>
      )}
    </div>
  );
}
