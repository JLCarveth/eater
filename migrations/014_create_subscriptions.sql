-- Migration: 014_create_subscriptions
-- Description: Add billing plan to users, create subscriptions + ai_usage tables
--              to support Macroscope Pro (Stripe) and AI-usage metering.

-- Denormalized fast-path plan flag on the user, kept truthful by the Stripe
-- webhook. 'free' | 'pro'. stripe_customer_id links a user to their Stripe
-- customer so we can create Checkout/Portal sessions and reconcile webhooks.
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
-- Opt-in for the Pro weekly email report (retention). Default on.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_weekly_report BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Subscriptions: the audit trail of Stripe subscription state. The webhook is
-- the source of truth; users.plan is the denormalized copy for fast gating.
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL, -- active | trialing | past_due | canceled | incomplete | unpaid
    price_id VARCHAR(255),
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Idempotency ledger for Stripe webhook events: we record each processed
-- event id so replayed events are no-ops.
CREATE TABLE IF NOT EXISTS stripe_events (
    id VARCHAR(255) PRIMARY KEY, -- Stripe event id (evt_...)
    type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI usage metering: one row per AI action, used to enforce the monthly
-- fair-use cap and the free trial allotment.
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL, -- label_scan | meal_scan | coach
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created ON ai_usage(user_id, created_at);

-- Widen the nutrition_records source CHECK to allow snap-a-meal saves.
ALTER TABLE nutrition_records DROP CONSTRAINT IF EXISTS nutrition_records_source_check;
ALTER TABLE nutrition_records ADD CONSTRAINT nutrition_records_source_check
    CHECK (source IN ('manual', 'scan', 'api', 'openfoodfacts', 'community', 'recipe', 'meal_scan'));
