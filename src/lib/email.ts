import nodemailer from "nodemailer";

/**
 * Sends an email if SMTP is configured via env vars.
 * If not configured, it logs to the console and resolves (no-op) so the
 * app works fully without email setup. In-app notifications are the primary channel.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log(`[email:skipped] To: ${opts.to} | ${opts.subject}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: Number(SMTP_PORT ?? 587) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from: EMAIL_FROM ?? "DAO Challenge <no-reply@example.com>",
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
  } catch (err) {
    // Never let email failures break the request flow.
    console.error("[email:error]", err);
  }
}
