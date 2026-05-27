import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth.ts";
import type { User, RecipeWithIngredients } from "@nutrition-llama/shared";
import { getUserRecipes } from "../../utils/db.ts";
import RecipeBrowser from "../../islands/RecipeBrowser.tsx";
import PageShell from "../../components/PageShell.tsx";
import PageHeader from "../../components/PageHeader.tsx";

interface RecipesData {
  user: User;
  initialRecipes: RecipeWithIngredients[];
}

export const handler: Handlers<RecipesData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const initialRecipes = await getUserRecipes(authResult.user!.id);

    return ctx.render({
      user: authResult.user!,
      initialRecipes,
    });
  },
};

export default function RecipesPage({ data }: PageProps<RecipesData>) {
  const { initialRecipes } = data;

  return (
    <>
      <Head>
        <title>Recipes - MacroScope</title>
      </Head>

      <PageShell maxWidth="7xl">
        <PageHeader
          title="Recipes"
          subtitle="Save combinations of foods to log quickly"
          actions={
            <a
              href="/recipes/new"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              New Recipe
            </a>
          }
        />
        <RecipeBrowser initialRecipes={initialRecipes} />
      </PageShell>
    </>
  );
}
