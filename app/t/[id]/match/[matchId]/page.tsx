import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ScoreForm } from "@/components/ScoreForm";
import { getMatchById } from "@/lib/tournament-data";
import { isPinVerified, requirePinAccess } from "@/lib/pin";
import { PinGate } from "@/components/PinGate";

export default async function MatchScorePage({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>;
}) {
  const { id, matchId } = await params;
  const match = await getMatchById(matchId);
  if (!match || match.round.tournament.id !== id) notFound();

  const tournament = match.round.tournament;
  if (tournament.status === "ENDED") redirect(`/t/${id}/final`);
  if (tournament.status !== "ACTIVE") redirect(`/t/${id}/manage`);
  if (match.completedAt) redirect(`/t/${id}/manage`);

  const pinAccess = await requirePinAccess(id, tournament.pinHash);
  const pinVerified = await isPinVerified(id);
  if (!pinAccess.ok) {
    return (
      <div className="mx-auto max-w-lg flex-1 px-4 py-10">
        <PinGate tournamentId={id} />
      </div>
    );
  }

  const teamALabel = `${match.player1.name} + ${match.player2.name}`;
  const teamBLabel = `${match.player3.name} + ${match.player4.name}`;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-8">
      <Link
        href={`/t/${id}/manage`}
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Back to manage
      </Link>
      <header>
        <p className="text-xs font-medium uppercase text-zinc-500">
          Round {match.round.number} · Court {match.court}
        </p>
        <h1 className="mt-1 text-xl font-bold">Enter score</h1>
      </header>
      <ScoreForm
        matchId={match.id}
        scoringMode={tournament.scoringMode}
        pointsPerMatch={tournament.pointsPerMatch}
        durationMinutes={tournament.durationMinutes}
        teamALabel={teamALabel}
        teamBLabel={teamBLabel}
        needsPin={!!tournament.pinHash && !pinVerified}
      />
    </div>
  );
}
