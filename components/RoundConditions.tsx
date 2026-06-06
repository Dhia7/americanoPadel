type RoundConditionsProps = {
  totalRounds: number;
  unlimitedRounds?: boolean;
  courtCount: number;
  scoringMode: "FIXED" | "TIMED";
  pointsPerMatch: number;
  durationMinutes: number | null;
  roundNumber?: number;
};

export function RoundConditions({
  totalRounds,
  unlimitedRounds = false,
  courtCount,
  scoringMode,
  pointsPerMatch,
  durationMinutes,
  roundNumber,
}: RoundConditionsProps) {
  const roundLabel =
    unlimitedRounds
      ? roundNumber != null
        ? `Round ${roundNumber} (open-ended)`
        : "Open-ended — no round limit"
      : roundNumber != null
        ? `Round ${roundNumber} of ${totalRounds}`
        : `${totalRounds} round${totalRounds !== 1 ? "s" : ""} total`;

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
      <h3 className="text-sm font-semibold">Round conditions</h3>
      <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <li>{roundLabel}</li>
        <li>
          {courtCount} court{courtCount !== 1 ? "s" : ""}
        </li>
        <li>
          {scoringMode === "FIXED"
            ? `Fixed scoring — ${pointsPerMatch} points per match`
            : `Timed — ${durationMinutes ?? 15} minutes per match`}
        </li>
      </ul>
    </div>
  );
}
