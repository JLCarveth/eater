import { Handlers } from "$fresh/server.ts";
import { getAuthPayload } from "../../utils/auth.ts";
import {
  getFoodLogExport,
  getUserById,
  getWeightLogAll,
} from "../../utils/db.ts";
import { isPro } from "../../utils/plan.ts";

// Minimal RFC-4180 CSV field escaping.
function csvField(value: string | number): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(csvField).join(",")];
  for (const row of rows) lines.push(row.map(csvField).join(","));
  return lines.join("\n");
}

export const handler: Handlers = {
  async GET(req) {
    const auth = await getAuthPayload(req);
    if (auth instanceof Response) return auth;

    // CSV export is a Pro feature.
    const user = await getUserById(auth.userId);
    if (!user || !isPro(user)) {
      return new Response(
        JSON.stringify({
          error: "CSV export is a Macroscope Pro feature.",
          upgradeUrl: "/account",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    const [foodLog, weightLog] = await Promise.all([
      getFoodLogExport(auth.userId),
      getWeightLogAll(auth.userId),
    ]);

    const foodCsv = toCsv(
      [
        "date",
        "meal",
        "food",
        "servings",
        "calories",
        "protein_g",
        "carbs_g",
        "fat_g",
        "fiber_g",
        "sugars_g",
        "sodium_mg",
      ],
      foodLog.map((r) => [
        r.loggedDate,
        r.mealType,
        r.name,
        r.servings,
        Math.round(r.calories),
        Math.round(r.protein * 10) / 10,
        Math.round(r.carbohydrates * 10) / 10,
        Math.round(r.totalFat * 10) / 10,
        Math.round(r.fiber * 10) / 10,
        Math.round(r.sugars * 10) / 10,
        Math.round(r.sodium),
      ]),
    );

    const weightCsv = toCsv(
      ["date", "weight_kg", "body_fat_pct"],
      weightLog.map((w) => [w.loggedDate, w.weightKg, w.bodyFatPct ?? ""]),
    );

    // Two labeled sections in one downloadable file.
    const body = `# Food Log\n${foodCsv}\n\n# Weight Log\n${weightCsv}\n`;
    const filename = `macroscope-export-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  },
};
