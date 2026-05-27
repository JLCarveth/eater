interface NutritionFactsPanelProps {
  calories: number;
  totalFat?: number | null;
  cholesterol?: number | null;
  sodium?: number | null;
  carbohydrates?: number | null;
  fiber?: number | null;
  sugars?: number | null;
  protein?: number | null;
  multiplier?: number;
  servingLabel?: string;
}

export default function NutritionFactsPanel({
  calories,
  totalFat,
  cholesterol,
  sodium,
  carbohydrates,
  fiber,
  sugars,
  protein,
  multiplier = 1,
  servingLabel = "1 serving",
}: NutritionFactsPanelProps) {
  const m = multiplier;
  return (
    <div class="border border-gray-300 rounded-lg p-4">
      <h4 class="text-base font-bold text-gray-900 border-b-8 border-gray-900 pb-1 mb-2">
        Nutrition Facts
      </h4>
      <p class="text-sm text-gray-500 border-b border-gray-300 pb-2 mb-2">
        {servingLabel}
      </p>
      <div class="text-sm space-y-1">
        <div class="flex justify-between font-bold border-b-4 border-gray-900 pb-1">
          <span>Calories</span>
          <span>{Math.round(calories * m)}</span>
        </div>
        <div class="flex justify-between border-b border-gray-200 py-0.5">
          <span class="font-semibold">Total Fat</span>
          <span>{Math.round((totalFat ?? 0) * m)}g</span>
        </div>
        <div class="flex justify-between border-b border-gray-200 py-0.5">
          <span class="font-semibold">Cholesterol</span>
          <span>{Math.round((cholesterol ?? 0) * m)}mg</span>
        </div>
        <div class="flex justify-between border-b border-gray-200 py-0.5">
          <span class="font-semibold">Sodium</span>
          <span>{Math.round((sodium ?? 0) * m)}mg</span>
        </div>
        <div class="flex justify-between border-b border-gray-200 py-0.5">
          <span class="font-semibold">Total Carbohydrates</span>
          <span>{Math.round((carbohydrates ?? 0) * m)}g</span>
        </div>
        <div class="flex justify-between pl-4 border-b border-gray-200 py-0.5">
          <span>Fiber</span>
          <span>{Math.round((fiber ?? 0) * m)}g</span>
        </div>
        <div class="flex justify-between pl-4 border-b border-gray-200 py-0.5">
          <span>Sugars</span>
          <span>{Math.round((sugars ?? 0) * m)}g</span>
        </div>
        <div class="flex justify-between border-b-4 border-gray-900 py-0.5">
          <span class="font-semibold">Protein</span>
          <span>{Math.round((protein ?? 0) * m)}g</span>
        </div>
      </div>
    </div>
  );
}
