import { Handlers } from "$fresh/server.ts";
import { getAuthPayload } from "../../utils/auth.ts";
import { getUserById, recordAiUsage } from "../../utils/db.ts";
import { checkAiAllowance, paywallResponse } from "../../utils/plan.ts";
import { rateLimit, rateLimitResponse } from "../../utils/ratelimit.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const handler: Handlers = {
  async POST(req) {
    const auth = await getAuthPayload(req);
    if (auth instanceof Response) return auth;

    const rl = rateLimit(`ai:${auth.userId}`, 8, 0.1);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    // Snap-a-meal is a Pro feature (also subject to the monthly fair-use cap).
    const user = await getUserById(auth.userId);
    if (!user) return json({ error: "User not found" }, 404);

    const allowance = await checkAiAllowance(user, "meal_scan");
    if (!allowance.allowed) return paywallResponse(allowance.message!);

    try {
      const apiUrl = Deno.env.get("NUTRITION_API_URL") ||
        "http://localhost:3000";

      const formData = await req.formData();
      const image = formData.get("image");
      if (!image || !(image instanceof File)) {
        return json({ error: "No image file provided" }, 400);
      }

      const forwardFormData = new FormData();
      forwardFormData.append("image", image);

      const response = await fetch(`${apiUrl}/analyze-meal`, {
        method: "POST",
        body: forwardFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return json(
          { error: errorData.error || "Meal analysis failed" },
          response.status,
        );
      }

      const result = await response.json();
      await recordAiUsage(auth.userId, "meal_scan");

      return json(result);
    } catch (error) {
      console.error("Analyze-meal proxy error:", error);
      return json({ error: "Failed to analyze meal" }, 500);
    }
  },
};
