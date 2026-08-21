/**
 * Weekly email report for Macroscope Pro users (retention / re-activation).
 *
 * Run on the VPS via cron / systemd timer, e.g. weekly:
 *   deno run --allow-net --allow-env --allow-read scripts/weekly_report.ts
 *
 * In dev (no RESEND_API_KEY) the emails are logged to the console.
 */

import {
  getCalorieTrend,
  getLoggingStreak,
  getProUsers,
  getWeightLogAll,
} from "../packages/web/utils/db.ts";
import { sendWeeklyReportEmail } from "../packages/web/utils/email.ts";

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

async function run(): Promise<void> {
  const now = new Date();
  const endDate = isoDate(now);
  const startDate = isoDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));

  const users = await getProUsers();
  console.log(`Weekly report: ${users.length} opted-in Pro user(s).`);

  let sent = 0;
  for (const user of users) {
    try {
      const [trend, streak, weights] = await Promise.all([
        getCalorieTrend(user.id, startDate, endDate),
        getLoggingStreak(user.id),
        getWeightLogAll(user.id),
      ]);

      const daysLogged = trend.length;
      // Skip users with no activity this week — nothing worth emailing about.
      if (daysLogged === 0) continue;

      const totalCalories = trend.reduce((sum, p) => sum + p.totalCalories, 0);
      const avgCalories = totalCalories / daysLogged;

      // Weight change within the window (first vs last recorded entry).
      const windowWeights = weights.filter(
        (w) => w.loggedDate >= startDate && w.loggedDate <= endDate,
      );
      const weightChangeKg = windowWeights.length >= 2
        ? windowWeights[windowWeights.length - 1].weightKg -
          windowWeights[0].weightKg
        : null;

      const ok = await sendWeeklyReportEmail(user.email, {
        displayName: user.displayName || user.email.split("@")[0],
        daysLogged,
        avgCalories,
        totalCalories,
        currentStreak: streak.currentStreak,
        weightChangeKg,
      });
      if (ok) sent++;
    } catch (error) {
      console.error(`Weekly report failed for ${user.email}:`, error);
    }
  }

  console.log(`Weekly report: ${sent} email(s) sent.`);
}

await run();
// postgres.js keeps the process alive via its pool; exit explicitly.
Deno.exit(0);
