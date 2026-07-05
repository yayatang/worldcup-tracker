import type { EspnMatch, EspnGroup, EspnTeam } from "./espn";
import { stageName } from "./espn";

export interface BracketTeam {
  id: string;
  name: string;
  tla: string;
  logo: string;
  seed?: string;
}

export interface BracketMatch {
  id?: string;
  label: string;
  home: BracketTeam | null;
  away: BracketTeam | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  statusDetail: string;
  winner: "home" | "away" | null;
  utcDate: string | null;
  projected: boolean;
}

export interface BracketRound {
  slug: string;
  name: string;
  matches: BracketMatch[];
}

const KNOCKOUT_SLUGS = [
  "round-of-32",
  "round-of-16",
  "quarterfinals",
  "semifinals",
  "3rd-place-match",
  "final",
];

function toTeam(t: EspnTeam, seed?: string): BracketTeam {
  return { id: t.id, name: t.name, tla: t.tla, logo: t.logo, seed };
}

function matchFromEspn(m: EspnMatch, label: string): BracketMatch {
  const w = m.winner === "home" ? "home" : m.winner === "away" ? "away" : null;
  return {
    id: m.id,
    label,
    home: toTeam(m.home),
    away: toTeam(m.away),
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status,
    statusDetail: m.statusDetail,
    winner: w,
    utcDate: m.utcDate,
    projected: false,
  };
}

export function buildBracket(matches: EspnMatch[], groups: EspnGroup[]): BracketRound[] {
  const knockoutMatches = matches.filter((m) => KNOCKOUT_SLUGS.includes(m.stage));

  if (knockoutMatches.length > 0) {
    // API has knockout matches — group them by stage
    const bySlug: Record<string, EspnMatch[]> = {};
    for (const m of knockoutMatches) {
      bySlug[m.stage] = bySlug[m.stage] ?? [];
      bySlug[m.stage].push(m);
    }

    return KNOCKOUT_SLUGS.filter((slug) => bySlug[slug]?.length).map((slug) => {
      const stageMatches = [...bySlug[slug]].sort(
        (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
      );
      return {
        slug,
        name: stageName(slug),
        matches: stageMatches.map((m, i) =>
          matchFromEspn(m, `${stageName(slug)} · Match ${i + 1}`)
        ),
      };
    });
  }

  // No knockout data yet — project R32 from group standings
  return [projectR32(groups)];
}

// Standard WC 2026 R32 pairing: 1A-2B, 1B-2A, 1C-2D, 1D-2C ...
// Using the 12-group format (groups A-L)
function projectR32(groups: EspnGroup[]): BracketRound {
  const byGroup: Record<string, EspnGroup> = {};
  for (const g of groups) {
    const letter = g.name.replace("Group ", "");
    byGroup[letter] = g;
  }

  function pick(group: string, pos: number): BracketTeam | null {
    const g = byGroup[group];
    if (!g) return null;
    const row = g.rows.find((r) => r.position === pos);
    if (!row) return null;
    return toTeam(row.team, `${pos}${group}`);
  }

  const pairings: [string, number, string, number][] = [
    ["A", 1, "B", 2], ["C", 1, "D", 2], ["E", 1, "F", 2],
    ["G", 1, "H", 2], ["I", 1, "J", 2], ["K", 1, "L", 2],
    ["B", 1, "A", 2], ["D", 1, "C", 2], ["F", 1, "E", 2],
    ["H", 1, "G", 2], ["J", 1, "I", 2], ["L", 1, "K", 2],
    // 4 best 3rd-place slots (TBD until after group stage)
  ];

  const matches: BracketMatch[] = pairings.map(([hg, hp, ag, ap], i) => ({
    label: `R32 · Match ${i + 1}`,
    home: pick(hg, hp),
    away: pick(ag, ap),
    homeScore: null,
    awayScore: null,
    status: "SCHEDULED",
    statusDetail: "Projected",
    winner: null,
    utcDate: null,
    projected: true,
  }));

  return { slug: "round-of-32", name: "Round of 32 (Projected)", matches };
}
