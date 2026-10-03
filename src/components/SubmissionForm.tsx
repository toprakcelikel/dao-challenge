"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmissionForm({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [note, setNote] = useState("");
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const data = new FormData(e.currentTarget);
    data.set("challengeId", challengeId);

    try {
      const res = await fetch("/api/submissions", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1400);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card text-center">
        <div className="text-5xl">🚀</div>
        <p className="mt-3 text-lg font-bold">Submitted for review!</p>
        <p className="text-sm text-slate-500">The admin will verify it shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <h2 className="text-lg font-bold">Submit your completion</h2>

      {error && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      )}

      <div>
        <label className="label">Screenshot / photo proof *</label>
        <input
          name="screenshot"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          required
          onChange={(e) => setFileNames(Array.from(e.target.files ?? []).map((f) => f.name))}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <p className="mt-1 text-xs text-slate-400">You can select multiple images (up to 10).</p>
        {fileNames.length > 0 && (
          <ul className="mt-1 text-xs text-slate-500">
            {fileNames.map((n, i) => (
              <li key={i}>• {n}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="label">Video link (optional)</label>
        <input
          name="videoUrl"
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://youtube.com/… or Google Drive link"
          className="input"
        />
      </div>

      <div>
        <label className="label">Note to the admin (optional)</label>
        <textarea
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Anything you want the admin to know…"
          className="input"
        />
      </div>

      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}
