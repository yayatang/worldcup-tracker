export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getMatches, getStandings } from "@/lib/football-data";
import { buildBracket } from "@/lib/bracket";
import type { BracketRound, BracketMatch } from "@/lib/bracket";

function TeamSlot({ team }: { team: { name: string; shortName: string; crest: string; seed?: string } | null }) {
  if (!team) {
    return (
      <div className="flex items-center gap-1.5 h-7 px-2 text-neutral-600 text-xs italic">
        TBD
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 h-7 px-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={team.crest} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
      <span className="text-xs font-medium truncate">{team.shortName || team.name}</span>
    </div>
  );
}

function BracketMatchCard({ match }: { match: BracketMatch }) {
  const homeWon = match.winner === "home";
  const awayWon = match.winner === "away";
  const isProjected = match.status === "PROJECTED";

  return (
    <div
      className={`bg-neutral-900 border rounded-lg overflow-hidden w-48 flex-shrink-0 ${
        isProjected ? "border-neutral-800 opacity-70" : "border-neutral-700"
      }`}
    >
      {/* Home */}
      <div
        className={`border-b border-neutral-800 flex items-center justify-between ${homeWon ? "bg-green-900/40" : ""}`}
      >
        <TeamSlot team={match.homeTeam} />
        {match.homeScore !== null && (
          <span className={`px-2 text-sm font-bold tabular-nums ${homeWon ? "text-green-400" : "text-neutral-300"}`}>
            {match.homeScore}
          </span>
        )}
      </div>
      {/* Away */}
      <div className={`flex items-center justify-between ${awayWon ? "bg-green-900/40" : ""}`}>
        <TeamSlot team={match.awayTeam} />
        {match.awayScore !== null && (
          <span className={`px-2 text-sm font-bold tabular-nums ${awayWon ? "text-green-400" : "text-neutral-300"}`}>
            {match.awayScore}
          </span>
        )}
      </div>
      {/* Status footer */}
      {isProjected && (
        <div className="text-center text-xs text-neutral-600 py-0.5 border-t border-neutral-800">
          Projected
        </div>
      )}
      {match.utcDate && !isProjected && (
        <div className="text-center text-xs text-neutral-600 py-0.5 border-t border-neutral-800">
          {new Date(match.utcDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </div>
      )}
    </div>
  );
}

function BracketRoundColumn({ round }: { round: BracketRound }) {
  return (
    <div className="flex-shrink-0">
      <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3 text-center">
        {round.name}
      </h3>
      <div className="flex flex-col gap-3">
        {round.matches.map((m, i) => (
          <BracketMatchCard key={m.id ?? `${round.name}-${i}`} match={m} />
        ))}
      </div>
    </div>
  );
}

async function BracketView() {
  const [matches, standings] = await Promise.all([getMatches(), getStandings()]);
  const rounds = buildBracket(standings, matches);

  if (rounds.length === 0) {
    return (
      <div className="text-neutral-500 text-sm py-12 text-center">
        Bracket data not yet available. Check back after the group stage.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {rounds.map((round, i) => (
          <BracketRoundColumn key={i} round={round} />
        ))}
      </div>
    </div>
  );
}

async function GroupStandings() {
  const standings = await getStandings();
  const groups = standings.filter((s) => s.type === "TOTAL" && s.group);
  if (groups.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold mb-4">Group Stage Standings</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groups.map((s, i) => {
          const groupLabel = s.group?.replace("GROUP_", "Group ") ?? "";
          return (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-neutral-800 text-xs font-semibold text-neutral-200">
                {groupLabel}
              </div>
              <div className="divide-y divide-neutral-800">
                {s.table.map((row, ri) => (
                  <div
                    key={row.team.id}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs ${ri < 2 ? "text-white" : "text-neutral-500"}`}
                  >
                    <span className="text-neutral-600 w-3">{row.position}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={row.team.crest} alt="" className="w-4 h-4 object-contain" />
                    <span className="flex-1 font-medium">{row.team.shortName || row.team.tla}</span>
                    <span className="font-bold">{row.points}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function BracketPage() {
  return (
    <div>
      <h1 className="text-2xl font-black mb-1">Bracket</h1>
      <p className="text-neutral-400 text-sm mb-6">
        Knockout bracket, auto-updated from live results. Projected matchups shown until FIFA confirms them officially.
      </p>

      <Suspense
        fallback={
          <div className="flex gap-6 overflow-x-auto pb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0">
                <div className="h-4 w-24 bg-neutral-800 rounded mb-3 animate-pulse mx-auto" />
                <div className="flex flex-col gap-3">
                  {Array.from({ length: Math.max(1, 8 >> i) }).map((_, j) => (
                    <div key={j} className="w-48 h-16 bg-neutral-900 border border-neutral-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        }
      >
        <BracketView />
      </Suspense>

      <Suspense fallback={null}>
        <GroupStandings />
      </Suspense>
    </div>
  );
}
