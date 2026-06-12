import { useState } from "preact/hooks";
import ErrorAlert from "../components/ErrorAlert.tsx";
import { Button } from "../components/ui/index.ts";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div class="mt-8 rounded-md bg-green-50 p-4">
        <p class="text-sm text-green-800">
          If an account exists with that email, we've sent a password reset
          link. Check your inbox — the link is valid for 1 hour.
        </p>
        <p class="mt-4 text-sm">
          <a
            href="/login"
            class="font-medium text-primary-600 hover:text-primary-500"
          >
            Back to sign in
          </a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} class="mt-8 space-y-6">
      <ErrorAlert error={error} />

      <div>
        <label htmlFor="email" class="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          placeholder="you@example.com"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        disabled={loading}
        class="w-full"
      >
        {loading ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}
