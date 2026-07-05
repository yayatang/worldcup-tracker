export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getMatches, stageName, type EspnMatch } from "@/lib/espn";
import MatchCard from "@/components/MatchCard";

const TZ = "Asia/Jerusalem";

const SLUG_ORDER = [
  "group-stage", "round-of-32", "round-of-16",
  "quarterfinals", "semifinals", "3rd-place-match", "final",
];

const PAST_STATUSES = new Set(["FINISHED", "EXTRA_TIME", "PENALTY", "POSTPONED", "CANCELLED"]);

function ilDate(utcDate: string) {
  return new Date(utcDate).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: TZ,
  });
}

function groupByDate(matches: EspnMatch[]): [string, EspnMatch[]][] {
  const map = new Map<string, EspnMatch[]>();
  for (const m of matches) {
    const key = ilDate(m.utcDate);
    const arr = map.get(key) ?? [];
    arr.push(m);
    map.set(key, arr);
  }
  return [...map.entries()];
}

async function ScheduleContent() {
  const matches = await getMatches(); // already sorted ascending by utcDate

  const upcoming = matches.filter((m) => !PAST_STATUSES.has(m.status));
  const past = matches.filter((m) => PAST_STATUSES.has(m.status)); // already ascending (chronological)

  const stages = [...new Set(matches.map((m) => m.stage))].sort(
    (a, b) => SLUG_ORDER.indexOf(a) - SLUG_ORDER.indexOf(b)
  );

  return (
    <>
      {/* Stage pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {stages.map((s) => (
          <span key={s} className="px-3 py-1 rounded-full text-xs bg-neutral-800 text-neutral-300">
            {stageName(s)}
          </span>
        ))}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">
            Upcoming <span className="text-neutral-500 font-normal text-sm">— Israel time</span>
          </h2>
          <div className="space-y-6">
            {groupByDate(upcoming).map(([date, dayMatches]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2 pb-1 border-b border-neutral-800">
                  {date}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {dayMatches.map((m) => <MatchCard key={m.id} match={m} />)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4 text-neutral-400">
            Past Results <span className="text-neutral-600 font-normal text-sm">— chronological</span>
          </h2>
          <div className="space-y-6">
            {groupByDate(past).map(([date, dayMatches]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-neutral-600 uppercase tracking-widest mb-2 pb-1 border-b border-neutral-800">
                  {date}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {dayMatches.map((m) => <MatchCard key={m.id} match={m} />)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function SchedulePage() {
  return (
    <div>
      <h1 className="text-2xl font-black mb-2">Full Schedule</h1>
      <p className="text-neutral-400 text-sm mb-6">
        Upcoming games first, then past results — all times in Israel time.
      </p>
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
