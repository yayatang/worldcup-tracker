import type { Match } from "@/lib/football-data";

const STATUS_STYLES: Record<string, string> = {
  IN_PLAY: "bg-green-600 text-white animate-pulse",
  PAUSED: "bg-yellow-600 text-white",
  FINISHED: "bg-neutral-700 text-neutral-300",
  SCHEDULED: "bg-blue-900 text-blue-200",
  TIMED: "bg-blue-900 text-blue-200",
  POSTPONED: "bg-red-900 text-red-300",
  CANCELLED: "bg-red-900 text-red-300",
};

const STATUS_LABEL: Record<string, string> = {
  IN_PLAY: "LIVE",
  PAUSED: "HT",
  FINISHED: "FT",
  SCHEDULED: "Upcoming",
  TIMED: "Upcoming",
  POSTPONED: "Postponed",
  CANCELLED: "Cancelled",
};

function formatDate(utcDate: string) {
  return new Date(utcDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(utcDate: string) {
  return new Date(utcDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  const isFinished = match.status === "FINISHED";
  const hasScore = isLive || isFinished;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-neutral-500">
          {match.group?.replace("GROUP_", "Group ") ?? match.stage.replace(/_/g, " ")}
          {match.matchday ? ` · MD${match.matchday}` : ""}
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded ${STATUS_STYLES[match.status] ?? "bg-neutral-700 text-neutral-300"}`}
        >
          {STATUS_LABEL[match.status] ?? match.status}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className="font-semibold text-sm text-right leading-tight">
            {match.homeTeam.shortName || match.homeTeam.name}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={match.homeTeam.crest} alt="" className="w-8 h-8 object-contain" />
        </div>

        {/* Score / Time */}
        <div className="flex-shrink-0 text-center w-20">
          {hasScore ? (
            <span className="text-xl font-bold tabular-nums">
              {match.score.fullTime.home ?? "–"} : {match.score.fullTime.away ?? "–"}
            </span>
          ) : (
            <div className="text-xs text-neutral-400">
              <div>{formatDate(match.utcDate)}</div>
              <div className="font-semibold text-white">{formatTime(match.utcDate)}</div>
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={match.awayTeam.crest} alt="" className="w-8 h-8 object-contain" />
          <span className="font-semibold text-sm leading-tight">
            {match.awayTeam.shortName || match.awayTeam.name}
          </span>
        </div>
      </div>

      {isLive && (
        <p className="text-center text-xs text-green-400 mt-2">● In Progress</p>
      )}
      {!hasScore && (
        <p className="text-center text-xs text-neutral-600 mt-2">{formatDate(match.utcDate)}</p>
      )}
    </div>
  );
}
