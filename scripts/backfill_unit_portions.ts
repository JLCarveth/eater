#!/usr/bin/env -S deno run --allow-env --allow-net
/**
 * Backfills unit_name and unit_weight_grams for existing USDA foundation food records.
 * Run after migration 011_add_unit_portions.sql.
 */

import { Client } from "npm:pg";
import data from "../FoodData_Central_foundation_food_json_2025-12-18.json" with { type: "json" };

const DB_URL = Deno.env.get("DATABASE_URL");
const PGUSER = Deno.env.get("PGUSER");

if (!DB_URL && !PGUSER) {
  console.error("DATABASE_URL or PGUSER is not set.");
  Deno.exit(1);
}

const client = DB_URL ? new Client(DB_URL) : new Client();

const SKIP_UNIT_NAMES = new Set([
  "oz", "g", "kg", "lb", "ml", "l", "fl oz", "RACC",
  "cup", "tbsp", "tsp", "tablespoon", "teaspoon", "pint", "quart", "gallon",
]);

async function main() {
  await client.connect();

  try {
    const systemUserRes = await client.query(
      "SELECT id FROM users WHERE email = $1",
      ["system@nutrition-llama.com"]
    );

    if (systemUserRes.rows.length === 0) {
      console.error("System user not found. Run import_foundation_foods.ts first.");
      Deno.exit(1);
    }

    const systemUserId = systemUserRes.rows[0].id;
    console.log(`Backfilling unit portions for system user ${systemUserId}...`);

    let updated = 0;
    let skipped = 0;

    for (const food of data.FoundationFoods) {
      const bestPortion = (food.foodPortions ?? []).find((p) => {
        const abbr = p.measureUnit?.abbreviation ?? "";
        const unitName = p.measureUnit?.name ?? "";
        return !SKIP_UNIT_NAMES.has(abbr) && !SKIP_UNIT_NAMES.has(unitName) && p.gramWeight > 0;
      });

      if (!bestPortion) {
        skipped++;
        continue;
      }

      const unitName = bestPortion.measureUnit?.name ?? null;
      const unitWeightGrams = bestPortion.gramWeight;

      const result = await client.query(
        `UPDATE nutrition_records
         SET unit_name = $1, unit_weight_grams = $2
         WHERE name = $3 AND user_id = $4 AND unit_name IS NULL`,
        [unitName, unitWeightGrams, food.description, systemUserId]
      );

      updated += result.rowCount ?? 0;
    }

    console.log(`Done. Updated ${updated} records, ${skipped} foods had no countable portion.`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
