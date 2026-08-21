import { Handlers } from "$fresh/server.ts";
import {
  constructWebhookEvent,
  type StripeEvent,
} from "../../../utils/stripe.ts";
import {
  getUserIdByStripeCustomerId,
  recordStripeEvent,
  setUserPlan,
  setUserStripeCustomerId,
  upsertSubscription,
} from "../../../utils/db.ts";
import type { SubscriptionStatus, UserPlan } from "@nutrition-llama/shared";

// Statuses that grant Pro access. The webhook is the source of truth for
// users.plan, which every gate reads.
const PRO_STATUSES = new Set(["active", "trialing"]);

function planForStatus(status: string): UserPlan {
  return PRO_STATUSES.has(status) ? "pro" : "free";
}

// deno-lint-ignore no-explicit-any
async function resolveUserId(sub: any): Promise<string | null> {
  const metaUserId = sub?.metadata?.user_id;
  if (metaUserId) return metaUserId;
  if (sub?.customer) {
    return await getUserIdByStripeCustomerId(String(sub.customer));
  }
  return null;
}

// deno-lint-ignore no-explicit-any
async function syncSubscription(sub: any): Promise<void> {
  const userId = await resolveUserId(sub);
  if (!userId) {
    console.error("Webhook: could not resolve user for subscription", sub?.id);
    return;
  }

  const customerId = String(sub.customer);
  // Backfill the customer id in case checkout created it out of band.
  await setUserStripeCustomerId(userId, customerId).catch(() => {});

  const status = sub.status as SubscriptionStatus;
  const priceId = sub?.items?.data?.[0]?.price?.id ?? null;
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end * 1000)
    : null;

  await upsertSubscription({
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: String(sub.id),
    status,
    priceId,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
  });

  await setUserPlan(userId, planForStatus(status));
}

async function handleEvent(event: StripeEvent): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      // Link the customer to the user immediately; the subscription.* events
      // that follow carry the full subscription state.
      const session = event.data.object;
      const userId = session.client_reference_id;
      if (userId && session.customer) {
        await setUserStripeCustomerId(userId, String(session.customer)).catch(
          () => {},
        );
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscription(event.data.object);
      break;
    }
    case "invoice.payment_failed": {
      // Downgrade access on failed payment. The subsequent subscription.updated
      // (past_due/unpaid) also covers this; handle here for immediacy.
      const invoice = event.data.object;
      const userId = await getUserIdByStripeCustomerId(
        String(invoice.customer),
      );
      if (userId) await setUserPlan(userId, "free");
      break;
    }
    default:
      // Unhandled event types are acknowledged (200) and ignored.
      break;
  }
}

export const handler: Handlers = {
  async POST(req) {
    // Signature verification needs the RAW body — read it before any parsing.
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: StripeEvent;
    try {
      event = await constructWebhookEvent(rawBody, signature);
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    try {
      // Idempotency: skip events we've already processed (Stripe retries).
      const isNew = await recordStripeEvent(event.id, event.type);
      if (!isNew) {
        return new Response(
          JSON.stringify({ received: true, duplicate: true }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      await handleEvent(event);

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Webhook processing error:", error);
      // 500 tells Stripe to retry.
      return new Response(JSON.stringify({ error: "Processing failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
