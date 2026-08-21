import { Handlers } from "$fresh/server.ts";
import {
  loginUser,
  createAccessToken,
  createRefreshTokenForUser,
  setAuthCookies,
} from "../../../utils/auth.ts";
import { getClientIp, rateLimit, rateLimitResponse } from "../../../utils/ratelimit.ts";

export const handler: Handlers = {
  async POST(req) {
    // Blunt brute-force: ~10 attempts burst, refilling 1 per 6s per IP.
    const rl = rateLimit(`login:${getClientIp(req)}`, 10, 1 / 6);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    try {
      const body = await req.json();
      const { email, password } = body;

      // Validate input
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: "Email and password are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Attempt login
      const user = await loginUser(email, password);

      if (!user) {
        return new Response(
          JSON.stringify({ error: "Invalid email or password" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      // Create tokens
      const accessToken = await createAccessToken(user);
      const refreshToken = await createRefreshTokenForUser(user);

      // Set cookies and return user
      const headers = new Headers({
        "Content-Type": "application/json",
      });
      setAuthCookies(headers, accessToken, refreshToken);

      return new Response(
        JSON.stringify({
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
          },
        }),
        { status: 200, headers }
      );
    } catch (error) {
      console.error("Login error:", error);
      return new Response(
        JSON.stringify({ error: "Login failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
