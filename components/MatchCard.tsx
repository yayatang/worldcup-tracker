import type { EspnMatch } from "@/lib/espn";

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  IN_PLAY:    { cls: "bg-green-600 text-white animate-pulse",                              label: "LIVE" },
  PAUSED:     { cls: "bg-amber-500 text-white",                                            label: "HT"   },
  EXTRA_TIME: { cls: "bg-orange-500 text-white",                                           label: "AET"  },
  PENALTY:    { cls: "bg-purple-600 text-white",                                           label: "PENS" },
  FINISHED:   { cls: "bg-elevated text-ink3",                                              label: "FT"   },
  SCHEDULED:  { cls: "bg-sky-100 text-sky-700 dark:bg-blue-900 dark:text-blue-200",        label: "Soon" },
  POSTPONED:  { cls: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",          label: "PPD"  },
  CANCELLED:  { cls: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",          label: "CXL"  },
};

const TZ = "Asia/Jerusalem";

function formatMatchDate(utcDate: string) {
  return new Date(utcDate).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: TZ,
  });
}

function formatMatchTime(utcDate: string) {
  return new Date(utcDate).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  });
}

export default function MatchCard({ match }: { match: EspnMatch }) {
  const badge = STATUS_BADGE[match.status] ?? STATUS_BADGE.SCHEDULED;
  const hasScore = ["IN_PLAY", "PAUSED", "FINISHED", "EXTRA_TIME", "PENALTY"].includes(match.status);
  const homeWon = match.winner === "home";
  const awayWon = match.winner === "away";

  return (
    <div className="bg-surface border border-line rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-ink4">
          {match.group ?? match.stage.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className={`font-semibold text-sm text-right leading-tight ${homeWon ? "text-ink" : "text-ink3"}`}>
            {match.home.tla}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={match.home.logo} alt="" className="w-8 h-8 object-contain" />
        </div>

        {/* Score / Time */}
        <div className="flex-shrink-0 text-center w-20">
          {hasScore ? (
            <span className="text-2xl font-bold tabular-nums text-ink">
              {match.homeScore ?? "–"}&nbsp;:&nbsp;{match.awayScore ?? "–"}
            </span>
          ) : (
            <div className="text-xs text-ink3">
              <div>{formatMatchDate(match.utcDate)}</div>
              <div className="font-bold text-ink text-sm">{formatMatchTime(match.utcDate)}</div>
            </div>
          )}
          {match.statusDetail && hasScore && (
            <div className="text-xs text-ink4 mt-0.5">{match.statusDetail}</div>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={match.away.logo} alt="" className="w-8 h-8 object-contain" />
          <span className={`font-semibold text-sm leading-tight ${awayWon ? "text-ink" : "text-ink3"}`}>
            {match.away.tla}
          </span>
        </div>
      </div>

      {match.status === "IN_PLAY" && (
        <p className="text-center text-xs text-accent mt-2">● {match.statusDetail}</p>
      )}
    </div>
  );
}
