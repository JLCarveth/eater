import { ComponentChildren } from "preact";
import { Spinner } from "./Spinner.tsx";

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  children: ComponentChildren;
  class?: string;
}

const VARIANT_MAP = {
  primary: "bg-primary-600 hover:bg-primary-700 text-white border border-transparent",
  secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
  danger: "bg-red-600 hover:bg-red-700 text-white border border-transparent",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-transparent",
};

const SIZE_MAP = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  onClick,
  children,
  class: cls,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      class={`inline-flex items-center justify-center gap-2 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${VARIANT_MAP[variant]} ${SIZE_MAP[size]}${cls ? ` ${cls}` : ""}`}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
