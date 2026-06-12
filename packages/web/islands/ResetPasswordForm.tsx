import { useState } from "preact/hooks";
import ErrorAlert from "../components/ErrorAlert.tsx";
import { Button } from "../components/ui/index.ts";

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div class="mt-8 rounded-md bg-green-50 p-4">
        <p class="text-sm text-green-800">
          Your password has been updated. You can now sign in with your new
          password.
        </p>
        <p class="mt-4 text-sm">
          <a
            href="/login"
            class="font-medium text-primary-600 hover:text-primary-500"
          >
            Sign in
          </a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="mt-8 space-y-6">
      <ErrorAlert error={error} />

      <div class="space-y-4">
        <div>
          <label
            htmlFor="password"
            class="block text-sm font-medium text-gray-700"
          >
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            class="block text-sm font-medium text-gray-700"
          >
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onInput={(e) =>
              setConfirmPassword((e.target as HTMLInputElement).value)}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Re-enter your new password"
          />
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        disabled={loading}
        class="w-full"
      >
        {loading ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
