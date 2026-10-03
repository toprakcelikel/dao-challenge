import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const statusBadge: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "⏳ Pending", cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "✅ Approved", cls: "bg-green-100 text-green-700" },
  REJECTED: { label: "❌ Rejected", cls: "bg-red-100 text-red-700" },
};

export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");

  const submissions = user.groupId
    ? await prisma.submission.findMany({
        where: { groupId: user.groupId },
        orderBy: { createdAt: "desc" },
        include: { challenge: { include: { category: true } }, submittedBy: true },
      })
    : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/dashboard" className="text-sm text-indigo-600">← Back to dashboard</Link>
      <h1 className="mb-4 mt-2 text-xl font-extrabold">
        {user.group ? `Team ${user.group.name} — Activity` : "My Activity"}
      </h1>

      {submissions.length === 0 ? (
        <div className="card text-slate-500">No submissions yet. Go complete a challenge!</div>
      ) : (
        <ul className="space-y-3">
          {submissions.map((s) => (
            <li key={s.id} className="card">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">
                  {s.challenge.category.icon} {s.challenge.title}
                </span>
                <span className={`badge ${statusBadge[s.status]?.cls}`}>{statusBadge[s.status]?.label}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                by {s.submittedBy.name} · {new Date(s.createdAt).toLocaleString()}
              </p>
              {s.status === "REJECTED" && s.adminFeedback && (
                <p className="mt-2 rounded-xl bg-red-50 p-2 text-sm text-red-600">
                  Admin: {s.adminFeedback}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
