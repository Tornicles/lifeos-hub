import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  automationRulesTable,
  userAutomationSettingsTable,
  automationTriggerEventsTable,
  automationActionQueueTable,
  automationLogsTable,
  automationExecutionsTable,
} from "@workspace/db";
import {
  ListAutomationRulesResponse,
  CreateAutomationRuleBody,
  CreateAutomationRuleResponse,
  UpdateAutomationRuleParams,
  UpdateAutomationRuleBody,
  UpdateAutomationRuleResponse,
  DeleteAutomationRuleParams,
  GetAutomationSettingsResponse,
  UpdateAutomationSettingsBody,
  UpdateAutomationSettingsResponse,
  ListAutomationTriggerEventsResponse,
  CreateAutomationTriggerEventBody,
  CreateAutomationTriggerEventResponse,
  ListAutomationQueueResponse,
  ListAutomationLogsResponse,
  ListAutomationExecutionsResponse,
  EvaluateAutomationResponse,
  TriggerAutomationBody,
  TriggerAutomationResponse,
  ProcessAutomationQueueResponse,
  ResolveAutomationConflictsResponse,
  ProcessDataFlowResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ---------- Rules ----------
router.get("/automation/rules", async (_req, res): Promise<void> => {
  const rows = await db.select().from(automationRulesTable);
  res.json(ListAutomationRulesResponse.parse(rows));
});

router.post("/automation/rules", async (req, res): Promise<void> => {
  const parsed = CreateAutomationRuleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [rule] = await db.insert(automationRulesTable).values(parsed.data).returning();
  res.status(201).json(CreateAutomationRuleResponse.parse(rule));
});

router.patch("/automation/rules/:id", async (req, res): Promise<void> => {
  const params = UpdateAutomationRuleParams.safeParse(req.params);
  const parsed = UpdateAutomationRuleBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res
      .status(400)
      .json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const [rule] = await db
    .update(automationRulesTable)
    .set({ ...parsed.data, version: undefined })
    .where(eq(automationRulesTable.id, params.data.id))
    .returning();
  if (!rule) {
    res.status(404).json({ error: "Rule not found" });
    return;
  }
  res.json(UpdateAutomationRuleResponse.parse(rule));
});

router.delete("/automation/rules/:id", async (req, res): Promise<void> => {
  const params = DeleteAutomationRuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [rule] = await db
    .delete(automationRulesTable)
    .where(eq(automationRulesTable.id, params.data.id))
    .returning();
  if (!rule) {
    res.status(404).json({ error: "Rule not found" });
    return;
  }
  res.sendStatus(204);
});

// ---------- Settings ----------
router.get("/automation/settings", async (req, res): Promise<void> => {
  const [existing] = await db
    .select()
    .from(userAutomationSettingsTable)
    .where(eq(userAutomationSettingsTable.userId, req.userId!));

  const settings =
    existing ??
    (
      await db
        .insert(userAutomationSettingsTable)
        .values({ userId: req.userId! })
        .onConflictDoNothing()
        .returning()
    )[0] ??
    (
      await db
        .select()
        .from(userAutomationSettingsTable)
        .where(eq(userAutomationSettingsTable.userId, req.userId!))
    )[0];

  res.json(GetAutomationSettingsResponse.parse(settings));
});

router.patch("/automation/settings", async (req, res): Promise<void> => {
  const parsed = UpdateAutomationSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [settings] = await db
    .update(userAutomationSettingsTable)
    .set(parsed.data)
    .where(eq(userAutomationSettingsTable.userId, req.userId!))
    .returning();
  if (!settings) {
    res.status(404).json({ error: "Settings not found" });
    return;
  }
  res.json(UpdateAutomationSettingsResponse.parse(settings));
});

// ---------- Trigger events ----------
router.get("/automation/trigger-events", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(automationTriggerEventsTable)
    .where(eq(automationTriggerEventsTable.userId, req.userId!));
  res.json(ListAutomationTriggerEventsResponse.parse(rows));
});

router.post("/automation/trigger-events", async (req, res): Promise<void> => {
  const parsed = CreateAutomationTriggerEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [event] = await db
    .insert(automationTriggerEventsTable)
    .values({ ...parsed.data, userId: req.userId! })
    .returning();
  res.status(201).json(CreateAutomationTriggerEventResponse.parse(event));
});

