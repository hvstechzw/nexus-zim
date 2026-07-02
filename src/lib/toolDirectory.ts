import type { LucideIcon } from "lucide-react";
import type { AppRole } from "@/hooks/useHasRole";
import {
  Radio, CheckCircle2, CalendarDays, School, Trophy, ShieldCheck, LayoutGrid,
  Globe2, ListChecks, MapPin, Users, FileText, DollarSign, Settings, Plus,
  UserCog, ClipboardList, Handshake, IdCard, Video,
} from "lucide-react";

export interface ToolDef {
  label: string;
  to: string;
  blurb: string;
  icon: LucideIcon;
  /** Roles that can use this tool. Empty = anyone signed in. */
  roles?: AppRole[];
}

export interface ToolGroup {
  tier: string;
  icon: LucideIcon;
  tools: ToolDef[];
}

/**
 * Every module in Nexus, grouped by the tier that owns it — the single
 * source of truth for both /tools (the full-page directory) and the
 * hamburger-menu sidebar.
 */
export const TOOL_DIRECTORY: ToolGroup[] = [
  {
    tier: "Public",
    icon: Globe2,
    tools: [
      { label: "Live Matches", to: "/live", blurb: "Realtime scores across all 15 sports.", icon: Radio },
      { label: "Results", to: "/results", blurb: "Completed fixtures and final scores.", icon: CheckCircle2 },
      { label: "Competition Calendar", to: "/calendar", blurb: "Upcoming fixtures by tier and sport.", icon: CalendarDays },
      { label: "Schools Directory", to: "/schools", blurb: "Every school on Nexus, verified by Scholastic Services.", icon: School },
      { label: "National Records", to: "/records", blurb: "All-time NASH & NAPH records.", icon: Trophy },
      { label: "Broadcast Gallery", to: "/broadcast", blurb: "Public broadcast graphics showcase.", icon: Video },
    ],
  },
  {
    tier: "Platform",
    icon: ShieldCheck,
    tools: [
      { label: "Admin Console", to: "/platform", blurb: "Full system administration.", icon: LayoutGrid, roles: ["platform_admin", "super_admin", "admin"] },
      { label: "Users & Roles", to: "/admin/dashboard", blurb: "Manage accounts and role approvals.", icon: UserCog, roles: ["platform_admin", "super_admin", "admin"] },
    ],
  },
  {
    tier: "Federation (NASH / NAPH National)",
    icon: Globe2,
    tools: [
      { label: "NASH National Dashboard", to: "/federation/nash", blurb: "Secondary schools federation overview.", icon: ShieldCheck, roles: ["nash_national", "national_technical_director", "federation_official", "national_admin", "platform_admin", "super_admin", "admin"] },
      { label: "NAPH National Dashboard", to: "/federation/naph", blurb: "Primary schools federation overview.", icon: ShieldCheck, roles: ["naph_national", "national_technical_director", "federation_official", "national_admin", "platform_admin", "super_admin", "admin"] },
      { label: "Seasons", to: "/admin/seasons", blurb: "Manage competition seasons/terms.", icon: CalendarDays },
      { label: "Sports Registry", to: "/admin/sports", blurb: "The 15 sports NASH/NAPH sanctions.", icon: Trophy },
      { label: "Organisations", to: "/admin/organisations", blurb: "National → provincial → district → zonal tree.", icon: Globe2 },
      { label: "Members", to: "/admin/members", blurb: "Federation officials directory.", icon: Users },
      { label: "Eligibility Flags", to: "/admin/eligibility", blurb: "Review dual-enrollment and eligibility flags.", icon: ListChecks },
      { label: "MoPSE Annual Report", to: "/admin/reports", blurb: "Print-ready ministry report.", icon: FileText },
      { label: "Finances", to: "/admin/finances", blurb: "Entry fees, budgets and payouts.", icon: DollarSign },
      { label: "Venues Database", to: "/admin/venues", blurb: "All sanctioned competition venues.", icon: MapPin },
    ],
  },
  {
    tier: "Provincial / District / Zonal",
    icon: MapPin,
    tools: [
      { label: "Provincial Dashboard", to: "/province", blurb: "Provincial-tier competitions and standings.", icon: MapPin, roles: ["provincial_admin", "provincial_technical_director"] },
      { label: "District Dashboard", to: "/district", blurb: "District-tier competitions and standings.", icon: MapPin, roles: ["district_admin", "district_technical_director"] },
      { label: "Zonal Dashboard", to: "/zone", blurb: "Zonal-tier fixtures and clusters.", icon: MapPin, roles: ["zonal_admin"] },
      { label: "Region Requests", to: "/admin/regions", blurb: "Approve pending regional admin requests.", icon: ListChecks },
    ],
  },
  {
    tier: "Competitions & Officiating",
    icon: Trophy,
    tools: [
      { label: "Tournament Wizard", to: "/admin/competitions/new", blurb: "NASH/NAPH competition creation flow.", icon: Plus },
      { label: "Competitions", to: "/admin/competitions", blurb: "Manage/delete competitions and fixtures.", icon: Trophy },
      { label: "Teams", to: "/admin/teams", blurb: "Manage/delete school team rosters.", icon: Users },
      { label: "Officials Registry", to: "/admin/officials", blurb: "Referees, scorers, technical delegates.", icon: ShieldCheck },
      { label: "Official Dashboard", to: "/official/dashboard", blurb: "Your assignments and match sheets.", icon: ClipboardList, roles: ["referee", "scorer", "timekeeper", "technical_delegate", "umpire"] },
      { label: "Assignments", to: "/official/assignments", blurb: "Upcoming officiating assignments.", icon: ClipboardList, roles: ["referee", "scorer", "timekeeper", "technical_delegate", "umpire"] },
      { label: "Organiser Dashboard", to: "/organiser/dashboard", blurb: "Run your competitions end to end.", icon: LayoutGrid, roles: ["competition_organiser", "hic"] },
      { label: "Broadcast CG Control", to: "/broadcast", blurb: "Score bug, lower thirds, sponsor ticker.", icon: Video, roles: ["competition_organiser", "hic", "broadcaster", "technical_delegate", "platform_admin", "super_admin", "admin"] },
    ],
  },
  {
    tier: "School",
    icon: School,
    tools: [
      { label: "School / Coach Dashboard", to: "/school/dashboard", blurb: "Your teams, fixtures and roster.", icon: School, roles: ["school_head", "coach", "team_manager", "school_coordinator"] },
      { label: "Team Registration", to: "/school/teams", blurb: "Register teams for a competition.", icon: Users, roles: ["school_head", "coach", "team_manager", "school_coordinator"] },
      { label: "Athletes Registry", to: "/school/players", blurb: "Your school's NASH athlete records.", icon: IdCard, roles: ["school_head", "coach", "team_manager", "school_coordinator"] },
      { label: "Register Athlete", to: "/admin/athletes/new", blurb: "Add an athlete, with dual-enrollment checks.", icon: Plus },
      { label: "Athletes Registry (federation)", to: "/admin/athletes", blurb: "Full athlete registry across all schools.", icon: IdCard },
      { label: "Eligibility (school view)", to: "/school/eligibility", blurb: "Flags raised for your athletes.", icon: ListChecks, roles: ["school_head", "coach", "team_manager", "school_coordinator"] },
    ],
  },
  {
    tier: "Athlete / Parent",
    icon: Users,
    tools: [
      { label: "Athlete Dashboard", to: "/athlete/profile", blurb: "Your profile, stats and NASH ID card.", icon: IdCard, roles: ["athlete", "parent"] },
      { label: "My Stats", to: "/athlete/stats", blurb: "Career stats across competitions.", icon: Trophy, roles: ["athlete", "parent"] },
      { label: "My Competitions", to: "/athlete/competitions", blurb: "Competitions you're registered in.", icon: CalendarDays, roles: ["athlete", "parent"] },
      { label: "Card Verification", to: "/admin/verify", blurb: "Verify identity via Scholastic Card.", icon: ShieldCheck },
    ],
  },
  {
    tier: "Federation Sync",
    icon: Settings,
    tools: [
      { label: "Scholastic Services Sync", to: "/admin/sync", blurb: "Pull schools and athletes from Scholastic Services.", icon: Settings },
      { label: "Sponsorships", to: "/admin/dashboard", blurb: "Sponsors, tiers and broadcast media.", icon: Handshake },
    ],
  },
];
