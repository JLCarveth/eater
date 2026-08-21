import { Handlers } from "$fresh/server.ts";
import {
  getAuthPayload,
  verifyUserPassword,
  clearAuthCookies,
} from "../../../utils/auth.ts";
import { deleteUserAccount } from "../../../utils/db.ts";

export const handler: Handlers = {
  async DELETE(req) {
    const auth = await getAuthPayload(req);
    if (auth instanceof Response) return auth;

    try {
      const body = await req.json();
      const { password } = body;

      if (!password || typeof password !== "string") {
        return new Response(
          JSON.stringify({ error: "Password is required to delete your account" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const valid = await verifyUserPassword(auth.userId, password);
      if (!valid) {
        return new Response(
          JSON.stringify({ error: "Password is incorrect" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      await deleteUserAccount(auth.userId);

      const headers = new Headers({ "Content-Type": "application/json" });
      clearAuthCookies(headers);

      return new Response(
        JSON.stringify({ message: "Account deleted" }),
        { status: 200, headers }
      );
    } catch (error) {
      console.error("Account deletion error:", error);
      return new Response(
        JSON.stringify({ error: "Something went wrong. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
