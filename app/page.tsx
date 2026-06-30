export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getMatches, getStandings } from "@/lib/football-data";
import MatchCard from "@/components/MatchCard";
import GroupTable from "@/components/GroupTable";
import type { Match } from "@/lib/football-data";

function sortByDate(a: Match, b: Match) {
  return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
}

async function LiveMatches() {
  const matches = await getMatches();
  const live = matches.filter(
    (m) => m.status === "IN_PLAY" || m.status === "PAUSED"
  );
  if (live.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-3 text-green-400">Live Now</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {live.map((m) => <MatchCard key={m.id} match={m} />)}
      </div>
    </section>
  );
}

async function UpcomingMatches() {
  const matches = await getMatches();
  const now = Date.now();
  const upcoming = matches
    .filter((m) => m.status === "SCHEDULED" || m.status === "TIMED")
    .filter((m) => new Date(m.utcDate).getTime() > now)
    .sort(sortByDate)
    .slice(0, 6);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Upcoming Matches</h2>
        <a href="/schedule" className="text-sm text-green-400 hover:underline">
          Full Schedule →
        </a>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-neutral-500 text-sm">No upcoming matches found.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      )}
    </section>
  );
}

async function RecentResults() {
  const matches = await getMatches();
  const recent = matches
    .filter((m) => m.status === "FINISHED")
    .sort((a, b) => sortByDate(b, a))
    .slice(0, 6);
  if (recent.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-3">Recent Results</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recent.map((m) => <MatchCard key={m.id} match={m} />)}
      </div>
    </section>
  );
}

async function GroupsSnapshot() {
  const standings = await getStandings();
  const groupStandings = standings.filter(
    (s) => s.type === "TOTAL" && s.group
  );
  if (groupStandings.length === 0) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Group Standings</h2>
        <a href="/bracket" className="text-sm text-green-400 hover:underline">
          Full Bracket →
        </a>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groupStandings.map((s, i) => (
          <GroupTable key={i} standing={s} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">
          FIFA World Cup <span className="text-green-400">2026</span>
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          USA · Canada · Mexico &nbsp;·&nbsp; June 11 – July 19, 2026
        </p>
      </div>

      <Suspense fallback={null}>
        <LiveMatches />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl h-28 animate-pulse" />
            ))}
          </div>
        }
      >
        <UpcomingMatches />
      </Suspense>

      <Suspense fallback={null}>
        <RecentResults />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        }
      >
        <GroupsSnapshot />
      </Suspense>
    </div>
  );
}
