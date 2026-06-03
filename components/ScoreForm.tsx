"use client";

import { useState, useTransition } from "react";
import { saveScore } from "@/lib/actions/scores";
import { MatchTimer } from "./MatchTimer";

export function ScoreForm({
  matchId,
  scoringMode,
  pointsPerMatch,
  durationMinutes,
  teamALabel,
  teamBLabel,
  needsPin,
}: {
  matchId: string;
  scoringMode: "FIXED" | "TIMED";
  pointsPerMatch: number;
  durationMinutes: number | null;
  teamALabel: string;
  teamBLabel: string;
  needsPin: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await saveScore(formData);
      if (result.error) {
        setError(result.error);
      } else {
        window.history.back();
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="matchId" value={matchId} />

      {scoringMode === "TIMED" && durationMinutes && (
        <MatchTimer durationMinutes={durationMinutes} />
      )}

      {scoringMode === "FIXED" && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Scores must add up to {pointsPerMatch} points.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">{teamALabel}</span>
          <input
            name="teamAPoints"
            type="number"
            min={0}
            max={scoringMode === "FIXED" ? pointsPerMatch : 999}
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 text-2xl font-semibold tabular-nums dark:border-zinc-600 dark:bg-zinc-900"
            inputMode="numeric"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{teamBLabel}</span>
          <input
            name="teamBPoints"
            type="number"
            min={0}
            max={scoringMode === "FIXED" ? pointsPerMatch : 999}
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 text-2xl font-semibold tabular-nums dark:border-zinc-600 dark:bg-zinc-900"
            inputMode="numeric"
          />
        </label>
      </div>

      {needsPin && (
        <label className="block">
          <span className="text-sm font-medium">Organizer PIN</span>
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
            placeholder="4-digit PIN"
          />
        </label>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-600 py-4 text-lg font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save score"}
      </button>
    </form>
  );
}
