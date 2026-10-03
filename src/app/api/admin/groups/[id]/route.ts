import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #3b82f6").optional(),
  points: z.number().int("Points must be a whole number").min(0, "Points cannot be negative").max(100000).optional(),
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

  await prisma.group.update({ where: { id: id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}
