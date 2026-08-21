import { Handlers } from "$fresh/server.ts";
import { getAuthPayload } from "../../utils/auth.ts";
import {
  getDailySummary,
  getUserById,
  getUserGoals,
  recordAiUsage,
} from "../../utils/db.ts";
import { checkAiAllowance, isPro, paywallResponse } from "../../utils/plan.ts";
import { rateLimit, rateLimitResponse } from "../../utils/ratelimit.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const COACH_SYSTEM_PROMPT =
  `You are a concise nutrition coach. Given a user's remaining macros for the day, ` +
  `suggest 2-3 specific, realistic foods (with rough portions) that would help them ` +
  `hit their remaining targets — prioritizing protein and calories. Keep each suggestion ` +
  `to one short sentence. Return ONLY a JSON array of strings, e.g. ` +
  `["6 oz grilled chicken (~50g protein)", "1 cup Greek yogurt with berries"].`;

async function getSuggestions(remaining: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}): Promise<string[]> {
  const apiUrl = Deno.env.get("LLM_API_URL") || "http://localhost:1234/v1";
  const apiKey = Deno.env.get("LLM_API_KEY") || "lm-studio";
  const model = Deno.env.get("LLM_TEXT_MODEL") || Deno.env.get("LLM_MODEL") ||
    "gpt-4o-mini";

  const userMsg = `Remaining today: ${Math.round(remaining.calories)} kcal, ` +
    `${Math.round(remaining.protein)}g protein, ${
      Math.round(remaining.carbs)
    }g carbs, ` +
    `${Math.round(remaining.fat)}g fat. What should I eat?`;

  const response = await fetch(`${apiUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: COACH_SYSTEM_PROMPT },
        { role: "user", content: userMsg },
      ],
      max_tokens: 300,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  let content: string = data.choices?.[0]?.message?.content?.trim() || "[]";
  if (content.startsWith("```")) {
    content = content.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
  }

  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed.map((s) => String(s)).slice(0, 3);
  } catch {
    // Fall back to splitting lines if the model didn't return clean JSON.
    return content.split("\n").map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
      .filter(Boolean).slice(0, 3);
  }
  return [];
}

export const handler: Handlers = {
  async GET(req) {
    const auth = await getAuthPayload(req);
    if (auth instanceof Response) return auth;

    const rl = rateLimit(`ai:${auth.userId}`, 8, 0.1);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    const user = await getUserById(auth.userId);
    if (!user) return json({ error: "User not found" }, 404);
    if (!isPro(user)) {
      return paywallResponse(
        "The AI macro coach is a Macroscope Pro feature.",
        403,
      );
    }

    const allowance = await checkAiAllowance(user, "coach");
    if (!allowance.allowed) return paywallResponse(allowance.message!);

    try {
      const goals = await getUserGoals(user.id);
      if (!goals) {
        return json({
          needsGoals: true,
          message: "Set your daily goals to get personalized suggestions.",
        });
      }

      const today = new Date().toISOString().split("T")[0];
      const summary = await getDailySummary(user.id, today);

      const remaining = {
        calories: goals.calories - (summary?.totalCalories ?? 0),
        protein: goals.proteinG - (summary?.totalProtein ?? 0),
        carbs: goals.carbsG - (summary?.totalCarbohydrates ?? 0),
        fat: goals.fatG - (summary?.totalFat ?? 0),
      };

      // Already at/over targets — no LLM call needed.
      if (remaining.calories <= 0 && remaining.protein <= 0) {
        return json({
          remaining,
          suggestions: [],
          message: "You've hit your targets for today. Nice work!",
        });
      }

      const suggestions = await getSuggestions(remaining);
      await recordAiUsage(user.id, "coach");

      return json({ remaining, suggestions });
    } catch (error) {
      console.error("Coach error:", error);
      return json({ error: "Could not generate suggestions right now." }, 500);
    }
  },
};
