import type { EspnGroup } from "@/lib/espn";

export default function GroupTable({ group }: { group: EspnGroup }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      <div className="px-4 py-2 bg-neutral-800 font-semibold text-sm text-neutral-200">
        {group.name}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-neutral-500 border-b border-neutral-800">
            <th className="text-left px-3 py-1.5 font-medium w-5">#</th>
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
          {group.rows.map((row) => (
            <tr
              key={row.team.id}
              className={`border-b border-neutral-800 last:border-0 ${
                row.advanced ? "text-white" : row.position <= 2 ? "text-neutral-200" : "text-neutral-500"
              }`}
            >
              <td className="px-3 py-2 text-neutral-500">{row.position}</td>
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
              <td className="text-center px-2 py-2 font-bold text-white">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
