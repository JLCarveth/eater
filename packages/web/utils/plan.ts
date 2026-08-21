/**
 * Plan gating helpers — the single source of truth for "is this user Pro?"
 * and the free-tier allowances every gated surface checks.
 *
 * users.plan is kept truthful by the Stripe webhook (Phase 1), which flips it
 * to 'pro' for active/trialing subscriptions and back to 'free' on cancel /
 * payment failure. isPro() reads that denormalized flag so gating is a cheap,
 * synchronous check.
 */

import type { AiAction, User } from "@nutrition-llama/shared";
import { countAiUsageLifetime, countAiUsageThisMonth } from "./db.ts";

// ---- Free-tier allowances -------------------------------------------------

/** Lifetime free label scans — a trial of the AI before asking for money. */
export const FREE_LABEL_SCAN_LIMIT = 10;
/** Days of trends/history a free user can see. */
export const FREE_TRENDS_DAYS = 14;
/** Recipes a free user can save. */
export const FREE_RECIPE_LIMIT = 3;
/** Goal presets a free user can save. */
export const FREE_GOAL_LIMIT = 1;

// ---- Pro fair-use cap -----------------------------------------------------

/** Monthly AI-action cap for Pro users (cost backstop, not a hard error). */
export const PRO_MONTHLY_AI_LIMIT = 100;

/** Where paywalled responses point the user to upgrade. */
export const UPGRADE_URL = "/account";

// deno-lint-ignore no-explicit-any
type PlanUser = Pick<User, "plan"> | { plan?: string | null } | any;

/**
 * Central Pro check. The webhook writes 'pro' for active/trialing subs and
 * 'free' otherwise, so a plan-string comparison is authoritative.
 */
export function isPro(user: PlanUser | null | undefined): boolean {
  return user?.plan === "pro";
}

export interface AiGateResult {
  /** Whether the action is allowed to proceed. */
  allowed: boolean;
  /** Machine-readable reason when blocked. */
  reason?: "trial_exhausted" | "fair_use_cap";
  /** User-facing message when blocked. */
  message?: string;
}

/**
 * Decide whether a user may perform an AI action right now.
 *
 * - Pro users: allowed until the monthly fair-use cap (friendly stop, not an
 *   error) — protects the margin from a runaway heavy user.
 * - Free users: allowed only for `label_scan`, and only up to the lifetime
 *   trial allowance. Meal scan / coach are Pro-only.
 */
export async function checkAiAllowance(
  user: PlanUser,
  action: AiAction,
): Promise<AiGateResult> {
  if (isPro(user)) {
    const used = await countAiUsageThisMonth(user.id);
    if (used >= PRO_MONTHLY_AI_LIMIT) {
      return {
        allowed: false,
        reason: "fair_use_cap",
        message:
          `You've reached this month's fair-use limit of ${PRO_MONTHLY_AI_LIMIT} ` +
          `AI actions. It resets at the start of next month.`,
      };
    }
    return { allowed: true };
  }

  // Free tier: only the label-scan trial is available.
  if (action === "label_scan") {
    const used = await countAiUsageLifetime(user.id, "label_scan");
    if (used >= FREE_LABEL_SCAN_LIMIT) {
      return {
        allowed: false,
        reason: "trial_exhausted",
        message: `You've used all ${FREE_LABEL_SCAN_LIMIT} free label scans. ` +
          `Upgrade to Macroscope Pro for more.`,
      };
    }
    return { allowed: true };
  }

  // meal_scan / coach are Pro-only for free users.
  return {
    allowed: false,
    reason: "trial_exhausted",
    message: "This is a Macroscope Pro feature. Upgrade to unlock it.",
  };
}

/** Standard 402 JSON body for a blocked premium API call. */
export function paywallResponse(message: string, status = 402): Response {
  return new Response(
    JSON.stringify({ error: message, upgradeUrl: UPGRADE_URL }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}
