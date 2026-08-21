import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/auth.ts";
import type { User } from "@nutrition-llama/shared";
import { isPro } from "../utils/plan.ts";
import CameraCapture from "../islands/CameraCapture.tsx";
import MealScan from "../islands/MealScan.tsx";
import PageShell from "../components/PageShell.tsx";
import PageHeader from "../components/PageHeader.tsx";
import ProPaywall from "../components/ProPaywall.tsx";

type ScanMode = "label" | "meal";

interface ScanData {
  user: User;
  initialUpc: string | null;
  mode: ScanMode;
  pro: boolean;
}

export const handler: Handlers<ScanData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const url = new URL(req.url);
    const initialUpc = url.searchParams.get("upc");
    const mode: ScanMode = url.searchParams.get("mode") === "meal" ? "meal" : "label";

    return ctx.render({
      user: authResult.user!,
      initialUpc,
      mode,
      pro: isPro(authResult.user!),
    });
  },
};

function ModeTab({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <a
      href={href}
      class={`flex-1 text-center px-4 py-2.5 text-sm font-medium rounded-md transition-all ${
        active ? "bg-white text-primary-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {children}
    </a>
  );
}

export default function ScanPage({ data }: PageProps<ScanData>) {
  const { mode, pro } = data;

  return (
    <>
      <Head>
        <title>Scan - MacroScope</title>
      </Head>

      <PageShell>
        <PageHeader
          title={mode === "meal" ? "Scan a Meal" : "Scan Nutrition Label"}
          subtitle={
            mode === "meal"
              ? "Snap a photo of your plate and let AI estimate the macros."
              : "Take a photo or upload an image of a nutrition label to extract the information automatically."
          }
        />

        <div class="flex gap-2 p-1 bg-gray-100 rounded-lg mb-6">
          <ModeTab href="/scan?mode=label" active={mode === "label"}>Nutrition Label</ModeTab>
          <ModeTab href="/scan?mode=meal" active={mode === "meal"}>Scan a Meal</ModeTab>
        </div>

        {mode === "meal"
          ? (pro
            ? <MealScan />
            : (
              <ProPaywall
                title="Snap-a-meal is a Pro feature"
                message="Take a photo of any plate and get an instant macro estimate — no label needed. Unlock it with Macroscope Pro."
                feature="meal_scan"
              />
            ))
          : <CameraCapture initialUpc={data.initialUpc} />}
      </PageShell>
    </>
  );
}
