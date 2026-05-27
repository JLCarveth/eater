import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../../utils/auth.ts";
import type { User, RecipeWithIngredients } from "@nutrition-llama/shared";
import { getRecipeById } from "../../../utils/db.ts";
import RecipeForm from "../../../islands/RecipeForm.tsx";
import PageShell from "../../../components/PageShell.tsx";
import PageHeader from "../../../components/PageHeader.tsx";

interface EditRecipeData {
  user: User;
  recipe: RecipeWithIngredients;
}

export const handler: Handlers<EditRecipeData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const { id } = ctx.params;
    const recipe = await getRecipeById(id, authResult.user!.id);

    if (!recipe) {
      return new Response("Not Found", { status: 404 });
    }

    return ctx.render({ user: authResult.user!, recipe });
  },
};

export default function EditRecipePage({ data }: PageProps<EditRecipeData>) {
  const { recipe } = data;

  return (
    <>
      <Head>
        <title>Edit {recipe.name} - MacroScope</title>
      </Head>

      <PageShell>
        <PageHeader
          title={`Edit ${recipe.name}`}
          back={{ href: `/recipes/${recipe.id}`, label: "Back to Recipe" }}
          spacing="mb-6"
        />
        <RecipeForm
          mode="edit"
          recipeId={recipe.id}
          initialData={{
            name: recipe.name,
            description: recipe.description ?? "",
            servings: recipe.servings,
            ingredients: recipe.ingredients.map((ing) => ({
              nutritionRecordId: ing.nutritionRecordId,
              amountServings: ing.amountServings,
              name: ing.nutritionRecord.name,
              calories: ing.nutritionRecord.calories,
              protein: ing.nutritionRecord.protein,
              carbohydrates: ing.nutritionRecord.carbohydrates,
              totalFat: ing.nutritionRecord.totalFat,
              servingSizeValue: ing.nutritionRecord.servingSizeValue,
              servingSizeUnit: ing.nutritionRecord.servingSizeUnit,
            })),
          }}
        />
      </PageShell>
    </>
  );
}
