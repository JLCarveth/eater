import { useState, useEffect, useCallback, useRef } from "preact/hooks";
import type { NutritionRecord, NutritionRecordWithSource } from "@nutrition-llama/shared";
import type { OffSearchResult } from "../utils/openfoodfacts.ts";
import FoodResultRow from "../components/FoodResultRow.tsx";
import SourceBadge from "../components/SourceBadge.tsx";
import { Alert, Button } from "../components/ui/index.ts";

type Tab = "user" | "system" | "community" | "off";

interface FoodBrowserProps {
  initialFoods: NutritionRecord[];
}

export default function FoodBrowser({ initialFoods }: FoodBrowserProps) {
  const [tab, setTab] = useState<Tab>("user");
  const [searchQuery, setSearchQuery] = useState("");

  const [systemResults, setSystemResults] = useState<NutritionRecordWithSource[]>([]);
  const [systemLoading, setSystemLoading] = useState(false);
  const [systemCount, setSystemCount] = useState(0);

  const [communityResults, setCommunityResults] = useState<NutritionRecordWithSource[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityCount, setCommunityCount] = useState(0);

  const [offResults, setOffResults] = useState<OffSearchResult[]>([]);
  const [offLoading, setOffLoading] = useState(false);
  const [savingBarcode, setSavingBarcode] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const debounceRef = useRef<number | null>(null);

  // Filter user foods client-side
  const filteredUserFoods = searchQuery
    ? initialFoods.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : initialFoods;

  const searchSystemFoods = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSystemResults([]);
      return;
    }
    setSystemLoading(true);
    try {
      const params = new URLSearchParams({ q, source: "system", limit: "30" });
      const response = await fetch(`/api/foods/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSystemResults(data.results);
        setSystemCount(data.counts.system);
      }
    } catch (err) {
      console.error("System food search error:", err);
    } finally {
      setSystemLoading(false);
    }
  }, []);

  const searchCommunityFoods = useCallback(async (q: string) => {
    if (q.length < 2) {
      setCommunityResults([]);
      return;
    }
    setCommunityLoading(true);
    try {
      const params = new URLSearchParams({ q, source: "community", limit: "30" });
      const response = await fetch(`/api/foods/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCommunityResults(data.results);
        setCommunityCount(data.counts.community);
      }
    } catch (err) {
      console.error("Community food search error:", err);
    } finally {
      setCommunityLoading(false);
    }
  }, []);

  const searchOffFoods = useCallback(async (q: string) => {
    if (q.length < 2) {
      setOffResults([]);
      return;
    }
    setOffLoading(true);
    try {
      const params = new URLSearchParams({ q, limit: "20" });
      const response = await fetch(`/api/foods/off-search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOffResults(data.results);
      }
    } catch (err) {
      console.error("OFF search error:", err);
    } finally {
      setOffLoading(false);
    }
  }, []);

  // Debounced search for system tab
  useEffect(() => {
    if (tab !== "system") return;
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchSystemFoods(searchQuery);
    }, 300) as unknown as number;
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, tab, searchSystemFoods]);

  // Debounced search for community tab
  useEffect(() => {
    if (tab !== "community") return;
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchCommunityFoods(searchQuery);
    }, 300) as unknown as number;
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, tab, searchCommunityFoods]);

  // Debounced search for OFF tab
  useEffect(() => {
    if (tab !== "off") return;
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchOffFoods(searchQuery);
    }, 300) as unknown as number;
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, tab, searchOffFoods]);

  // Fetch system and community counts on mount
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams({ q: "", source: "system", limit: "1" });
        const response = await fetch(`/api/foods/search?${params}`);
        if (response.ok) {
          const data = await response.json();
          setSystemCount(data.counts.system);
          setCommunityCount(data.counts.community);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const saveOffFood = useCallback(async (result: OffSearchResult) => {
    setSavingBarcode(result.barcode);
    setSaveError(null);
    try {
      const response = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.food),
      });
      if (!response.ok) {
        const data = await response.json();
        setSaveError(data.error || "Failed to save food");
        return;
      }
      const saved = await response.json();
      globalThis.location.href = `/foods/${saved.id}`;
    } catch (err) {
      console.error("Save OFF food error:", err);
      setSaveError("Failed to save food");
    } finally {
      setSavingBarcode(null);
    }
  }, []);

  const saveCommunityFood = useCallback(async (food: NutritionRecordWithSource) => {
    setSaveError(null);
    try {
      const response = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // POST handler reads only the fields it needs; extra fields like id/userId are ignored
        body: JSON.stringify({ ...food, source: "manual" }),
      });
      if (!response.ok) {
        const data = await response.json();
        setSaveError(data.error || "Failed to save food");
        return;
      }
      const saved = await response.json();
      globalThis.location.href = `/foods/${saved.id}`;
    } catch (err) {
      console.error("Save community food error:", err);
      setSaveError("Failed to save food");
    }
  }, []);

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
      tab === t
        ? "border-primary-600 text-primary-600 bg-white"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`;

  const placeholder: Record<Tab, string> = {
    user: "Filter your foods...",
    system: "Type to search USDA foods...",
    community: "Type to search community foods...",
    off: "Search Open Food Facts (e.g. 'Oreos', 'Big Mac')...",
  };

  return (
    <div>
      {/* Tabs */}
      <div class="flex gap-1 border-b border-gray-200 mb-4 flex-wrap">
        <Button variant="bare" type="button" onClick={() => setTab("user")} class={tabClass("user")}>
          My Foods ({initialFoods.length})
        </Button>
        <Button variant="bare" type="button" onClick={() => setTab("system")} class={tabClass("system")}>
          USDA Foods{systemCount > 0 ? ` (${systemCount})` : ""}
        </Button>
        <Button variant="bare" type="button" onClick={() => setTab("community")} class={tabClass("community")}>
          Community{communityCount > 0 ? ` (${communityCount})` : ""}
        </Button>
        <Button variant="bare" type="button" onClick={() => setTab("off")} class={tabClass("off")}>
          Open Food Facts
        </Button>
      </div>

      {/* Search */}
      <div class="mb-4">
        <input
          type="text"
          value={searchQuery}
          onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
          placeholder={placeholder[tab]}
          class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
        />
      </div>

      {saveError && <Alert variant="error" message={saveError} onDismiss={() => setSaveError(null)} />}

      {/* Results */}
      {tab === "user" ? (
        filteredUserFoods.length > 0 ? (
          <div class="bg-white shadow rounded-lg overflow-hidden">
            <ul class="divide-y divide-gray-200">
              {filteredUserFoods.map((food) => (
                <li key={food.id}>
                  <FoodResultRow
                    name={food.name}
                    calories={food.calories}
                    protein={food.protein}
                    carbohydrates={food.carbohydrates}
                    totalFat={food.totalFat}
                    servingSizeValue={food.servingSizeValue}
                    servingSizeUnit={food.servingSizeUnit}
                    upcCode={food.upcCode}
                    href={`/foods/${food.id}`}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
            {searchQuery ? "No matching foods found" : "No foods saved yet"}
          </div>
        )
      ) : tab === "system" ? (
        /* System / USDA tab */
        <>
          {searchQuery.length < 2 ? (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              Type at least 2 characters to search USDA Foundation Foods
            </div>
          ) : systemLoading ? (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              Searching...
            </div>
          ) : systemResults.length > 0 ? (
            <div class="bg-white shadow rounded-lg overflow-hidden">
              <ul class="divide-y divide-gray-200">
                {systemResults.map((food) => (
                  <li key={food.id}>
                    <FoodResultRow
                      name={food.name}
                      calories={food.calories}
                      protein={food.protein}
                      carbohydrates={food.carbohydrates}
                      totalFat={food.totalFat}
                      servingSizeValue={food.servingSizeValue}
                      servingSizeUnit={food.servingSizeUnit}
                      badge={<SourceBadge label="USDA" />}
                      href={`/foods/${food.id}`}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              No USDA foods found for "{searchQuery}"
            </div>
          )}
        </>
      ) : tab === "community" ? (
        /* Community tab */
        <>
          {searchQuery.length < 2 ? (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              Type at least 2 characters to search community foods
            </div>
          ) : communityLoading ? (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              Searching...
            </div>
          ) : communityResults.length > 0 ? (
            <div class="bg-white shadow rounded-lg overflow-hidden">
              <ul class="divide-y divide-gray-200">
                {communityResults.map((food) => (
                  <li key={food.id}>
                    <FoodResultRow
                      name={food.name}
                      calories={food.calories}
                      protein={food.protein}
                      carbohydrates={food.carbohydrates}
                      totalFat={food.totalFat}
                      servingSizeValue={food.servingSizeValue}
                      servingSizeUnit={food.servingSizeUnit}
                      upcCode={food.upcCode}
                      badge={<SourceBadge label="Community" />}
                      onClick={() => saveCommunityFood(food)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              No community foods found for "{searchQuery}"
            </div>
          )}
        </>
      ) : (
        /* Open Food Facts tab */
        <>
          {searchQuery.length < 2 ? (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              Type at least 2 characters to search Open Food Facts
            </div>
          ) : offLoading ? (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              Searching...
            </div>
          ) : offResults.length > 0 ? (
            <div class="bg-white shadow rounded-lg overflow-hidden">
              <ul class="divide-y divide-gray-200">
                {offResults.map((result) => (
                  <li key={result.barcode}>
                    <FoodResultRow
                      name={result.productName}
                      calories={result.food.calories}
                      protein={result.food.protein}
                      carbohydrates={result.food.carbohydrates}
                      totalFat={result.food.totalFat}
                      servingSizeValue={result.food.servingSizeValue}
                      servingSizeUnit={result.food.servingSizeUnit}
                      upcCode={result.barcode}
                      badge={<SourceBadge label="Open Food Facts" />}
                      action={
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => saveOffFood(result)}
                          loading={savingBarcode === result.barcode}
                          disabled={savingBarcode === result.barcode}
                        >
                          {savingBarcode === result.barcode ? "Saving..." : "Save"}
                        </Button>
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div class="bg-white shadow rounded-lg p-8 text-center text-gray-500">
              No results found for "{searchQuery}"
            </div>
          )}
        </>
      )}
    </div>
  );
}
