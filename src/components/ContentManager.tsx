"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Challenge = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  level: number;
  status: string;
  maxSubmissions: number;
};
type Category = {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  challenges: Challenge[];
};

const statusStyle: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  LOCKED: "bg-slate-100 text-slate-500",
  COMPLETED: "bg-indigo-100 text-indigo-700",
};

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Request failed");
  return json;
}

export default function ContentManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newCat, setNewCat] = useState({ name: "", icon: "" });

  function refresh() {
    router.refresh();
  }
  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">{error}</div>
      )}
      {success && (
        <div className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700 ring-1 ring-green-100">{success}</div>
      )}

      {/* Add category */}
      <form
        className="card flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newCat.name.trim()) return;
          const name = newCat.name.trim();
          setSuccess(null);
          run(async () => {
            await api("/api/admin/categories", "POST", { name: newCat.name, icon: newCat.icon || undefined });
            setNewCat({ name: "", icon: "" });
            setSuccess(`Added \u201c${name}\u201d to the top of the list.`);
          });
        }}
      >
        <div className="w-20">
          <label className="label">Icon</label>
          <input className="input text-center" maxLength={4} placeholder="🎯" value={newCat.icon} onChange={(e) => setNewCat((c) => ({ ...c, icon: e.target.value }))} />
        </div>
        <div className="flex-1">
          <label className="label">New category name</label>
          <input className="input" placeholder="e.g. Outdoors & Nature" value={newCat.name} onChange={(e) => setNewCat((c) => ({ ...c, name: e.target.value }))} />
        </div>
        <button className="btn-primary">Add category</button>
      </form>

      {categories.length === 0 && (
        <div className="card text-slate-500">No categories yet. Add your first one above.</div>
      )}

      {categories.map((cat) => (
        <CategoryCard key={cat.id} category={cat} run={run} statusStyle={statusStyle} />
      ))}
    </div>
  );
}

function CategoryCard({
  category,
  run,
  statusStyle,
}: {
  category: Category;
  run: (fn: () => Promise<unknown>) => void;
  statusStyle: Record<string, string>;
}) {
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ name: category.name, icon: category.icon });
  const [newCh, setNewCh] = useState({ title: "", description: "", difficulty: "Easy", maxSubmissions: 1 });

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input className="input w-16 text-center" maxLength={4} value={edit.icon} onChange={(e) => setEdit((s) => ({ ...s, icon: e.target.value }))} />
            <input className="input flex-1" value={edit.name} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} />
            <button className="btn-success" onClick={() => run(async () => { await api(`/api/admin/categories/${category.id}`, "PATCH", edit); setEditing(false); })}>Save</button>
            <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{category.icon}</span>
              <span className="text-lg font-bold">{category.name}</span>
              {!category.active && <span className="badge bg-slate-100 text-slate-500">Hidden</span>}
            </div>
            <div className="flex items-center gap-1">
              <button className="btn-secondary px-2 py-1 text-xs" onClick={() => run(() => api(`/api/admin/categories/${category.id}`, "PATCH", { active: !category.active }))}>
                {category.active ? "Hide" : "Show"}
              </button>
              <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setEditing(true)}>Edit</button>
              <button
                className="btn-danger px-2 py-1 text-xs"
                onClick={() => {
                  if (confirm(`Delete "${category.name}" and all its tasks? This cannot be undone.`)) {
                    run(() => api(`/api/admin/categories/${category.id}`, "DELETE"));
                  }
                }}
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Challenges */}
      <ul className="mt-4 space-y-2">
        {category.challenges.map((ch, i) => (
          <ChallengeRow key={ch.id} challenge={ch} displayLevel={i + 1} run={run} statusStyle={statusStyle} />
        ))}
        {category.challenges.length === 0 && (
          <li className="text-sm text-slate-400">No tasks yet — add the first one below.</li>
        )}
      </ul>

      {/* Add challenge */}
      <form
        className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newCh.title.trim() || !newCh.description.trim()) return;
          run(async () => {
            await api("/api/admin/challenges", "POST", { categoryId: category.id, ...newCh });
            setNewCh({ title: "", description: "", difficulty: "Easy", maxSubmissions: 1 });
          });
        }}
      >
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Task title" value={newCh.title} onChange={(e) => setNewCh((c) => ({ ...c, title: e.target.value }))} />
          <select className="input w-32" value={newCh.difficulty} onChange={(e) => setNewCh((c) => ({ ...c, difficulty: e.target.value }))}>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <label className="flex items-center gap-1 text-xs text-slate-500" title="Max number of teams that may submit. One winner is chosen.">
            Max subs
            <input type="number" min={1} className="input w-16" value={newCh.maxSubmissions} onChange={(e) => setNewCh((c) => ({ ...c, maxSubmissions: Math.max(1, Number(e.target.value) || 1) }))} />
          </label>
        </div>
        <textarea className="input" rows={2} placeholder="What should the group do?" value={newCh.description} onChange={(e) => setNewCh((c) => ({ ...c, description: e.target.value }))} />
        <button className="btn-primary">Add task</button>
      </form>
    </div>
  );
}

