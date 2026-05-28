import type { ComponentChildren } from "preact";
import { Button } from "./ui/index.ts";

interface FoodResultRowProps {
  name: string;
  calories: number;
  protein: number | null;
  carbohydrates: number | null;
  totalFat: number | null;
  servingSizeValue: number;
  servingSizeUnit: string;
  upcCode?: string | null;
  badge?: ComponentChildren;
  href?: string;
  onClick?: () => void;
  action?: ComponentChildren;
}

export function MacroInlineText({ protein, carbs, fat }: { protein: number | null; carbs: number | null; fat: number | null }) {
  return <span>P: {protein || 0}g | C: {carbs || 0}g | F: {fat || 0}g</span>;
}

export default function FoodResultRow({
  name, calories, protein, carbohydrates, totalFat,
  servingSizeValue, servingSizeUnit, upcCode, badge, href, onClick, action,
}: FoodResultRowProps) {
  const servingLine = `${servingSizeValue}${servingSizeUnit} per serving${upcCode ? ` | UPC: ${upcCode}` : ""}`;

  const left = (
    <div class={action ? "flex-1 min-w-0" : ""}>
      <div class="flex items-center gap-2 flex-wrap">
        <h3 class="text-lg font-medium text-gray-900 truncate">{name}</h3>
        {badge}
      </div>
      <p class="text-sm text-gray-500">{servingLine}</p>
    </div>
  );

  const right = (
    <div class={action ? "flex items-center gap-4 ml-4 shrink-0" : "text-right"}>
      <div class="text-right">
        <p class="text-lg font-semibold text-gray-900">{calories} cal</p>
        <p class="text-sm text-gray-500">
          <MacroInlineText protein={protein} carbs={carbohydrates} fat={totalFat} />
        </p>
      </div>
      {action}
    </div>
  );

  if (href) {
    return (
      <a href={href} class="block hover:bg-gray-50 px-6 py-4">
        <div class="flex items-center justify-between">{left}{right}</div>
      </a>
    );
  }

  if (onClick) {
    return (
      <Button variant="bare" type="button" onClick={onClick} class="block w-full text-left hover:bg-gray-50 px-6 py-4">
        <div class="flex items-center justify-between">{left}{right}</div>
      </Button>
    );
  }

  return (
    <div class="flex items-center justify-between hover:bg-gray-50 px-6 py-4">
      {left}{right}
    </div>
  );
}
