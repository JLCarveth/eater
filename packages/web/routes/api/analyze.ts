import { Handlers } from "$fresh/server.ts";
import { getAuthPayload } from "../../utils/auth.ts";
import { getUserById, recordAiUsage } from "../../utils/db.ts";
import { checkAiAllowance, paywallResponse } from "../../utils/plan.ts";
import { rateLimit, rateLimitResponse } from "../../utils/ratelimit.ts";

export const handler: Handlers = {
  async POST(req) {
    const auth = await getAuthPayload(req);
    if (auth instanceof Response) return auth;

    // Blunt bursts on the expensive vision call (per-user token bucket).
    const rl = rateLimit(`ai:${auth.userId}`, 8, 0.1);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfter);

    // Gate: free users get a lifetime trial of label scans; Pro is capped by
    // the monthly fair-use limit.
    const user = await getUserById(auth.userId);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const allowance = await checkAiAllowance(user, "label_scan");
    if (!allowance.allowed) {
      return paywallResponse(allowance.message!);
    }

    try {
      // Get the API URL from environment
      const apiUrl = Deno.env.get("NUTRITION_API_URL") || "http://localhost:3000";

      // Get the form data from the request
      const formData = await req.formData();
      const image = formData.get("image");

      if (!image || !(image instanceof File)) {
        return new Response(
          JSON.stringify({ error: "No image file provided" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Create new form data to forward to the API
      const forwardFormData = new FormData();
      forwardFormData.append("image", image);

      // Forward request to the Node.js API
      const response = await fetch(`${apiUrl}/analyze-nutrition`, {
        method: "POST",
        body: forwardFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return new Response(
          JSON.stringify({ error: errorData.error || "Analysis failed" }),
          { status: response.status, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = await response.json();

      // Meter only successful AI calls.
      await recordAiUsage(auth.userId, "label_scan");

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Analyze proxy error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to analyze image" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};
