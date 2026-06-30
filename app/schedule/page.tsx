export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getMatches } from "@/lib/football-data";
import MatchCard from "@/components/MatchCard";
import type { Match } from "@/lib/football-data";

function groupByDate(matches: Match[]): Record<string, Match[]> {
  const grouped: Record<string, Match[]> = {};
  for (const m of matches) {
    const dateKey = new Date(m.utcDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    grouped[dateKey] = grouped[dateKey] ?? [];
    grouped[dateKey].push(m);
  }
  return grouped;
}

const STAGE_ORDER: Record<string, number> = {
  GROUP_STAGE: 0,
  ROUND_OF_32: 1,
  LAST_16: 2,
  QUARTER_FINALS: 3,
  SEMI_FINALS: 4,
  THIRD_PLACE: 5,
  FINAL: 6,
};

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Group Stage",
  ROUND_OF_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS: "Semi-finals",
  THIRD_PLACE: "3rd Place",
  FINAL: "Final",
};

async function ScheduleList() {
  const matches = await getMatches();
  const sorted = [...matches].sort(
    (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
  );
  const grouped = groupByDate(sorted);

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([date, dayMatches]) => (
        <section key={date}>
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-3 pb-2 border-b border-neutral-800">
            {date}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dayMatches.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

async function StageFilter() {
  const matches = await getMatches();
  const stages = [...new Set(matches.map((m) => m.stage))].sort(
    (a, b) => (STAGE_ORDER[a] ?? 99) - (STAGE_ORDER[b] ?? 99)
  );
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {stages.map((stage) => (
        <span
          key={stage}
          className="px-3 py-1 rounded-full text-xs bg-neutral-800 text-neutral-300"
        >
          {STAGE_LABELS[stage] ?? stage.replace(/_/g, " ")}
        </span>
      ))}
    </div>
  );
}

export default function SchedulePage() {
  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Full Schedule</h1>
      <p className="text-neutral-400 text-sm mb-6">All matches, grouped by date.</p>

      <Suspense fallback={<div className="flex flex-wrap gap-2 mb-6">{Array.from({length:4}).map((_,i)=><div key={i} className="h-6 w-24 rounded-full bg-neutral-800 animate-pulse"/>)}</div>}>
        <StageFilter />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl h-28 animate-pulse" />
            ))}
          </div>
        }
      >
        <ScheduleList />
      </Suspense>
    </div>
  );
}
