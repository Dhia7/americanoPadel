"use client";

import { useState, useTransition } from "react";
import {
  generateNextRound,
  regenerateCurrentRound,
} from "@/lib/actions/rounds";
import { endTournament } from "@/lib/actions/tournament";

export function ManageActions({
  tournamentId,
  canGenerateNext,
  canRegenerate,
  canEnd,
  needsPin,
  nextRoundLabel,
}: {
  tournamentId: string;
  canGenerateNext: boolean;
  canRegenerate: boolean;
  canEnd: boolean;
  needsPin: boolean;
  nextRoundLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function getPin(): string | undefined {
    if (!needsPin) return undefined;
    return prompt("Enter organizer PIN") ?? undefined;
  }

  function run(action: () => Promise<{ error?: string } | void>) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (result && "error" in result && result.error) {
          setError(result.error);
        } else {
          window.location.reload();
        }
      } catch (e) {
        if (e && typeof e === "object" && "digest" in e) return;
        setError("Something went wrong");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canGenerateNext && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => generateNextRound(tournamentId, getPin()))}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {nextRoundLabel}
        </button>
      )}
      {canRegenerate && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(() => regenerateCurrentRound(tournamentId, getPin()))
          }
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
        >
          Auto-pair again
        </button>
      )}
      {canEnd && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (
              !confirm(
                "End this tournament? Scores and rounds will be frozen."
              )
            ) {
              return;
            }
            const pin = getPin();
            startTransition(async () => {
              const result = await endTournament(tournamentId, pin);
              if (result?.error) setError(result.error);
            });
          }}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-800 dark:text-red-400"
        >
          End tournament
        </button>
      )}
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
