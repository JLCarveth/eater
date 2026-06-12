import { Head } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";
import ResetPasswordForm from "../islands/ResetPasswordForm.tsx";

export default function ResetPasswordPage(props: PageProps) {
  const token = props.url.searchParams.get("token") ?? "";

  return (
    <>
      <Head>
        <title>Reset Password - MacroScope</title>
      </Head>

      <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Choose a new password
            </h2>
          </div>

          {token ? <ResetPasswordForm token={token} /> : (
            <div class="mt-8 rounded-md bg-red-50 p-4">
              <p class="text-sm text-red-800">
                This reset link is missing its token. Make sure you opened the
                full link from your email, or request a new one.
              </p>
              <p class="mt-4 text-sm">
                <a
                  href="/forgot-password"
                  class="font-medium text-primary-600 hover:text-primary-500"
                >
                  Request a new reset link
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
