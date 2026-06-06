"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteTournament,
  updateTournamentName,
} from "@/lib/actions/tournament";

type RecentTournament = {
  id: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "ENDED";
  currentRound: number;
  totalRounds: number;
  unlimitedRounds: boolean;
  requiresPin: boolean;
  pinVerified: boolean;
};

function hrefFor(t: RecentTournament) {
  if (t.status === "ENDED") return `/t/${t.id}/final`;
  return `/t/${t.id}/manage`;
}

function statusLabel(t: RecentTournament) {
  if (t.status === "DRAFT") return "Draft";
  if (t.status === "ENDED") return "Ended";
  return t.unlimitedRounds
    ? `R${t.currentRound}+`
    : `R${t.currentRound}/${t.totalRounds}`;
}

export function RecentTournamentList({
  tournaments,
}: {
  tournaments: RecentTournament[];
}) {
  return (
    <ul className="space-y-2">
      {tournaments.map((t) => (
        <RecentTournamentItem key={t.id} tournament={t} />
      ))}
    </ul>
  );
}

function RecentTournamentItem({ tournament }: { tournament: RecentTournament }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePin, setDeletePin] = useState("");
  const [name, setName] = useState(tournament.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const needsPinForDelete =
    tournament.requiresPin && !tournament.pinVerified;

  function handleSaveName() {
    setError(null);
    const formData = new FormData();
    formData.set("name", name.trim());
    startTransition(async () => {
      const result = await updateTournamentName(tournament.id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function startDelete() {
    setError(null);
    setDeletePin("");
    setConfirmingDelete(true);
  }

  function cancelDelete() {
    setConfirmingDelete(false);
    setDeletePin("");
    setError(null);
  }

  function confirmDelete() {
    if (needsPinForDelete && deletePin.length !== 4) {
      setError("Enter the 4-digit organizer PIN");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteTournament(
        tournament.id,
        needsPinForDelete ? deletePin : undefined
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setConfirmingDelete(false);
      setDeletePin("");
      router.refresh();
    });
  }

  if (confirmingDelete) {
    return (
      <li className="rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/30">
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          Delete &quot;{tournament.name}&quot; permanently?
        </p>
        <p className="mt-1 text-xs text-red-700/80 dark:text-red-300/80">
          {tournament.status === "ENDED"
            ? "All results will be removed and cannot be recovered."
            : "All players, rounds, and scores will be lost."}
        </p>
        {needsPinForDelete && (
          <label className="mt-3 block">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Organizer PIN
            </span>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={deletePin}
              onChange={(e) => setDeletePin(e.target.value.replace(/\D/g, ""))}
              aria-label="Organizer PIN"
              placeholder="4-digit PIN"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 text-center text-lg tracking-widest dark:border-zinc-600 dark:bg-zinc-900"
              autoFocus
            />
          </label>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={confirmDelete}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? "Deleting…" : "Confirm delete"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={cancelDelete}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <label className="text-xs font-medium text-zinc-500">Tournament name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          aria-label="Tournament name"
          placeholder="Tournament name"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
          autoFocus
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={pending || !name.trim()}
            onClick={handleSaveName}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setName(tournament.name);
              setEditing(false);
              setError(null);
            }}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          >
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center gap-2 px-4 py-3">
        <Link href={hrefFor(tournament)} className="min-w-0 flex-1 hover:opacity-80">
          <p className="truncate font-medium">{tournament.name}</p>
          <p className="text-xs text-zinc-500">{statusLabel(tournament)}</p>
        </Link>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={pending}
            className="rounded-lg px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label={`Rename ${tournament.name}`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={startDelete}
            disabled={pending}
            className="rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            aria-label={`Delete ${tournament.name}`}
          >
            Delete
          </button>
        </div>
      </div>
      {error && !editing && !confirmingDelete && (
        <p className="px-4 pb-3 text-sm text-red-600">{error}</p>
      )}
    </li>
  );
}
