import { Head } from "$fresh/runtime.ts";

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service - MacroScope</title>
      </Head>

      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 class="text-3xl font-extrabold text-gray-900">Terms of Service</h1>
        <p class="mt-2 text-sm text-gray-500">Last updated: August 17, 2026</p>

        <div class="mt-8 space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 class="text-xl font-semibold text-gray-900">1. Agreement</h2>
            <p class="mt-2">
              These Terms of Service ("Terms") govern your use of MacroScope
              (the "Service"). By creating an account or using the Service, you
              agree to these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">2. The Service</h2>
            <p class="mt-2">
              MacroScope is a nutrition-tracking application that lets you log
              foods, scan nutrition labels, estimate meal macros, and track your
              progress over time. Nutrition figures — especially those produced
              by AI features such as label scanning and meal estimation — are
              estimates and may be inaccurate. The Service is not medical
              advice. Consult a qualified professional for dietary or health
              decisions.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">3. Accounts</h2>
            <p class="mt-2">
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activity under your account. You
              must provide accurate information and be at least the age of
              majority in your jurisdiction to use the Service.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              4. Macroscope Pro &amp; Billing
            </h2>
            <p class="mt-2">
              MacroScope offers a paid subscription, "Macroscope Pro", on a
              monthly or annual basis. Payments are processed by{" "}
              <a
                href="https://stripe.com"
                class="text-primary-600 hover:text-primary-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe
              </a>. By subscribing you authorize us, through Stripe, to charge
              the applicable fee plus any taxes to your payment method.
            </p>
            <ul class="mt-2 list-disc list-inside space-y-1">
              <li>
                <strong>Renewal:</strong>{" "}
                Subscriptions renew automatically at the end of each billing
                period until cancelled.
              </li>
              <li>
                <strong>Cancellation:</strong>{" "}
                You may cancel at any time via the billing portal in your
                account. Access continues until the end of the current paid
                period.
              </li>
              <li>
                <strong>Refunds:</strong>{" "}
                Except where required by law, fees are non-refundable.
              </li>
              <li>
                <strong>Fair use:</strong>{" "}
                AI features are subject to a monthly fair-use limit to keep the
                Service sustainable.
              </li>
              <li>
                <strong>Price changes:</strong>{" "}
                We may change prices with notice; changes apply to the next
                billing period.
              </li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              5. Acceptable Use
            </h2>
            <p class="mt-2">You agree not to:</p>
            <ul class="mt-2 list-disc list-inside space-y-1">
              <li>
                Misuse, overload, or attempt to disrupt or reverse-engineer the
                Service
              </li>
              <li>
                Access the Service through automated means beyond normal
                personal use
              </li>
              <li>
                Use the Service for any unlawful purpose or to infringe others'
                rights
              </li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">6. Your Content</h2>
            <p class="mt-2">
              You retain ownership of the data you submit. You grant us a
              limited license to store and process it solely to operate the
              Service. Our handling of your data is described in our{" "}
              <a
                href="/privacy"
                class="text-primary-600 hover:text-primary-700 underline"
              >
                Privacy Policy
              </a>.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">7. Disclaimers</h2>
            <p class="mt-2">
              The Service is provided "as is" and "as available" without
              warranties of any kind, express or implied, including accuracy of
              nutrition data. To the maximum extent permitted by law, we
              disclaim all such warranties.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              8. Limitation of Liability
            </h2>
            <p class="mt-2">
              To the maximum extent permitted by law, MacroScope and its
              operators will not be liable for any indirect, incidental, or
              consequential damages, or for any loss arising from your use of,
              or reliance on, the Service or its nutrition estimates.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">9. Termination</h2>
            <p class="mt-2">
              We may suspend or terminate your access if you violate these
              Terms. You may stop using the Service and request account deletion
              at any time.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">
              10. Changes to These Terms
            </h2>
            <p class="mt-2">
              We may update these Terms from time to time. Changes will be
              posted on this page with an updated revision date. Your continued
              use of the Service after changes are posted constitutes
              acceptance.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">11. Contact</h2>
            <p class="mt-2">
              Questions about these Terms can be directed to the email address
              associated with the application administrator.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
