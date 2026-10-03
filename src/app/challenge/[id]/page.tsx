import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getEventEnded } from "@/lib/queries";
import SubmissionForm from "@/components/SubmissionForm";

const difficultyColor: Record<string, string> = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-red-100 text-red-700",
};

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "ADMIN") redirect("/admin");

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!challenge) notFound();

  const eventEnded = await getEventEnded();

  const myGroupSubs = user.groupId
    ? await prisma.submission.findMany({
        where: { challengeId: challenge.id, groupId: user.groupId },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const latest = myGroupSubs[0] ?? null;

  const closed = challenge.status !== "ACTIVE";
  const hasPending = latest?.status === "PENDING";
  const canSubmit = !eventEnded && !closed && !hasPending;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link href="/dashboard" className="text-sm text-indigo-600">← Back to dashboard</Link>

      <div className="card mt-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="text-2xl">{challenge.category.icon}</span>
          <span>{challenge.category.name}</span>
          <span>•</span>
          <span>Level {challenge.level}</span>
          <span className={`badge ${difficultyColor[challenge.difficulty] ?? "bg-slate-100 text-slate-600"}`}>
            {challenge.difficulty}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold">{challenge.title}</h1>
        <p className="mt-2 text-slate-600">{challenge.description}</p>
      </div>

      <div className="mt-6">
        {closed ? (
          <div className="card text-center">
            <div className="text-4xl">🔒</div>
            <p className="mt-2 font-bold">This challenge is closed.</p>
            <p className="text-sm text-slate-500">
              Another group won it, or the admin moved on. Check your dashboard for the next task.
            </p>
          </div>
        ) : eventEnded ? (
          <div className="card text-center text-slate-500">The event has ended.</div>
        ) : hasPending ? (
          <div className="card text-center">
            <div className="text-4xl">⏳</div>
            <p className="mt-2 font-bold">Your group has a submission under review.</p>
            <p className="text-sm text-slate-500">Hang tight — the admin will verify it soon.</p>
          </div>
        ) : (
          <>
            {latest?.status === "REJECTED" && (
              <div className="mb-4 rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
                <p className="font-semibold text-red-700">Your last submission was rejected.</p>
                {latest.adminFeedback && (
                  <p className="mt-1 text-sm text-red-600">Admin note: {latest.adminFeedback}</p>
                )}
                <p className="mt-1 text-sm text-red-600">Make a change and try again below.</p>
              </div>
            )}
            {canSubmit && <SubmissionForm challengeId={challenge.id} />}
          </>
        )}
      </div>
    </div>
  );
}
