"use client";

import { useState, useTransition } from "react";
import { endTournament } from "@/lib/actions/tournament";

export function EndTournamentButton({
  tournamentId,
  needsPin,
  prominent = false,
  label = "End tournament",
}: {
  tournamentId: string;
  needsPin: boolean;
  prominent?: boolean;
  label?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleEnd() {
    if (
      !confirm(
        "End this tournament? Scores and rounds will be frozen and final standings will be published."
      )
    ) {
      return;
    }

    const pin = needsPin ? prompt("Enter organizer PIN") ?? undefined : undefined;
    if (needsPin && !pin) return;

    setError(null);
    startTransition(async () => {
      const result = await endTournament(tournamentId, pin);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className={prominent ? "space-y-2" : "contents"}>
      <button
        type="button"
        disabled={pending}
        onClick={handleEnd}
        className={
          prominent
            ? "w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            : "rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-800 dark:text-red-400 disabled:opacity-50"
        }
      >
        {pending ? "Ending…" : label}
      </button>
      {error && (
        <p className={prominent ? "text-sm text-red-600" : "w-full text-sm text-red-600"}>
          {error}
        </p>
      )}
    </div>
  );
}
