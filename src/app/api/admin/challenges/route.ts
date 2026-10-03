import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const createSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Easy"),
  maxSubmissions: z.coerce.number().int().min(1).max(100).default(1),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }
  const { categoryId, title, description, difficulty, maxSubmissions } = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const agg = await prisma.challenge.aggregate({
    where: { categoryId },
    _max: { sortOrder: true, level: true },
  });
  // If the category currently has no open challenge, this new one becomes ACTIVE
  // so the ladder keeps flowing; otherwise it's LOCKED behind the current one.
  const hasActive = await prisma.challenge.count({
    where: { categoryId, status: "ACTIVE" },
  });

  const challenge = await prisma.challenge.create({
    data: {
      categoryId,
      title,
      description,
      difficulty,
      maxSubmissions,
      level: (agg._max.level ?? 0) + 1,
      sortOrder: (agg._max.sortOrder ?? 0) + 1,
      status: hasActive > 0 ? "LOCKED" : "ACTIVE",
    },
  });

  return NextResponse.json({ ok: true, id: challenge.id });
}
