import { JSX } from "preact";

interface TextInputProps extends JSX.HTMLAttributes<HTMLInputElement> {
  label?: string;
  id?: string;
  error?: string;
  hint?: string;
}

const BASE_CLASS = "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";
const NORMAL_CLASS = `${BASE_CLASS} border-gray-300`;
const ERROR_CLASS = `${BASE_CLASS} border-red-300 focus:ring-red-500 focus:border-red-500`;

export function TextInput({ label, id, error, hint, class: cls, ...props }: TextInputProps) {
  return (
    <div>
      {label && (
        <label for={id} class="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        class={`${error ? ERROR_CLASS : NORMAL_CLASS}${cls ? ` ${cls}` : ""}`}
        {...props}
      />
      {hint && !error && <p class="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p class="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
