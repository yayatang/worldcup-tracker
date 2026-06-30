import { unstable_cache } from "next/cache";

// Server-only: never import this in client components
const BASE_URL = "https://api.football-data.org/v4";
const WC_ID = "WC";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string; // 3-letter abbreviation — join key with fifa-rankings.json
  crest: string;
}

export interface Score {
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
}

export interface Match {
  id: number;
  utcDate: string;
  status:
    | "SCHEDULED"
    | "TIMED"
    | "IN_PLAY"
    | "PAUSED"
    | "FINISHED"
    | "SUSPENDED"
    | "POSTPONED"
    | "CANCELLED";
  stage: string;
  group: string | null;
  matchday: number | null;
  homeTeam: Team;
  awayTeam: Team;
  score: Score;
}

export interface StandingEntry {
  position: number;
  team: Team;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface Standing {
  stage: string;
  type: string;
  group: string | null;
  table: StandingEntry[];
}

// ── API client ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key || key === "your_key_here") {
    throw new Error("FOOTBALL_DATA_API_KEY not configured — add it to .env.local");
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-Auth-Token": key },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(
      `football-data.org ${path} → ${res.status} ${res.statusText}`
    );
  }
  return res.json() as Promise<T>;
}

// ── Cached wrappers (5-min for matches, 1-hour for standings) ─────────────────

export const getMatches = unstable_cache(
  async (): Promise<Match[]> => {
    const data = await apiFetch<{ matches: Match[] }>(`/competitions/${WC_ID}/matches`);
    return data.matches;
  },
  ["wc-matches"],
  { revalidate: 300 }
);

export const getStandings = unstable_cache(
  async (): Promise<Standing[]> => {
    const data = await apiFetch<{ standings: Standing[] }>(`/competitions/${WC_ID}/standings`);
    return data.standings;
  },
  ["wc-standings"],
  { revalidate: 3600 }
);
