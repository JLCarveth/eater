import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/auth.ts";
import type { User, WeightLogEntry, TrendsData } from "@nutrition-llama/shared";
import { getWeightLog, getCalorieTrend, getLoggingStreak } from "../utils/db.ts";
import { FREE_TRENDS_DAYS, isPro } from "../utils/plan.ts";
import TrendsView from "../islands/TrendsView.tsx";
import PageShell from "../components/PageShell.tsx";
import PageHeader from "../components/PageHeader.tsx";

interface TrendsPageData {
  user: User;
  weightLog: WeightLogEntry[];
  trends: TrendsData;
  pro: boolean;
}

export const handler: Handlers<TrendsPageData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const pro = isPro(authResult.user!);
    // Island defaults to the 30-day view; free users are capped at 14 days.
    const requestedDays = 30;
    const limited = !pro && requestedDays > FREE_TRENDS_DAYS;
    const daysBack = limited ? FREE_TRENDS_DAYS : requestedDays;

    const now = new Date();
    const endDate = now.toISOString().split("T")[0];
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const userId = authResult.user!.id;

    const [weightLog, calorieTrend, streak] = await Promise.all([
      getWeightLog(userId, startDate, endDate),
      getCalorieTrend(userId, startDate, endDate),
      getLoggingStreak(userId),
    ]);

    return ctx.render({
      user: authResult.user!,
      weightLog,
      trends: {
        calorieTrend,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        limited,
        pro,
      },
      pro,
    });
  },
};

export default function TrendsPage({ data }: PageProps<TrendsPageData>) {
  return (
    <>
      <Head>
        <title>Trends - MacroScope</title>
      </Head>

      <PageShell maxWidth="4xl">
        <PageHeader
          title="Trends"
          titleSize="3xl"
          subtitle="Track your weight, calorie intake, and logging streaks over time."
        />
        <TrendsView
          initialWeightLog={data.weightLog}
          initialTrends={data.trends}
          pro={data.pro}
        />
      </PageShell>
    </>
  );
}
