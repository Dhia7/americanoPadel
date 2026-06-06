import Link from "next/link";
import { notFound } from "next/navigation";
import { Leaderboard } from "@/components/Leaderboard";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { getTournamentFull } from "@/lib/tournament-data";
import { computeStandings } from "@/lib/standings";
import { getRoundCountForDisplay } from "@/lib/tournament-view";

export default async function FinalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournamentFull(id);
  if (!tournament) notFound();

  const standings = computeStandings(tournament.players, tournament.rounds);
  const top3 = standings.filter((r) => r.rank <= 3);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
          Tournament complete
        </p>
        <h1 className="mt-2 text-3xl font-bold">{tournament.name}</h1>
        <p className="mt-2 text-zinc-500">
          {tournament.players.length} players ·{" "}
          {getRoundCountForDisplay(tournament)} round
          {getRoundCountForDisplay(tournament) !== 1 ? "s" : ""}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <CopyLinkButton path={`/t/${id}`} label="Share results" />
        </div>
      </header>

      {top3.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {top3.map((row, i) => (
            <div
              key={row.playerId}
              className={`rounded-xl border p-4 text-center ${
                i === 0
                  ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <p className="text-3xl font-bold">{row.rank}</p>
              <p className="mt-1 font-semibold">{row.name}</p>
              <p className="text-sm text-zinc-500">{row.points} pts</p>
            </div>
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Final standings</h2>
        <Leaderboard
          rows={standings}
          totalRounds={getRoundCountForDisplay(tournament)}
        />
      </section>

      <Link href="/" className="text-center text-sm text-zinc-500 hover:underline">
        Create another tournament
      </Link>
    </div>
  );
}
