import { ComponentChildren } from "preact";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ComponentChildren;
  icon?: ComponentChildren;
  size?: "sm" | "md";
}

export function EmptyState({ title, description, action, icon, size = "md" }: EmptyStateProps) {
  if (size === "sm") {
    return (
      <div class="px-3 py-4 text-sm text-gray-500 text-center">
        {title}
      </div>
    );
  }

  return (
    <div class="text-center py-12">
      {icon && (
        <div class="flex justify-center mb-4 text-gray-300">
          {icon}
        </div>
      )}
      <h3 class="text-sm font-medium text-gray-900">{title}</h3>
      {description && (
        <p class="mt-1 text-sm text-gray-500">{description}</p>
      )}
      {action && (
        <div class="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}
