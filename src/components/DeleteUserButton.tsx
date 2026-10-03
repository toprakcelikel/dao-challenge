"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function onClick() {
    if (!confirm(`Delete ${userName}? This removes their submissions and cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      alert(data?.error ?? "Failed to delete user.");
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deleting}
      className="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
      title={`Delete ${userName}`}
    >
      {deleting ? "…" : "Delete"}
    </button>
  );
}
