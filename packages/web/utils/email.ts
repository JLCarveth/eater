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

export interface WeeklyReportData {
  displayName: string;
  daysLogged: number;
  avgCalories: number;
  totalCalories: number;
  currentStreak: number;
  weightChangeKg: number | null;
}

export async function sendWeeklyReportEmail(
  to: string,
  data: WeeklyReportData
): Promise<boolean> {
  const subject = "Your MacroScope week in review";
  const appUrl = getAppUrl();

  const weightLine = data.weightChangeKg != null
    ? `Weight change: ${data.weightChangeKg >= 0 ? "+" : ""}${data.weightChangeKg.toFixed(1)} kg`
    : "";

  const text = `Hi ${data.displayName},

Here's your week in review:

- Days logged: ${data.daysLogged}/7
- Average calories: ${Math.round(data.avgCalories)} kcal/day
- Current streak: ${data.currentStreak} days
${weightLine ? `- ${weightLine}\n` : ""}
Keep it up! Open MacroScope: ${appUrl}/dashboard

Manage your email preferences at ${appUrl}/account`;

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1f2937;">
  <h1 style="font-size: 20px; margin-bottom: 16px;">Your week in review</h1>
  <p style="line-height: 1.6;">Hi ${data.displayName}, here's how your week went:</p>
  <ul style="line-height: 1.9; font-size: 15px;">
    <li><strong>Days logged:</strong> ${data.daysLogged}/7</li>
    <li><strong>Average calories:</strong> ${Math.round(data.avgCalories)} kcal/day</li>
    <li><strong>Current streak:</strong> ${data.currentStreak} days</li>
    ${weightLine ? `<li><strong>${weightLine}</strong></li>` : ""}
  </ul>
  <p style="margin: 24px 0;">
    <a href="${appUrl}/dashboard"
       style="background-color: #16a34a; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">
      Open MacroScope
    </a>
  </p>
  <p style="line-height: 1.6; font-size: 13px; color: #6b7280;">
    You're receiving this because you're a MacroScope Pro member.
    <a href="${appUrl}/account" style="color: #16a34a;">Manage email preferences</a>.
  </p>
</div>`;

  return await sendEmail({ to, subject, html, text });
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
