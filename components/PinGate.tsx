"use client";

import { useState, useTransition } from "react";
import { verifyTournamentPin } from "@/lib/actions/pin";

export function PinGate({ tournamentId }: { tournamentId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const pin = formData.get("pin") as string;
    setError(null);
    startTransition(async () => {
      const result = await verifyTournamentPin(tournamentId, pin);
      if (result.error) setError(result.error);
      else window.location.reload();
    });
  }

  return (
    <div className="mx-auto max-w-sm rounded-xl border border-zinc-200 p-6 dark:border-zinc-700">
      <h2 className="text-lg font-semibold">Enter organizer PIN</h2>
      <p className="mt-1 text-sm text-zinc-500">
        This tournament is protected. Enter the 4-digit PIN to manage it.
      </p>
      <form action={handleSubmit} className="mt-4 space-y-4">
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          required
          autoFocus
          className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-center text-2xl tracking-widest dark:border-zinc-600 dark:bg-zinc-900"
          placeholder="••••"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-zinc-900 py-3 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
