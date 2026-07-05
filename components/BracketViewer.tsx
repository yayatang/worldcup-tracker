"use client";

import { useState, useMemo } from "react";
import type { BracketRound, BracketMatch } from "@/lib/bracket";

// ── Constants ─────────────────────────────────────────────────────────────────

// Base slot height (px) for the R16 round; doubles each subsequent round.
const UNIT = 88;

// Visual ordering of R16 matches from date-sorted order.
// ESPN's QF wiring: QF1←R16[1,2], QF2←R16[5,6], QF3←R16[3,4], QF4←R16[7,8].
// Reordering to [0,1,4,5,2,3,6,7] gives consecutive pairs that each feed one QF.
const R16_REORDER = [0, 1, 4, 5, 2, 3, 6, 7];

const KNOCKOUT_SLUGS = ["round-of-16", "quarterfinals", "semifinals", "final"];

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeamInfo {
  tla: string;
  name: string;
  logo: string;
}

interface Props {
  rounds: BracketRound[];
  thirdPlace: BracketMatch | null;
  allTeams: TeamInfo[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isTbd(tla: string) {
  return tla.includes(" ");
}

function teamSide(match: BracketMatch, tla: string | null): "home" | "away" | null {
  if (!tla) return null;
  if (match.home?.tla === tla) return "home";
  if (match.away?.tla === tla) return "away";
  return null;
}

// Collect all match IDs that contain a given team across all rounds.
function getTeamMatchIds(rounds: BracketRound[], tla: string): Set<string> {
  const ids = new Set<string>();
  for (const r of rounds) {
    for (const m of r.matches) {
      if (m.id && (m.home?.tla === tla || m.away?.tla === tla)) {
        ids.add(m.id);
      }
    }
  }
  return ids;
}

// Return the match for a given slug + visual index, or null.
function getRoundMatches(rounds: BracketRound[], slug: string): BracketMatch[] {
  return rounds.find((r) => r.slug === slug)?.matches ?? [];
}

function reorderR16(matches: BracketMatch[]): BracketMatch[] {
  if (matches.length !== 8) return matches;
  return R16_REORDER.map((i) => matches[i]);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TeamRow({
  team,
  score,
  won,
  selected,
  highlighted,
}: {
  team: { tla: string; name: string; logo: string } | null;
  score: number | null;
  won: boolean;
  selected: boolean;
  highlighted: boolean;
}) {
  if (!team || isTbd(team.tla)) {
    return (
      <div className="flex items-center h-8 px-2 text-neutral-600 text-xs italic gap-1.5">
        <div className="w-4 h-4 rounded-full bg-neutral-800" />
        TBD
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-between h-8 px-2 transition-colors ${
        won ? "bg-green-900/40" : ""
      } ${selected ? "bg-blue-900/50" : ""}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={team.logo} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
        <span
          className={`text-xs font-semibold truncate ${
            won ? "text-white" : highlighted ? "text-blue-300" : "text-neutral-300"
          }`}
        >
          {team.tla}
        </span>
      </div>
      {score !== null && (
        <span
          className={`text-sm font-bold tabular-nums ml-2 ${
            won ? "text-green-400" : "text-neutral-400"
          }`}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function MatchCard({
  match,
  selectedTla,
  highlightedIds,
}: {
  match: BracketMatch;
  selectedTla: string | null;
  highlightedIds: Set<string>;
}) {
  const isHighlighted = !!(match.id && highlightedIds.has(match.id));
  const homeWon = match.winner === "home";
  const awayWon = match.winner === "away";
  const homeSel = teamSide(match, selectedTla) === "home";
  const awaySel = teamSide(match, selectedTla) === "away";

  const borderCls = isHighlighted
    ? "border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
    : match.projected
    ? "border-neutral-800 opacity-60"
    : "border-neutral-700";

  const statusText =
    match.status === "FINISHED" || match.status === "EXTRA_TIME" || match.status === "PENALTY"
      ? match.statusDetail || "FT"
      : match.status === "IN_PLAY" || match.status === "PAUSED"
      ? "● LIVE"
      : match.utcDate
      ? new Date(match.utcDate).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Jerusalem" })
      : "TBD";

  return (
    <div
      className={`w-44 flex-shrink-0 rounded-lg overflow-hidden border bg-neutral-900 transition-all ${borderCls}`}
    >
      <div className="border-b border-neutral-800">
        <TeamRow
          team={match.home}
          score={match.homeScore}
          won={homeWon}
          selected={homeSel}
          highlighted={isHighlighted}
        />
      </div>
      <TeamRow
        team={match.away}
        score={match.awayScore}
        won={awayWon}
        selected={awaySel}
        highlighted={isHighlighted}
      />
      <div className="text-center text-[10px] text-neutral-600 py-0.5 border-t border-neutral-800">
        {statusText}
      </div>
    </div>
  );
}

// Connector lines between two source match slots and one target slot.
// slotH: height of each SOURCE slot (px).
function Connector({ slotH }: { slotH: number }) {
  const h = slotH * 2;
  return (
    <div style={{ height: h, width: 16, position: "relative", flexShrink: 0 }}>
      {/* Vertical segment: center of top slot → center of bottom slot */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: slotH / 2,
          height: slotH,
          width: 1,
          background: "#404040",
        }}
      />
      {/* Horizontal segment at midpoint extending to right */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: slotH - 0.5,
          height: 1,
          background: "#404040",
        }}
      />
    </div>
  );
}

// Thin horizontal line leading into a match card (left arm).
function LeftArm({ slotH }: { slotH: number }) {
  return (
    <div style={{ height: slotH, width: 10, position: "relative", flexShrink: 0 }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: 1,
          background: "#404040",
          transform: "translateY(-0.5px)",
        }}
      />
    </div>
  );
}

// A column of match slots at a given depth (depth determines slot height).
function MatchColumn({
  matches,
  depth,
  selectedTla,
  highlightedIds,
  showLeftArm = true,
}: {
  matches: BracketMatch[];
  depth: number;
  selectedTla: string | null;
  highlightedIds: Set<string>;
  showLeftArm?: boolean;
}) {
  const slotH = UNIT * Math.pow(2, depth);
  return (
    <div className="flex flex-col flex-shrink-0">
      {matches.map((m, i) => (
        <div
          key={m.id ?? `${depth}-${i}`}
          style={{ height: slotH, display: "flex", alignItems: "center" }}
        >
          {showLeftArm && depth > 0 && <LeftArm slotH={slotH} />}
          <MatchCard match={m} selectedTla={selectedTla} highlightedIds={highlightedIds} />
        </div>
      ))}
    </div>
  );
}

// A column of connector elements between two adjacent rounds.
function ConnectorColumn({ count, slotH }: { count: number; slotH: number }) {
  return (
    <div className="flex flex-col flex-shrink-0">
      {Array.from({ length: count }).map((_, i) => (
        <Connector key={i} slotH={slotH} />
      ))}
    </div>
  );
}

// ── Road to Final ─────────────────────────────────────────────────────────────

function RoadToFinal({
  tla,
  rounds,
}: {
  tla: string;
  rounds: BracketRound[];
}) {
  const allMatches: { round: string; match: BracketMatch }[] = [];
  for (const r of rounds) {
    for (const m of r.matches) {
      if (m.home?.tla === tla || m.away?.tla === tla) {
        allMatches.push({ round: r.name, match: m });
      }
    }
  }

  if (allMatches.length === 0) return null;

  const team = (allMatches[0].match.home?.tla === tla
    ? allMatches[0].match.home
    : allMatches[0].match.away)!;

  return (
    <div className="mt-6 bg-neutral-900 border border-blue-900/60 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={team.logo} alt="" className="w-6 h-6 object-contain" />
        <h3 className="font-bold text-blue-300">
          {team.name} — Road to the Final
        </h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {allMatches.map(({ round, match }, i) => {
          const side = match.home?.tla === tla ? "home" : "away";
          const opponent = side === "home" ? match.away : match.home;
          const teamScore = side === "home" ? match.homeScore : match.awayScore;
          const oppScore = side === "home" ? match.awayScore : match.homeScore;
          const won = match.winner === side;
          const isPlayed = ["FINISHED", "EXTRA_TIME", "PENALTY"].includes(match.status);
          const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";

          return (
            <div key={i} className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border text-xs ${
              isLive ? "border-green-600 bg-green-950" :
              won ? "border-green-800 bg-green-950/40" :
              isPlayed ? "border-red-900 bg-red-950/30" :
              "border-neutral-700 bg-neutral-800"
            }`}>
              <span className="text-neutral-400 text-[10px] uppercase tracking-wide">{round}</span>
              <div className="flex items-center gap-1.5">
                {opponent && !isTbd(opponent.tla) ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={opponent.logo} alt="" className="w-4 h-4 object-contain" />
                    <span className="font-semibold text-neutral-200">vs {opponent.tla}</span>
                  </>
                ) : (
                  <span className="text-neutral-500 italic">vs TBD</span>
                )}
              </div>
              {isPlayed ? (
                <span className={`font-bold ${won ? "text-green-400" : "text-red-400"}`}>
                  {teamScore} – {oppScore} {won ? "W" : "L"}
                  {match.statusDetail && match.statusDetail !== "FT" ? ` (${match.statusDetail})` : ""}
                </span>
              ) : isLive ? (
                <span className="text-green-400 font-bold">● LIVE {teamScore}–{oppScore}</span>
              ) : (
                <span className="text-neutral-400">
                  {match.utcDate
                    ? new Date(match.utcDate).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Jerusalem" })
                    : "TBD"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Team Picker ───────────────────────────────────────────────────────────────

function TeamPicker({
  teams,
  selected,
  onSelect,
}: {
  teams: TeamInfo[];
  selected: string | null;
  onSelect: (tla: string | null) => void;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-neutral-400">Highlight a team:</span>
        {selected && (
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-neutral-500 hover:text-white underline"
          >
            clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {teams.map((t) => (
          <button
            key={t.tla}
            onClick={() => onSelect(selected === t.tla ? null : t.tla)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-all ${
              selected === t.tla
                ? "border-blue-500 bg-blue-950 text-white"
                : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.logo} alt="" className="w-4 h-4 object-contain" />
            {t.tla}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BracketViewer({ rounds, thirdPlace, allTeams }: Props) {
  const [selectedTla, setSelectedTla] = useState<string | null>(null);

  const knockoutRounds = useMemo(
    () => rounds.filter((r) => KNOCKOUT_SLUGS.includes(r.slug)),
    [rounds]
  );

  const highlightedIds = useMemo(
    () => (selectedTla ? getTeamMatchIds(knockoutRounds, selectedTla) : new Set<string>()),
    [knockoutRounds, selectedTla]
  );

  const r16 = useMemo(() => reorderR16(getRoundMatches(rounds, "round-of-16")), [rounds]);
  const qf = useMemo(() => getRoundMatches(rounds, "quarterfinals"), [rounds]);
  const sf = useMemo(() => getRoundMatches(rounds, "semifinals"), [rounds]);
  const final = useMemo(() => getRoundMatches(rounds, "final"), [rounds]);

  if (knockoutRounds.length === 0) {
    return (
      <p className="text-neutral-500 text-sm py-12 text-center">
        Knockout bracket not available yet.
      </p>
    );
  }

  const hasR16 = r16.length > 0;

  return (
    <div>
      <TeamPicker teams={allTeams} selected={selectedTla} onSelect={setSelectedTla} />

      {/* Bracket */}
      <div className="overflow-x-auto pb-4">
        <div className="flex flex-row items-start gap-0" style={{ minWidth: "min-content" }}>
          {hasR16 && (
            <>
              <MatchColumn
                matches={r16}
                depth={0}
                selectedTla={selectedTla}
                highlightedIds={highlightedIds}
                showLeftArm={false}
              />
              <ConnectorColumn count={4} slotH={UNIT} />
            </>
          )}

          {qf.length > 0 && (
            <>
              <MatchColumn
                matches={qf}
                depth={hasR16 ? 1 : 0}
                selectedTla={selectedTla}
                highlightedIds={highlightedIds}
                showLeftArm={!hasR16}
              />
              <ConnectorColumn count={2} slotH={hasR16 ? UNIT * 2 : UNIT} />
            </>
          )}

          {sf.length > 0 && (
            <>
              <MatchColumn
                matches={sf}
                depth={hasR16 ? 2 : qf.length > 0 ? 1 : 0}
                selectedTla={selectedTla}
                highlightedIds={highlightedIds}
              />
              <ConnectorColumn count={1} slotH={hasR16 ? UNIT * 4 : qf.length > 0 ? UNIT * 2 : UNIT} />
            </>
          )}

          {final.length > 0 && (
            <MatchColumn
              matches={final}
              depth={hasR16 ? 3 : qf.length > 0 ? 2 : sf.length > 0 ? 1 : 0}
              selectedTla={selectedTla}
              highlightedIds={highlightedIds}
            />
          )}

          {/* Trophy label */}
          {final.length > 0 && (
            <div
              className="flex items-center justify-center flex-shrink-0 pl-4"
              style={{ height: UNIT * (hasR16 ? 8 : qf.length > 0 ? 4 : 2) }}
            >
              <span className="text-3xl">🏆</span>
            </div>
          )}
        </div>
      </div>

      {/* 3rd place */}
      {thirdPlace && (
        <div className="mt-4">
          <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">3rd Place</p>
          <MatchCard
            match={thirdPlace}
            selectedTla={selectedTla}
            highlightedIds={highlightedIds}
          />
        </div>
      )}

      {/* Road to Final */}
      {selectedTla && (
        <RoadToFinal tla={selectedTla} rounds={knockoutRounds} />
      )}
    </div>
  );
}
