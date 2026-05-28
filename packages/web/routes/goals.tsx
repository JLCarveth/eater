import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { requireAuth } from "../utils/auth.ts";
import type { User, UserGoals } from "@nutrition-llama/shared";
import { getUserGoals } from "../utils/db.ts";
import GoalSetup from "../islands/GoalSetup.tsx";
import PageShell from "../components/PageShell.tsx";
import PageHeader from "../components/PageHeader.tsx";
import { Card } from "../components/ui/index.ts";

interface GoalsData {
  user: User;
  goals: UserGoals | null;
}

export const handler: Handlers<GoalsData> = {
  async GET(req, ctx) {
    const authResult = await requireAuth(req);
    if (authResult.redirect) {
      return authResult.redirect;
    }

    const goals = await getUserGoals(authResult.user!.id);

    return ctx.render({
      user: authResult.user!,
      goals,
    });
  },
};

export default function GoalsPage({ data }: PageProps<GoalsData>) {
  const { goals } = data;

  return (
    <>
      <Head>
        <title>Goals - MacroScope</title>
      </Head>

      <PageShell>
        <PageHeader
          title="Nutrition Goals"
          titleSize="3xl"
          subtitle="Set your daily calorie and macro targets to track your progress."
        />
        <Card>
          <GoalSetup existingGoals={goals} />
        </Card>
      </PageShell>
    </>
  );
}
