import type { EspnGroup } from "@/lib/espn";

export default function GroupTable({ group }: { group: EspnGroup }) {
  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-sm">
      <div className="px-4 py-2 bg-elevated font-semibold text-sm text-ink2">
        {group.name}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-ink4 border-b border-line">
            <th className="text-left px-3 py-1.5 font-medium w-5">#</th>
            <th className="text-left px-3 py-1.5 font-medium">Team</th>
            <th className="text-center px-2 py-1.5 font-medium">P</th>
            <th className="text-center px-2 py-1.5 font-medium">W</th>
            <th className="text-center px-2 py-1.5 font-medium">D</th>
            <th className="text-center px-2 py-1.5 font-medium">L</th>
            <th className="text-center px-2 py-1.5 font-medium">GD</th>
            <th className="text-center px-2 py-1.5 font-medium font-bold text-ink">Pts</th>
          </tr>
        </thead>
        <tbody>
          {group.rows.map((row) => (
            <tr
              key={row.team.id}
              className={`border-b border-line last:border-0 ${
                row.advanced ? "text-ink" : row.position <= 2 ? "text-ink2" : "text-ink4"
              }`}
            >
              <td className="px-3 py-2 text-ink4">{row.position}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.team.logo} alt="" className="w-4 h-4 object-contain" />
                  <span className="font-medium">{row.team.tla}</span>
                </div>
              </td>
              <td className="text-center px-2 py-2">{row.played}</td>
              <td className="text-center px-2 py-2">{row.won}</td>
              <td className="text-center px-2 py-2">{row.drawn}</td>
              <td className="text-center px-2 py-2">{row.lost}</td>
              <td className="text-center px-2 py-2">
                {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
              </td>
              <td className="text-center px-2 py-2 font-bold text-ink">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
