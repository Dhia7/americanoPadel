import type { RoundRecord, StandingRow } from "@/lib/standings";

const recordColors = {
  win: "text-emerald-600 dark:text-emerald-400",
  loss: "text-rose-600 dark:text-rose-400",
  tie: "text-amber-600 dark:text-amber-400",
  sep: "text-zinc-400 dark:text-zinc-500",
};

function ColoredRecord({
  wins,
  losses,
  ties,
  size = "sm",
}: Pick<RoundRecord, "wins" | "losses" | "ties"> & { size?: "sm" | "xs" }) {
  const textSize = size === "xs" ? "text-xs" : "text-sm";

  return (
    <span className={`inline-flex items-center tabular-nums font-medium ${textSize}`}>
      <span className={recordColors.win}>{wins}</span>
      <span className={recordColors.sep}>-</span>
      <span className={recordColors.loss}>{losses}</span>
      <span className={recordColors.sep}>-</span>
      <span className={recordColors.tie}>{ties}</span>
    </span>
  );
}

function RoundOutcome({ wins, losses, ties }: Pick<RoundRecord, "wins" | "losses" | "ties">) {
  if (wins === 1) {
    return <span className={`text-xs font-semibold ${recordColors.win}`}>W</span>;
  }
  if (losses === 1) {
    return <span className={`text-xs font-semibold ${recordColors.loss}`}>L</span>;
  }
  if (ties === 1) {
    return <span className={`text-xs font-semibold ${recordColors.tie}`}>T</span>;
  }
  return <ColoredRecord wins={wins} losses={losses} ties={ties} size="xs" />;
}

function RecordHeader() {
  return (
    <span className="inline-flex items-center font-semibold">
      <span className={recordColors.win}>W</span>
      <span className={recordColors.sep}>-</span>
      <span className={recordColors.loss}>L</span>
      <span className={recordColors.sep}>-</span>
      <span className={recordColors.tie}>T</span>
    </span>
  );
}

function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0 fill-[#D4AF37] text-[#D4AF37]"
    >
      <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.77l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.5z" />
    </svg>
  );
}

const defaultRankStyles = {
  row: "border-zinc-200 dark:border-zinc-800",
  muted: "text-zinc-500",
};

function getRankStyles(rank: number, showMedals: boolean) {
  if (!showMedals) return defaultRankStyles;

  switch (rank) {
    case 1:
      return {
        row: "bg-[#FFD700]/40 dark:bg-[#FFD700]/15 border-[#D4AF37]/60 dark:border-[#D4AF37]/40",
        muted: "text-amber-900/70 dark:text-amber-200/80",
      };
    case 2:
      return {
        row: "bg-[#C0C0C0]/50 dark:bg-[#C0C0C0]/20 border-[#A8A8A8]/60 dark:border-[#A8A8A8]/40",
        muted: "text-zinc-600 dark:text-zinc-300",
      };
    case 3:
      return {
        row: "bg-[#CD7F32]/35 dark:bg-[#CD7F32]/20 border-[#B87333]/60 dark:border-[#B87333]/40",
        muted: "text-orange-900/70 dark:text-orange-200/80",
      };
    default:
      return defaultRankStyles;
  }
}

export function Leaderboard({
  rows,
  totalRounds = 0,
}: {
  rows: StandingRow[];
  totalRounds?: number;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No scores yet. Standings appear after matches are played.</p>
    );
  }

  const showMedals = rows.some((row) => row.points > 0);
  const roundNumbers = Array.from(
    { length: totalRounds },
    (_, index) => index + 1
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="bg-zinc-100 dark:bg-zinc-900">
          <tr>
            <th className="px-4 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Player</th>
            <th className="px-4 py-3 font-semibold text-right">Pts</th>
            <th className="px-4 py-3 text-right">
              <RecordHeader />
            </th>
            {roundNumbers.map((roundNumber) => (
              <th
                key={roundNumber}
                className="px-3 py-3 text-center font-semibold"
                title="Points · Win-Loss-Tie"
              >
                R{roundNumber}
              </th>
            ))}
            <th className="px-4 py-3 font-semibold text-right">Played</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const styles = getRankStyles(row.rank, showMedals);
            return (
              <tr
                key={row.playerId}
                className={`border-t ${styles.row}`}
              >
                <td className="px-4 py-3 font-medium">{row.rank}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    {showMedals && row.rank === 1 && <StarIcon />}
                    {row.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  {row.points}
                </td>
                <td className="px-4 py-3 text-right">
                  <ColoredRecord wins={row.wins} losses={row.losses} ties={row.ties} />
                </td>
                {roundNumbers.map((roundNumber) => {
                  const round = row.rounds[roundNumber];
                  return (
                    <td
                      key={roundNumber}
                      className={`px-3 py-3 text-center tabular-nums ${styles.muted}`}
                    >
                      {round ? (
                        <span className="inline-flex flex-col leading-tight">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {round.points}
                          </span>
                          <RoundOutcome
                            wins={round.wins}
                            losses={round.losses}
                            ties={round.ties}
                          />
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  );
                })}
                <td className={`px-4 py-3 text-right tabular-nums ${styles.muted}`}>
                  {row.played}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
