type Variant = "minimal" | "flat" | "card";
type Size = "sm" | "md" | "lg";
type Cols = "4" | "2md4" | "2sm4";

export interface MacroSummaryGridProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  variant?: Variant;
  size?: Size;
  cols?: Cols;
  gap?: "3" | "4";
  class?: string;
}

const COLS_MAP: Record<Cols, string> = {
  "4": "grid-cols-4",
  "2md4": "grid-cols-2 md:grid-cols-4",
  "2sm4": "grid-cols-2 sm:grid-cols-4",
};

const GAP_MAP: Record<string, string> = { "3": "gap-3", "4": "gap-4" };

const VALUE_SIZE: Record<Size, string> = {
  sm: "text-xl font-bold",
  md: "text-2xl font-bold",
  lg: "text-3xl font-bold",
};

const LABEL_SIZE: Record<Size, string> = {
  sm: "text-xs",
  md: "text-xs",
  lg: "text-sm",
};

const PADDING: Record<Size, string> = { sm: "p-2", md: "p-3", lg: "p-5" };

interface MacroConfig {
  label: string;
  unit: string;
  flatBg: string;
  valueColor: string;
  cardBg: string;
  border: string;
  cardLabelColor: string;
  iconColor: string;
  iconPath: string;
}

const MACROS = {
  calories: {
    label: "Calories",
    unit: "",
    flatBg: "bg-gray-50",
    valueColor: "text-gray-900",
    cardBg: "bg-white",
    border: "border-gray-200",
    cardLabelColor: "text-gray-600",
    iconColor: "text-gray-400",
    iconPath: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  protein: {
    label: "Protein",
    unit: "g",
    flatBg: "bg-red-50",
    valueColor: "text-red-600",
    cardBg: "bg-gradient-to-br from-red-50 to-red-100",
    border: "border-red-200",
    cardLabelColor: "text-red-700",
    iconColor: "text-red-500",
    iconPath:
      "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z",
  },
  carbs: {
    label: "Carbs",
    unit: "g",
    flatBg: "bg-yellow-50",
    valueColor: "text-yellow-600",
    cardBg: "bg-gradient-to-br from-yellow-50 to-yellow-100",
    border: "border-yellow-200",
    cardLabelColor: "text-yellow-700",
    iconColor: "text-yellow-500",
    iconPath:
      "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  },
  fat: {
    label: "Fat",
    unit: "g",
    flatBg: "bg-blue-50",
    valueColor: "text-blue-600",
    cardBg: "bg-gradient-to-br from-blue-50 to-blue-100",
    border: "border-blue-200",
    cardLabelColor: "text-blue-700",
    iconColor: "text-blue-500",
    iconPath:
      "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
} satisfies Record<string, MacroConfig>;

type MacroKey = keyof typeof MACROS;

export interface MacroStatCardProps {
  macro: MacroKey;
  value: number;
  variant?: Variant;
  size?: Size;
}

export function MacroStatCard({
  macro,
  value,
  variant = "flat",
  size = "md",
}: MacroStatCardProps) {
  const cfg = MACROS[macro];
  const display = `${Math.round(value ?? 0)}${cfg.unit}`;
  const valCls = `${VALUE_SIZE[size]} ${cfg.valueColor}`;
  const labelCls = `${LABEL_SIZE[size]} text-gray-500`;

  if (variant === "minimal") {
    return (
      <div class="text-center">
        <p class={valCls}>{display}</p>
        <p class={labelCls}>{cfg.label}</p>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        class={`${cfg.cardBg} shadow-sm rounded-lg ${PADDING[size]} border ${cfg.border} hover:shadow-md transition-shadow`}
      >
        <div class="flex items-center justify-between mb-2">
          <p class={`text-sm font-medium ${cfg.cardLabelColor}`}>{cfg.label}</p>
          <svg
            class={`h-5 w-5 ${cfg.iconColor}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d={cfg.iconPath}
            />
          </svg>
        </div>
        <p class={valCls}>{display}</p>
      </div>
    );
  }

  return (
    <div class={`${cfg.flatBg} rounded-lg ${PADDING[size]} text-center`}>
      <p class={valCls}>{display}</p>
      <p class={labelCls}>{cfg.label}</p>
    </div>
  );
}

export function MacroSummaryGrid({
  calories,
  protein,
  carbs,
  fat,
  variant = "flat",
  size = "md",
  cols = "2md4",
  gap = "4",
  class: cls,
}: MacroSummaryGridProps) {
  return (
    <div class={`grid ${COLS_MAP[cols]} ${GAP_MAP[gap]}${cls ? ` ${cls}` : ""}`}>
      <MacroStatCard macro="calories" value={calories} variant={variant} size={size} />
      <MacroStatCard macro="protein" value={protein} variant={variant} size={size} />
      <MacroStatCard macro="carbs" value={carbs} variant={variant} size={size} />
      <MacroStatCard macro="fat" value={fat} variant={variant} size={size} />
    </div>
  );
}
