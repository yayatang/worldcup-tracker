export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getStandings } from "@/lib/football-data";
import fifaRankings from "@/data/fifa-rankings.json";
import type { StandingEntry } from "@/lib/football-data";

interface FifaEntry {
  rank: number;
  tla: string;
  team: string;
  points: number;
  confederation: string;
}

const rankingsMap = new Map<string, FifaEntry>(
  (fifaRankings as FifaEntry[]).map((r) => [r.tla, r])
);

async function RankingsTable() {
  const standings = await getStandings();

  // Collect all teams across all groups
  const teamMap = new Map<string, { entry: StandingEntry; group: string }>();
  for (const s of standings) {
    if (s.type === "TOTAL" && s.group) {
      const groupLabel = s.group.replace("GROUP_", "Group ");
      for (const entry of s.table) {
        teamMap.set(entry.team.tla, { entry, group: groupLabel });
      }
    }
  }

  // Join with FIFA rankings
  const rows = [...teamMap.values()]
    .map(({ entry, group }) => ({
      entry,
      group,
      fifa: rankingsMap.get(entry.team.tla) ?? null,
    }))
    .sort((a, b) => (a.fifa?.rank ?? 999) - (b.fifa?.rank ?? 999));

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-neutral-500 text-xs border-b border-neutral-800 bg-neutral-800">
            <th className="text-left px-4 py-2.5 font-medium">FIFA Rank</th>
            <th className="text-left px-4 py-2.5 font-medium">Team</th>
            <th className="text-center px-3 py-2.5 font-medium hidden sm:table-cell">Points</th>
            <th className="text-center px-3 py-2.5 font-medium hidden md:table-cell">Confederation</th>
            <th className="text-center px-3 py-2.5 font-medium">WC Group</th>
            <th className="text-center px-3 py-2.5 font-medium">WC Pos</th>
            <th className="text-center px-3 py-2.5 font-medium">WC Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ entry, group, fifa }, i) => (
            <tr
              key={entry.team.id}
              className={`border-b border-neutral-800 last:border-0 ${i % 2 === 0 ? "" : "bg-neutral-900/50"}`}
            >
              <td className="px-4 py-2.5">
                <span className="font-bold text-neutral-300">
                  {fifa ? `#${fifa.rank}` : "–"}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={entry.team.crest} alt="" className="w-5 h-5 object-contain" />
                  <span className="font-semibold">{entry.team.name}</span>
                  <span className="text-xs text-neutral-500 hidden lg:inline">
                    {entry.team.tla}
                  </span>
                </div>
              </td>
              <td className="text-center px-3 py-2.5 text-neutral-400 hidden sm:table-cell">
                {fifa?.points?.toLocaleString() ?? "–"}
              </td>
              <td className="text-center px-3 py-2.5 text-neutral-500 text-xs hidden md:table-cell">
                {fifa?.confederation ?? "–"}
              </td>
              <td className="text-center px-3 py-2.5 text-neutral-300">{group}</td>
              <td className="text-center px-3 py-2.5 font-semibold">{entry.position}</td>
              <td className="text-center px-3 py-2.5 font-bold text-green-400">{entry.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RankingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-black mb-1">FIFA Rankings</h1>
      <p className="text-neutral-400 text-sm mb-6">
        World rankings joined with each team&apos;s current group standing.
        Rankings updated monthly by FIFA.
      </p>

      <Suspense
        fallback={
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl h-96 animate-pulse" />
        }
      >
        <RankingsTable />
      </Suspense>

      <p className="text-xs text-neutral-600 mt-4">
        FIFA rankings data last updated manually. See{" "}
        <a
          href="https://www.fifa.com/fifa-world-ranking"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-neutral-400"
        >
          fifa.com
        </a>{" "}
        for the latest official rankings.
      </p>
    </div>
  );
}
