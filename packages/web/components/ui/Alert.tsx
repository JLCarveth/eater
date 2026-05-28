import { ComponentChildren } from "preact";

interface AlertProps {
  variant?: "error" | "success" | "warning" | "info";
  title?: string;
  children?: ComponentChildren;
  message?: string;
  onDismiss?: () => void;
}

const VARIANT_MAP = {
  error: {
    container: "bg-red-50 border-red-200",
    icon: "text-red-500",
    title: "text-red-800",
    body: "text-red-700",
  },
  success: {
    container: "bg-green-50 border-green-200",
    icon: "text-green-500",
    title: "text-green-800",
    body: "text-green-700",
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200",
    icon: "text-yellow-500",
    title: "text-yellow-800",
    body: "text-yellow-700",
  },
  info: {
    container: "bg-blue-50 border-blue-200",
    icon: "text-blue-500",
    title: "text-blue-800",
    body: "text-blue-700",
  },
};

function AlertIcon({ variant }: { variant: NonNullable<AlertProps["variant"]> }) {
  if (variant === "error") {
    return (
      <svg class="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (variant === "success") {
    return (
      <svg class="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (variant === "warning") {
    return (
      <svg class="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  }
  return (
    <svg class="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function Alert({ variant = "error", title, children, message, onDismiss }: AlertProps) {
  const styles = VARIANT_MAP[variant];
  const content = children ?? message;
  if (!content && !title) return null;

  return (
    <div class={`rounded-md border p-4 flex items-start gap-3 ${styles.container}`}>
      <span class={styles.icon}>
        <AlertIcon variant={variant} />
      </span>
      <div class="flex-1 min-w-0">
        {title && <p class={`text-sm font-medium ${styles.title}`}>{title}</p>}
        {content && <p class={`text-sm ${styles.body}${title ? " mt-1" : ""}`}>{content}</p>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          class={`flex-shrink-0 ${styles.icon} hover:opacity-75`}
          aria-label="Dismiss"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
