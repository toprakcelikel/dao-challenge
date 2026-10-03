"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MemberMover({
  userId,
  currentGroupId,
  groups,
}: {
  userId: string;
  currentGroupId: string;
  groups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const groupId = e.target.value;
    if (groupId === currentGroupId) return;
    setSaving(true);
    setError(false);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
    setSaving(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError(true);
    }
  }

  return (
    <select
      className="input h-7 w-28 py-0 text-xs"
      value={currentGroupId}
      onChange={onChange}
      disabled={saving}
      title={error ? "Failed to move — try again" : "Move to another team"}
    >
      {groups.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name}
        </option>
      ))}
    </select>
  );
}
