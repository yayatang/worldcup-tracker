import type { Match, Standing, StandingEntry } from "./football-data";

// Standard World Cup 2026 bracket pairing by group position
// Format: 48 teams, 12 groups (A–L), top 2 per group + 8 best 3rd-place teams advance
// Round of 32 matchups follow FIFA's official bracket

export interface BracketTeam {
  tla: string;
  name: string;
  shortName: string;
  crest: string;
  seed?: string; // e.g. "1A", "2B", "3rd-D/E/F"
}

export interface BracketMatch {
  id?: number;
  label: string; // e.g. "R32-M1"
  homeTeam: BracketTeam | null;
  awayTeam: BracketTeam | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  winner: "home" | "away" | null;
  utcDate: string | null;
}

export interface BracketRound {
  name: string;
  matches: BracketMatch[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function teamFromEntry(entry: StandingEntry, seed: string): BracketTeam {
  return {
    tla: entry.team.tla,
    name: entry.team.name,
    shortName: entry.team.shortName,
    crest: entry.team.crest,
    seed,
  };
}

function teamFromMatch(match: Match, side: "home" | "away"): BracketTeam {
  const t = side === "home" ? match.homeTeam : match.awayTeam;
  return { tla: t.tla, name: t.name, shortName: t.shortName, crest: t.crest };
}

function winnerOfMatch(m: Match): "home" | "away" | null {
  if (m.score.winner === "HOME_TEAM") return "home";
  if (m.score.winner === "AWAY_TEAM") return "away";
  return null;
}

function toBracketMatch(m: Match, label: string): BracketMatch {
  const w = winnerOfMatch(m);
  return {
    id: m.id,
    label,
    homeTeam: teamFromMatch(m, "home"),
    awayTeam: teamFromMatch(m, "away"),
    homeScore: m.score.fullTime.home,
    awayScore: m.score.fullTime.away,
    status: m.status,
    winner: w,
    utcDate: m.utcDate,
  };
}

// ── Top-level export ──────────────────────────────────────────────────────────

/**
 * Build bracket rounds from standings + all matches.
 * Returns rounds in order: Round of 32, Round of 16, Quarter-finals,
 * Semi-finals, 3rd Place, Final.
 */
export function buildBracket(
  standings: Standing[],
  allMatches: Match[]
): BracketRound[] {
  const knockoutStages = [
    "ROUND_OF_32",
    "LAST_16",
    "QUARTER_FINALS",
    "SEMI_FINALS",
    "THIRD_PLACE",
    "FINAL",
  ];

  const stageLabels: Record<string, string> = {
    ROUND_OF_32: "Round of 32",
    LAST_16: "Round of 16",
    QUARTER_FINALS: "Quarter-finals",
    SEMI_FINALS: "Semi-finals",
    THIRD_PLACE: "3rd Place",
    FINAL: "Final",
  };

  // Group knockout matches by stage (as returned by the API)
  const byStage: Record<string, Match[]> = {};
  for (const m of allMatches) {
    if (knockoutStages.includes(m.stage)) {
      byStage[m.stage] = byStage[m.stage] ?? [];
      byStage[m.stage].push(m);
    }
  }

  const rounds: BracketRound[] = [];

  for (const stage of knockoutStages) {
    const stageMatches = byStage[stage] ?? [];
    if (stageMatches.length === 0) continue;

    stageMatches.sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

    rounds.push({
      name: stageLabels[stage] ?? stage,
      matches: stageMatches.map((m, i) =>
        toBracketMatch(m, `${stage}-${i + 1}`)
      ),
    });
  }

  // If the API hasn't scheduled knockout matches yet, project R32 from standings
  if (rounds.length === 0) {
    rounds.push(buildProjectedR32(standings));
  }

  return rounds;
}

/**
 * Project Round of 32 based on current group standings.
 * World Cup 2026: 12 groups (A–L), top 2 per group advance directly.
 * The 8 best 3rd-place teams also advance (shown as TBD until official).
 *
 * Official FIFA bracket pairing (tentative, may shift based on host-nation rules):
 * Groups and their projected R32 matchups follow standard FIFA seeding.
 */
function buildProjectedR32(standings: Standing[]): BracketRound {
  // Build a map: group letter → sorted table
  const groupMap: Record<string, StandingEntry[]> = {};
  for (const s of standings) {
    if (s.type === "TOTAL" && s.group) {
      const letter = s.group.replace(/^GROUP_/, "");
      groupMap[letter] = [...s.table].sort((a, b) => a.position - b.position);
    }
  }

  function pick(group: string, pos: 1 | 2): BracketTeam | null {
    const table = groupMap[group];
    if (!table || table.length < pos) return null;
    return teamFromEntry(table[pos - 1], `${pos}${group}`);
  }

  // 2026 World Cup projected R32 pairings (FIFA official bracket not confirmed yet
  // for 3rd-place wildcards — those slots are labeled TBD)
  const pairings: [string | null, string | null, string | null, string | null, string][] = [
    // [home-group, home-pos, away-group, away-pos, label]
    // Each entry: winner of group X pos vs winner of group Y pos
    ["A", "1", "B", "2", "R32-1"],
    ["C", "1", "D", "2", "R32-2"],
    ["E", "1", "F", "2", "R32-3"],
    ["G", "1", "H", "2", "R32-4"],
    ["I", "1", "J", "2", "R32-5"],
    ["K", "1", "L", "2", "R32-6"],
    ["B", "1", "A", "2", "R32-7"],
    ["D", "1", "C", "2", "R32-8"],
    ["F", "1", "E", "2", "R32-9"],
    ["H", "1", "G", "2", "R32-10"],
    ["J", "1", "I", "2", "R32-11"],
    ["L", "1", "K", "2", "R32-12"],
    // 3rd-place wildcards (4 matches, opponents TBD)
    [null, null, null, null, "R32-13 (3rd place)"],
    [null, null, null, null, "R32-14 (3rd place)"],
    [null, null, null, null, "R32-15 (3rd place)"],
    [null, null, null, null, "R32-16 (3rd place)"],
  ];

  const matches: BracketMatch[] = pairings.map(([hg, hp, ag, ap, label]) => ({
    label,
    homeTeam: hg && hp ? pick(hg, parseInt(hp) as 1 | 2) : null,
    awayTeam: ag && ap ? pick(ag, parseInt(ap) as 1 | 2) : null,
    homeScore: null,
    awayScore: null,
    status: "PROJECTED",
    winner: null,
    utcDate: null,
  }));

  return { name: "Round of 32 (Projected)", matches };
}
