import { Handlers } from "$fresh/server.ts";
import { getAuthPayload } from "../../utils/auth.ts";
import { getCalorieTrend, getLoggingStreak, getUserById } from "../../utils/db.ts";
import { FREE_TRENDS_DAYS, isPro } from "../../utils/plan.ts";

export const handler: Handlers = {
  async GET(req) {
    const auth = await getAuthPayload(req);
    if (auth instanceof Response) return auth;

    try {
      const url = new URL(req.url);
      const period = url.searchParams.get("period") || "week";

      const now = new Date();
      const endDate = now.toISOString().split("T")[0];
      let daysBack: number;

      switch (period) {
        case "month":
          daysBack = 30;
          break;
        case "3month":
          daysBack = 90;
          break;
        case "year":
          daysBack = 365;
          break;
        default:
          daysBack = 7;
      }

      // Free users only see the most recent FREE_TRENDS_DAYS; Pro sees all.
      const user = await getUserById(auth.userId);
      const pro = isPro(user);
      let limited = false;
      if (!pro && daysBack > FREE_TRENDS_DAYS) {
        daysBack = FREE_TRENDS_DAYS;
        limited = true;
      }

      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const [calorieTrend, streak] = await Promise.all([
        getCalorieTrend(auth.userId, startDate, endDate),
        getLoggingStreak(auth.userId),
      ]);

      return new Response(
        JSON.stringify({
          calorieTrend,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          limited,
          pro,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Get trends error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to get trends data" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
