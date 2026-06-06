import { CreateTournamentForm } from "@/components/CreateTournamentForm";
import { RecentTournamentList } from "@/components/RecentTournamentList";
import { getRecentTournamentIds } from "@/lib/recent-cookies";
import { prisma } from "@/lib/db";
import { isPinVerified } from "@/lib/pin";

export default async function HomePage() {
  const ids = await getRecentTournamentIds();
  const tournaments =
    ids.length > 0
      ? await prisma.tournament.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            name: true,
            status: true,
            currentRound: true,
            totalRounds: true,
            unlimitedRounds: true,
            pinHash: true,
          },
        })
      : [];

  const orderedRaw = ids
    .map((id) => tournaments.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => t != null);

  const ordered = await Promise.all(
    orderedRaw.map(async (t) => ({
      id: t.id,
      name: t.name,
      status: t.status,
      currentRound: t.currentRound,
      totalRounds: t.totalRounds,
      unlimitedRounds: t.unlimitedRounds,
      requiresPin: !!t.pinHash,
      pinVerified: await isPinVerified(t.id),
    }))
  );

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Americano Padel</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Run an Americano tournament: players, rounds, scores, live standings.
        </p>
      </header>

      <CreateTournamentForm />

      {ordered.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Recent tournaments
          </h2>
          <RecentTournamentList tournaments={ordered} />
        </section>
      )}
    </div>
  );
}
