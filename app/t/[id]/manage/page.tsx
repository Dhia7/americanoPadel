import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Leaderboard } from "@/components/Leaderboard";
import { MatchCard } from "@/components/MatchCard";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { PinGate } from "@/components/PinGate";
import { PlayerManager } from "@/components/PlayerManager";
import { ManageActions } from "@/components/ManageActions";
import { PollRefresh } from "@/components/PollRefresh";
import { getTournamentFull } from "@/lib/tournament-data";
import { computeStandings } from "@/lib/standings";
import { isPinVerified, requirePinAccess } from "@/lib/pin";
import {
  getCurrentRound,
  canGenerateNextRound,
  canRegenerateRound,
  allRoundsComplete,
} from "@/lib/tournament-view";

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
  const standings = computeStandings(tournament.players, allMatches);
  const currentRound = getCurrentRound(tournament);
  const pinVerified = await isPinVerified(id);
  const needsPin = !!tournament.pinHash && !pinVerified;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
      {tournament.status === "ACTIVE" && <PollRefresh />}

      <header className="space-y-2">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Home
        </Link>
        <h1 className="text-2xl font-bold">{tournament.name}</h1>
        <p className="text-sm text-zinc-500">
          {tournament.status === "DRAFT"
            ? "Draft — add players and start"
            : `Round ${tournament.currentRound} / ${tournament.totalRounds} · ${tournament.scoringMode === "FIXED" ? `Fixed ${tournament.pointsPerMatch} pts` : `${tournament.durationMinutes} min`}`}
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
          />
        </section>
      )}

      {tournament.status === "ACTIVE" && (
        <>
          <ManageActions
            tournamentId={id}
            canGenerateNext={canGenerateNextRound(tournament)}
            canRegenerate={canRegenerateRound(tournament)}
            canEnd={true}
            needsPin={needsPin}
            nextRoundLabel={`Generate round ${tournament.currentRound + 1}`}
          />

          {currentRound && (
            <section>
              <h2 className="mb-3 text-lg font-semibold">
                Round {currentRound.number} — enter scores
              </h2>
              <div className="grid gap-3">
                {currentRound.matches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    tournamentId={id}
                    manage
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
        <Leaderboard rows={standings} />
      </section>
    </div>
  );
}
