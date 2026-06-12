/**
 * Transactional email via Resend (https://resend.com)
 *
 * Requires RESEND_API_KEY and EMAIL_FROM. When RESEND_API_KEY is not set
 * (local development), emails are not sent and their content is logged to
 * the console instead.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function getAppUrl(): string {
  return (Deno.env.get("APP_URL") || "http://localhost:8000").replace(/\/+$/, "");
}

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") || "MacroScope <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set - email to ${input.to} not sent.\n` +
        `Subject: ${input.subject}\n${input.text}`
    );
    return false;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[email] Resend API error: ${response.status} - ${error}`);
    return false;
  }

  return true;
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<boolean> {
  const subject = "Reset your MacroScope password";

  const text = `We received a request to reset your MacroScope password.

Reset your password by opening this link (valid for 1 hour):

${resetUrl}

If you didn't request a password reset, you can safely ignore this email - your password will not be changed.`;

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1f2937;">
  <h1 style="font-size: 20px; margin-bottom: 16px;">Reset your password</h1>
  <p style="line-height: 1.6;">
    We received a request to reset your MacroScope password. Click the button
    below to choose a new one. This link is valid for <strong>1 hour</strong>.
  </p>
  <p style="margin: 24px 0;">
    <a href="${resetUrl}"
       style="background-color: #16a34a; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">
      Reset password
    </a>
  </p>
  <p style="line-height: 1.6; font-size: 14px; color: #6b7280;">
    If the button doesn't work, copy and paste this link into your browser:<br />
    <a href="${resetUrl}" style="color: #16a34a; word-break: break-all;">${resetUrl}</a>
  </p>
  <p style="line-height: 1.6; font-size: 14px; color: #6b7280;">
    If you didn't request a password reset, you can safely ignore this email -
    your password will not be changed.
  </p>
</div>`;

  return await sendEmail({ to, subject, html, text });
}
