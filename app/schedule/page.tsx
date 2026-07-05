export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getMatches, stageName, type EspnMatch } from "@/lib/espn";
import MatchCard from "@/components/MatchCard";

function groupByDate(matches: EspnMatch[]) {
  const map: Record<string, EspnMatch[]> = {};
  for (const m of matches) {
    const key = new Date(m.utcDate).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    map[key] = map[key] ?? [];
    map[key].push(m);
  }
  return map;
}

const SLUG_ORDER = [
  "group-stage", "round-of-32", "round-of-16",
  "quarterfinals", "semifinals", "3rd-place-match", "final",
];

async function ScheduleContent() {
  const matches = await getMatches();
  const grouped = groupByDate(matches);

  const stages = [...new Set(matches.map((m) => m.stage))].sort(
    (a, b) => SLUG_ORDER.indexOf(a) - SLUG_ORDER.indexOf(b)
  );

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        {stages.map((s) => (
          <span key={s} className="px-3 py-1 rounded-full text-xs bg-neutral-800 text-neutral-300">
            {stageName(s)}
          </span>
        ))}
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([date, dayMatches]) => (
          <section key={date}>
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3 pb-2 border-b border-neutral-800">
              {date}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dayMatches.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

export default function SchedulePage() {
  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Full Schedule</h1>
      <p className="text-neutral-400 text-sm mb-6">All matches, grouped by date.</p>
      <Suspense
        fallback={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl h-28 animate-pulse" />
            ))}
          </div>
        }
      >
        <ScheduleContent />
      </Suspense>
    </div>
  );
}
