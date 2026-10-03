import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({ ended: z.boolean() });

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: { eventEnded: parsed.data.ended },
    create: { id: 1, eventEnded: parsed.data.ended },
  });

  return NextResponse.json({ ok: true });
}
