import { useState } from "preact/hooks";

interface EmailPrefToggleProps {
  initial: boolean;
}

export default function EmailPrefToggle({ initial }: EmailPrefToggleProps) {
  const [enabled, setEnabled] = useState(initial);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    try {
      const res = await fetch("/api/account/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailWeeklyReport: next }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      // Revert on failure.
      setEnabled(!next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <label class="flex items-center justify-between gap-4 cursor-pointer">
      <span class="text-sm text-gray-700">Weekly email report</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={saving}
        onClick={toggle}
        class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-primary-600" : "bg-gray-300"
        } disabled:opacity-50`}
      >
        <span
          class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}
