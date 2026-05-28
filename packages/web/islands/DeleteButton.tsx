import { useState } from "preact/hooks";
import { Button } from "../components/ui/index.ts";

interface Props {
  itemId: string;
  itemName: string;
  apiPath: string;   // e.g. "/api/foods"
  redirectTo: string; // e.g. "/foods"
  label: string;     // e.g. "Food" or "Recipe"
}

export default function DeleteButton({ itemId, itemName, apiPath, redirectTo, label }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiPath}/${itemId}`, { method: "DELETE" });
      if (res.ok) {
        globalThis.location.href = redirectTo;
      } else {
        const data = await res.json();
        setError(data.error ?? `Failed to delete ${label.toLowerCase()}`);
        setLoading(false);
        setConfirming(false);
      }
    } catch {
      setError("Network error");
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-700">Delete "{itemName}"?</span>
        <Button
          variant="danger"
          onClick={handleDelete}
          loading={loading}
          disabled={loading}
        >
          {loading ? "Deleting..." : "Yes, delete"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        {error && <span class="text-sm text-red-600">{error}</span>}
      </div>
    );
  }

  return (
    <Button
      variant="danger"
      onClick={() => setConfirming(true)}
    >
      Delete {label}
    </Button>
  );
}
