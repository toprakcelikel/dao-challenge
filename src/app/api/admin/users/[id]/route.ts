import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  groupId: z.string().trim().min(1, "Pick a team"),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  const group = await prisma.group.findUnique({ where: { id: parsed.data.groupId } });
  if (!group) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  await prisma.user.update({ where: { id }, data: { groupId: group.id } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (admin.id === id) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (user.role === "ADMIN") {
    return NextResponse.json({ error: "Admins can't be deleted." }, { status: 400 });
  }

  // Remove dependent records first (no cascade on these relations), then the user.
  await prisma.$transaction([
    prisma.notification.deleteMany({ where: { recipientUserId: id } }),
    prisma.submission.deleteMany({ where: { submittedById: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
