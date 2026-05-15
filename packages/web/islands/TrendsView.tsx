import { useState, useEffect, useRef } from "preact/hooks";
import type { WeightLogEntry, TrendsData } from "@nutrition-llama/shared";

type Period = "week" | "month" | "3month";
type WeightUnit = "kg" | "lbs";

const KG_TO_LBS = 2.20462;

const periodLabels: Record<Period, string> = {
  week: "7 Days",
  month: "30 Days",
  "3month": "90 Days",
};

// --- Sub-components ---

function PeriodSelector({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  return (
    <div class="flex gap-2 p-1 bg-gray-100 rounded-lg max-w-md">
      {(["week", "month", "3month"] as Period[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          class={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-all ${
            period === p
              ? "bg-white text-primary-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {periodLabels[p]}
        </button>
      ))}
    </div>
  );
}

function StreakDisplay({ currentStreak, longestStreak }: { currentStreak: number; longestStreak: number }) {
  return (
    <div class="grid grid-cols-2 gap-4 max-w-md">
      <div class="bg-white shadow rounded-lg p-5 text-center">
        <p class="text-3xl font-bold text-primary-600">{currentStreak}</p>
        <p class="text-sm text-gray-500 mt-1">Current Streak</p>
        <p class="text-xs text-gray-400">consecutive days</p>
      </div>
      <div class="bg-white shadow rounded-lg p-5 text-center">
        <p class="text-3xl font-bold text-yellow-500">{longestStreak}</p>
        <p class="text-sm text-gray-500 mt-1">Longest Streak</p>
        <p class="text-xs text-gray-400">consecutive days</p>
      </div>
    </div>
  );
}

function CalorieChart({ calorieTrend, loading }: { calorieTrend: TrendsData["calorieTrend"]; loading: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { Chart } = await import("https://esm.sh/chart.js@4.4.7/auto");
      if (cancelled || !canvasRef.current) return;

      if (chartInstance.current) {
        (chartInstance.current as { destroy: () => void }).destroy();
      }

      const labels = calorieTrend.map((e) => {
        const d = new Date(e.date + "T00:00:00");
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      });

      chartInstance.current = new Chart(canvasRef.current, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Calories",
              data: calorieTrend.map((e) => e.totalCalories),
              backgroundColor: "rgba(16, 185, 129, 0.7)",
              borderColor: "#10b981",
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, title: { display: true, text: "kcal" } } },
        },
      });
    })();

    return () => {
      cancelled = true;
      if (chartInstance.current) {
        (chartInstance.current as { destroy: () => void }).destroy();
        chartInstance.current = null;
      }
    };
  }, [calorieTrend]);

  return (
    <div class="bg-white shadow rounded-lg p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Daily Calories</h2>
      {loading ? (
        <div class="h-64 flex items-center justify-center text-gray-400">Loading...</div>
      ) : calorieTrend.length === 0 ? (
        <div class="h-64 flex items-center justify-center text-gray-400">
          No calorie data for this period. Log some food to see trends.
        </div>
      ) : (
        <div class="h-64">
          <canvas ref={canvasRef} />
        </div>
      )}
    </div>
  );
}

function WeightChart({
  weightLog,
  weightUnit,
  loading,
  onUnitChange,
}: {
  weightLog: WeightLogEntry[];
  weightUnit: WeightUnit;
  loading: boolean;
  onUnitChange: (u: WeightUnit) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { Chart } = await import("https://esm.sh/chart.js@4.4.7/auto");
      if (cancelled || !canvasRef.current) return;

      if (chartInstance.current) {
        (chartInstance.current as { destroy: () => void }).destroy();
      }

      const labels = weightLog.map((e) => {
        const d = new Date(e.loggedDate + "T00:00:00");
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      });
      const data = weightLog.map((e) =>
        weightUnit === "lbs" ? +(e.weightKg * KG_TO_LBS).toFixed(1) : e.weightKg
      );

      chartInstance.current = new Chart(canvasRef.current, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: `Weight (${weightUnit})`,
              data,
              borderColor: "#7c3aed",
              backgroundColor: "rgba(124, 58, 237, 0.1)",
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: false, title: { display: true, text: weightUnit } } },
        },
      });
    })();

    return () => {
      cancelled = true;
      if (chartInstance.current) {
        (chartInstance.current as { destroy: () => void }).destroy();
        chartInstance.current = null;
      }
    };
  }, [weightLog, weightUnit]);

  return (
    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Weight</h2>
        <select
          value={weightUnit}
          onChange={(e) => onUnitChange((e.target as HTMLSelectElement).value as WeightUnit)}
          class="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="lbs">lbs</option>
          <option value="kg">kg</option>
        </select>
      </div>
      {loading ? (
        <div class="h-64 flex items-center justify-center text-gray-400">Loading...</div>
      ) : weightLog.length === 0 ? (
        <div class="h-64 flex items-center justify-center text-gray-400">
          No weight data. Add an entry below to start tracking.
        </div>
      ) : (
        <div class="h-64">
          <canvas ref={canvasRef} />
        </div>
      )}
    </div>
  );
}

