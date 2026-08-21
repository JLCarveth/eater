import { useState } from "preact/hooks";
import { Button, Card } from "../components/ui/index.ts";
import { trackEvent } from "../utils/analytics.ts";

interface CoachResponse {
  suggestions?: string[];
  message?: string;
  needsGoals?: boolean;
  error?: string;
  upgradeUrl?: string;
}

export default function CoachCard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CoachResponse | null>(null);
  const [error, setError] = useState("");

  const ask = async () => {
    setLoading(true);
    setError("");
    trackEvent("Coach_Ask");
    try {
      const res = await fetch("/api/coach");
      const body: CoachResponse = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not get suggestions");
      setData(body);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not get suggestions",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card class="mb-8">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            What should I eat?
          </h2>
          <p class="text-sm text-gray-500">
            AI suggestions to hit your remaining macros.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={ask}
          loading={loading}
          disabled={loading}
        >
          {data ? "Refresh" : "Ask coach"}
        </Button>
      </div>

      {error && <p class="text-sm text-red-600">{error}</p>}

      {data?.needsGoals && (
        <p class="text-sm text-gray-600">
          <a
            href="/goals"
            class="text-primary-600 hover:text-primary-700 font-medium"
          >
            Set your goals
          </a>{" "}
          to get personalized suggestions.
        </p>
      )}

      {data?.message && !data.needsGoals && (
        <p class="text-sm text-gray-700">{data.message}</p>
      )}

      {data?.suggestions && data.suggestions.length > 0 && (
        <ul class="space-y-2 mt-2">
          {data.suggestions.map((s, i) => (
            <li key={i} class="flex items-start gap-2 text-sm text-gray-800">
              <span class="text-primary-600 mt-0.5">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
