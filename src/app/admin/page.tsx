import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLeaderboard, getEventEnded } from "@/lib/queries";
import { Leaderboard } from "@/components/Leaderboard";
import AdminNav from "@/components/AdminNav";
import ReviewActions from "@/components/ReviewActions";
import EventControl from "@/components/EventControl";

export const dynamic = "force-dynamic";

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const [pending, groups, eventEnded, recent] = await Promise.all([
    prisma.submission.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { group: true, challenge: { include: { category: true } }, submittedBy: true },
    }),
    getLeaderboard(),
    getEventEnded(),
    prisma.submission.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { reviewedAt: "desc" },
      take: 8,
      include: { group: true, challenge: true },
    }),
  ]);

  return (
    <>
      <AdminNav active="review" />
      <main className="mx-auto max-w-6xl px-4 pb-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h1 className="text-lg font-bold">
                Pending review {pending.length > 0 && <span className="badge bg-amber-100 text-amber-700">{pending.length}</span>}
              </h1>
            </div>

            {pending.length === 0 && (
              <div className="card text-slate-500">🎉 All caught up — no submissions waiting.</div>
            )}

            <div className="space-y-4">
              {pending.map((s) => (
                <div key={s.id} className="card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="badge px-2.5 py-1 text-white" style={{ backgroundColor: s.group.color }}>
                        {s.group.name}
                      </span>
                      <span className="font-bold">{s.challenge.title}</span>
                      <span className="text-sm text-slate-400">
                        {s.challenge.category.icon} {s.challenge.category.name} · L{s.challenge.level}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{timeAgo(s.createdAt)}</span>
                  </div>

                  <p className="mt-1 text-xs text-slate-400">by {s.submittedBy.name}</p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-wrap gap-2">
                      {[s.screenshotPath, ...(s.extraImages ? (JSON.parse(s.extraImages) as string[]) : [])].map((img, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <a key={i} href={`/api/uploads/${img}`} target="_blank" rel="noreferrer">
                          <img
                            src={`/api/uploads/${img}`}
                            alt={`submission proof ${i + 1}`}
                            className="h-32 w-32 rounded-xl object-cover ring-1 ring-slate-200"
                          />
                        </a>
                      ))}
                    </div>
                    <div className="text-sm">
                      {s.videoUrl && (
                        <p className="mb-2">
                          🎬{" "}
                          <a href={s.videoUrl} target="_blank" rel="noreferrer" className="font-semibold text-indigo-600 underline">
                            Watch video
                          </a>
                        </p>
                      )}
                      {s.note ? (
                        <p className="rounded-xl bg-slate-50 p-3 text-slate-600">“{s.note}”</p>
                      ) : (
                        <p className="text-slate-400">No note provided.</p>
                      )}
                    </div>
                  </div>

                  <ReviewActions submissionId={s.id} />
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <Leaderboard groups={groups} />
            <EventControl eventEnded={eventEnded} />

            <div className="card">
              <h2 className="mb-3 text-sm font-bold text-slate-500">Recent decisions</h2>
              {recent.length === 0 ? (
                <p className="text-sm text-slate-400">Nothing yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {recent.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2">
                      <span className="truncate">
                        {r.status === "APPROVED" ? "✅" : "❌"} {r.group.name} — {r.challenge.title}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {r.reviewedAt ? timeAgo(r.reviewedAt) : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