function WeightEntryForm({
  weightUnit,
  onUnitChange,
  onSave,
}: {
  weightUnit: WeightUnit;
  onUnitChange: (u: WeightUnit) => void;
  onSave: (weightKg: number, bodyFatPct: number | undefined, loggedDate: string) => Promise<void>;
}) {
  const [weightValue, setWeightValue] = useState("");
  const [bodyFatPct, setBodyFatPct] = useState("");
  const [loggedDate, setLoggedDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const val = parseFloat(weightValue);
    if (!val || val <= 0) {
      setError("Please enter a valid weight");
      return;
    }

    const weightKg = weightUnit === "lbs" ? val / KG_TO_LBS : val;
    const bfp = bodyFatPct ? parseFloat(bodyFatPct) : undefined;

    if (bfp !== undefined && (bfp <= 0 || bfp >= 100)) {
      setError("Body fat % must be between 0 and 100");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave(weightKg, bfp, loggedDate);
      setWeightValue("");
      setBodyFatPct("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save weight");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="bg-white shadow rounded-lg p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Log Weight</h2>

      {error && (
        <div class="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
          <p class="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={loggedDate}
              onInput={(e) => setLoggedDate((e.target as HTMLInputElement).value)}
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Weight</label>
            <div class="mt-1 flex gap-2">
              <input
                type="number"
                step="0.1"
                min="0"
                value={weightValue}
                onInput={(e) => setWeightValue((e.target as HTMLInputElement).value)}
                placeholder={weightUnit === "lbs" ? "150" : "68"}
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <select
                value={weightUnit}
                onChange={(e) => onUnitChange((e.target as HTMLSelectElement).value as WeightUnit)}
                class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Body Fat % (optional)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={bodyFatPct}
              onInput={(e) => setBodyFatPct((e.target as HTMLInputElement).value)}
              placeholder="15"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          class="px-6 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {saving ? "Saving..." : "Log Weight"}
        </button>
      </div>
    </div>
  );
}

function WeightHistoryTable({
  weightLog,
  weightUnit,
  onDelete,
}: {
  weightLog: WeightLogEntry[];
  weightUnit: WeightUnit;
  onDelete: (id: string) => void;
}) {
  if (weightLog.length === 0) return null;

  return (
    <div class="bg-white shadow rounded-lg p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Weight History</h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Body Fat %</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {[...weightLog].reverse().map((entry) => (
              <tr key={entry.id}>
                <td class="px-4 py-3 text-sm text-gray-900">
                  {new Date(entry.loggedDate + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td class="px-4 py-3 text-sm text-gray-900">
                  {weightUnit === "lbs"
                    ? (entry.weightKg * KG_TO_LBS).toFixed(1) + " lbs"
                    : entry.weightKg.toFixed(1) + " kg"}
                </td>
                <td class="px-4 py-3 text-sm text-gray-500">
                  {entry.bodyFatPct != null ? entry.bodyFatPct + "%" : "-"}
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(entry.id)}
                    class="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Main island ---

interface TrendsViewProps {
  initialWeightLog: WeightLogEntry[];
  initialTrends: TrendsData;
}

export default function TrendsView({ initialWeightLog, initialTrends }: TrendsViewProps) {
  const [period, setPeriod] = useState<Period>("month");
  const [weightLog, setWeightLog] = useState(initialWeightLog);
  const [trends, setTrends] = useState(initialTrends);
  const [loading, setLoading] = useState(false);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lbs");

  const fetchData = async (p: Period) => {
    setLoading(true);
    try {
      const now = new Date();
      const endDate = now.toISOString().split("T")[0];
      const daysBack = p === "week" ? 7 : p === "month" ? 30 : 90;
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const [weightRes, trendsRes] = await Promise.all([
        fetch(`/api/weight?start=${startDate}&end=${endDate}`),
        fetch(`/api/trends?period=${p}`),
      ]);

      if (weightRes.ok) setWeightLog(await weightRes.json());
      if (trendsRes.ok) setTrends(await trendsRes.json());
    } catch (err) {
      console.error("Failed to fetch trends:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    fetchData(p);
  };

  const handleSaveWeight = async (weightKg: number, bodyFatPct: number | undefined, loggedDate: string) => {
    const res = await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightKg, bodyFatPct, loggedDate }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to save");
    }

    fetchData(period);
  };

  const handleDeleteWeight = async (id: string) => {
    try {
      const res = await fetch(`/api/weight?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData(period);
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  return (
    <div class="space-y-8">
      <PeriodSelector period={period} onChange={handlePeriodChange} />
      <StreakDisplay currentStreak={trends.currentStreak} longestStreak={trends.longestStreak} />
      <CalorieChart calorieTrend={trends.calorieTrend} loading={loading} />
      <WeightChart
        weightLog={weightLog}
        weightUnit={weightUnit}
        loading={loading}
        onUnitChange={setWeightUnit}
      />
      <WeightEntryForm
        weightUnit={weightUnit}
        onUnitChange={setWeightUnit}
        onSave={handleSaveWeight}
      />
      <WeightHistoryTable
        weightLog={weightLog}
        weightUnit={weightUnit}
        onDelete={handleDeleteWeight}
      />
    </div>
  );
}
