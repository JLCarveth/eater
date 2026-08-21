import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/auth.ts";
import type { User } from "@nutrition-llama/shared";
import ChangePasswordForm from "../islands/ChangePasswordForm.tsx";
import DeleteAccountForm from "../islands/DeleteAccountForm.tsx";
import PageShell from "../components/PageShell.tsx";
import PageHeader from "../components/PageHeader.tsx";
import { Button, Card } from "../components/ui/index.ts";

interface SettingsData {
  user: User;
}

export const handler: Handlers<SettingsData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    return ctx.render({ user: authResult.user! });
  },
};

export default function SettingsPage({ data }: PageProps<SettingsData>) {
  const { user } = data;
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Head>
        <title>Account Settings - MacroScope</title>
      </Head>

      <PageShell>
        <PageHeader
          title="Account Settings"
          titleSize="3xl"
          subtitle="Manage your account, password, and data."
        />

        <div class="space-y-6">
          <Card>
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Account</h2>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm font-medium text-gray-500">Email</dt>
                <dd class="text-sm text-gray-900">{user.email}</dd>
              </div>
              {user.displayName && (
                <div>
                  <dt class="text-sm font-medium text-gray-500">Display name</dt>
                  <dd class="text-sm text-gray-900">{user.displayName}</dd>
                </div>
              )}
              <div>
                <dt class="text-sm font-medium text-gray-500">Member since</dt>
                <dd class="text-sm text-gray-900">{memberSince}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              Change password
            </h2>
            <ChangePasswordForm />
          </Card>

          <Card>
            <h2 class="text-lg font-semibold text-gray-900 mb-2">
              Export your data
            </h2>
            <p class="text-sm text-gray-600 mb-4">
              Download a copy of everything stored in your account — profile,
              goals, saved foods, recipes, food log, and weight log — as a JSON
              file.
            </p>
            <a href="/api/account/export" download>
              <Button variant="secondary">Download my data</Button>
            </a>
          </Card>

          <Card class="border border-red-200">
            <h2 class="text-lg font-semibold text-red-700 mb-2">Danger zone</h2>
            <p class="text-sm text-gray-600 mb-4">
              Permanently delete your account and all associated data. Consider
              exporting your data first.
            </p>
            <DeleteAccountForm />
          </Card>
        </div>
      </PageShell>
    </>
  );
}
