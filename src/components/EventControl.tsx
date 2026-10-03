"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EventControl({ eventEnded }: { eventEnded: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle(ended: boolean) {
    if (ended && !confirm("End the event? Students will no longer be able to submit, and the leaderboard will be frozen.")) {
      return;
    }
    setLoading(true);
    await fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ended }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="mb-2 text-sm font-bold text-slate-500">Event control</h2>
      {eventEnded ? (
        <>
          <p className="mb-3 text-sm text-slate-600">🏁 The event has ended. Submissions are closed.</p>
          <button className="btn-secondary w-full" disabled={loading} onClick={() => toggle(false)}>
            {loading ? "…" : "Reopen event"}
          </button>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-600">The event is live. End it to freeze scores and declare a winner.</p>
          <button className="btn-danger w-full" disabled={loading} onClick={() => toggle(true)}>
            {loading ? "…" : "🏁 End event"}
          </button>
        </>
      )}
    </div>
  );
}
