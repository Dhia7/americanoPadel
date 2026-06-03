import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const PIN_COOKIE_PREFIX = "tournament_pin_";

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string | null): Promise<boolean> {
  if (!hash) return true;
  return bcrypt.compare(pin, hash);
}

export async function setPinVerified(tournamentId: string): Promise<void> {
  const store = await cookies();
  store.set(`${PIN_COOKIE_PREFIX}${tournamentId}`, "1", {
    path: "/",
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function isPinVerified(tournamentId: string): Promise<boolean> {
  const store = await cookies();
  return store.get(`${PIN_COOKIE_PREFIX}${tournamentId}`)?.value === "1";
}

export async function requirePinAccess(
  tournamentId: string,
  pinHash: string | null
): Promise<{ ok: true } | { ok: false; requiresPin: boolean }> {
  if (!pinHash) return { ok: true };
  const verified = await isPinVerified(tournamentId);
  return verified ? { ok: true } : { ok: false, requiresPin: true };
}
