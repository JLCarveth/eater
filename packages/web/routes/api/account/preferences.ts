import { Handlers } from "$fresh/server.ts";
import { getAuthPayload } from "../../../utils/auth.ts";
import { setUserEmailPref } from "../../../utils/db.ts";

export const handler: Handlers = {
  async PUT(req) {
    const auth = await getAuthPayload(req);
    if (auth instanceof Response) return auth;

    try {
      const body = await req.json();
      if (typeof body.emailWeeklyReport !== "boolean") {
        return new Response(
          JSON.stringify({ error: "emailWeeklyReport must be a boolean" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      await setUserEmailPref(auth.userId, body.emailWeeklyReport);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Update preferences error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update preferences" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
