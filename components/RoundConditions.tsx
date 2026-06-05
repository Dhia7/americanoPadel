type RoundConditionsProps = {
  totalRounds: number;
  courtCount: number;
  scoringMode: "FIXED" | "TIMED";
  pointsPerMatch: number;
  durationMinutes: number | null;
  roundNumber?: number;
};

export function RoundConditions({
  totalRounds,
  courtCount,
  scoringMode,
  pointsPerMatch,
  durationMinutes,
  roundNumber,
}: RoundConditionsProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
      <h3 className="text-sm font-semibold">Round conditions</h3>
      <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <li>
          {roundNumber != null
            ? `Round ${roundNumber} of ${totalRounds}`
            : `${totalRounds} round${totalRounds !== 1 ? "s" : ""} total`}
        </li>
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
