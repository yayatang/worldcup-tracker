export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getMatches, stageName, type EspnMatch } from "@/lib/espn";
import MatchCard from "@/components/MatchCard";

const TZ = "Asia/Jerusalem";

const SLUG_ORDER = [
  "group-stage", "round-of-32", "round-of-16",
  "quarterfinals", "semifinals", "3rd-place-match", "final",
];

function ilKey(utcDate: string | Date) {
  return new Date(utcDate).toLocaleDateString("en-CA", { timeZone: TZ });
}

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
  const todayKey = ilKey(new Date());

  // Split by Israel calendar day relative to today
  const today = matches.filter((m) => ilKey(m.utcDate) === todayKey);
  const future = matches.filter((m) => ilKey(m.utcDate) > todayKey);
  const past = matches.filter((m) => ilKey(m.utcDate) < todayKey); // ascending (chronological)

  const stages = [...new Set(matches.map((m) => m.stage))].sort(
    (a, b) => SLUG_ORDER.indexOf(a) - SLUG_ORDER.indexOf(b)
  );

  return (
    <>
      {/* Stage pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {stages.map((s) => (
          <span key={s} className="px-3 py-1 rounded-full text-xs bg-elevated text-ink3">
            {stageName(s)}
          </span>
        ))}
      </div>

      {/* Today — emphasized */}
      {today.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-600 text-white">TODAY</span>
            <h2 className="text-lg font-bold">
              {ilDate(today[0].utcDate)}{" "}
              <span className="text-ink4 font-normal text-sm">— Israel time</span>
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {today.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {future.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">
            Upcoming <span className="text-ink4 font-normal text-sm">— Israel time</span>
          </h2>
          <div className="space-y-6">
            {groupByDate(future).map(([date, dayMatches]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-ink3 uppercase tracking-widest mb-2 pb-1 border-b border-line">
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

      {/* Past — dimmed */}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4 text-ink3">
            Past Results <span className="text-ink4 font-normal text-sm">— chronological</span>
          </h2>
          <div className="space-y-6">
            {groupByDate(past).map(([date, dayMatches]) => (
              <div key={date}>
                <p className="text-xs font-semibold text-ink4 uppercase tracking-widest mb-2 pb-1 border-b border-line">
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
      <p className="text-ink3 text-sm mb-6">
        Upcoming games first, then past results — all times in Israel time.
      </p>
      <Suspense
        fallback={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-surface border border-line rounded-xl h-28 animate-pulse" />
            ))}
          </div>
        }
      >
        <ScheduleContent />
      </Suspense>
    </div>
  );
}
