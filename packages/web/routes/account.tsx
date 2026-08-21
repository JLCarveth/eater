import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/auth.ts";
import type { Subscription, User } from "@nutrition-llama/shared";
import { getSubscription, getUserEmailPref } from "../utils/db.ts";
import { isPro } from "../utils/plan.ts";
import PageShell from "../components/PageShell.tsx";
import PageHeader from "../components/PageHeader.tsx";
import { Card } from "../components/ui/index.ts";
import BillingActions from "../islands/BillingActions.tsx";
import EmailPrefToggle from "../islands/EmailPrefToggle.tsx";
import TrackEvent from "../islands/TrackEvent.tsx";

interface AccountData {
  user: User;
  subscription: Subscription | null;
  pro: boolean;
  emailWeeklyReport: boolean;
  checkoutSuccess: boolean;
}

export const handler: Handlers<AccountData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) return authResult.redirect;

    const user = authResult.user!;
    const [subscription, emailWeeklyReport] = await Promise.all([
      getSubscription(user.id),
      getUserEmailPref(user.id),
    ]);

    const checkoutSuccess =
      new URL(req.url).searchParams.get("checkout") === "success";

    return ctx.render({
      user,
      subscription,
      pro: isPro(user),
      emailWeeklyReport,
      checkoutSuccess,
    });
  },
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AccountPage({ data }: PageProps<AccountData>) {
  const { user, subscription, pro, emailWeeklyReport, checkoutSuccess } = data;

  return (
    <>
      <Head>
        <title>Account - MacroScope</title>
      </Head>

      <PageShell>
        <PageHeader
          title="Account"
          titleSize="3xl"
          subtitle="Manage your plan and billing."
        />

        <div class="space-y-6">
          {checkoutSuccess && (
            <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <TrackEvent event="subscribe_success" />
              <p class="text-sm text-primary-800 font-medium">
                Welcome to Macroscope Pro! Your subscription is active.
              </p>
              <p class="text-xs text-primary-700 mt-1">
                If your plan still shows Free, give it a few seconds and refresh
                — we're confirming with Stripe.
              </p>
            </div>
          )}

          <Card>
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-lg font-semibold text-gray-900">
                  {pro ? "Macroscope Pro" : "Free plan"}
                </h2>
                <p class="text-sm text-gray-500">{user.email}</p>
              </div>
              <span
                class={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  pro
                    ? "bg-primary-100 text-primary-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {pro ? "PRO" : "FREE"}
              </span>
            </div>

            {pro && subscription && (
              <dl class="text-sm text-gray-600 space-y-1 mb-6">
                <div class="flex justify-between">
                  <dt>Status</dt>
                  <dd class="font-medium text-gray-900 capitalize">
                    {subscription.status}
                  </dd>
                </div>
                <div class="flex justify-between">
                  <dt>
                    {subscription.cancelAtPeriodEnd
                      ? "Access until"
                      : "Renews on"}
                  </dt>
                  <dd class="font-medium text-gray-900">
                    {formatDate(subscription.currentPeriodEnd)}
                  </dd>
                </div>
              </dl>
            )}

            {!pro && (
              <p class="text-sm text-gray-600 mb-6">
                Upgrade to unlock snap-a-meal photo logging, the AI macro coach,
                unlimited history &amp; trends, CSV export, and unlimited
                recipes.
              </p>
            )}

            <BillingActions isPro={pro} />
          </Card>

          {pro && (
            <Card>
              <h2 class="text-lg font-semibold text-gray-900 mb-2">
                Export your data
              </h2>
              <p class="text-sm text-gray-600 mb-4">
                Download your full food log and weight history as CSV.
              </p>
              <a
                href="/api/export"
                class="inline-flex items-center justify-center gap-2 font-medium rounded-md px-4 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 transition-colors"
              >
                Download CSV
              </a>
            </Card>
          )}

          {pro && (
            <Card>
              <h2 class="text-lg font-semibold text-gray-900 mb-4">
                Email preferences
              </h2>
              <EmailPrefToggle initial={emailWeeklyReport} />
            </Card>
          )}
        </div>
      </PageShell>
    </>
  );
}
