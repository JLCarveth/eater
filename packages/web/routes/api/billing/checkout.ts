import { Handlers } from "$fresh/server.ts";
import { getAuthPayload } from "../../../utils/auth.ts";
import {
  getUserById,
  getUserStripeCustomerId,
  setUserStripeCustomerId,
} from "../../../utils/db.ts";
import {
  createCheckoutSession,
  createCustomer,
  getPriceId,
} from "../../../utils/stripe.ts";

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

    const body = await req.json().catch(() => ({}));
    const interval = body.interval === "monthly" ? "monthly" : "annual";

    try {
      const user = await getUserById(auth.userId);
      if (!user) return json({ error: "User not found" }, 404);

      // Ensure the user has a Stripe customer so the subscription and portal
      // attach to a stable identity.
      let customerId = await getUserStripeCustomerId(user.id);
      if (!customerId) {
        const customer = await createCustomer(user.email, user.id);
        customerId = customer.id;
        await setUserStripeCustomerId(user.id, customerId);
      }

      const session = await createCheckoutSession({
        customerId,
        priceId: getPriceId(interval),
        userId: user.id,
      });

      return json({ url: session.url });
    } catch (error) {
      console.error("Checkout error:", error);
      return json({ error: "Failed to start checkout" }, 500);
    }
  },
};
