import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  systemStateDailyTable,
  stateWarningsTable,
  ultraMetricsTable,
  hubsTable,
  logsTable,
} from "@workspace/db";
import { toDateOnlyString } from "../lib/dateUtils";
import {
  ListSystemStateQueryParams,
  ListSystemStateResponse,
  ListStateWarningsResponse,
  DismissStateWarningParams,
  DismissStateWarningBody,
  DismissStateWarningResponse,
  ValidateSystemResponse,
  CalculateUltraScoreBody,
  CalculateUltraScoreResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/system-state", async (req, res): Promise<void> => {
  const query = ListSystemStateQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const conditions = [eq(systemStateDailyTable.userId, req.userId!)];
  if (query.data.tenantId)
    conditions.push(eq(systemStateDailyTable.tenantId, query.data.tenantId));
  const rows = await db
    .select()
    .from(systemStateDailyTable)
    .where(and(...conditions));
  res.json(ListSystemStateResponse.parse(rows));
});

router.get("/system-state/warnings", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(stateWarningsTable)
    .where(eq(stateWarningsTable.userId, req.userId!));
  res.json(ListStateWarningsResponse.parse(rows));
});

router.patch("/system-state/warnings/:id", async (req, res): Promise<void> => {
  const params = DismissStateWarningParams.safeParse(req.params);
  const parsed = DismissStateWarningBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res
      .status(400)
      .json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const [warning] = await db
    .update(stateWarningsTable)
    .set({
      dismissed: parsed.data.dismissed,
      dismissedAt: parsed.data.dismissed ? new Date() : null,
    })
    .where(
      and(eq(stateWarningsTable.id, params.data.id), eq(stateWarningsTable.userId, req.userId!)),
    )
    .returning();
  if (!warning) {
    res.status(404).json({ error: "Warning not found" });
    return;
  }
  res.json(DismissStateWarningResponse.parse(warning));
});

router.post("/system/validate", async (req, res): Promise<void> => {
  const issues: string[] = [];

  const hubs = await db.select().from(hubsTable);
  if (hubs.length === 0) issues.push("No hubs configured");

  const recentLogs = await db
    .select()
    .from(logsTable)
    .where(eq(logsTable.userId, req.userId!));
  if (recentLogs.length === 0) issues.push("No activity logs found for user");

  res.json(ValidateSystemResponse.parse({ valid: issues.length === 0, issues }));
});

router.post("/ultra-score/calculate", async (req, res): Promise<void> => {
  const parsed = CalculateUltraScoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const stateDate = toDateOnlyString(parsed.data.stateDate) ?? new Date().toISOString().slice(0, 10);

  const conditions = [
    eq(ultraMetricsTable.userId, req.userId!),
    eq(ultraMetricsTable.metricDate, stateDate),
  ];
  if (parsed.data.tenantId) conditions.push(eq(ultraMetricsTable.tenantId, parsed.data.tenantId));

  const metrics = await db
    .select()
    .from(ultraMetricsTable)
    .where(and(...conditions));

  const ultraScore =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
      : 0;

  let state = "stable";
  if (ultraScore >= 80) state = "thriving";
  else if (ultraScore < 40) state = "at_risk";

  const sorted = [...metrics].sort((a, b) => b.value - a.value);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  const [existing] = await db
    .select()
    .from(systemStateDailyTable)
    .where(
      and(
        eq(systemStateDailyTable.userId, req.userId!),
        eq(systemStateDailyTable.stateDate, stateDate),
      ),
    );

  const values: typeof systemStateDailyTable.$inferInsert = {
    userId: req.userId!,
    tenantId: parsed.data.tenantId,
    stateDate,
    ultraScore,
    state,
    priorityZone: weakest ? String(weakest.domainId ?? "") : null,
    strongestHubId: null,
    weakestHubId: null,
    stateReasons: { metricsConsidered: metrics.length },
  };

  const [result] = existing
    ? await db
        .update(systemStateDailyTable)
        .set(values)
        .where(eq(systemStateDailyTable.id, existing.id))
        .returning()
    : await db.insert(systemStateDailyTable).values(values).returning();

  res.json(CalculateUltraScoreResponse.parse(result));
});

export default router;
