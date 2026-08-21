import { Handlers } from "$fresh/server.ts";
import { getAuthPayload } from "../../../utils/auth.ts";
import { getUserStripeCustomerId } from "../../../utils/db.ts";
import { createPortalSession } from "../../../utils/stripe.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const handler: Handlers = {
  async POST(req) {
    const auth = await getAuthPayload(req);
    if (auth instanceof Response) return auth;

    try {
      const customerId = await getUserStripeCustomerId(auth.userId);
      if (!customerId) {
        return json({ error: "No billing account found" }, 400);
      }

      const session = await createPortalSession(customerId);
      return json({ url: session.url });
    } catch (error) {
      console.error("Portal error:", error);
      return json({ error: "Failed to open billing portal" }, 500);
    }
  },
};
