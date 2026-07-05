import type { EspnMatch } from "@/lib/espn";

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  IN_PLAY:    { cls: "bg-green-600 text-white animate-pulse", label: "LIVE" },
  PAUSED:     { cls: "bg-yellow-600 text-white",             label: "HT"   },
  EXTRA_TIME: { cls: "bg-orange-600 text-white",             label: "AET"  },
  PENALTY:    { cls: "bg-purple-700 text-white",             label: "PENS" },
  FINISHED:   { cls: "bg-neutral-700 text-neutral-300",      label: "FT"   },
  SCHEDULED:  { cls: "bg-blue-900 text-blue-200",            label: "Soon" },
  POSTPONED:  { cls: "bg-red-900 text-red-300",              label: "PPD"  },
  CANCELLED:  { cls: "bg-red-900 text-red-300",              label: "CXL"  },
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
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-neutral-500">
          {match.group ?? match.stage.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className={`font-semibold text-sm text-right leading-tight ${homeWon ? "text-white" : "text-neutral-300"}`}>
            {match.home.tla}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={match.home.logo} alt="" className="w-8 h-8 object-contain" />
        </div>

        {/* Score / Time */}
        <div className="flex-shrink-0 text-center w-20">
          {hasScore ? (
            <span className="text-2xl font-bold tabular-nums">
              {match.homeScore ?? "–"}&nbsp;:&nbsp;{match.awayScore ?? "–"}
            </span>
          ) : (
            <div className="text-xs text-neutral-400">
              <div>{formatMatchDate(match.utcDate)}</div>
              <div className="font-bold text-white text-sm">{formatMatchTime(match.utcDate)}</div>
            </div>
          )}
          {match.statusDetail && hasScore && (
            <div className="text-xs text-neutral-500 mt-0.5">{match.statusDetail}</div>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={match.away.logo} alt="" className="w-8 h-8 object-contain" />
          <span className={`font-semibold text-sm leading-tight ${awayWon ? "text-white" : "text-neutral-300"}`}>
            {match.away.tla}
          </span>
        </div>
      </div>

      {match.status === "IN_PLAY" && (
        <p className="text-center text-xs text-green-400 mt-2">● {match.statusDetail}</p>
      )}
    </div>
  );
}
