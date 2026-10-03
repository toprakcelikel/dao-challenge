export function Leaderboard({
  groups,
  highlightGroupId,
}: {
  groups: { id: string; name: string; color: string; points: number; _count: { members: number } }[];
  highlightGroupId?: string | null;
}) {
  const max = Math.max(1, ...groups.map((g) => g.points));
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="card">
      <h2 className="mb-4 text-lg font-bold">🏆 Leaderboard</h2>
      <ul className="space-y-3">
        {groups.map((g, i) => {
          const isMe = g.id === highlightGroupId;
          return (
            <li key={g.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-semibold">
                  <span>{medals[i] ?? `#${i + 1}`}</span>
                  <span>{g.name}</span>
                  {isMe && <span className="badge bg-indigo-100 text-indigo-700">You</span>}
                </span>
                <span className="font-bold">{g.points} pts</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(g.points / max) * 100}%`, backgroundColor: g.color }}
                />
              </div>
              <div className="mt-0.5 text-xs text-slate-400">{g._count.members} members</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
