import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// Where uploaded screenshots are stored. Defaults to ./uploads locally.
// In cloud hosting (e.g. Azure App Service) set UPLOAD_DIR to a persistent
// folder such as /home/data/uploads so files survive restarts.
const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "uploads");
const ALLOWED = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function saveScreenshot(file: File): Promise<string> {
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    throw new Error("Only PNG, JPG, WEBP, or GIF images are allowed.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image is too large (max 8 MB).");
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, name), buffer);
  return name; // stored as screenshotPath; served via /api/uploads/[name]
}

export async function readScreenshot(
  name: string
): Promise<{ data: Buffer; contentType: string } | null> {
  // Prevent path traversal: only allow simple file names.
  if (!/^[a-zA-Z0-9_-]+\.(png|jpg|webp|gif)$/.test(name)) return null;
  const ext = name.split(".").pop()!;
  const typeByExt: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
  };
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, name));
    return { data, contentType: typeByExt[ext] };
  } catch {
    return null;
  }
}
