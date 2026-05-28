import { ComponentChildren } from "preact";

interface CardProps {
  children: ComponentChildren;
  padding?: "none" | "sm" | "md" | "lg";
  class?: string;
}

const PADDING_MAP = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ children, padding = "md", class: cls }: CardProps) {
  return (
    <div class={`bg-white shadow rounded-lg ${PADDING_MAP[padding]}${cls ? ` ${cls}` : ""}`}>
      {children}
    </div>
  );
}
