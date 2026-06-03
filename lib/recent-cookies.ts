import { cookies } from "next/headers";

const COOKIE_NAME = "recent_tournaments";
const MAX_RECENT = 10;

export async function getRecentTournamentIds(): Promise<string[]> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addRecentTournamentId(id: string): Promise<void> {
  const store = await cookies();
  const current = await getRecentTournamentIds();
  const next = [id, ...current.filter((x) => x !== id)].slice(0, MAX_RECENT);
  store.set(COOKIE_NAME, JSON.stringify(next), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function removeRecentTournamentId(id: string): Promise<void> {
  const store = await cookies();
  const current = await getRecentTournamentIds();
  const next = current.filter((x) => x !== id);
  store.set(COOKIE_NAME, JSON.stringify(next), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
