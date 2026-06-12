import { Handlers } from "$fresh/server.ts";
import { resetPasswordWithToken } from "../../../utils/auth.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { token, password } = body;

      if (!token || typeof token !== "string") {
        return new Response(
          JSON.stringify({ error: "Reset token is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!password || typeof password !== "string") {
        return new Response(
          JSON.stringify({ error: "Password is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (password.length < 8) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 8 characters" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const success = await resetPasswordWithToken(token, password);

      if (!success) {
        return new Response(
          JSON.stringify({
            error:
              "This reset link is invalid or has expired. Please request a new one.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ message: "Password updated successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Reset password error:", error);
      return new Response(
        JSON.stringify({ error: "Something went wrong. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
