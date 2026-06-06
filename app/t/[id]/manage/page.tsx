import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Leaderboard } from "@/components/Leaderboard";
import { MatchCard } from "@/components/MatchCard";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { PinGate } from "@/components/PinGate";
import { PlayerManager } from "@/components/PlayerManager";
import { RoundPairingControls } from "@/components/RoundPairingControls";
import { buildHistoryFromMatches } from "@/lib/pairing/history";
import {
  buildPlayerPairingSummary,
  serializePairingHistory,
} from "@/lib/pairing/display-history";
import { PollRefresh } from "@/components/PollRefresh";
import { attachPlayersToMatches, buildPlayerLookup } from "@/lib/match-players";
import { getTournamentFull } from "@/lib/tournament-data";
import { computeStandings } from "@/lib/standings";
import { isPinVerified, requirePinAccess } from "@/lib/pin";
import { tournamentLiveVersion } from "@/lib/tournament-version";
import {
  getCurrentRound,
  canGenerateNextRound,
  canRegenerateRound,
  canGoBackToPreviousRound,
  canClearCurrentRoundScores,
  allRoundsComplete,
  formatRoundProgress,
  getRoundCountForDisplay,
  isRoundComplete,
} from "@/lib/tournament-view";
import {
  parseRound1Snapshot,
  snapshotToSlots,
} from "@/lib/pairing/snapshot";

export default async function ManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournamentFull(id);
  if (!tournament) notFound();

  if (tournament.status === "ENDED") {
    redirect(`/t/${id}/final`);
  }

  const pinAccess = await requirePinAccess(id, tournament.pinHash);
  if (!pinAccess.ok) {
    return (
      <div className="mx-auto max-w-lg flex-1 px-4 py-10">
        <PinGate tournamentId={id} />
      </div>
    );
  }

  const allMatches = tournament.rounds.flatMap((r) => r.matches);
  const standings = computeStandings(tournament.players, tournament.rounds);
  const currentRound = getCurrentRound(tournament);
  const pinVerified = await isPinVerified(id);
  const needsPin = !!tournament.pinHash && !pinVerified;

  const completedMatches = allMatches.filter((m) => m.completedAt);
  const pairingHistory = buildHistoryFromMatches(completedMatches);
  const pairingSummary = buildPlayerPairingSummary(
    tournament.players,
    pairingHistory
  );
  const serializedHistory = serializePairingHistory(pairingHistory);
  const round1Snapshot = parseRound1Snapshot(tournament.round1PairingSnapshot);
  const originalRound1Slots = round1Snapshot
    ? snapshotToSlots(round1Snapshot)
    : undefined;
  const playerLookup = buildPlayerLookup(tournament.players);
  const currentRoundMatches = currentRound
    ? attachPlayersToMatches(currentRound.matches, playerLookup)
    : [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      {tournament.status === "ACTIVE" && (
        <PollRefresh
          tournamentId={id}
          liveVersion={tournamentLiveVersion(tournament)}
        />
      )}

      <header className="space-y-2">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Home
        </Link>
        <h1 className="text-2xl font-bold">{tournament.name}</h1>
        <p className="text-sm text-zinc-500">
          {tournament.status === "DRAFT"
            ? "Draft — add players and start"
            : `${formatRoundProgress(tournament)} · ${tournament.scoringMode === "FIXED" ? `Fixed ${tournament.pointsPerMatch} pts` : `${tournament.durationMinutes} min`}${tournament.unlimitedRounds ? " · Open-ended" : ""}`}
        </p>
        <div className="flex flex-wrap gap-2">
          <CopyLinkButton path={`/t/${id}/manage`} label="Copy manage link" />
          <CopyLinkButton path={`/t/${id}`} label="Copy public link" />
          <Link
            href={`/t/${id}`}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600"
          >
            Public view
          </Link>
        </div>
      </header>

      {tournament.status === "DRAFT" && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Players</h2>
          <PlayerManager
            tournamentId={id}
            players={tournament.players}
            needsPin={needsPin}
            totalRounds={tournament.totalRounds}
            unlimitedRounds={tournament.unlimitedRounds}
            courtCount={tournament.courtCount}
            scoringMode={tournament.scoringMode}
            pointsPerMatch={tournament.pointsPerMatch}
            durationMinutes={tournament.durationMinutes}
          />
        </section>
      )}

      {tournament.status === "ACTIVE" && (
        <>
          <RoundPairingControls
            tournamentId={id}
            players={tournament.players}
            pairingSummary={pairingSummary}
            pairingHistory={serializedHistory}
            courtCount={tournament.courtCount}
            roundNumber={tournament.currentRound}
            totalRounds={tournament.totalRounds}
            unlimitedRounds={tournament.unlimitedRounds}
            scoringMode={tournament.scoringMode}
            pointsPerMatch={tournament.pointsPerMatch}
            durationMinutes={tournament.durationMinutes}
            needsPin={needsPin}
            canGenerateNext={canGenerateNextRound(tournament)}
            canRegenerate={canRegenerateRound(tournament)}
            canGoBack={canGoBackToPreviousRound(tournament)}
            canClearScores={canClearCurrentRoundScores(tournament)}
            canEnd={true}
            currentRoundComplete={
              currentRound ? isRoundComplete(currentRound) : false
            }
            nextRoundLabel={`Generate round ${tournament.currentRound + 1}`}
            currentRoundMatches={currentRound?.matches ?? []}
            originalRound1Slots={originalRound1Slots}
          />

          {currentRound && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">
                Round {currentRound.number} —{" "}
                {currentRound.matches.every((m) => m.completedAt)
                  ? "edit scores"
                  : "enter scores"}
              </h2>
              {canRegenerateRound(tournament) && (
                <p className="mb-3 text-sm text-zinc-500">
                  Wrong pairings? Use <strong>Edit round {tournament.currentRound} pairings</strong>{" "}
                  above, or <strong>Clear round {tournament.currentRound} scores</strong> first if
                  scores are already entered.
                </p>
              )}
              {canGoBackToPreviousRound(tournament) && (
                <p className="mb-3 text-sm text-zinc-500">
                  Need to fix an earlier round? Use <strong>Back to round{" "}
                  {tournament.currentRound - 1}</strong> above — the current round
                  will be removed.
                </p>
              )}
              <div className="grid gap-3">
                {currentRoundMatches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    tournamentId={id}
                    manage
                    editable
                    scoringMode={tournament.scoringMode}
                    durationMinutes={tournament.durationMinutes}
                  />
                ))}
              </div>
            </section>
          )}

          {allRoundsComplete(tournament) && (
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              All {tournament.totalRounds} rounds are complete. End the tournament to publish final standings.
            </p>
          )}
        </>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Live standings</h2>
        <Leaderboard
          rows={standings}
          totalRounds={getRoundCountForDisplay(tournament)}
        />
      </section>
    </div>
  );
}
