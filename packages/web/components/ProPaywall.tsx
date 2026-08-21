import { Card } from "./ui/index.ts";
import TrackEvent from "../islands/TrackEvent.tsx";

interface ProPaywallProps {
  title?: string;
  message: string;
  /** Optional CTA label; defaults to "Upgrade to Pro". */
  cta?: string;
  /** Funnel label for the paywall that was hit. */
  feature?: string;
}

/**
 * Soft paywall: shown in place of a Pro-only surface for free users. Never
 * hides the app chrome — it explains the value and links to /account.
 */
export default function ProPaywall(
  {
    title = "A Macroscope Pro feature",
    message,
    cta = "Upgrade to Pro",
    feature,
  }: ProPaywallProps,
) {
  return (
    <Card>
      <TrackEvent
        event="hit_paywall"
        props={feature ? { feature } : undefined}
      />
      <div class="text-center py-6">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 mb-3">
          PRO
        </span>
        <h3 class="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p class="text-sm text-gray-600 max-w-md mx-auto mb-5">{message}</p>
        <a
          href="/account"
          class="inline-flex items-center justify-center gap-2 font-medium rounded-md px-6 py-3 text-base bg-primary-600 hover:bg-primary-700 text-white transition-colors"
        >
          {cta}
        </a>
      </div>
    </Card>
  );
}
