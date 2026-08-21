import { useState } from "preact/hooks";
import ErrorAlert from "../components/ErrorAlert.tsx";
import { Alert, Button, TextInput } from "../components/ui/index.ts";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (_err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <ErrorAlert error={error} />
      {success && (
        <Alert
          variant="success"
          message="Password updated. Any other devices have been signed out."
          onDismiss={() => setSuccess(false)}
        />
      )}

      <TextInput
        label="Current password"
        id="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        value={currentPassword}
        onInput={(e) => setCurrentPassword((e.target as HTMLInputElement).value)}
      />

      <TextInput
        label="New password"
        id="newPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="At least 8 characters"
        value={newPassword}
        onInput={(e) => setNewPassword((e.target as HTMLInputElement).value)}
      />

      <TextInput
        label="Confirm new password"
        id="confirmNewPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={confirmPassword}
        onInput={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
      />

      <Button type="submit" variant="primary" loading={loading} disabled={loading}>
        {loading ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
