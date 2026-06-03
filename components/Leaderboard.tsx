import type { StandingRow } from "@/lib/standings";

export function Leaderboard({ rows }: { rows: StandingRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No scores yet. Standings appear after matches are played.</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-100 dark:bg-zinc-900">
          <tr>
            <th className="px-4 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Player</th>
            <th className="px-4 py-3 font-semibold text-right">Pts</th>
            <th className="px-4 py-3 font-semibold text-right">Played</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.playerId}
              className="border-t border-zinc-200 dark:border-zinc-800"
            >
              <td className="px-4 py-3 font-medium">{row.rank}</td>
              <td className="px-4 py-3">{row.name}</td>
              <td className="px-4 py-3 text-right font-semibold tabular-nums">
                {row.points}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-500">
                {row.played}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
