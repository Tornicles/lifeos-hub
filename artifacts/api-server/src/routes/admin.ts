import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import {
  db,
  adminSettingsTable,
  auditLogsTable,
  profilesTable,
  tenantsTable,
  hubsTable,
  logsTable,
} from "@workspace/db";
import {
  ListAdminSettingsResponse,
  UpsertAdminSettingBody,
  UpsertAdminSettingResponse,
  ListAuditLogsResponse,
  GetAdminStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/settings", async (_req, res): Promise<void> => {
  const rows = await db.select().from(adminSettingsTable);
  res.json(ListAdminSettingsResponse.parse(rows));
});

router.post("/admin/settings", async (req, res): Promise<void> => {
  const parsed = UpsertAdminSettingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [setting] = await db
    .insert(adminSettingsTable)
    .values({ settingKey: parsed.data.settingKey, settingValue: parsed.data.settingValue, description: parsed.data.description, updatedBy: req.userId! })
    .onConflictDoUpdate({
      target: adminSettingsTable.settingKey,
      set: {
        settingValue: parsed.data.settingValue,
        description: parsed.data.description,
        updatedBy: req.userId!,
      },
    })
    .returning();
  res.json(UpsertAdminSettingResponse.parse(setting));
});

router.get("/admin/audit-logs", async (_req, res): Promise<void> => {
  const rows = await db.select().from(auditLogsTable);
  res.json(ListAuditLogsResponse.parse(rows));
});

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [{ count: totalUsers }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(profilesTable);
  const [{ count: totalTenants }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tenantsTable);
  const [{ count: activeHubs }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(hubsTable)
    .where(eq(hubsTable.isActive, true));
  const today = new Date().toISOString().slice(0, 10);
  const [{ count: logsToday }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(logsTable)
    .where(eq(logsTable.logDate, today));

  res.json(
    GetAdminStatsResponse.parse({
      totalUsers,
      totalTenants,
      activeHubs,
      avgUltraScore: null,
      logsToday,
    }),
  );
});

export default router;
