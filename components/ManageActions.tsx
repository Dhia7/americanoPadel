"use client";

import { useState, useTransition } from "react";
import {
  generateNextRound,
  regenerateCurrentRound,
} from "@/lib/actions/rounds";
import { EndTournamentButton } from "@/components/EndTournamentButton";

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
          className="rounded-lg border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:text-emerald-400"
        >
          Re-generate round (auto)
        </button>
      )}
      {canEnd && (
        <EndTournamentButton tournamentId={tournamentId} needsPin={needsPin} />
      )}
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
