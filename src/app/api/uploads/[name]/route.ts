import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { readScreenshot } from "@/lib/uploads";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  // Only authenticated users can view uploaded proof images.
  // Verify the JWT only (no DB round-trip) — a single page can request many
  // images at once, and hitting the DB for each would serialize on SQLite.
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const file = await readScreenshot(name);
  if (!file) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
