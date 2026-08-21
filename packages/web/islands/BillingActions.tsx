import { useState } from "preact/hooks";
import { Button } from "../components/ui/index.ts";
import ErrorAlert from "../components/ErrorAlert.tsx";
import { trackEvent } from "../utils/analytics.ts";

interface BillingActionsProps {
  isPro: boolean;
}

export default function BillingActions({ isPro }: BillingActionsProps) {
  const [loading, setLoading] = useState<
    "monthly" | "annual" | "portal" | null
  >(null);
  const [error, setError] = useState("");

  const startCheckout = async (interval: "monthly" | "annual") => {
    setLoading(interval);
    setError("");
    trackEvent("start_checkout", { interval });
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Checkout failed");
      }
      globalThis.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(null);
    }
  };

  const openPortal = async () => {
    setLoading("portal");
    setError("");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not open billing portal");
      }
      globalThis.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not open billing portal",
      );
      setLoading(null);
    }
  };

  if (isPro) {
    return (
      <div class="space-y-4">
        <ErrorAlert error={error} />
        <Button
          variant="secondary"
          onClick={openPortal}
          loading={loading === "portal"}
          disabled={loading !== null}
        >
          Manage billing
        </Button>
      </div>
    );
  }

  return (
    <div class="space-y-4">
      <ErrorAlert error={error} />
      <div class="flex flex-col sm:flex-row gap-3">
        <Button
          variant="primary"
          size="lg"
          onClick={() => startCheckout("annual")}
          loading={loading === "annual"}
          disabled={loading !== null}
          class="flex-1"
        >
          Go Pro — $24/year
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => startCheckout("monthly")}
          loading={loading === "monthly"}
          disabled={loading !== null}
          class="flex-1"
        >
          $3.99/month
        </Button>
      </div>
      <p class="text-xs text-gray-500">
        Annual saves ~50%. Cancel anytime from the billing portal.
      </p>
    </div>
  );
}
