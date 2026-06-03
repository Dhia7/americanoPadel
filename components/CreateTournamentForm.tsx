"use client";

import { useState, useTransition } from "react";
import { createTournament } from "@/lib/actions/tournament";

export function CreateTournamentForm() {
  const [mode, setMode] = useState<"FIXED" | "TIMED">("FIXED");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createTournament(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 p-6 dark:border-zinc-700">
      <h2 className="text-lg font-semibold">New tournament</h2>

      <label className="block">
        <span className="text-sm font-medium">Name</span>
        <input
          name="name"
          required
          placeholder="Friday Americano"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Number of rounds</span>
        <input
          name="totalRounds"
          type="number"
          min={1}
          max={20}
          defaultValue={6}
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
        />
      </label>

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
            Fixed (to 24)
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
            defaultValue={24}
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
            defaultValue={15}
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </label>
      )}

      <label className="block">
        <span className="text-sm font-medium">Courts</span>
        <select
          name="courtCount"
          defaultValue={1}
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
        <input type="checkbox" name="autoAdvanceRounds" defaultChecked />
        <span className="text-sm">Auto-generate next round when all scores entered</span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Organizer PIN (optional)</span>
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          placeholder="4 digits"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900"
        />
      </label>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-600 py-4 text-lg font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create tournament"}
      </button>
    </form>
  );
}
