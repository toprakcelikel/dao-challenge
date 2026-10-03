import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
  icon: z.string().trim().max(8).optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "A category name is required." }, { status: 400 });
  }

  const min = await prisma.category.aggregate({ _min: { sortOrder: true } });
  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      icon: parsed.data.icon || "🎯",
      sortOrder: (min._min.sortOrder ?? 0) - 1,
    },
  });

  return NextResponse.json({ ok: true, id: category.id });
}
