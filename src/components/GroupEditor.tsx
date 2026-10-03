"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GroupEditor({
  group,
}: {
  group: { id: string; name: string; color: string; points: number };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.name);
  const [color, setColor] = useState(group.color);
  const [points, setPoints] = useState(String(group.points));
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    const parsedPoints = Number(points);
    if (!Number.isInteger(parsedPoints) || parsedPoints < 0) {
      setError("Points must be a whole number ≥ 0");
      return;
    }
    const res = await fetch(`/api/admin/groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color, points: parsedPoints }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Failed");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setEditing(true)}>
        Edit
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded" />
      <input className="input h-8 w-36 py-1" value={name} onChange={(e) => setName(e.target.value)} />
      <input
        type="number"
        min={0}
        className="input h-8 w-20 py-1"
        value={points}
        onChange={(e) => setPoints(e.target.value)}
        title="Points"
      />
      <button className="btn-success px-2 py-1 text-xs" onClick={save}>Save</button>
      <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setEditing(false)}>Cancel</button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
