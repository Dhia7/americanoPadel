"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function PollRefresh({
  tournamentId,
  liveVersion,
  intervalMs = 15000,
}: {
  tournamentId: string;
  liveVersion: string;
  intervalMs?: number;
}) {
  const router = useRouter();
  const versionRef = useRef(liveVersion);

  useEffect(() => {
    versionRef.current = liveVersion;
  }, [liveVersion]);

  useEffect(() => {
    let cancelled = false;

    async function checkForUpdates() {
      if (document.visibilityState !== "visible") return;

      try {
        const response = await fetch(`/api/t/${tournamentId}/live`, {
          cache: "no-store",
        });
        if (!response.ok || cancelled) return;

        const data = (await response.json()) as { version?: string };
        if (!data.version || data.version === versionRef.current) return;

        versionRef.current = data.version;
        router.refresh();
      } catch {
        // Ignore transient network errors during polling.
      }
    }

    const id = window.setInterval(checkForUpdates, intervalMs);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void checkForUpdates();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router, tournamentId, intervalMs]);

  return null;
}
