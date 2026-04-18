/**
 * Shared Zod schemas for nexus-zim forms.
 *
 * These schemas mirror the Supabase table shapes and are used to validate
 * user input before it reaches `supabase.from(...).insert()`. Database-layer
 * constraints (NOT NULL, CHECK, enums) are the real source of truth, but
 * validating early keeps errors close to the input and improves UX.
 */

import { z } from "zod";

// ── Enums (kept in sync with supabase/migrations) ────────────────────
export const COMPETITION_LEVELS = [
  "primary_school",
  "secondary_school",
  "club_academy",
  "provincial",
  "national_league",
  "national_cup",
  "international",
] as const;

export const COMPETITION_FORMATS = [
  "round_robin",
  "single_elimination",
  "double_elimination",
  "swiss",
  "league",
  "ladder",
  "custom_heats",
] as const;

export const COMPETITION_STATUSES = [
  "draft",
  "registration_open",
  "registration_closed",
  "ongoing",
  "completed",
  "cancelled",
] as const;

export const ZIM_PROVINCES = [
  "Harare",
  "Bulawayo",
  "Manicaland",
  "Mashonaland Central",
  "Mashonaland East",
  "Mashonaland West",
  "Masvingo",
  "Matabeleland North",
  "Matabeleland South",
  "Midlands",
] as const;

// ── Competition ──────────────────────────────────────────────────────
export const competitionSchema = z
  .object({
    name: z.string().trim().min(3, "Name must be at least 3 characters").max(120),
    discipline: z.string().trim().min(2).max(60),
    level: z.enum(COMPETITION_LEVELS),
    format: z.enum(COMPETITION_FORMATS),
    status: z.enum(COMPETITION_STATUSES),
    season: z.string().regex(/^\d{4}$/, "Season must be a 4-digit year"),
    province: z.enum(ZIM_PROVINCES).nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    registration_deadline: z.string().nullable().optional(),
    max_participants: z.number().int().positive().nullable().optional(),
    entry_fee: z.number().nonnegative().default(0),
    prize_pool: z.number().nonnegative().default(0),
    sponsor: z.string().max(200).nullable().optional(),
    parent_id: z.string().uuid().nullable().optional(),
    logo_url: z.string().url().nullable().optional(),
  })
  .refine(
    (c) => !c.start_date || !c.end_date || c.start_date <= c.end_date,
    { message: "End date must be on or after start date", path: ["end_date"] },
  );

export type CompetitionInput = z.infer<typeof competitionSchema>;

// ── Athlete ──────────────────────────────────────────────────────────
export const athleteSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be YYYY-MM-DD").nullable().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_say"]).nullable().optional(),
  province: z.enum(ZIM_PROVINCES),
  school_name: z.string().max(200).nullable().optional(),
  club_name: z.string().max(200).nullable().optional(),
  disciplines: z.array(z.string()).default([]),
  medical_waiver_signed: z.boolean().default(false),
  medical_waiver_date: z.string().nullable().optional(),
  personal_bests: z
    .array(
      z.object({
        discipline: z.string().min(1),
        value: z.string().min(1),
        recorded_at: z.string().nullable().optional(),
      }),
    )
    .default([]),
  photo_url: z.string().url().nullable().optional(),
});

export type AthleteInput = z.infer<typeof athleteSchema>;

// ── Team ─────────────────────────────────────────────────────────────
export const teamSchema = z.object({
  name: z.string().trim().min(2).max(120),
  short_name: z.string().trim().max(12).nullable().optional(),
  discipline: z.string().trim().min(2).max(60),
  level: z.enum(COMPETITION_LEVELS),
  province: z.enum(ZIM_PROVINCES),
  school_name: z.string().max(200).nullable().optional(),
  club_name: z.string().max(200).nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  kit_colors: z.array(z.string()).max(4).default([]),
  founded_year: z.number().int().min(1900).max(new Date().getFullYear()).nullable().optional(),
  sports_offered: z.array(z.string()).default([]),
});

export type TeamInput = z.infer<typeof teamSchema>;

// ── Official ─────────────────────────────────────────────────────────
export const officialSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  role: z.enum([
    "referee",
    "scorer",
    "umpire",
    "judge",
    "broadcaster",
    "medical",
    "coach",
    "administrator",
  ]),
  disciplines: z.array(z.string()).default([]),
  province: z.enum(ZIM_PROVINCES),
  certification_level: z.enum(["entry", "provincial", "national", "international"]).nullable().optional(),
  bank_account: z
    .object({
      bank_name: z.string().trim().min(2),
      account_number: z.string().trim().regex(/^\d{6,20}$/, "Account number must be 6-20 digits"),
      account_holder: z.string().trim().min(2),
      branch: z.string().trim().max(80).nullable().optional(),
    })
    .nullable()
    .optional(),
});

export type OfficialInput = z.infer<typeof officialSchema>;

// ── Fixture ──────────────────────────────────────────────────────────
export const fixtureSchema = z.object({
  competition_id: z.string().uuid(),
  home_team_id: z.string().uuid(),
  away_team_id: z.string().uuid(),
  scheduled_at: z.string().min(1, "Scheduled time required"),
  venue_id: z.string().uuid().nullable().optional(),
  round_label: z.string().max(40).nullable().optional(),
}).refine((f) => f.home_team_id !== f.away_team_id, {
  message: "Home and away teams must differ",
  path: ["away_team_id"],
});

export type FixtureInput = z.infer<typeof fixtureSchema>;
