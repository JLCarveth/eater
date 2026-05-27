interface Props {
  error: string | null | undefined;
}

export default function ErrorAlert({ error }: Props) {
  if (!error) return null;
  return (
    <div class="rounded-md bg-red-50 border border-red-200 p-4 flex items-start gap-3">
      <svg
        class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p class="text-sm text-red-700">{error}</p>
    </div>
  );
}
