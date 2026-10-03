import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { notifyUser } from "@/lib/notify";
import { DIFFICULTY_POINTS } from "@/lib/constants";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  feedback: z.string().max(500).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { action, feedback } = parsed.data;

  const submission = await prisma.submission.findUnique({
    where: { id: id },
    include: { challenge: { include: { category: true } }, group: true },
  });
  if (!submission) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }
  if (submission.status !== "PENDING") {
    return NextResponse.json(
      { error: "This submission has already been reviewed." },
      { status: 409 }
    );
  }

  // Collect users to notify after the transaction commits.
  const notifications: { userId: string; type: string; message: string; email?: { to: string; subject: string } }[] = [];

  if (action === "reject") {
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: "REJECTED", adminFeedback: feedback ?? null, reviewedAt: new Date() },
    });
    notifications.push({
      userId: submission.submittedById,
      type: "Submission rejected",
      message: `Your "${submission.challenge.title}" submission was rejected${feedback ? `: ${feedback}` : "."} You can resubmit while the challenge is still open.`,
    });
  } else {
    // APPROVE — single winner. Resolve the race atomically.
    const challenge = submission.challenge;
    if (challenge.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This challenge is already completed by another group." },
        { status: 409 }
      );
    }

    const earnedPoints = DIFFICULTY_POINTS[challenge.difficulty] ?? 1;

    // Find the next locked challenge in the same category to activate.
    const nextChallenge = await prisma.challenge.findFirst({
      where: { categoryId: challenge.categoryId, status: "LOCKED", sortOrder: { gt: challenge.sortOrder } },
      orderBy: { sortOrder: "asc" },
    });

    // Other pending submissions (losing groups) on this challenge.
    const otherPending = await prisma.submission.findMany({
      where: { challengeId: challenge.id, status: "PENDING", id: { not: submission.id } },
      select: { submittedById: true },
    });

    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.submission.update({
        where: { id: submission.id },
        data: { status: "APPROVED", adminFeedback: feedback ?? null, reviewedAt: new Date() },
      }),
      prisma.challenge.update({
        where: { id: challenge.id },
        data: { status: "COMPLETED", wonByGroupId: submission.groupId },
      }),
      prisma.group.update({
        where: { id: submission.groupId },
        data: { points: { increment: earnedPoints } },
      }),
      prisma.submission.updateMany({
        where: { challengeId: challenge.id, status: "PENDING", id: { not: submission.id } },
        data: {
          status: "REJECTED",
          adminFeedback: "Another group won this challenge.",
          reviewedAt: new Date(),
        },
      }),
    ];
    if (nextChallenge) {
      ops.push(
        prisma.challenge.update({
          where: { id: nextChallenge.id },
          data: { status: "ACTIVE" },
        })
      );
    }

    await prisma.$transaction(ops);

    notifications.push({
      userId: submission.submittedById,
      type: "Points earned!",
      message: `🎉 Your group ${submission.group.name} won "${challenge.title}" and earned ${earnedPoints} point${earnedPoints === 1 ? "" : "s"}!`,
    });
    for (const other of otherPending) {
      notifications.push({
        userId: other.submittedById,
        type: "Challenge won by another group",
        message: `Another group won "${challenge.title}". A new challenge in ${challenge.category.name} is now open!`,
      });
    }
  }

  // Fire notifications (best-effort; do not block the response on email).
  await Promise.all(
    notifications.map((n) =>
      notifyUser({ userId: n.userId, type: n.type, message: n.message, link: "/dashboard" })
    )
  );

  return NextResponse.json({ ok: true });
}
