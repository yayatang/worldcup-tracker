export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getMatches, getStandings, type EspnMatch } from "@/lib/espn";
import MatchCard from "@/components/MatchCard";
import GroupTable from "@/components/GroupTable";

const Skeleton = () => (
  <div className="bg-surface border border-line rounded-xl h-28 animate-pulse" />
);

async function LiveMatches() {
  const matches = await getMatches();
  const live = matches.filter((m) => m.status === "IN_PLAY" || m.status === "PAUSED");
  if (live.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-3 text-accent">● Live Now</h2>
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
    .filter((m) => m.status === "SCHEDULED" && new Date(m.utcDate).getTime() > now)
    .slice(0, 6);
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Upcoming Matches</h2>
        <a href="/schedule" className="text-sm text-accent hover:underline">Full Schedule →</a>
      </div>
      {upcoming.length === 0
        ? <p className="text-ink4 text-sm">No upcoming matches scheduled.</p>
        : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>}
    </section>
  );
}

async function RecentResults() {
  const matches = await getMatches();
  // ascending (chronological) — most recently played games last, so we take the tail
  const allFinished = matches.filter((m) =>
    ["FINISHED", "EXTRA_TIME", "PENALTY"].includes(m.status)
  );
  const finished: EspnMatch[] = allFinished.slice(-6);
  if (finished.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-3">Recent Results</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {finished.map((m) => <MatchCard key={m.id} match={m} />)}
      </div>
    </section>
  );
}

async function GroupsSnapshot() {
  const groups = await getStandings();
  if (groups.length === 0) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Group Standings</h2>
        <a href="/" className="text-sm text-accent hover:underline">Full Bracket →</a>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groups.map((g) => <GroupTable key={g.name} group={g} />)}
      </div>
    </section>
  );
}

const GridSkeleton = ({ n }: { n: number }) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-8">
    {Array.from({ length: n }).map((_, i) => <Skeleton key={i} />)}
  </div>
);

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">
          FIFA World Cup <span className="text-accent">2026</span>
        </h1>
        <p className="text-ink3 text-sm mt-1">
          USA · Canada · Mexico &nbsp;·&nbsp; June 11 – July 19, 2026
        </p>
      </div>

      <Suspense fallback={null}><LiveMatches /></Suspense>

      <Suspense fallback={<GridSkeleton n={6} />}><UpcomingMatches /></Suspense>

      <Suspense fallback={null}><RecentResults /></Suspense>

      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-surface border border-line rounded-xl h-44 animate-pulse" />
            ))}
          </div>
        }
      >
        <GroupsSnapshot />
      </Suspense>
    </div>
  );
}
