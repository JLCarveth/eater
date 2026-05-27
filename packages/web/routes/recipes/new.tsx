import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth.ts";
import type { User } from "@nutrition-llama/shared";
import RecipeForm from "../../islands/RecipeForm.tsx";
import PageShell from "../../components/PageShell.tsx";
import PageHeader from "../../components/PageHeader.tsx";

interface NewRecipeData {
  user: User;
}

export const handler: Handlers<NewRecipeData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    return ctx.render({ user: authResult.user! });
  },
};

export default function NewRecipePage({ data: _data }: PageProps<NewRecipeData>) {
  return (
    <>
      <Head>
        <title>New Recipe - MacroScope</title>
      </Head>

      <PageShell>
        <PageHeader
          title="New Recipe"
          back={{ href: "/recipes", label: "Back to Recipes" }}
          spacing="mb-6"
        />
        <RecipeForm mode="create" />
      </PageShell>
    </>
  );
}
