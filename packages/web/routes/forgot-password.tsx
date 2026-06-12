import { Head } from "$fresh/runtime.ts";
import ForgotPasswordForm from "../islands/ForgotPasswordForm.tsx";

export default function ForgotPasswordPage() {
  return (
    <>
      <Head>
        <title>Forgot Password - MacroScope</title>
      </Head>

      <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Forgot your password?
            </h2>
            <p class="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset it.
            </p>
          </div>

          <ForgotPasswordForm />

          <p class="text-center text-sm text-gray-600">
            Remembered it?{" "}
            <a
              href="/login"
              class="font-medium text-primary-600 hover:text-primary-500"
            >
              Back to sign in
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
