import { Handlers } from "$fresh/server.ts";
import {
  getAuthPayload,
  changePassword,
  createAccessToken,
  createRefreshTokenForUser,
  setAuthCookies,
} from "../../../utils/auth.ts";
import { getUserById } from "../../../utils/db.ts";

export const handler: Handlers = {
  async POST(req) {
    const auth = await getAuthPayload(req);
    if (auth instanceof Response) return auth;

    try {
      const body = await req.json();
      const { currentPassword, newPassword } = body;

      if (!currentPassword || typeof currentPassword !== "string") {
        return new Response(
          JSON.stringify({ error: "Current password is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!newPassword || typeof newPassword !== "string") {
        return new Response(
          JSON.stringify({ error: "New password is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      if (newPassword.length < 8) {
        return new Response(
          JSON.stringify({ error: "New password must be at least 8 characters" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const success = await changePassword(auth.userId, currentPassword, newPassword);

      if (!success) {
        return new Response(
          JSON.stringify({ error: "Current password is incorrect" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // changePassword revoked all refresh tokens; issue fresh tokens so this
      // session stays logged in while other devices are signed out
      const user = await getUserById(auth.userId);
      const headers = new Headers({ "Content-Type": "application/json" });
      if (user) {
        const accessToken = await createAccessToken(user);
        const refreshToken = await createRefreshTokenForUser(user);
        setAuthCookies(headers, accessToken, refreshToken);
      }

      return new Response(
        JSON.stringify({ message: "Password updated successfully" }),
        { status: 200, headers }
      );
    } catch (error) {
      console.error("Change password error:", error);
      return new Response(
        JSON.stringify({ error: "Something went wrong. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
