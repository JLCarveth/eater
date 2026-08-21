/**
 * Minimal Stripe client over the REST API (no SDK — keeps the Deno/Fresh
 * bundle lean). Covers exactly what the billing pipe needs: create a
 * customer, a Checkout Session, a Billing Portal session, and verify webhook
 * signatures.
 *
 * Env:
 *   STRIPE_SECRET_KEY      sk_test_... / sk_live_...
 *   STRIPE_WEBHOOK_SECRET  whsec_...
 *   STRIPE_PRICE_MONTHLY   price_...   ($3.99/mo anchor)
 *   STRIPE_PRICE_ANNUAL    price_...   ($24/yr headline)
 */

import { encodeHex } from "$std/encoding/hex.ts";
import { getAppUrl } from "./email.ts";

const STRIPE_API = "https://api.stripe.com/v1";

// Stripe's REST payloads and responses are dynamically shaped; a single
// escape hatch keeps the rest of the file honest.
// deno-lint-ignore no-explicit-any
type StripeAny = any;

function secretKey(): string {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return key;
}

export function getPriceId(interval: "monthly" | "annual"): string {
  const env = interval === "annual"
    ? "STRIPE_PRICE_ANNUAL"
    : "STRIPE_PRICE_MONTHLY";
  const priceId = Deno.env.get(env);
  if (!priceId) throw new Error(`${env} not set`);
  return priceId;
}

/**
 * Flatten a nested params object into Stripe's bracketed form-encoding, e.g.
 * { line_items: [{ price: "p", quantity: 1 }] } ->
 * line_items[0][price]=p&line_items[0][quantity]=1
 */
function toFormBody(obj: Record<string, StripeAny>, prefix = ""): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    const encodedKey = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        const arrKey = `${encodedKey}[${i}]`;
        if (typeof item === "object") {
          parts.push(toFormBody(item, arrKey));
        } else {
          parts.push(
            `${encodeURIComponent(arrKey)}=${encodeURIComponent(String(item))}`,
          );
        }
      });
    } else if (typeof value === "object") {
      parts.push(toFormBody(value, encodedKey));
    } else {
      parts.push(
        `${encodeURIComponent(encodedKey)}=${
          encodeURIComponent(String(value))
        }`,
      );
    }
  }
  return parts.filter(Boolean).join("&");
}

async function stripeRequest(
  path: string,
  body: Record<string, StripeAny>,
): Promise<StripeAny> {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: toFormBody(body),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message ||
      `Stripe API error ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function createCustomer(
  email: string,
  userId: string,
): Promise<{ id: string }> {
  return await stripeRequest("/customers", {
    email,
    metadata: { user_id: userId },
  });
}

export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  userId: string;
}): Promise<{ url: string }> {
  const appUrl = getAppUrl();
  return await stripeRequest("/checkout/sessions", {
    mode: "subscription",
    customer: params.customerId,
    client_reference_id: params.userId,
    line_items: [{ price: params.priceId, quantity: 1 }],
    // Stripe Tax: collect the right sales-tax/VAT automatically.
    automatic_tax: { enabled: true },
    customer_update: { address: "auto" },
    success_url: `${appUrl}/account?checkout=success`,
    cancel_url: `${appUrl}/account?checkout=cancelled`,
    subscription_data: { metadata: { user_id: params.userId } },
  });
}

export async function createPortalSession(
  customerId: string,
): Promise<{ url: string }> {
  const appUrl = getAppUrl();
  return await stripeRequest("/billing_portal/sessions", {
    customer: customerId,
    return_url: `${appUrl}/account`,
  });
}

// ---- Webhook signature verification ---------------------------------------

export interface StripeEvent {
  id: string;
  type: string;
  data: { object: StripeAny };
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
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
    new TextEncoder().encode(message),
  );
  return encodeHex(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Verify a Stripe webhook signature against the raw request body and return
 * the parsed event. Throws if the signature is missing, malformed, expired,
 * or does not match. Mirrors Stripe's `constructEvent`.
 */
export async function constructWebhookEvent(
  rawBody: string,
  signatureHeader: string | null,
  toleranceSeconds = 300,
): Promise<StripeEvent> {
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not set");
  if (!signatureHeader) throw new Error("Missing Stripe-Signature header");

  // Header form: t=timestamp,v1=sig[,v1=sig...]
  let timestamp = "";
  const v1Signatures: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const [k, v] = part.split("=");
    if (k === "t") timestamp = v;
    else if (k === "v1") v1Signatures.push(v);
  }
  if (!timestamp || v1Signatures.length === 0) {
    throw new Error("Malformed Stripe-Signature header");
  }

  // Replay protection.
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > toleranceSeconds) {
    throw new Error("Stripe webhook timestamp outside tolerance");
  }

  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  const valid = v1Signatures.some((sig) => timingSafeEqual(sig, expected));
  if (!valid) throw new Error("Stripe signature verification failed");

  return JSON.parse(rawBody) as StripeEvent;
}
