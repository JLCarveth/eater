import { useRef, useState } from "preact/hooks";
import type {
  MealAnalysis,
  MealType,
  NutritionData,
} from "@nutrition-llama/shared";
import { trackEvent } from "../utils/analytics.ts";
import ErrorAlert from "../components/ErrorAlert.tsx";
import { Button, Card, SelectInput } from "../components/ui/index.ts";

type ScanState = "idle" | "preview" | "analyzing" | "results" | "saving";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function n(v?: { value: number } | null): number {
  return v?.value ?? 0;
}

export default function MealScan() {
  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<MealAnalysis | null>(null);
  const [name, setName] = useState("");
  const [mealType, setMealType] = useState<MealType>("lunch");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setState("preview");
    };
    reader.onerror = () => setError("Failed to read the selected image.");
    reader.readAsDataURL(file);
    input.value = "";
  };

  const analyze = async () => {
    if (!image) return;
    setState("analyzing");
    setError("");
    try {
      const res = await fetch(image);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append("image", blob, "meal.jpg");

      const analyzeRes = await fetch("/api/analyze-meal", {
        method: "POST",
        body: formData,
      });
      const data = await analyzeRes.json();
      if (!analyzeRes.ok) {
        // Surface paywall / fair-use messages directly.
        throw new Error(data.error || "Meal analysis failed");
      }
      setResult(data as MealAnalysis);
      const defaultName = data.items?.[0]?.name
        ? `${data.items[0].name}${
          data.items.length > 1 ? ` +${data.items.length - 1} more` : ""
        }`
        : "Meal";
      setName(defaultName);
      trackEvent("Scan_Meal");
      setState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Meal analysis failed.");
      setState("preview");
    }
  };

  const saveToLog = async () => {
    if (!result) return;
    if (!name.trim()) {
      setError("Please enter a name for this meal");
      return;
    }
    setState("saving");
    setError("");
    try {
      const t: NutritionData = result.total;
      const foodRes = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          servingSizeValue: n(t.servingSize) || 1,
          servingSizeUnit: "serving",
          calories: n(t.calories),
          totalFat: n(t.totalFat),
          carbohydrates: n(t.carbohydrates),
          fiber: n(t.fiber),
          sugars: n(t.sugars),
          protein: n(t.protein),
          sodium: n(t.sodium),
          source: "meal_scan",
        }),
      });
      const food = await foodRes.json();
      if (!foodRes.ok) throw new Error(food.error || "Failed to save meal");

      const logRes = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nutritionRecordId: food.id,
          servings: 1,
          mealType,
        }),
      });
      if (!logRes.ok) {
        const logErr = await logRes.json().catch(() => ({}));
        throw new Error(logErr.error || "Failed to log meal");
      }

      trackEvent("Log_Meal");
      globalThis.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save meal");
      setState("results");
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setName("");
    setError("");
    setState("idle");
  };

  return (
    <div class="space-y-6">
      <ErrorAlert error={error} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        class="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        class="hidden"
      />

      {state === "idle" && (
        <div class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p class="mt-4 text-gray-600">
            Snap a photo of your plate to estimate its macros
          </p>
          <div class="mt-4 flex justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => cameraInputRef.current?.click()}
            >
              Take Photo
            </Button>
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Image
            </Button>
          </div>
        </div>
      )}

      {state === "preview" && image && (
        <div class="space-y-4">
          <div class="bg-gray-100 rounded-lg overflow-hidden">
            <img src={image} alt="Meal" class="w-full" />
          </div>
          <div class="flex justify-center gap-4">
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Retake
            </Button>
            <Button variant="primary" onClick={analyze}>Estimate Macros</Button>
          </div>
        </div>
      )}

      {state === "analyzing" && (
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto">
          </div>
          <p class="mt-4 text-gray-600">
            Identifying foods and estimating macros...
          </p>
          <p class="text-sm text-gray-500">This may take a moment</p>
        </div>
      )}

      {(state === "results" || state === "saving") && result && (
        <div class="space-y-6">
          <Card>
            <h3 class="text-lg font-semibold text-gray-900 mb-1">
              Estimated meal
            </h3>
            <p class="text-xs text-gray-500 mb-4">
              AI estimates from the photo — adjust the name and meal below.
            </p>
            <ul class="divide-y divide-gray-100">
              {result.items.map((item, i) => (
                <li
                  key={i}
                  class="py-2 flex items-center justify-between text-sm"
                >
                  <span class="text-gray-800">{item.name}</span>
                  <span class="text-gray-500">
                    {Math.round(n(item.calories))} kcal ·{" "}
                    {Math.round(n(item.protein))}P /{" "}
                    {Math.round(n(item.carbohydrates))}C /{" "}
                    {Math.round(n(item.totalFat))}F
                  </span>
                </li>
              ))}
            </ul>
            <div class="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-sm font-semibold text-gray-900">
              <span>Total</span>
              <span>
                {Math.round(n(result.total.calories))} kcal ·{" "}
                {Math.round(n(result.total.protein))}P /{" "}
                {Math.round(n(result.total.carbohydrates))}C /{" "}
                {Math.round(n(result.total.totalFat))}F
              </span>
            </div>
          </Card>

          <Card class="space-y-4">
            <div>
              <label
                htmlFor="mealName"
                class="block text-sm font-medium text-gray-700"
              >
                Meal Name *
              </label>
              <input
                id="mealName"
                type="text"
                value={name}
                onInput={(e) => setName((e.target as HTMLInputElement).value)}
                class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Chicken & rice bowl"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Meal
              </label>
              <SelectInput
                value={mealType}
                onChange={(e) =>
                  setMealType(
                    (e.target as HTMLSelectElement).value as MealType,
                  )}
                options={MEAL_TYPES.map((m) => ({
                  value: m,
                  label: m.charAt(0).toUpperCase() + m.slice(1),
                }))}
              />
            </div>
            <div class="flex gap-4">
              <Button variant="secondary" onClick={reset} class="flex-1">
                Start Over
              </Button>
              <Button
                variant="primary"
                onClick={saveToLog}
                loading={state === "saving"}
                disabled={state === "saving" || !name.trim()}
                class="flex-1"
              >
                {state === "saving" ? "Saving..." : "Add to Log"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
