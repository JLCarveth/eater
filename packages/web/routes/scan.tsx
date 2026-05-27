import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/auth.ts";
import type { User } from "@nutrition-llama/shared";
import CameraCapture from "../islands/CameraCapture.tsx";
import PageShell from "../components/PageShell.tsx";
import PageHeader from "../components/PageHeader.tsx";

interface ScanData {
  user: User;
  initialUpc: string | null;
}

export const handler: Handlers<ScanData> = {
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

export default function ScanPage({ data }: PageProps<ScanData>) {
  return (
    <>
      <Head>
        <title>Scan Nutrition Label - MacroScope</title>
      </Head>

      <PageShell>
        <PageHeader
          title="Scan Nutrition Label"
          subtitle="Take a photo or upload an image of a nutrition label to extract the information automatically."
        />
        <CameraCapture initialUpc={data.initialUpc} />
      </PageShell>
    </>
  );
}
