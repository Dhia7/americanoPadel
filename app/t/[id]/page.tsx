import { notFound } from "next/navigation";
import { Leaderboard } from "@/components/Leaderboard";
import { MatchCard } from "@/components/MatchCard";
import { PollRefresh } from "@/components/PollRefresh";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { attachPlayersToMatches, buildPlayerLookup } from "@/lib/match-players";
import { getTournamentFull } from "@/lib/tournament-data";
import { computeStandings } from "@/lib/standings";
import { tournamentLiveVersion } from "@/lib/tournament-version";
import {
  getCurrentRound,
  allRoundsComplete,
  formatRoundProgress,
  getRoundCountForDisplay,
} from "@/lib/tournament-view";

export default async function PublicTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournamentFull(id);
  if (!tournament) notFound();

  if (tournament.status === "ENDED") {
    const { redirect } = await import("next/navigation");
    redirect(`/t/${id}/final`);
  }

  const standings = computeStandings(tournament.players, tournament.rounds);
  const currentRound = getCurrentRound(tournament);
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
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
          Live leaderboard
        </p>
        <h1 className="text-2xl font-bold">{tournament.name}</h1>
        <p className="text-sm text-zinc-500">
          {formatRoundProgress(tournament)}
          {tournament.status === "DRAFT" && " · Not started yet"}
          {tournament.unlimitedRounds && tournament.status === "ACTIVE" && " · Open-ended"}
        </p>
        <CopyLinkButton path={`/t/${id}`} label="Copy public link" />
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Standings</h2>
        <Leaderboard
          rows={standings}
          totalRounds={getRoundCountForDisplay(tournament)}
        />
      </section>

      {currentRound && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Round {currentRound.number} matches
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {currentRoundMatches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                tournamentId={id}
                scoringMode={tournament.scoringMode}
                durationMinutes={tournament.durationMinutes}
              />
            ))}
          </div>
        </section>
      )}

      {allRoundsComplete(tournament) && tournament.status === "ACTIVE" && (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          All rounds complete. Waiting for final results.
        </p>
      )}
    </div>
  );
}
