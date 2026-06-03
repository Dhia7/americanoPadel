import Link from "next/link";
import type { Match, Player } from "@prisma/client";

type MatchWithPlayers = Match & {
  player1: Player;
  player2: Player;
  player3: Player;
  player4: Player;
};

export function MatchCard({
  match,
  tournamentId,
  manage = false,
  scoringMode,
  durationMinutes,
}: {
  match: MatchWithPlayers;
  tournamentId: string;
  manage?: boolean;
  scoringMode?: "FIXED" | "TIMED";
  durationMinutes?: number | null;
}) {
  const done = match.completedAt != null;
  const teamA = `${match.player1.name} + ${match.player2.name}`;
  const teamB = `${match.player3.name} + ${match.player4.name}`;
  const score =
    done && match.teamAPoints != null && match.teamBPoints != null
      ? `${match.teamAPoints} – ${match.teamBPoints}`
      : "Pending";

  const content = (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        done
          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30"
          : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
      } ${manage && !done ? "cursor-pointer" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-zinc-500">
        <span>Court {match.court}</span>
        <span>{done ? "Done" : "Pending"}</span>
      </div>
      <p className="font-medium">{teamA}</p>
      <p className="my-1 text-center text-xs text-zinc-400">vs</p>
      <p className="font-medium">{teamB}</p>
      <p className="mt-3 text-lg font-semibold tabular-nums">{score}</p>
      {manage && !done && scoringMode === "TIMED" && durationMinutes && (
        <p className="mt-1 text-xs text-zinc-500">{durationMinutes} min match</p>
      )}
    </div>
  );

  if (manage && !done) {
    return (
      <Link href={`/t/${tournamentId}/match/${match.id}`}>{content}</Link>
    );
  }

  return content;
}
