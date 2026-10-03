import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { saveScreenshot } from "@/lib/uploads";
import { notifyRole } from "@/lib/notify";
import { getEventEnded } from "@/lib/queries";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  if (!user.groupId) {
    return NextResponse.json({ error: "You are not in a group yet." }, { status: 400 });
  }
  if (await getEventEnded()) {
    return NextResponse.json({ error: "The event has ended." }, { status: 403 });
  }

  const form = await req.formData();
  const challengeId = String(form.get("challengeId") ?? "");
  const videoUrl = String(form.get("videoUrl") ?? "").trim();
  const note = String(form.get("note") ?? "").trim();
  const files = form.getAll("screenshot").filter((f): f is File => f instanceof File && f.size > 0);

  if (!challengeId) {
    return NextResponse.json({ error: "Missing challenge." }, { status: 400 });
  }
  if (files.length === 0) {
    return NextResponse.json({ error: "At least one screenshot is required." }, { status: 400 });
  }
  if (files.length > 10) {
    return NextResponse.json({ error: "You can upload at most 10 images." }, { status: 400 });
  }
  if (videoUrl && !/^https?:\/\/.+/i.test(videoUrl)) {
    return NextResponse.json({ error: "Video link must be a valid URL." }, { status: 400 });
  }

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { category: true },
  });
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }
  if (challenge.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "This challenge is no longer open. Another group may have already won it." },
      { status: 409 }
    );
  }

  // Block duplicate pending submissions from the same group.
  const pending = await prisma.submission.findFirst({
    where: { challengeId, groupId: user.groupId, status: "PENDING" },
  });
  if (pending) {
    return NextResponse.json(
      { error: "Your group already has a pending submission for this task." },
      { status: 409 }
    );
  }

  // Per-task cap on how many teams may submit (defaults to 1; admin can raise).
  if (challenge.maxSubmissions > 0) {
    const submittingGroups = await prisma.submission.findMany({
      where: { challengeId, status: { in: ["PENDING", "APPROVED"] } },
      select: { groupId: true },
      distinct: ["groupId"],
    });
    const alreadyCounted = submittingGroups.some((g) => g.groupId === user.groupId);
    if (!alreadyCounted && submittingGroups.length >= challenge.maxSubmissions) {
      return NextResponse.json(
        { error: "This task has reached its submission limit." },
        { status: 409 }
      );
    }
  }

  let screenshotPath: string;
  const extra: string[] = [];
  try {
    const saved: string[] = [];
    for (const f of files) {
      saved.push(await saveScreenshot(f));
    }
    screenshotPath = saved[0];
    extra.push(...saved.slice(1));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed." },
      { status: 400 }
    );
  }

  const submission = await prisma.submission.create({
    data: {
      challengeId,
      groupId: user.groupId,
      submittedById: user.id,
      screenshotPath,
      extraImages: extra.length > 0 ? JSON.stringify(extra) : null,
      videoUrl: videoUrl || null,
      note: note || null,
      status: "PENDING",
    },
    include: { group: true },
  });

  await notifyRole({
    role: "ADMIN",
    type: "New submission",
    message: `${submission.group.name} submitted "${challenge.title}" (${challenge.category.name}) for review.`,
    link: "/admin",
  });

  return NextResponse.json({ ok: true });
}
