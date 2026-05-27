import { useState, lazy, Suspense } from "preact/compat";
import type { MealType } from "@nutrition-llama/shared";
import { trackEvent } from "../utils/analytics.ts";
import ErrorAlert from "../components/ErrorAlert.tsx";
import FoodFields from "../components/FoodFields.tsx";

// Lazy load BarcodeScanner to prevent zxing-wasm from blocking hydration
const BarcodeScanner = lazy(() => import("./BarcodeScanner.tsx"));

interface FoodNutrition {
  calories: number;
  protein: number | null;
  carbohydrates: number | null;
  totalFat: number | null;
  fiber: number | null;
  sugars: number | null;
  sodium: number | null;
  cholesterol: number | null;
  servingSizeValue: number;
  servingSizeUnit: string;
}

interface InitialFoodData {
  name: string;
  servingSizeValue: number;
  servingSizeUnit: string;
  calories: number;
  protein: number | null;
  carbohydrates: number | null;
  totalFat: number | null;
  fiber: number | null;
  sugars: number | null;
  sodium: number | null;
  cholesterol: number | null;
  upcCode: string | null;
}

interface FoodLogFormProps {
  mode: "create" | "log" | "edit";
  foodId?: string;
  foodName?: string;
  initialUpc?: string | null;
  foodNutrition?: FoodNutrition;
  initialFood?: InitialFoodData;
}

