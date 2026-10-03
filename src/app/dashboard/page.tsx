import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLeaderboard, getCategoriesWithActiveChallenge, getEventEnded } from "@/lib/queries";
import { Leaderboard } from "@/components/Leaderboard";
import LogoutButton from "@/components/LogoutButton";

const difficultyColor: Record<string, string> = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-red-100 text-red-700",
};

const statusBadge: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "⏳ Pending review", cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "✅ Approved", cls: "bg-green-100 text-green-700" },
  REJECTED: { label: "❌ Rejected — resubmit", cls: "bg-red-100 text-red-700" },
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");

  const [groups, categories, eventEnded] = await Promise.all([
    getLeaderboard(),
    getCategoriesWithActiveChallenge(user.groupId),
    getEventEnded(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Welcome, {user.name}!</p>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">
            🏆 DAO Challenge
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {user.group && (
            <span
              className="badge px-3 py-1 text-sm text-white"
              style={{ backgroundColor: user.group.color }}
            >
              {user.group.name}
            </span>
          )}
          <LogoutButton />
        </div>
      </header>

      {eventEnded && (
        <div className="mb-6 rounded-2xl bg-slate-800 p-4 text-center text-white">
          🏁 The event has ended! Check the leaderboard for the final results.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold">Active Challenges</h2>
          {categories.length === 0 && (
            <div className="card text-slate-500">
              No challenges yet. Check back soon — the admin is setting things up!
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((cat) => {
              const ch = cat.activeChallenge;
              const sub = ch?.myGroupSubmission;
              return (
                <div key={cat.id} className="card flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="font-bold">{cat.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {cat.completedChallenges}/{cat.totalChallenges} done
                    </span>
                  </div>

                  {ch ? (
                    <div className="mt-3 flex flex-1 flex-col">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400">
                          Level {ch.level}
                        </span>
                        <span className={`badge ${difficultyColor[ch.difficulty] ?? "bg-slate-100 text-slate-600"}`}>
                          {ch.difficulty}
                        </span>
                      </div>
                      <h3 className="font-semibold">{ch.title}</h3>
                      <p className="mt-1 flex-1 text-sm text-slate-600">{ch.description}</p>

                      {sub && (
                        <div className={`badge mt-3 ${statusBadge[sub.status]?.cls}`}>
                          {statusBadge[sub.status]?.label}
                        </div>
                      )}

                      {!eventEnded ? (
                        <Link href={`/challenge/${ch.id}`} className="btn-primary mt-3">
                          {sub?.status === "PENDING" ? "View submission" : sub?.status === "REJECTED" ? "Resubmit" : "Complete this task"}
                        </Link>
                      ) : (
                        <span className="mt-3 text-sm text-slate-400">Event ended</span>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">
                      🎉 All challenges complete in this category!
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6">
          <Leaderboard groups={groups} highlightGroupId={user.groupId} />
          <Link href="/dashboard/activity" className="btn-secondary w-full">
            📨 My group&apos;s activity
          </Link>
        </aside>
      </div>
    </div>
  );
}
