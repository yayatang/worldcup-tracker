export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getMatches, getStandings } from "@/lib/espn";
import { buildBracket, type BracketMatch } from "@/lib/bracket";
import GroupTable from "@/components/GroupTable";
import BracketViewer from "@/components/BracketViewer";

async function BracketSection() {
  const [matches, groups] = await Promise.all([getMatches(), getStandings()]);
  const rounds = buildBracket(matches, groups);

  // Extract 3rd-place match separately so BracketViewer handles just the main bracket tree
  const thirdIdx = rounds.findIndex((r) => r.slug === "3rd-place-match");
  const thirdPlace: BracketMatch | null =
    thirdIdx >= 0 ? rounds[thirdIdx].matches[0] ?? null : null;
  const mainRounds = rounds.filter((r) => r.slug !== "3rd-place-match");

  // Collect all real teams that appear in knockout rounds
  const seen = new Set<string>();
  const allTeams: { tla: string; name: string; logo: string }[] = [];
  for (const r of mainRounds) {
    for (const m of r.matches) {
      for (const t of [m.home, m.away]) {
        if (t && !t.tla.includes(" ") && !seen.has(t.tla)) {
          seen.add(t.tla);
          allTeams.push({ tla: t.tla, name: t.name, logo: t.logo });
        }
      }
    }
  }
  allTeams.sort((a, b) => a.name.localeCompare(b.name));

  // Build seed map: tla → "1A", "2B", "3C", etc.
  const seedMap: Record<string, string> = {};
  for (const g of groups) {
    const letter = g.name.replace("Group ", "");
    for (const row of g.rows) {
      seedMap[row.team.tla] = `${row.position}${letter}`;
    }
  }

  if (mainRounds.length === 0) {
    return (
      <p className="text-ink4 text-sm py-12 text-center">
        Bracket not available yet — check back after the group stage.
      </p>
    );
  }

  return (
    <BracketViewer
      rounds={mainRounds}
      thirdPlace={thirdPlace}
      allTeams={allTeams}
      seedMap={seedMap}
    />
  );
}

async function GroupsSection() {
  const groups = await getStandings();
  if (groups.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold mb-4">Group Stage Results</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groups.map((g) => (
          <GroupTable key={g.name} group={g} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight">
          FIFA World Cup <span className="text-accent">2026</span> — Bracket
        </h1>
        <p className="text-ink3 text-sm mt-1">
          Select a team to highlight their matches and see their road to the Final.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex gap-4 overflow-x-hidden">
            {[8, 4, 2, 1].map((n, i) => (
              <div key={i} className="flex flex-col gap-2 flex-shrink-0">
                <div className="h-3 w-20 bg-elevated rounded animate-pulse mb-1 mx-auto" />
                {Array.from({ length: n }).map((_, j) => (
                  <div
                    key={j}
                    className="w-44 bg-surface border border-line rounded-lg animate-pulse"
                    style={{ height: 72 }}
                  />
                ))}
              </div>
            ))}
          </div>
        }
      >
        <BracketSection />
      </Suspense>

      <Suspense fallback={null}>
        <GroupsSection />
      </Suspense>
    </div>
  );
}