export default function FoodLogForm({ mode, foodId, foodName, initialUpc, foodNutrition, initialFood }: FoodLogFormProps) {
  // Form state for creating/editing food
  const [name, setName] = useState(initialFood?.name ?? "");
  const [servingSizeValue, setServingSizeValue] = useState(initialFood ? String(initialFood.servingSizeValue) : "100");
  const [servingSizeUnit, setServingSizeUnit] = useState<"g" | "ml">((initialFood?.servingSizeUnit as "g" | "ml") ?? "g");
  const [calories, setCalories] = useState(initialFood ? String(initialFood.calories) : "");
  const [protein, setProtein] = useState(initialFood?.protein != null ? String(initialFood.protein) : "");
  const [carbohydrates, setCarbohydrates] = useState(initialFood?.carbohydrates != null ? String(initialFood.carbohydrates) : "");
  const [totalFat, setTotalFat] = useState(initialFood?.totalFat != null ? String(initialFood.totalFat) : "");
  const [fiber, setFiber] = useState(initialFood?.fiber != null ? String(initialFood.fiber) : "");
  const [sugars, setSugars] = useState(initialFood?.sugars != null ? String(initialFood.sugars) : "");
  const [sodium, setSodium] = useState(initialFood?.sodium != null ? String(initialFood.sodium) : "");
  const [cholesterol, setCholesterol] = useState(initialFood?.cholesterol != null ? String(initialFood.cholesterol) : "");
  const [upcCode, setUpcCode] = useState(initialFood?.upcCode ?? initialUpc ?? "");

  // Log form state
  const [servings, setServings] = useState("1");
  const [amountUnit, setAmountUnit] = useState<"servings" | "g" | "ml">("servings");
  const [mealType, setMealType] = useState<MealType>("snack");
  const [loggedDate, setLoggedDate] = useState(new Date().toISOString().split("T")[0]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Helper function to calculate servings based on selected unit
  const calculateServings = (): number => {
    const amount = parseFloat(servings) || 0;
    if (amountUnit === "servings") {
      return amount;
    }
    // Convert weight to servings
    if (!foodNutrition?.servingSizeValue || foodNutrition.servingSizeValue === 0) {
      return amount; // Fallback
    }
    return amount / foodNutrition.servingSizeValue;
  };

  // Handle unit change with value conversion for better UX
  const handleUnitChange = (newUnit: "servings" | "g" | "ml") => {
    const currentAmount = parseFloat(servings) || 1;
    const currentServings = amountUnit === "servings"
      ? currentAmount
      : currentAmount / (foodNutrition?.servingSizeValue || 1);

    let newAmount: number;
    if (newUnit === "servings") {
      newAmount = currentServings;
    } else {
      newAmount = currentServings * (foodNutrition?.servingSizeValue || 1);
    }

    setServings(newAmount.toFixed(2));
    setAmountUnit(newUnit);
  };

  const handleCreateFood = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          servingSizeValue: parseFloat(servingSizeValue),
          servingSizeUnit,
          calories: parseFloat(calories),
          protein: protein ? parseFloat(protein) : undefined,
          carbohydrates: carbohydrates ? parseFloat(carbohydrates) : undefined,
          totalFat: totalFat ? parseFloat(totalFat) : undefined,
          fiber: fiber ? parseFloat(fiber) : undefined,
          sugars: sugars ? parseFloat(sugars) : undefined,
          sodium: sodium ? parseFloat(sodium) : undefined,
          cholesterol: cholesterol ? parseFloat(cholesterol) : undefined,
          upcCode: upcCode || undefined,
          source: "manual",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create food");
      }

      window.location.href = "/foods";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create food");
    } finally {
      setLoading(false);
    }
  };

  const handleEditFood = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/foods/${foodId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          servingSizeValue: parseFloat(servingSizeValue),
          servingSizeUnit,
          calories: parseFloat(calories),
          protein: protein ? parseFloat(protein) : undefined,
          carbohydrates: carbohydrates ? parseFloat(carbohydrates) : undefined,
          totalFat: totalFat ? parseFloat(totalFat) : undefined,
          fiber: fiber ? parseFloat(fiber) : undefined,
          sugars: sugars ? parseFloat(sugars) : undefined,
          sodium: sodium ? parseFloat(sodium) : undefined,
          cholesterol: cholesterol ? parseFloat(cholesterol) : undefined,
          upcCode: upcCode || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update food");
      }

      window.location.href = `/foods/${foodId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update food");
    } finally {
      setLoading(false);
    }
  };

  const handleLogFood = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nutritionRecordId: foodId,
          servings: calculateServings(),
          mealType,
          loggedDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to log food");
      }

      trackEvent("Log_Food", { meal_type: mealType });
      window.location.href = `/log/${loggedDate}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log food");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "log") {
    const s = calculateServings();

    return (
      <form onSubmit={handleLogFood} class="space-y-4">
        <ErrorAlert error={error} />

        {foodNutrition && (
          <div class="border border-gray-300 rounded-lg p-4">
            <h4 class="text-base font-bold text-gray-900 border-b-8 border-gray-900 pb-1 mb-2">
              Nutrition Facts
            </h4>
            <p class="text-sm text-gray-500 border-b border-gray-300 pb-2 mb-2">
              {s !== 1 ? `${s.toFixed(2)} servings` : "1 serving"}{" "}
              ({Math.round(s * foodNutrition.servingSizeValue)}{foodNutrition.servingSizeUnit})
            </p>
            <div class="text-sm space-y-1">
              <div class="flex justify-between font-bold border-b-4 border-gray-900 pb-1">
                <span>Calories</span>
                <span>{Math.round(foodNutrition.calories * s)}</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 py-0.5">
                <span class="font-semibold">Total Fat</span>
                <span>{Math.round((foodNutrition.totalFat || 0) * s)}g</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 py-0.5">
                <span class="font-semibold">Cholesterol</span>
                <span>{Math.round((foodNutrition.cholesterol || 0) * s)}mg</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 py-0.5">
                <span class="font-semibold">Sodium</span>
                <span>{Math.round((foodNutrition.sodium || 0) * s)}mg</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 py-0.5">
                <span class="font-semibold">Total Carbohydrates</span>
                <span>{Math.round((foodNutrition.carbohydrates || 0) * s)}g</span>
              </div>
              <div class="flex justify-between pl-4 border-b border-gray-200 py-0.5">
                <span>Fiber</span>
                <span>{Math.round((foodNutrition.fiber || 0) * s)}g</span>
              </div>
              <div class="flex justify-between pl-4 border-b border-gray-200 py-0.5">
                <span>Sugars</span>
                <span>{Math.round((foodNutrition.sugars || 0) * s)}g</span>
              </div>
              <div class="flex justify-between border-b-4 border-gray-900 py-0.5">
                <span class="font-semibold">Protein</span>
                <span>{Math.round((foodNutrition.protein || 0) * s)}g</span>
              </div>
            </div>
          </div>
        )}

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              step={amountUnit === "servings" ? "0.25" : "any"}
              min={amountUnit === "servings" ? "0.25" : "0.01"}
              value={servings}
              onInput={(e) => setServings((e.target as HTMLInputElement).value)}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
            {amountUnit !== "servings" && (
              <p class="text-xs text-gray-500 mt-1">
                = {calculateServings().toFixed(2)} servings
              </p>
            )}
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Unit</label>
            <select
              value={amountUnit}
              onChange={(e) => handleUnitChange((e.target as HTMLSelectElement).value as "servings" | "g" | "ml")}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="servings">servings</option>
              {foodNutrition && foodNutrition.servingSizeValue > 0 && foodNutrition.servingSizeUnit !== "serving" && (
                <option value={foodNutrition.servingSizeUnit}>
                  {foodNutrition.servingSizeUnit === "g" ? "grams (g)" : "milliliters (ml)"}
                </option>
              )}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Meal</label>
            <select
              value={mealType}
              onChange={(e) => setMealType((e.target as HTMLSelectElement).value as MealType)}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={loggedDate}
            onInput={(e) => setLoggedDate((e.target as HTMLInputElement).value)}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Logging..." : `Log ${foodName || "Food"}`}
        </button>
      </form>
    );
  }

  if (mode === "edit") {
    return (
      <form onSubmit={handleEditFood} class="space-y-6">
        <ErrorAlert error={error} />
        <FoodFields
          name={name} setName={setName}
          servingSizeValue={servingSizeValue} setServingSizeValue={setServingSizeValue}
          servingSizeUnit={servingSizeUnit} setServingSizeUnit={setServingSizeUnit}
          upcCode={upcCode} setUpcCode={setUpcCode}
          calories={calories} setCalories={setCalories}
          protein={protein} setProtein={setProtein}
          carbohydrates={carbohydrates} setCarbohydrates={setCarbohydrates}
          totalFat={totalFat} setTotalFat={setTotalFat}
          fiber={fiber} setFiber={setFiber}
          sugars={sugars} setSugars={setSugars}
          sodium={sodium} setSodium={setSodium}
          cholesterol={cholesterol} setCholesterol={setCholesterol}
        />
        <button
          type="submit"
          disabled={loading}
          class="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    );
  }

  // Create mode
  return (
    <form onSubmit={handleCreateFood} class="space-y-6">
      <ErrorAlert error={error} />
      <FoodFields
        name={name} setName={setName}
        servingSizeValue={servingSizeValue} setServingSizeValue={setServingSizeValue}
        servingSizeUnit={servingSizeUnit} setServingSizeUnit={setServingSizeUnit}
        upcCode={upcCode} setUpcCode={setUpcCode}
        calories={calories} setCalories={setCalories}
        protein={protein} setProtein={setProtein}
        carbohydrates={carbohydrates} setCarbohydrates={setCarbohydrates}
        totalFat={totalFat} setTotalFat={setTotalFat}
        fiber={fiber} setFiber={setFiber}
        sugars={sugars} setSugars={setSugars}
        sodium={sodium} setSodium={setSodium}
        cholesterol={cholesterol} setCholesterol={setCholesterol}
        onScanClick={() => setShowBarcodeScanner(true)}
      />
      <button
        type="submit"
        disabled={loading}
        class="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Saving..." : "Save Food"}
      </button>

      {showBarcodeScanner && (
        <Suspense fallback={<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"><div class="text-white">Loading scanner...</div></div>}>
          <BarcodeScanner
            onScan={(code) => {
              setUpcCode(code);
              setShowBarcodeScanner(false);
            }}
            onClose={() => setShowBarcodeScanner(false)}
          />
        </Suspense>
      )}
    </form>
  );
}
