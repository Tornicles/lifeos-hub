import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, ultraMetricsTable, habitsTable, projectsTable } from "@workspace/db";
import {
  GenerateDailyInsightResponse,
  GenerateWeeklyInsightResponse,
  GenerateMonthlyInsightResponse,
  GenerateAiInsightBody,
  GenerateAiInsightResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildInsight(userId: string, period: "daily" | "weekly" | "monthly" | "ai") {
  const metrics = await db
    .select()
    .from(ultraMetricsTable)
    .where(eq(ultraMetricsTable.userId, userId));
  const habits = await db.select().from(habitsTable).where(eq(habitsTable.userId, userId));
  const projects = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.userId, userId), eq(projectsTable.status, "active")));

  const avgScore =
    metrics.length > 0 ? metrics.reduce((s, m) => s + m.value, 0) / metrics.length : 0;

  return {
    id: crypto.randomUUID(),
    userId,
    period,
    summary: `Your average score is ${avgScore.toFixed(1)}. You have ${habits.length} active habits and ${projects.length} active projects.`,
    details: { avgScore, habitCount: habits.length, activeProjectCount: projects.length },
    generatedAt: new Date().toISOString(),
  };
}

router.post("/insights/daily", async (req, res): Promise<void> => {
  res.json(GenerateDailyInsightResponse.parse(await buildInsight(req.userId!, "daily")));
});

router.post("/insights/weekly", async (req, res): Promise<void> => {
  res.json(GenerateWeeklyInsightResponse.parse(await buildInsight(req.userId!, "weekly")));
});

router.post("/insights/monthly", async (req, res): Promise<void> => {
  res.json(GenerateMonthlyInsightResponse.parse(await buildInsight(req.userId!, "monthly")));
});

router.post("/insights/ai", async (req, res): Promise<void> => {
  const parsed = GenerateAiInsightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const insight = await buildInsight(req.userId!, "ai");
  res.json(
    GenerateAiInsightResponse.parse({
      ...insight,
      summary: parsed.data.prompt
        ? `${insight.summary} (regarding: "${parsed.data.prompt}")`
        : insight.summary,
    }),
  );
});

export default router;
