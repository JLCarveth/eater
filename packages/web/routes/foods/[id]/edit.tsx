import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../../../utils/auth.ts";
import { getFoodById } from "../../../utils/db.ts";
import type { User, NutritionRecord } from "@nutrition-llama/shared";
import FoodLogForm from "../../../islands/FoodLogForm.tsx";
import PageShell from "../../../components/PageShell.tsx";
import PageHeader from "../../../components/PageHeader.tsx";

interface EditFoodData {
  user: User;
  food: NutritionRecord;
}

export const handler: Handlers<EditFoodData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const { id } = ctx.params;
    const food = await getFoodById(id, authResult.user!.id);

    if (!food) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/foods" },
      });
    }

    return ctx.render({ user: authResult.user!, food });
  },
};

export default function EditFoodPage({ data }: PageProps<EditFoodData>) {
  const { food } = data;

  return (
    <>
      <Head>
        <title>Edit {food.name} - MacroScope</title>
      </Head>

      <PageShell>
        <PageHeader
          title="Edit Food"
          subtitle={`Update nutrition information for ${food.name}.`}
          back={{ href: `/foods/${food.id}`, label: `Back to ${food.name}` }}
        />
        <FoodLogForm
          mode="edit"
          foodId={food.id}
          initialFood={{
            name: food.name,
            servingSizeValue: food.servingSizeValue,
            servingSizeUnit: food.servingSizeUnit,
            calories: food.calories,
            protein: food.protein,
            carbohydrates: food.carbohydrates,
            totalFat: food.totalFat,
            fiber: food.fiber,
            sugars: food.sugars,
            sodium: food.sodium,
            cholesterol: food.cholesterol,
            upcCode: food.upcCode,
          }}
        />
      </PageShell>
    </>
  );
}
