import { Handlers } from "$fresh/server.ts";
import { getAuthPayload } from "../../../utils/auth.ts";
import { exportUserData } from "../../../utils/db.ts";

export const handler: Handlers = {
  async GET(req) {
    const auth = await getAuthPayload(req);
    if (auth instanceof Response) return auth;

    try {
      const data = await exportUserData(auth.userId);

      if (!data) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      const date = new Date().toISOString().split("T")[0];
      return new Response(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="macroscope-export-${date}.json"`,
        },
      });
    } catch (error) {
      console.error("Data export error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to export data" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
