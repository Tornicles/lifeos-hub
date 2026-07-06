import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  notificationsTable,
  notificationPreferencesTable,
  stateWarningsTable,
} from "@workspace/db";
import {
  ListNotificationsResponse,
  UpdateNotificationParams,
  UpdateNotificationBody,
  UpdateNotificationResponse,
  DeleteNotificationParams,
  GetNotificationPreferencesResponse,
  UpdateNotificationPreferencesBody,
  UpdateNotificationPreferencesResponse,
  GenerateNotificationsResponse,
  ProcessNotificationsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.userId!));
  res.json(ListNotificationsResponse.parse(rows));
});

router.patch("/notifications/:id", async (req, res): Promise<void> => {
  const params = UpdateNotificationParams.safeParse(req.params);
  const parsed = UpdateNotificationBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res
      .status(400)
      .json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const values: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.isRead) values.readAt = new Date();
  if (parsed.data.isResolved) values.resolvedAt = new Date();

  const [notification] = await db
    .update(notificationsTable)
    .set(values)
    .where(
      and(eq(notificationsTable.id, params.data.id), eq(notificationsTable.userId, req.userId!)),
    )
    .returning();
  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(UpdateNotificationResponse.parse(notification));
});

router.delete("/notifications/:id", async (req, res): Promise<void> => {
  const params = DeleteNotificationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [notification] = await db
    .delete(notificationsTable)
    .where(
      and(eq(notificationsTable.id, params.data.id), eq(notificationsTable.userId, req.userId!)),
    )
    .returning();
  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/notifications/preferences", async (req, res): Promise<void> => {
  const [existing] = await db
    .select()
    .from(notificationPreferencesTable)
    .where(eq(notificationPreferencesTable.userId, req.userId!));

  const prefs =
    existing ??
    (
      await db
        .insert(notificationPreferencesTable)
        .values({ userId: req.userId! })
        .onConflictDoNothing()
        .returning()
    )[0] ??
    (
      await db
        .select()
        .from(notificationPreferencesTable)
        .where(eq(notificationPreferencesTable.userId, req.userId!))
    )[0];

  res.json(GetNotificationPreferencesResponse.parse(prefs));
});

router.patch("/notifications/preferences", async (req, res): Promise<void> => {
  const parsed = UpdateNotificationPreferencesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [prefs] = await db
    .update(notificationPreferencesTable)
    .set(parsed.data)
    .where(eq(notificationPreferencesTable.userId, req.userId!))
    .returning();
  if (!prefs) {
    res.status(404).json({ error: "Preferences not found" });
    return;
  }
  res.json(UpdateNotificationPreferencesResponse.parse(prefs));
});

router.post("/notifications/generate", async (req, res): Promise<void> => {
  const warnings = await db
    .select()
    .from(stateWarningsTable)
    .where(and(eq(stateWarningsTable.userId, req.userId!), eq(stateWarningsTable.dismissed, false)));

  const created = [];
  for (const warning of warnings) {
    const [notification] = await db
      .insert(notificationsTable)
      .values({
        userId: req.userId!,
        tenantId: warning.tenantId,
        type: warning.warningType,
        title: "State warning",
        message: warning.warningText,
        severity: warning.severity ?? "medium",
        relatedEntityType: "state_warning",
        relatedEntityId: String(warning.id),
      })
      .returning();
    created.push(notification);
  }

  res.json(GenerateNotificationsResponse.parse(created));
});

router.post("/notifications/process", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, req.userId!), eq(notificationsTable.isRead, false)));

  res.json(ProcessNotificationsResponse.parse({ processed: rows.length }));
});

export default router;
