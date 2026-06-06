"use client";

import { useState, useTransition } from "react";
import type { Player } from "@prisma/client";
import { EndTournamentButton } from "@/components/EndTournamentButton";
import { ManageActions } from "@/components/ManageActions";
import { ManualPairingPanel } from "@/components/ManualPairingPanel";
import type { PlayerPairingSummary } from "@/lib/pairing/display-history";
import type { SerializablePairingHistory } from "@/lib/pairing/display-history";
import {
  goBackToPreviousRound,
  clearCurrentRoundScores,
  resetRound1ToOriginal,
} from "@/lib/actions/rounds";
import { slotsFromMatches, type MatchSlot } from "@/lib/pairing/validateManual";

export function RoundPairingControls({
  tournamentId,
  players,
  pairingSummary,
  pairingHistory,
  courtCount,
  roundNumber,
  totalRounds,
  unlimitedRounds = false,
  scoringMode,
  pointsPerMatch,
  durationMinutes,
  needsPin,
  canGenerateNext,
  canRegenerate,
  canGoBack,
  canClearScores,
  canEnd,
  currentRoundComplete = false,
  nextRoundLabel,
  currentRoundMatches,
  originalRound1Slots,
}: {
  tournamentId: string;
  players: Player[];
  pairingSummary: Record<string, PlayerPairingSummary>;
  pairingHistory: SerializablePairingHistory;
  courtCount: number;
  roundNumber: number;
  totalRounds: number;
  unlimitedRounds?: boolean;
  scoringMode: "FIXED" | "TIMED";
  pointsPerMatch: number;
  durationMinutes: number | null;
  needsPin: boolean;
  canGenerateNext: boolean;
  canRegenerate: boolean;
  canGoBack: boolean;
  canClearScores: boolean;
  canEnd: boolean;
  currentRoundComplete?: boolean;
  nextRoundLabel: string;
  currentRoundMatches: {
    player1Id: string;
    player2Id: string;
    player3Id: string;
    player4Id: string;
  }[];
  originalRound1Slots?: MatchSlot[];
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [showManualNext, setShowManualNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const nextRoundNumber = roundNumber + 1;
  const showEditPairings = canRegenerate;
  const showManualNextPairings = canGenerateNext && roundNumber >= 1;
  const showResetOriginal =
    showEditPairings && !!originalRound1Slots?.length;
  const editSlots: MatchSlot[] | undefined = canRegenerate
    ? slotsFromMatches(currentRoundMatches)
    : undefined;

  function getPin(): string | undefined {
    if (!needsPin) return undefined;
    return prompt("Enter organizer PIN") ?? undefined;
  }

  function handleGoBack() {
    const prevRound = roundNumber - 1;
    if (
      !confirm(
        `Go back to round ${prevRound}? Round ${roundNumber} and any later rounds will be removed so you can fix round ${prevRound}.`
      )
    ) {
      return;
    }
    setError(null);
    const pin = getPin();
    if (needsPin && !pin) return;

    startTransition(async () => {
      const result = await goBackToPreviousRound(tournamentId, pin);
      if (result.error) {
        setError(result.error);
      } else {
        window.location.reload();
      }
    });
  }

  function handleClearScores() {
    if (
      !confirm(
        `Clear all scores for round ${roundNumber}? You can then edit pairings or re-enter scores.`
      )
    ) {
      return;
    }
    setError(null);
    const pin = getPin();
    if (needsPin && !pin) return;

    startTransition(async () => {
      const result = await clearCurrentRoundScores(tournamentId, pin);
      if (result.error) {
        setError(result.error);
      } else {
        window.location.reload();
      }
    });
  }

  function handleResetOriginal() {
    if (
      !confirm(
        "Restore the original round 1 pairings you chose when starting?"
      )
    ) {
      return;
    }
    setError(null);
    const pin = getPin();
    if (needsPin && !pin) return;

    startTransition(async () => {
      const result = await resetRound1ToOriginal(tournamentId, pin);
      if (result.error) {
        setError(result.error);
      } else {
        window.location.reload();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ManageActions
          tournamentId={tournamentId}
          canGenerateNext={canGenerateNext}
          canRegenerate={canRegenerate}
          canEnd={canEnd && !unlimitedRounds}
          needsPin={needsPin}
          nextRoundLabel={nextRoundLabel}
        />
        {showEditPairings && (
          <button
            type="button"
            onClick={() => {
              setShowManualNext(false);
              setShowEdit((v) => !v);
            }}
            className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-800 dark:text-blue-400"
          >
            {showEdit
              ? "Hide edit pairings"
              : `Edit round ${roundNumber} pairings`}
          </button>
        )}
        {showManualNextPairings && (
          <button
            type="button"
            onClick={() => {
              setShowEdit(false);
              setShowManualNext((v) => !v);
            }}
            className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-800 dark:text-blue-400"
          >
            {showManualNext
              ? `Hide round ${nextRoundNumber} pairings`
              : `Choose round ${nextRoundNumber} pairings`}
          </button>
        )}
        {showResetOriginal && (
          <button
            type="button"
            disabled={pending}
            onClick={handleResetOriginal}
            className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-800 dark:text-blue-400 disabled:opacity-50"
          >
            Reset to original round 1
          </button>
        )}
        {canGoBack && (
          <button
            type="button"
            disabled={pending}
            onClick={handleGoBack}
            className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 dark:border-amber-800 dark:text-amber-400 disabled:opacity-50"
          >
            Back to round {roundNumber - 1}
          </button>
        )}
        {canClearScores && (
          <button
            type="button"
            disabled={pending}
            onClick={handleClearScores}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600 disabled:opacity-50"
          >
            Clear round {roundNumber} scores
          </button>
        )}
      </div>

      {canGenerateNext && roundNumber >= 1 && !showManualNext && (
        <p className="text-sm text-zinc-500">
          Round {nextRoundNumber}: use <strong>{nextRoundLabel}</strong> for
          automatic pairings, or <strong>Choose round {nextRoundNumber} pairings</strong>{" "}
          to set matchups yourself.
        </p>
      )}

      {unlimitedRounds && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/20">
          <h3 className="font-semibold text-red-900 dark:text-red-200">
            Finish open-ended tournament
          </h3>
          <p className="mt-1 text-sm text-red-800/80 dark:text-red-300/80">
            {currentRoundComplete
              ? `Round ${roundNumber} is complete. Generate another round or end the tournament to publish final standings.`
              : `This tournament has no round limit. End it whenever you are done playing.`}
          </p>
          <div className="mt-3">
            <EndTournamentButton
              tournamentId={tournamentId}
              needsPin={needsPin}
              prominent
              label="End tournament & publish results"
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {showEdit && showEditPairings && (
        <ManualPairingPanel
          tournamentId={tournamentId}
          players={players}
          pairingSummary={pairingSummary}
          pairingHistory={pairingHistory}
          courtCount={courtCount}
          roundNumber={roundNumber}
          totalRounds={totalRounds}
          unlimitedRounds={unlimitedRounds}
          scoringMode={scoringMode}
          pointsPerMatch={pointsPerMatch}
          durationMinutes={durationMinutes}
          needsPin={needsPin}
          mode="regenerate"
          initialSlots={editSlots}
          originalSlots={roundNumber === 1 ? originalRound1Slots : undefined}
          onCancel={() => setShowEdit(false)}
        />
      )}

      {showManualNext && showManualNextPairings && (
        <ManualPairingPanel
          tournamentId={tournamentId}
          players={players}
          pairingSummary={pairingSummary}
          pairingHistory={pairingHistory}
          courtCount={courtCount}
          roundNumber={nextRoundNumber}
          totalRounds={totalRounds}
          unlimitedRounds={unlimitedRounds}
          scoringMode={scoringMode}
          pointsPerMatch={pointsPerMatch}
          durationMinutes={durationMinutes}
          needsPin={needsPin}
          mode="next"
          onCancel={() => setShowManualNext(false)}
        />
      )}
    </div>
  );
}
