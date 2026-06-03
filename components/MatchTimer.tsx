"use client";

import { useEffect, useState } from "react";

export function MatchTimer({ durationMinutes }: { durationMinutes: number }) {
  const totalSeconds = durationMinutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running, remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const done = remaining === 0;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
      <p className="text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-200">
        Match timer
      </p>
      <p
        className={`mt-2 text-4xl font-bold tabular-nums ${
          done ? "text-red-600" : ""
        }`}
      >
        {mins}:{secs.toString().padStart(2, "0")}
      </p>
      <div className="mt-3 flex gap-2">
        {!running ? (
          <button
            type="button"
            onClick={() => setRunning(true)}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Start
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setRunning(false)}
            className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium"
          >
            Pause
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setRemaining(totalSeconds);
            setRunning(false);
          }}
          className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium"
        >
          Reset
        </button>
      </div>
      {done && (
        <p className="mt-2 text-sm font-medium text-red-600">Time&apos;s up — enter the final score.</p>
      )}
    </div>
  );
}
