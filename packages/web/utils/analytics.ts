type PlausibleFn = (
  event: string,
  options?: { props?: Record<string, string | number | boolean> },
) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

export function trackEvent(
  name: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;
  const plausible = (window as Window & { plausible?: PlausibleFn }).plausible;
  if (plausible) {
    plausible(name, props ? { props } : undefined);
  }
}