// ---------- Read-only observability ----------
router.get("/automation/queue", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(automationActionQueueTable)
    .where(eq(automationActionQueueTable.userId, req.userId!));
  res.json(ListAutomationQueueResponse.parse(rows));
});

router.get("/automation/logs", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(automationLogsTable)
    .where(eq(automationLogsTable.userId, req.userId!));
  res.json(ListAutomationLogsResponse.parse(rows));
});

router.get("/automation/executions", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(automationExecutionsTable)
    .where(eq(automationExecutionsTable.userId, req.userId!));
  res.json(ListAutomationExecutionsResponse.parse(rows));
});

// NOTE: `/automation/auto-actions` (GET/PATCH) previously read/wrote
// `auto_actions_table`, which was dropped in the Tech-Tate schema migration.
// Removed pending a replacement design in a later pass.

// ---------- Automation engine action endpoints ----------

// NOTE: previously evaluated rules against `ultra_metrics_table`, which was
// dropped in the Tech-Tate schema migration. This now evaluates rules with
// no metrics data available (always queues 0 actions) pending a replacement
// metrics source (e.g. the new finance/academy/gamification tables) in a
// later pass. This directly degrades the Dashboard's "ultra score"/automation
// evaluate feature.
router.post("/automation/evaluate", async (req, res): Promise<void> => {
  const rules = await db
    .select()
    .from(automationRulesTable)
    .where(eq(automationRulesTable.isActive, true));

  res.json(
    EvaluateAutomationResponse.parse({ rulesEvaluated: rules.length, actionsQueued: 0 }),
  );
});

router.post("/automation/trigger", async (req, res): Promise<void> => {
  const parsed = TriggerAutomationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db.insert(automationTriggerEventsTable).values({
    userId: req.userId!,
    triggerType: parsed.data.triggerType,
    triggerSource: parsed.data.triggerSource ?? "manual",
    triggerData: parsed.data.triggerData ?? {},
  });

  await db.insert(automationExecutionsTable).values({
    userId: req.userId!,
    triggerType: parsed.data.triggerType,
    conditionsMet: {},
    actionsExecuted: {},
    executionResult: "triggered",
  });

  res.json(ProcessAutomationQueueResponse.parse({ processed: 1 }));
});

router.post("/automation/process", async (req, res): Promise<void> => {
  const pending = await db
    .select()
    .from(automationActionQueueTable)
    .where(
      and(
        eq(automationActionQueueTable.userId, req.userId!),
        eq(automationActionQueueTable.status, "pending"),
      ),
    );

  for (const item of pending) {
    await db
      .update(automationActionQueueTable)
      .set({ status: "executed", executedAt: new Date() })
      .where(eq(automationActionQueueTable.id, item.id));
  }

  // NOTE: previously also wrote a row to `auto_actions_table` (dropped in the
  // Tech-Tate schema migration) per processed queue item. That side effect
  // is gone pending a replacement design in a later pass.

  res.json(ProcessAutomationQueueResponse.parse({ processed: pending.length }));
});

router.post("/automation/resolve-conflicts", async (req, res): Promise<void> => {
  const rules = await db
    .select()
    .from(automationRulesTable)
    .where(eq(automationRulesTable.isActive, true));

  const groups = new Map<string, typeof rules>();
  for (const rule of rules) {
    if (!rule.conflictGroup) continue;
    const group = groups.get(rule.conflictGroup) ?? [];
    group.push(rule);
    groups.set(rule.conflictGroup, group);
  }

  let resolved = 0;
  for (const [, group] of groups) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    for (const loser of sorted.slice(1)) {
      await db
        .update(automationRulesTable)
        .set({ isActive: false })
        .where(eq(automationRulesTable.id, loser.id));
      resolved++;
    }
  }

  res.json(ResolveAutomationConflictsResponse.parse({ processed: resolved }));
});

router.post("/data-flow/process", async (req, res): Promise<void> => {
  const events = await db
    .select()
    .from(automationTriggerEventsTable)
    .where(
      and(
        eq(automationTriggerEventsTable.userId, req.userId!),
        eq(automationTriggerEventsTable.processed, false),
      ),
    );

  for (const event of events) {
    await db
      .update(automationTriggerEventsTable)
      .set({ processed: true })
      .where(eq(automationTriggerEventsTable.id, event.id));
  }

  res.json(ProcessDataFlowResponse.parse({ processed: events.length }));
});

export default router;
