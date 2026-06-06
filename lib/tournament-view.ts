import type { TournamentFull } from "@/lib/tournament-data";

type RoundInfo = Pick<
  TournamentFull,
  "unlimitedRounds" | "totalRounds" | "currentRound" | "rounds"
>;

export function getCurrentRound(tournament: TournamentFull) {
  if (tournament.currentRound === 0) return null;
  return tournament.rounds.find((r) => r.number === tournament.currentRound) ?? null;
}

export function isRoundComplete(round: { matches: { completedAt: Date | null }[] }) {
  return (
    round.matches.length > 0 &&
    round.matches.every((m) => m.completedAt != null)
  );
}

export function getRoundCountForDisplay(tournament: RoundInfo): number {
  if (tournament.unlimitedRounds) {
    const maxRound = tournament.rounds.reduce(
      (max, round) => Math.max(max, round.number),
      0
    );
    return Math.max(maxRound, tournament.currentRound);
  }
  return tournament.totalRounds;
}

export function formatRoundProgress(tournament: RoundInfo): string {
  if (tournament.unlimitedRounds) {
    return tournament.currentRound > 0
      ? `Round ${tournament.currentRound}`
      : "Not started";
  }
  return `Round ${tournament.currentRound} / ${tournament.totalRounds}`;
}

export function canGenerateNextRound(tournament: TournamentFull) {
  if (tournament.status !== "ACTIVE") return false;
  if (
    !tournament.unlimitedRounds &&
    tournament.currentRound >= tournament.totalRounds
  ) {
    return false;
  }
  if (tournament.currentRound === 0) return false;
  const round = getCurrentRound(tournament);
  if (!round) return false;
  return isRoundComplete(round);
}

export function canRegenerateRound(tournament: TournamentFull) {
  const round = getCurrentRound(tournament);
  if (!round) return false;
  return round.matches.every((m) => !m.completedAt);
}

export function canGoBackToPreviousRound(tournament: TournamentFull) {
  return tournament.status === "ACTIVE" && tournament.currentRound > 1;
}

export function canClearCurrentRoundScores(tournament: TournamentFull) {
  const round = getCurrentRound(tournament);
  if (!round) return false;
  return round.matches.some((m) => m.completedAt != null);
}

export function allRoundsComplete(tournament: TournamentFull) {
  if (tournament.unlimitedRounds) return false;
  return (
    tournament.currentRound === tournament.totalRounds &&
    tournament.currentRound > 0 &&
    (() => {
      const round = getCurrentRound(tournament);
      return round ? isRoundComplete(round) : false;
    })()
  );
}
