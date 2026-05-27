type SourceLabel = "USDA" | "Community" | "Open Food Facts" | "Recipe" | "OFF";

const COLOR_MAP: Record<SourceLabel, string> = {
  "USDA": "bg-green-100 text-green-700",
  "Community": "bg-purple-100 text-purple-700",
  "Open Food Facts": "bg-orange-100 text-orange-700",
  "OFF": "bg-orange-100 text-orange-700",
  "Recipe": "bg-indigo-100 text-indigo-700",
};

interface SourceBadgeProps {
  label: SourceLabel;
  shrink?: boolean;
}

export default function SourceBadge({ label, shrink }: SourceBadgeProps) {
  return (
    <span
      class={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${COLOR_MAP[label]}${shrink ? " flex-shrink-0" : ""}`}
    >
      {label}
    </span>
  );
}
