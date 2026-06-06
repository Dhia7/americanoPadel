import { z } from "zod";

const tournamentSettingsFields = {
  name: z.string().min(1).max(100),
  totalRounds: z.coerce.number().int().min(1).max(20).optional(),
  unlimitedRounds: z.coerce.boolean().optional(),
  scoringMode: z.enum(["FIXED", "TIMED"]),
  pointsPerMatch: z.coerce.number().int().min(1).max(50).optional(),
  durationMinutes: z.coerce.number().int().min(1).max(60).optional(),
  courtCount: z.coerce.number().int().min(1).max(4),
  autoAdvanceRounds: z.coerce.boolean().optional(),
};

function refineTournamentSettings(
  data: z.infer<z.ZodObject<typeof tournamentSettingsFields>>,
  ctx: z.RefinementCtx
) {
  if (!data.unlimitedRounds && !data.totalRounds) {
    ctx.addIssue({
      code: "custom",
      message: "Number of rounds required",
      path: ["totalRounds"],
    });
  }
  if (data.scoringMode === "FIXED" && !data.pointsPerMatch) {
    ctx.addIssue({
      code: "custom",
      message: "Points per match required for fixed scoring",
      path: ["pointsPerMatch"],
    });
  }
  if (data.scoringMode === "TIMED" && !data.durationMinutes) {
    ctx.addIssue({
      code: "custom",
      message: "Duration required for timed scoring",
      path: ["durationMinutes"],
    });
  }
}

export const createTournamentSchema = z
  .object({
    ...tournamentSettingsFields,
    pin: z.string().regex(/^\d{4}$/).optional().or(z.literal("")),
  })
  .superRefine(refineTournamentSettings);

export const updateTournamentSettingsSchema = z
  .object(tournamentSettingsFields)
  .superRefine(refineTournamentSettings);

export const playerNameSchema = z.string().min(1).max(50).trim();

export const scoreSchema = z.object({
  matchId: z.string(),
  teamAPoints: z.coerce.number().int().min(0),
  teamBPoints: z.coerce.number().int().min(0),
  pin: z.string().optional(),
});

export function validatePlayerCount(count: number): string | null {
  if (count < 4) return "Add at least 4 players";
  if (count > 16) return "Maximum 16 players";
  if (count % 4 !== 0) return "Player count must be a multiple of 4 (4, 8, 12, or 16)";
  return null;
}
