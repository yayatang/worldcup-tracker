import type { Standing } from "@/lib/football-data";

export default function GroupTable({ standing }: { standing: Standing }) {
  const groupLabel = standing.group?.replace("GROUP_", "Group ") ?? "Group";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-neutral-800 font-semibold text-sm text-neutral-200">
        {groupLabel}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-neutral-500 border-b border-neutral-800">
            <th className="text-left px-3 py-1.5 font-medium w-6">#</th>
            <th className="text-left px-3 py-1.5 font-medium">Team</th>
            <th className="text-center px-2 py-1.5 font-medium">P</th>
            <th className="text-center px-2 py-1.5 font-medium">W</th>
            <th className="text-center px-2 py-1.5 font-medium">D</th>
            <th className="text-center px-2 py-1.5 font-medium">L</th>
            <th className="text-center px-2 py-1.5 font-medium">GD</th>
            <th className="text-center px-2 py-1.5 font-medium font-bold text-white">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standing.table.map((row, i) => (
            <tr
              key={row.team.id}
              className={`border-b border-neutral-800 last:border-0 ${i < 2 ? "text-white" : "text-neutral-400"}`}
            >
              <td className="px-3 py-2 text-neutral-500">{row.position}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.team.crest} alt="" className="w-4 h-4 object-contain" />
                  <span className="font-medium">{row.team.shortName || row.team.tla}</span>
                </div>
              </td>
              <td className="text-center px-2 py-2">{row.playedGames}</td>
              <td className="text-center px-2 py-2">{row.won}</td>
              <td className="text-center px-2 py-2">{row.draw}</td>
              <td className="text-center px-2 py-2">{row.lost}</td>
              <td className="text-center px-2 py-2">
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </td>
              <td className="text-center px-2 py-2 font-bold text-white">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
