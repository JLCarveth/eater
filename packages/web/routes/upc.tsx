import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/auth.ts";
import type { User } from "@nutrition-llama/shared";
import UpcLookup from "../islands/UpcLookup.tsx";
import PageShell from "../components/PageShell.tsx";
import PageHeader from "../components/PageHeader.tsx";

interface UpcData {
  user: User;
  initialCode: string | null;
}

export const handler: Handlers<UpcData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    // Extract optional ?code= query param for deep linking
    const url = new URL(req.url);
    const initialCode = url.searchParams.get("code");

    return ctx.render({
      user: authResult.user!,
      initialCode,
    });
  },
};

export default function UpcPage({ data }: PageProps<UpcData>) {
  return (
    <>
      <Head>
        <title>Quick Add - MacroScope</title>
      </Head>

      <PageShell>
        <PageHeader
          title="Quick Add by Barcode"
          subtitle="Scan a barcode to quickly log foods you've already saved."
        />
        <UpcLookup initialCode={data.initialCode} />
      </PageShell>
    </>
  );
}