function ChallengeRow({
  challenge,
  displayLevel,
  run,
  statusStyle,
}: {
  challenge: Challenge;
  displayLevel: number;
  run: (fn: () => Promise<unknown>) => void;
  statusStyle: Record<string, string>;
}) {
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({
    title: challenge.title,
    description: challenge.description,
    difficulty: challenge.difficulty,
    maxSubmissions: challenge.maxSubmissions,
  });

  if (editing) {
    return (
      <li className="space-y-2 rounded-xl border border-slate-200 p-3">
        <div className="flex gap-2">
          <input className="input flex-1" value={edit.title} onChange={(e) => setEdit((s) => ({ ...s, title: e.target.value }))} />
          <select className="input w-32" value={edit.difficulty} onChange={(e) => setEdit((s) => ({ ...s, difficulty: e.target.value }))}>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <label className="flex items-center gap-1 text-xs text-slate-500" title="Max number of teams that may submit. One winner is chosen.">
            Max subs
            <input type="number" min={1} className="input w-16" value={edit.maxSubmissions} onChange={(e) => setEdit((s) => ({ ...s, maxSubmissions: Math.max(1, Number(e.target.value) || 1) }))} />
          </label>
        </div>
        <textarea className="input" rows={2} value={edit.description} onChange={(e) => setEdit((s) => ({ ...s, description: e.target.value }))} />
        <div className="flex gap-2">
          <button className="btn-success" onClick={() => run(async () => { await api(`/api/admin/challenges/${challenge.id}`, "PATCH", edit); setEditing(false); })}>Save</button>
          <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 p-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">L{displayLevel}</span>
          <span className="font-semibold">{challenge.title}</span>
          <span className={`badge ${statusStyle[challenge.status] ?? "bg-slate-100"}`}>{challenge.status}</span>
          <span className="badge bg-slate-100 text-slate-500">{challenge.difficulty}</span>
          {challenge.maxSubmissions > 1 && (
            <span className="badge bg-amber-100 text-amber-700">📝 max {challenge.maxSubmissions} subs</span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-slate-500">{challenge.description}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        {challenge.status === "COMPLETED" && (
          <button
            className="btn-secondary px-2 py-1 text-xs"
            onClick={() => {
              if (confirm(`Mark "${challenge.title}" as incomplete? This reopens the task and removes the point awarded for it.`)) {
                run(() => api(`/api/admin/challenges/${challenge.id}`, "PATCH", { reopen: true }));
              }
            }}
          >
            Mark incomplete
          </button>
        )}
        <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setEditing(true)}>Edit</button>
        <button
          className="btn-danger px-2 py-1 text-xs"
          onClick={() => {
            if (confirm(`Delete task "${challenge.title}"?`)) {
              run(() => api(`/api/admin/challenges/${challenge.id}`, "DELETE"));
            }
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
