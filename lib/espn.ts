import { unstable_cache } from "next/cache";

const SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const STANDINGS_URL = "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings";

// ── Raw ESPN types ────────────────────────────────────────────────────────────

interface RawTeam {
  id: string;
  displayName: string;
  abbreviation: string;
  logo?: string;
}

interface RawCompetitor {
  homeAway: "home" | "away";
  score: string;
  team: RawTeam;
}

interface RawStatusType {
  name: string;
  state: "pre" | "in" | "post";
  completed: boolean;
  description: string;
  detail: string;
}

interface RawEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  season: { slug: string };
  competitions: {
    altGameNote: string;
    status: { type: RawStatusType; displayClock?: string };
    competitors: RawCompetitor[];
    venue?: { fullName?: string };
  }[];
}

interface RawStandingEntry {
  team: { id: string; displayName: string; abbreviation: string; logo?: string };
  stats: { name: string; displayValue: string }[];
}

interface RawGroup {
  name: string;
  abbreviation: string;
  standings: { entries: RawStandingEntry[] };
}

// ── Normalised types (used throughout the app) ────────────────────────────────

export interface EspnTeam {
  id: string;
  name: string;
  tla: string;
  logo: string;
}

export type MatchStatus =
  | "SCHEDULED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "EXTRA_TIME"
  | "PENALTY"
  | "POSTPONED"
  | "CANCELLED";

export interface EspnMatch {
  id: string;
  utcDate: string;
  name: string;
  stage: string; // ESPN slug: 'group-stage', 'round-of-32', etc.
  group: string | null; // "Group A", null for knockout
  status: MatchStatus;
  statusDetail: string; // "FT", "HT", "45'", "Upcoming"
  home: EspnTeam;
  away: EspnTeam;
  homeScore: number | null;
  awayScore: number | null;
  winner: "home" | "away" | "draw" | null;
  venue: string | null;
}

export interface EspnStandingRow {
  position: number;
  team: EspnTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  advanced: boolean;
}

export interface EspnGroup {
  name: string;
  rows: EspnStandingRow[];
}

// ── Parsing helpers ───────────────────────────────────────────────────────────

const STAGE_NAMES: Record<string, string> = {
  "group-stage": "Group Stage",
  "round-of-32": "Round of 32",
  "round-of-16": "Round of 16",
  quarterfinals: "Quarter-finals",
  semifinals: "Semi-finals",
  "3rd-place-match": "3rd Place",
  final: "Final",
};

export function stageName(slug: string): string {
  return STAGE_NAMES[slug] ?? slug;
}

function parseStatus(raw: RawStatusType, clock?: string): { status: MatchStatus; detail: string } {
  const n = raw.name;
  if (n === "STATUS_SCHEDULED" || n === "STATUS_TIMED") return { status: "SCHEDULED", detail: "" };
  if (n === "STATUS_IN_PROGRESS") return { status: "IN_PLAY", detail: clock ?? "Live" };
  if (n === "STATUS_HALFTIME") return { status: "PAUSED", detail: "HT" };
  if (n === "STATUS_FULL_TIME" || n === "STATUS_FINAL" || raw.completed) {
    if (raw.detail?.includes("Pen") || raw.detail?.includes("PEN")) return { status: "PENALTY", detail: "FT (Pen)" };
    if (raw.detail?.includes("AET") || raw.detail?.includes("ET")) return { status: "EXTRA_TIME", detail: "AET" };
    return { status: "FINISHED", detail: "FT" };
  }
  if (n === "STATUS_POSTPONED") return { status: "POSTPONED", detail: "Postponed" };
  if (n === "STATUS_CANCELLED" || n === "STATUS_ABANDONED") return { status: "CANCELLED", detail: "Cancelled" };
  return { status: "SCHEDULED", detail: raw.detail ?? "" };
}

function parseGroup(altGameNote: string): string | null {
  const m = altGameNote.match(/Group ([A-L])/);
  return m ? `Group ${m[1]}` : null;
}

