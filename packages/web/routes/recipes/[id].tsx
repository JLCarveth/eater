import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../utils/auth.ts";
import type { User, RecipeWithIngredients } from "@nutrition-llama/shared";
import { getRecipeById } from "../../utils/db.ts";
import FoodLogForm from "../../islands/FoodLogForm.tsx";
import DeleteButton from "../../islands/DeleteButton.tsx";
import PageShell from "../../components/PageShell.tsx";
import BackLink from "../../components/BackLink.tsx";
import NutritionFactsPanel from "../../components/NutritionFactsPanel.tsx";
import { Card } from "../../components/ui/index.ts";

interface RecipeDetailData {
  user: User;
  recipe: RecipeWithIngredients;
}

export const handler: Handlers<RecipeDetailData> = {
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

export default function RecipeDetailPage({ data }: PageProps<RecipeDetailData>) {
  const { recipe } = data;
  const nr = recipe.nutrition;

  return (
    <>
      <Head>
        <title>{recipe.name} - MacroScope</title>
      </Head>

      <PageShell>
        <div class="mb-6">
          <BackLink href="/recipes">Back to Recipes</BackLink>
          <div class="flex items-center gap-3 mt-2">
            <h1 class="text-2xl font-bold text-gray-900">{recipe.name}</h1>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Recipe
            </span>
          </div>
          {recipe.description && (
            <p class="text-gray-600 mt-1">{recipe.description}</p>
          )}
          <p class="text-gray-500 text-sm mt-1">
            Makes {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Actions */}
        <Card class="mb-6">
          <div class="flex gap-3">
            <a
              href={`/recipes/${recipe.id}/edit`}
              class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Edit Recipe
            </a>
            <DeleteButton itemId={recipe.id} itemName={recipe.name} apiPath="/api/recipes" redirectTo="/recipes" label="Recipe" />
          </div>
        </Card>

        {/* Ingredients */}
        <Card class="mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">
            Ingredients ({recipe.ingredients.length})
          </h2>
          <ul class="divide-y divide-gray-100">
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} class="py-3 flex items-center justify-between">
                <div>
                  <span class="text-sm font-medium text-gray-900">{ing.nutritionRecord.name}</span>
                  <span class="text-xs text-gray-500 ml-2">
                    {ing.amountServings} serving{ing.amountServings !== 1 ? "s" : ""}
                  </span>
                </div>
                <span class="text-xs text-gray-500">
                  {Math.round(ing.nutritionRecord.calories * ing.amountServings)} cal
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Per-serving nutrition */}
        <Card class="mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Nutrition Facts (per serving)</h2>
          <NutritionFactsPanel
            calories={nr.calories}
            totalFat={nr.totalFat}
            cholesterol={nr.cholesterol}
            sodium={nr.sodium}
            carbohydrates={nr.carbohydrates}
            fiber={nr.fiber}
            sugars={nr.sugars}
            protein={nr.protein}
          />
        </Card>

        {/* Log this recipe */}
        <Card>
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Log This Recipe</h2>
          <FoodLogForm
            mode="log"
            foodId={recipe.nutritionRecordId}
            foodName={recipe.name}
            foodNutrition={{
              calories: nr.calories,
              protein: nr.protein,
              carbohydrates: nr.carbohydrates,
              totalFat: nr.totalFat,
              fiber: nr.fiber,
              sugars: nr.sugars,
              sodium: nr.sodium,
              cholesterol: nr.cholesterol,
              servingSizeValue: 1,
              servingSizeUnit: "serving",
              unitName: null,
              unitWeightGrams: null,
            }}
          />
        </Card>
      </PageShell>
    </>
  );
}
