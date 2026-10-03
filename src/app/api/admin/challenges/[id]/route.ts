import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { DIFFICULTY_POINTS } from "@/lib/constants";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().min(1).max(1000).optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  maxSubmissions: z.coerce.number().int().min(1).max(100).optional(),
  reopen: z.literal(true).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { reopen, ...fields } = parsed.data;

  // Reopen a completed task: mark it active again, undo the win and the point,
  // and re-lock any later task that had auto-unlocked in this category.
  if (reopen) {
    const challenge = await prisma.challenge.findUnique({ where: { id } });
    if (!challenge) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    if (challenge.status !== "COMPLETED") {
      return NextResponse.json({ error: "Only completed tasks can be marked incomplete." }, { status: 409 });
    }

    const dec = DIFFICULTY_POINTS[challenge.difficulty] ?? 1;
    const ops: Prisma.PrismaPromise<unknown>[] = [];

    // Undo the points for every team that had completed this task.
    const approved = await prisma.submission.findMany({
      where: { challengeId: id, status: "APPROVED" },
      select: { groupId: true },
    });
    const decByGroup = new Map<string, number>();
    for (const s of approved) {
      decByGroup.set(s.groupId, (decByGroup.get(s.groupId) ?? 0) + dec);
    }
    if (decByGroup.size > 0) {
      const winners = await prisma.group.findMany({ where: { id: { in: [...decByGroup.keys()] } } });
      for (const w of winners) {
        const newPoints = Math.max(0, w.points - (decByGroup.get(w.id) ?? 0));
        ops.push(prisma.group.update({ where: { id: w.id }, data: { points: newPoints } }));
      }
    }

    ops.push(
      prisma.challenge.update({ where: { id }, data: { status: "ACTIVE", wonByGroupId: null } }),
      // Keep a single open task per category: re-lock any other open task.
      prisma.challenge.updateMany({
        where: { categoryId: challenge.categoryId, status: "ACTIVE", id: { not: id } },
        data: { status: "LOCKED" },
      }),
      // Let the previously winning submissions be reviewed again.
      prisma.submission.updateMany({
        where: { challengeId: id, status: "APPROVED" },
        data: { status: "PENDING", reviewedAt: null, adminFeedback: null },
      })
    );

    await prisma.$transaction(ops);
    return NextResponse.json({ ok: true });
  }

  await prisma.challenge.update({ where: { id: id }, data: fields });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const challenge = await prisma.challenge.findUnique({ where: { id: id } });
  if (!challenge) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.challenge.delete({ where: { id: id } });

  // If we removed the open challenge, promote the next locked one so the ladder continues.
  if (challenge.status === "ACTIVE") {
    const next = await prisma.challenge.findFirst({
      where: { categoryId: challenge.categoryId, status: "LOCKED", sortOrder: { gt: challenge.sortOrder } },
      orderBy: { sortOrder: "asc" },
    });
    if (next) {
      await prisma.challenge.update({ where: { id: next.id }, data: { status: "ACTIVE" } });
    }
  }

  return NextResponse.json({ ok: true });
}
