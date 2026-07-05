export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getMatches, getStandings } from "@/lib/espn";
import { buildBracket, type BracketMatch, type BracketRound } from "@/lib/bracket";
import GroupTable from "@/components/GroupTable";

function TeamSlot({
  team,
  score,
  won,
}: {
  team: { name: string; tla: string; logo: string } | null;
  score: number | null;
  won: boolean;
}) {
  if (!team) {
    return <div className="flex items-center gap-1.5 h-8 px-2 text-neutral-600 text-xs italic">TBD</div>;
  }
  return (
    <div className={`flex items-center justify-between h-8 px-2 ${won ? "bg-green-900/30" : ""}`}>
      <div className="flex items-center gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={team.logo} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
        <span className={`text-xs font-medium ${won ? "text-white" : "text-neutral-300"}`}>{team.tla}</span>
      </div>
      {score !== null && (
        <span className={`text-sm font-bold tabular-nums ml-2 ${won ? "text-green-400" : "text-neutral-300"}`}>
          {score}
        </span>
      )}
    </div>
  );
}

function BracketMatchCard({ match }: { match: BracketMatch }) {
  const homeWon = match.winner === "home";
  const awayWon = match.winner === "away";

  return (
    <div className={`w-44 flex-shrink-0 rounded-lg overflow-hidden border ${match.projected ? "border-neutral-800 opacity-60" : "border-neutral-700"} bg-neutral-900`}>
      <div className="border-b border-neutral-800">
        <TeamSlot team={match.home} score={match.homeScore} won={homeWon} />
      </div>
      <TeamSlot team={match.away} score={match.awayScore} won={awayWon} />
      <div className="text-center text-xs text-neutral-600 py-0.5 border-t border-neutral-800">
        {match.projected
          ? "Projected"
          : match.utcDate
          ? new Date(match.utcDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : ""}
      </div>
    </div>
  );
}

function RoundColumn({ round }: { round: BracketRound }) {
  return (
    <div className="flex-shrink-0">
      <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3 text-center whitespace-nowrap">
        {round.name}
      </h3>
      <div className="flex flex-col gap-3">
        {round.matches.map((m, i) => (
          <BracketMatchCard key={m.id ?? `${round.slug}-${i}`} match={m} />
        ))}
      </div>
    </div>
  );
}

async function BracketView() {
  const [matches, groups] = await Promise.all([getMatches(), getStandings()]);
  const rounds = buildBracket(matches, groups);

  if (rounds.length === 0) {
    return (
      <p className="text-neutral-500 text-sm py-12 text-center">
        Bracket not available yet — check back after the group stage.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max items-start">
        {rounds.map((r, i) => <RoundColumn key={i} round={r} />)}
      </div>
    </div>
  );
}

async function GroupsSection() {
  const groups = await getStandings();
  if (groups.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold mb-4">Group Standings</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groups.map((g) => <GroupTable key={g.name} group={g} />)}
      </div>
    </section>
  );
}

export default function BracketPage() {
  return (
    <div>
      <h1 className="text-2xl font-black mb-1">Bracket</h1>
      <p className="text-neutral-400 text-sm mb-6">
        Knockout bracket auto-updated from live results. Before official matchups are confirmed,
        projected pairings are shown based on current standings.
      </p>

      <Suspense
        fallback={
          <div className="flex gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0">
                <div className="h-3 w-24 bg-neutral-800 rounded mb-3 animate-pulse mx-auto" />
                <div className="flex flex-col gap-3">
                  {Array.from({ length: Math.max(1, 8 >> i) }).map((_, j) => (
                    <div key={j} className="w-44 h-16 bg-neutral-900 border border-neutral-800 rounded-lg animate-pulse" />
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
        <GroupsSection />
      </Suspense>
    </div>
  );
}
