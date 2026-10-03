import { prisma } from "./db";
import { sendEmail } from "./email";
import type { Role } from "./constants";

/** Create an in-app notification for a single user (and optionally email them). */
export async function notifyUser(opts: {
  userId: string;
  type: string;
  message: string;
  link?: string;
  email?: { to: string; subject: string };
}): Promise<void> {
  await prisma.notification.create({
    data: {
      recipientUserId: opts.userId,
      type: opts.type,
      message: opts.message,
      link: opts.link,
    },
  });
  if (opts.email) {
    await sendEmail({ to: opts.email.to, subject: opts.email.subject, text: opts.message });
  }
}

/** Create an in-app notification targeted at a role (e.g., all admins). */
export async function notifyRole(opts: {
  role: Role;
  type: string;
  message: string;
  link?: string;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      recipientRole: opts.role,
      type: opts.type,
      message: opts.message,
      link: opts.link,
    },
  });

  // Best-effort email to the admin address if configured.
  if (opts.role === "ADMIN" && process.env.ADMIN_EMAIL) {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `[DAO Challenge] ${opts.type}`,
      text: opts.message,
    });
  }
}
