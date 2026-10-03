"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewActions({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function review(action: "approve" | "reject") {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, feedback: feedback.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        setLoading(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
      setLoading(null);
    }
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      {!showReject ? (
        <div className="flex gap-2">
          <button className="btn-success flex-1" disabled={loading !== null} onClick={() => review("approve")}>
            {loading === "approve" ? "Approving…" : "✅ Approve & award point"}
          </button>
          <button className="btn-danger" disabled={loading !== null} onClick={() => setShowReject(true)}>
            ❌ Reject
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            className="input"
            rows={2}
            placeholder="Reason for rejection (optional, shown to the group)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="btn-danger flex-1" disabled={loading !== null} onClick={() => review("reject")}>
              {loading === "reject" ? "Rejecting…" : "Confirm reject"}
            </button>
            <button className="btn-secondary" onClick={() => setShowReject(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
