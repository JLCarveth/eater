/**
 * Minimal integration tests for the highest-risk money paths:
 * the Pro gate and Stripe webhook signature verification.
 *
 * Run: cd packages/web && deno test --allow-env
 */

import { assert, assertEquals, assertRejects } from "$std/assert/mod.ts";
import { encodeHex } from "$std/encoding/hex.ts";
import { isPro } from "../utils/plan.ts";
import { constructWebhookEvent } from "../utils/stripe.ts";

// deno-lint-ignore no-explicit-any
const user = (plan: string): any => ({ id: "u1", plan });

Deno.test("isPro: true only for the pro plan", () => {
  assert(isPro(user("pro")));
  assertEquals(isPro(user("free")), false);
  assertEquals(isPro(null), false);
  assertEquals(isPro(undefined), false);
  assertEquals(isPro({}), false);
});

const WEBHOOK_SECRET = "whsec_test_secret";

async function sign(
  payload: string,
  timestamp: number,
  secret = WEBHOOK_SECRET,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  return encodeHex(new Uint8Array(sig));
}

Deno.test("constructWebhookEvent: accepts a valid signature", async () => {
  Deno.env.set("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);
  const payload = JSON.stringify({
    id: "evt_1",
    type: "customer.subscription.updated",
    data: { object: {} },
  });
  const t = Math.floor(Date.now() / 1000);
  const header = `t=${t},v1=${await sign(payload, t)}`;

  const event = await constructWebhookEvent(payload, header);
  assertEquals(event.id, "evt_1");
  assertEquals(event.type, "customer.subscription.updated");
});

Deno.test("constructWebhookEvent: rejects a forged signature", async () => {
  Deno.env.set("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);
  const payload = JSON.stringify({
    id: "evt_2",
    type: "x",
    data: { object: {} },
  });
  const t = Math.floor(Date.now() / 1000);
  const header = `t=${t},v1=deadbeef`;

  await assertRejects(
    () => constructWebhookEvent(payload, header),
    Error,
    "signature",
  );
});

Deno.test("constructWebhookEvent: rejects a stale timestamp (replay)", async () => {
  Deno.env.set("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);
  const payload = JSON.stringify({
    id: "evt_3",
    type: "x",
    data: { object: {} },
  });
  const t = Math.floor(Date.now() / 1000) - 10_000; // well outside tolerance
  const header = `t=${t},v1=${await sign(payload, t)}`;

  await assertRejects(
    () => constructWebhookEvent(payload, header),
    Error,
    "tolerance",
  );
});

Deno.test("constructWebhookEvent: rejects a missing signature header", async () => {
  Deno.env.set("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);
  await assertRejects(
    () => constructWebhookEvent("{}", null),
    Error,
    "Missing",
  );
});
