import { Handlers } from "$fresh/server.ts";
import { createPasswordResetTokenForUser } from "../../../utils/auth.ts";
import { getUserByEmail } from "../../../utils/db.ts";
import { getAppUrl, sendPasswordResetEmail } from "../../../utils/email.ts";

// Per-email throttle to prevent inbox flooding via the reset endpoint.
// In-memory is fine for a single-instance deployment.
const MAX_REQUESTS_PER_WINDOW = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

const requestLog = new Map<string, number[]>();

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(email) ?? []).filter(
    (t) => now - t < WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    requestLog.set(email, timestamps);
    return true;
  }

  timestamps.push(now);
  requestLog.set(email, timestamps);

  // Opportunistic cleanup so the map doesn't grow unbounded
  if (requestLog.size > 1000) {
    for (const [key, times] of requestLog) {
      if (times.every((t) => now - t >= WINDOW_MS)) {
        requestLog.delete(key);
      }
    }
  }

  return false;
}

// Always responds 200 with the same message whether or not the email exists,
// so the endpoint can't be used to enumerate registered accounts.
const GENERIC_RESPONSE = JSON.stringify({
  message:
    "If an account exists with that email, we've sent a password reset link.",
});

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const email = typeof body.email === "string" ? body.email.trim() : "";

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!isRateLimited(email)) {
        const user = await getUserByEmail(email);
        if (user) {
          const token = await createPasswordResetTokenForUser(user);
          const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;
          await sendPasswordResetEmail(user.email, resetUrl);
        }
      }

      return new Response(GENERIC_RESPONSE, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      return new Response(
        JSON.stringify({ error: "Something went wrong. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
