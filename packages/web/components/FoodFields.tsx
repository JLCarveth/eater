import { Button, Card, SelectInput } from "./ui/index.ts";

interface FoodFieldsProps {
  name: string;
  setName: (v: string) => void;
  servingSizeValue: string;
  setServingSizeValue: (v: string) => void;
  servingSizeUnit: "g" | "ml";
  setServingSizeUnit: (v: "g" | "ml") => void;
  upcCode: string;
  setUpcCode: (v: string) => void;
  calories: string;
  setCalories: (v: string) => void;
  protein: string;
  setProtein: (v: string) => void;
  carbohydrates: string;
  setCarbohydrates: (v: string) => void;
  totalFat: string;
  setTotalFat: (v: string) => void;
  fiber: string;
  setFiber: (v: string) => void;
  sugars: string;
  setSugars: (v: string) => void;
  sodium: string;
  setSodium: (v: string) => void;
  cholesterol: string;
  setCholesterol: (v: string) => void;
  onScanClick?: () => void;
}

const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";

export default function FoodFields({
  name, setName,
  servingSizeValue, setServingSizeValue,
  servingSizeUnit, setServingSizeUnit,
  upcCode, setUpcCode,
  calories, setCalories,
  protein, setProtein,
  carbohydrates, setCarbohydrates,
  totalFat, setTotalFat,
  fiber, setFiber,
  sugars, setSugars,
  sodium, setSodium,
  cholesterol, setCholesterol,
  onScanClick,
}: FoodFieldsProps) {
  return (
    <>
      <Card class="space-y-4">
        <h3 class="text-lg font-medium text-gray-900">Basic Info</h3>

        <div>
          <label class="block text-sm font-medium text-gray-700">Food Name *</label>
          <input
            type="text"
            required
            value={name}
            onInput={(e) => setName((e.target as HTMLInputElement).value)}
            class={inputClass}
            placeholder={onScanClick ? "e.g., Chicken Breast, Oatmeal" : undefined}
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Serving Size *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0.01"
              value={servingSizeValue}
              onInput={(e) => setServingSizeValue((e.target as HTMLInputElement).value)}
              class={inputClass}
            />
          </div>
          <SelectInput
            label="Unit *"
            value={servingSizeUnit}
            onChange={(e) => setServingSizeUnit((e.target as HTMLSelectElement).value as "g" | "ml")}
            options={[
              { value: "g", label: "grams (g)" },
              { value: "ml", label: "milliliters (ml)" },
            ]}
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">UPC Code (optional)</label>
          {onScanClick ? (
            <div class="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                value={upcCode}
                onInput={(e) => setUpcCode((e.target as HTMLInputElement).value)}
                class="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Barcode number"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={onScanClick}
                class="rounded-l-none border-l-0"
                title="Scan barcode"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </Button>
            </div>
          ) : (
            <input
              type="text"
              value={upcCode}
              onInput={(e) => setUpcCode((e.target as HTMLInputElement).value)}
              class={inputClass}
              placeholder="Barcode number"
            />
          )}
        </div>
      </Card>

      <Card class="space-y-4">
        <h3 class="text-lg font-medium text-gray-900">Nutrition Facts</h3>

        <div>
          <label class="block text-sm font-medium text-gray-700">Calories *</label>
          <input
            type="number"
            required
            step="0.1"
            min="0"
            value={calories}
            onInput={(e) => setCalories((e.target as HTMLInputElement).value)}
            class={inputClass}
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Protein (g)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={protein}
              onInput={(e) => setProtein((e.target as HTMLInputElement).value)}
              class={inputClass}
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Carbohydrates (g)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={carbohydrates}
              onInput={(e) => setCarbohydrates((e.target as HTMLInputElement).value)}
              class={inputClass}
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Total Fat (g)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={totalFat}
              onInput={(e) => setTotalFat((e.target as HTMLInputElement).value)}
              class={inputClass}
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Fiber (g)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={fiber}
              onInput={(e) => setFiber((e.target as HTMLInputElement).value)}
              class={inputClass}
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Sugars (g)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={sugars}
              onInput={(e) => setSugars((e.target as HTMLInputElement).value)}
              class={inputClass}
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Sodium (mg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={sodium}
              onInput={(e) => setSodium((e.target as HTMLInputElement).value)}
              class={inputClass}
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Cholesterol (mg)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={cholesterol}
            onInput={(e) => setCholesterol((e.target as HTMLInputElement).value)}
            class={inputClass}
          />
        </div>
      </Card>
    </>
  );
}
