import { useEffect } from "preact/hooks";
import { trackEvent } from "../utils/analytics.ts";

interface TrackEventProps {
  event: string;
  props?: Record<string, string | number | boolean>;
}

/**
 * Zero-render island that fires a single Plausible funnel event on mount.
 * No-op when Plausible isn't configured.
 */
export default function TrackEvent({ event, props }: TrackEventProps) {
  useEffect(() => {
    trackEvent(event, props);
    // Fire once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
