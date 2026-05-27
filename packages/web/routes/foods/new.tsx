import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth.ts";
import type { User } from "@nutrition-llama/shared";
import FoodLogForm from "../../islands/FoodLogForm.tsx";
import PageShell from "../../components/PageShell.tsx";
import PageHeader from "../../components/PageHeader.tsx";

interface NewFoodData {
  user: User;
  initialUpc: string | null;
}

export const handler: Handlers<NewFoodData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    // Extract optional ?upc= query param to pre-fill UPC field
    const url = new URL(req.url);
    const initialUpc = url.searchParams.get("upc");

    return ctx.render({
      user: authResult.user!,
      initialUpc,
    });
  },
};

export default function NewFoodPage({ data }: PageProps<NewFoodData>) {
  return (
    <>
      <Head>
        <title>Add Food - MacroScope</title>
      </Head>

      <PageShell>
        <PageHeader
          title="Add New Food"
          subtitle="Enter nutrition information manually."
          back={{ href: "/foods", label: "Back to My Foods" }}
        />

        {!data.initialUpc && (
          <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <svg class="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1 text-sm">
              <p class="font-medium text-blue-800">Have a barcode?</p>
              <p class="text-blue-700 mt-0.5">
                Check if this food already exists in our database before entering it manually.{" "}
                <a href="/upc" class="font-medium underline hover:text-blue-900">
                  Scan barcode
                </a>
              </p>
            </div>
          </div>
        )}

        <FoodLogForm mode="create" initialUpc={data.initialUpc} />
      </PageShell>
    </>
  );
}
