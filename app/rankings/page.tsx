export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getStandings } from "@/lib/espn";
import fifaRankings from "@/data/fifa-rankings.json";

interface FifaEntry {
  rank: number;
  tla: string;
  team: string;
  points: number;
  confederation: string;
}

const rankMap = new Map<string, FifaEntry>(
  (fifaRankings as FifaEntry[]).map((r) => [r.tla, r])
);

async function RankingsTable() {
  const groups = await getStandings();

  // Flatten all teams across all groups
  const rows = groups.flatMap((g) =>
    g.rows.map((row) => ({
      group: g.name,
      row,
      fifa: rankMap.get(row.team.tla) ?? null,
    }))
  );

  // Sort by FIFA rank (unranked last)
  rows.sort((a, b) => (a.fifa?.rank ?? 999) - (b.fifa?.rank ?? 999));

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="text-neutral-500 text-xs border-b border-neutral-800 bg-neutral-800">
            <th className="text-left px-4 py-2.5 font-medium">FIFA Rank</th>
            <th className="text-left px-4 py-2.5 font-medium">Team</th>
            <th className="text-center px-3 py-2.5 font-medium hidden sm:table-cell">Rating</th>
            <th className="text-center px-3 py-2.5 font-medium hidden md:table-cell">Confed.</th>
            <th className="text-center px-3 py-2.5 font-medium">WC Group</th>
            <th className="text-center px-3 py-2.5 font-medium">Pos</th>
            <th className="text-center px-3 py-2.5 font-medium">WC Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ row, group, fifa }, i) => (
            <tr key={row.team.id} className={`border-b border-neutral-800 last:border-0 ${i % 2 === 1 ? "bg-neutral-900/60" : ""}`}>
              <td className="px-4 py-2.5 font-bold text-neutral-300">
                {fifa ? `#${fifa.rank}` : "–"}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.team.logo} alt="" className="w-5 h-5 object-contain" />
                  <span className="font-semibold">{row.team.name}</span>
                  <span className="text-xs text-neutral-500 hidden lg:inline">{row.team.tla}</span>
                </div>
              </td>
              <td className="text-center px-3 py-2.5 text-neutral-400 hidden sm:table-cell">
                {fifa?.points?.toLocaleString() ?? "–"}
              </td>
              <td className="text-center px-3 py-2.5 text-neutral-500 text-xs hidden md:table-cell">
                {fifa?.confederation ?? "–"}
              </td>
              <td className="text-center px-3 py-2.5 text-neutral-300">{group}</td>
              <td className="text-center px-3 py-2.5 font-semibold">{row.position}</td>
              <td className="text-center px-3 py-2.5 font-bold text-green-400">{row.points}</td>
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
        FIFA rankings update monthly.
      </p>
      <Suspense
        fallback={<div className="bg-neutral-900 border border-neutral-800 rounded-xl h-96 animate-pulse" />}
      >
        <RankingsTable />
      </Suspense>
      <p className="text-xs text-neutral-600 mt-4">
        FIFA ranking points are approximate — see{" "}
        <a href="https://www.fifa.com/fifa-world-ranking" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-400">
          fifa.com
        </a>{" "}
        for official figures.
      </p>
    </div>
  );
}