function parseWinner(
  status: MatchStatus,
  homeScore: number | null,
  awayScore: number | null
): "home" | "away" | "draw" | null {
  if (!["FINISHED", "EXTRA_TIME", "PENALTY"].includes(status)) return null;
  if (homeScore === null || awayScore === null) return null;
  if (homeScore > awayScore) return "home";
  if (awayScore > homeScore) return "away";
  return "draw";
}

function normaliseTeam(t: RawTeam): EspnTeam {
  return {
    id: t.id,
    name: t.displayName,
    tla: t.abbreviation,
    logo: t.logo || `https://a.espncdn.com/i/teamlogos/countries/500/${t.abbreviation.toLowerCase()}.png`,
  };
}

function parseEvent(e: RawEvent): EspnMatch {
  const comp = e.competitions[0];
  const { status, detail } = parseStatus(comp.status.type, comp.status.displayClock);
  const home = comp.competitors.find((c) => c.homeAway === "home")!;
  const away = comp.competitors.find((c) => c.homeAway === "away")!;
  const homeScore = home?.score !== "" && home?.score !== undefined ? Number(home.score) : null;
  const awayScore = away?.score !== "" && away?.score !== undefined ? Number(away.score) : null;

  return {
    id: e.id,
    utcDate: e.date,
    name: e.name,
    stage: e.season.slug,
    group: parseGroup(comp.altGameNote ?? ""),
    status,
    statusDetail: detail || (status === "SCHEDULED" ? formatTime(e.date) : detail),
    home: normaliseTeam(home.team),
    away: normaliseTeam(away.team),
    homeScore,
    awayScore,
    winner: parseWinner(status, homeScore, awayScore),
    venue: comp.venue?.fullName ?? null,
  };
}

function formatTime(utcDate: string): string {
  return new Date(utcDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function parseStat(stats: { name: string; displayValue: string }[], name: string): number {
  return parseInt(stats.find((s) => s.name === name)?.displayValue ?? "0", 10) || 0;
}

function parseStandingRow(entry: RawStandingEntry, idx: number): EspnStandingRow {
  const s = entry.stats;
  const gf = parseStat(s, "pointsFor");
  const ga = parseStat(s, "pointsAgainst");
  return {
    position: parseStat(s, "rank") || idx + 1,
    team: normaliseTeam(entry.team),
    played: parseStat(s, "gamesPlayed"),
    won: parseStat(s, "wins"),
    drawn: parseStat(s, "ties"),
    lost: parseStat(s, "losses"),
    goalsFor: gf,
    goalsAgainst: ga,
    goalDiff: gf - ga,
    points: parseStat(s, "points"),
    advanced: s.find((x) => x.name === "advanced")?.displayValue === "1",
  };
}

// ── Fetchers with caching ─────────────────────────────────────────────────────

async function fetchAllMatches(): Promise<EspnMatch[]> {
  // Fetch the full tournament in two calls (ESPN handles ~40-day ranges fine)
  const [r1, r2] = await Promise.all([
    fetch(`${SCOREBOARD}?dates=20260611-20260630`, { cache: "no-store" }),
    fetch(`${SCOREBOARD}?dates=20260701-20260719`, { cache: "no-store" }),
  ]);
  const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
  const events: RawEvent[] = [...(d1.events ?? []), ...(d2.events ?? [])];
  return events.map(parseEvent).sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  );
}

async function fetchStandings(): Promise<EspnGroup[]> {
  const res = await fetch(STANDINGS_URL, { cache: "no-store" });
  const data = await res.json();
  const groups: RawGroup[] = data.children ?? [];
  return groups.map((g) => ({
    name: g.name,
    rows: g.standings.entries.map((e, i) => parseStandingRow(e, i)),
  }));
}

// 5-min cache for matches (live score updates), 1-hour for standings
export const getMatches = unstable_cache(fetchAllMatches, ["espn-matches"], { revalidate: 300 });
export const getStandings = unstable_cache(fetchStandings, ["espn-standings"], { revalidate: 3600 });
