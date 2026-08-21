import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import TrackEvent from "../islands/TrackEvent.tsx";

export const handler: Handlers = {
  GET(req, ctx) {
    // If user is logged in, redirect to dashboard
    if (ctx.state?.user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/dashboard" },
      });
    }
    return ctx.render();
  },
};

export default function Home() {
  return (
    <>
      <Head>
        <title>MacroScope — Know What You're Eating</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,400i;9..144,700i&family=DM+Sans:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --ink: #1a1a16;
            --warm-bg: #fafaf5;
          }
          .font-display { font-family: 'Fraunces', Georgia, serif; }
          .font-body { font-family: 'DM Sans', system-ui, sans-serif; }
          .text-ink { color: var(--ink); }
          .bg-warm { background-color: var(--warm-bg); }
          .step-num {
            font-family: 'Fraunces', Georgia, serif;
            font-size: 5rem;
            font-weight: 700;
            line-height: 1;
            color: #dcfce7;
            user-select: none;
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .fade-up-1 { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.05s both; }
          .fade-up-2 { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.18s both; }
          .fade-up-3 { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.32s both; }
          .fade-up-4 { animation: fadeUp 0.65s cubic-bezier(.22,1,.36,1) 0.46s both; }
          .card-rotated { transform: rotate(2.5deg); }
          .card-badge { transform: rotate(-6deg); }
          .pill-btn {
            display: inline-flex;
            align-items: center;
            padding: 0.875rem 1.75rem;
            border-radius: 9999px;
            font-weight: 500;
            transition: background-color 0.15s, color 0.15s;
          }
        `}</style>
      </Head>

      <div class="bg-warm font-body" style="color: var(--ink);">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section class="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-36">
          <div class="grid lg:grid-cols-12 gap-12 items-center">

            {/* Left: copy */}
            <div class="lg:col-span-7">
              <span class="fade-up-1 inline-block text-xs font-medium tracking-widest text-primary-600 uppercase mb-7">
                Nutrition Tracking
              </span>

              <h1
                class="font-display fade-up-2 text-ink"
                style="font-family:'Fraunces',Georgia,serif; font-weight:700; font-size:clamp(2.75rem,6vw,5rem); line-height:1.08; margin-bottom:1.5rem;"
              >
                Know what<br />
                you're eating.<br />
                <em style="font-style:italic; color:#16a34a;">Every time.</em>
              </h1>

              <p
                class="text-gray-500 leading-relaxed max-w-md fade-up-3"
                style="font-size:1.125rem; margin-bottom:2.5rem;"
              >
                Point your camera at any nutrition label — MacroScope reads
                every value on it and saves it to your food library. Log meals in
                seconds, track macros without a spreadsheet.
              </p>

              <div class="flex flex-wrap items-center gap-4 fade-up-4">
                <a
                  href="/register"
                  class="pill-btn bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
                >
                  Get started free
                </a>
                <a
                  href="/login"
                  class="text-gray-600 font-medium hover:text-primary-600 transition-colors"
                  style="text-decoration:underline; text-decoration-color:#d1d5db; text-underline-offset:4px;"
                >
                  Sign in
                </a>
              </div>
            </div>

            {/* Right: mock snapshot card */}
            <div class="hidden lg:flex lg:col-span-5 justify-center items-center">
              <div class="relative">
                <div
                  class="card-rotated w-64 bg-white border border-gray-100 rounded-3xl p-8 shadow-md flex flex-col gap-6"
                >
                  <div
                    class="text-xs font-medium tracking-widest text-gray-400 uppercase"
                  >
                    Today's snapshot
                  </div>
                  <div>
                    <div
                      class="font-display text-ink"
                      style="font-family:'Fraunces',Georgia,serif; font-size:3.25rem; font-weight:700; line-height:1; margin-bottom:0.25rem;"
                    >
                      2,140
                    </div>
                    <div class="text-sm text-gray-400">calories logged</div>
                  </div>
                  <div class="flex gap-5 border-t border-gray-50 pt-5">
                    <div>
                      <div class="font-semibold text-ink">142g</div>
                      <div class="text-xs text-gray-400 mt-0.5">protein</div>
                    </div>
                    <div>
                      <div class="font-semibold text-ink">210g</div>
                      <div class="text-xs text-gray-400 mt-0.5">carbs</div>
                    </div>
                    <div>
                      <div class="font-semibold text-ink">68g</div>
                      <div class="text-xs text-gray-400 mt-0.5">fat</div>
                    </div>
                  </div>
                </div>

                {/* floating badge */}
                <div
                  class="card-badge absolute -top-3 -right-6 bg-primary-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap"
                >
                  3 labels scanned today 🦙
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section class="border-t border-gray-100 bg-white">
          <div class="max-w-7xl mx-auto px-6 lg:px-8 py-20">
            <div class="mb-14">
              <span class="text-xs font-medium tracking-widest text-primary-600 uppercase">
                How it works
              </span>
            </div>

            <div class="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">

              <div class="py-8 md:py-0 md:pr-12">
                <div class="step-num mb-5">01</div>
                <h3 class="font-semibold text-ink text-lg mb-2">Scan the label</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                  Photograph any nutrition facts panel with your phone — packaged
                  foods, supplements, restaurant nutrition cards. If it has a label,
                  it works.
                </p>
              </div>

              <div class="py-8 md:py-0 md:px-12">
                <div class="step-num mb-5">02</div>
                <h3 class="font-semibold text-ink text-lg mb-2">We read it</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                  Calories, protein, carbs, fat, serving size — all of it, pulled
                  straight from the label and saved to your personal food library.
                  No manual entry.
                </p>
              </div>

              <div class="py-8 md:py-0 md:pl-12">
                <div class="step-num mb-5">03</div>
                <h3 class="font-semibold text-ink text-lg mb-2">Log your day</h3>
                <p class="text-gray-500 text-sm leading-relaxed">
                  Add saved foods to your daily log, adjust servings, and watch your
                  macros tally up. Check your trends over time. That's the whole
                  thing.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────── */}
        <section id="pricing" class="border-t border-gray-100 bg-white">
          <TrackEvent event="view_pricing" />
          <div class="max-w-5xl mx-auto px-6 lg:px-8 py-20">
            <div class="text-center mb-12">
              <span class="text-xs font-medium tracking-widest text-primary-600 uppercase">
                Pricing
              </span>
              <h2
                class="font-display text-ink mt-3"
                style="font-family:'Fraunces',Georgia,serif; font-weight:700; font-size:clamp(2rem,4vw,3rem); line-height:1.1;"
              >
                Simple, honest pricing
              </h2>
              <p class="text-gray-500 mt-3">Start free. Upgrade when the AI coach earns its keep.</p>
            </div>

            <div class="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Free */}
              <div class="bg-warm border border-gray-200 rounded-3xl p-8 flex flex-col">
                <h3 class="font-semibold text-ink text-xl mb-1">Free</h3>
                <p class="text-gray-500 text-sm mb-5">Everything you need to log by hand.</p>
                <div class="mb-6">
                  <span class="font-display text-ink" style="font-family:'Fraunces',Georgia,serif; font-size:2.5rem; font-weight:700;">$0</span>
                  <span class="text-gray-400 text-sm"> / forever</span>
                </div>
                <ul class="space-y-2 text-sm text-gray-600 flex-1">
                  <li>✓ Barcode &amp; UPC logging</li>
                  <li>✓ Manual food entry &amp; daily summaries</li>
                  <li>✓ 10 free AI label scans</li>
                  <li>✓ Last 14 days of trends</li>
                  <li>✓ Up to 3 recipes</li>
                </ul>
                <a href="/register" class="pill-btn bg-white text-ink border border-gray-300 hover:bg-gray-50 mt-7 justify-center">
                  Get started free
                </a>
              </div>

              {/* Pro */}
              <div class="bg-white border-2 border-primary-500 rounded-3xl p-8 flex flex-col relative shadow-sm">
                <span class="absolute -top-3 right-6 bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Best value
                </span>
                <h3 class="font-semibold text-ink text-xl mb-1">Pro</h3>
                <p class="text-gray-500 text-sm mb-5">Your AI nutrition coach bundle.</p>
                <div class="mb-1">
                  <span class="font-display text-ink" style="font-family:'Fraunces',Georgia,serif; font-size:2.5rem; font-weight:700;">$24</span>
                  <span class="text-gray-400 text-sm"> / year</span>
                </div>
                <p class="text-xs text-gray-400 mb-6">or $3.99/month — annual saves ~50%</p>
                <ul class="space-y-2 text-sm text-gray-600 flex-1">
                  <li>✓ <strong class="text-ink">Snap-a-meal</strong> — photo → macros</li>
                  <li>✓ <strong class="text-ink">AI macro coach</strong> — daily suggestions</li>
                  <li>✓ Unlimited history &amp; trends</li>
                  <li>✓ Weekly email report</li>
                  <li>✓ CSV export</li>
                  <li>✓ Unlimited recipes &amp; goals</li>
                </ul>
                <a href="/register" class="pill-btn bg-primary-600 text-white hover:bg-primary-700 mt-7 justify-center">
                  Start with Pro →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Minimal CTA ──────────────────────────────────────── */}
        <section class="max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <p
              class="font-display text-ink"
              style="font-family:'Fraunces',Georgia,serif; font-size:1.75rem; font-weight:600; line-height:1.3;"
            >
              Start tracking today.<br />
              <span class="text-gray-400 font-normal" style="font-size:1.375rem;">
                Free account, no credit card, no spreadsheets.
              </span>
            </p>
            <a
              href="/register"
              class="pill-btn bg-primary-600 text-white hover:bg-primary-700 shadow-sm shrink-0"
            >
              Create free account →
            </a>
          </div>
        </section>

      </div>
    </>
  );
}
