import { useState } from "preact/hooks";
import ErrorAlert from "../components/ErrorAlert.tsx";
import { Button, TextInput } from "../components/ui/index.ts";

export default function DeleteAccountForm() {
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      globalThis.location.href = "/";
    } catch (_err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!confirming) {
    return (
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Delete my account
      </Button>
    );
  }

  return (
    <form onSubmit={handleDelete} class="space-y-4">
      <ErrorAlert error={error} />

      <p class="text-sm text-gray-700">
        This will permanently delete your account, saved foods, recipes, food
        log, weight log, and goals. This cannot be undone. Enter your password
        to confirm.
      </p>

      <TextInput
        label="Password"
        id="deletePassword"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
      />

      <div class="flex gap-3">
        <Button type="submit" variant="danger" loading={loading} disabled={loading}>
          {loading ? "Deleting..." : "Permanently delete account"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => {
            setConfirming(false);
            setPassword("");
            setError("");
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
