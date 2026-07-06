import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, tenantsTable, membershipsTable } from "@workspace/db";
import {
  ListTenantsResponse,
  CreateTenantBody,
  CreateTenantResponse,
  GetTenantParams,
  GetTenantResponse,
  UpdateTenantParams,
  UpdateTenantBody,
  UpdateTenantResponse,
  DeleteTenantParams,
  ListMembershipsParams,
  ListMembershipsResponse,
  CreateMembershipParams,
  CreateMembershipBody,
  CreateMembershipResponse,
  UpdateMembershipParams,
  UpdateMembershipBody,
  UpdateMembershipResponse,
  DeleteMembershipParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getUserTenantIds(userId: string): Promise<string[]> {
  const rows = await db
    .select({ tenantId: membershipsTable.tenantId })
    .from(membershipsTable)
    .where(eq(membershipsTable.userId, userId));
  return rows.map((r) => r.tenantId);
}

router.get("/tenants", async (req, res): Promise<void> => {
  const tenantIds = await getUserTenantIds(req.userId!);
  if (tenantIds.length === 0) {
    res.json(ListTenantsResponse.parse([]));
    return;
  }
  const tenants = await db.select().from(tenantsTable);
  const filtered = tenants.filter((t) => tenantIds.includes(t.id));
  res.json(ListTenantsResponse.parse(filtered));
});

router.post("/tenants", async (req, res): Promise<void> => {
  const parsed = CreateTenantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [tenant] = await db.insert(tenantsTable).values(parsed.data).returning();
  await db.insert(membershipsTable).values({
    tenantId: tenant.id,
    userId: req.userId!,
    role: "owner",
    status: "active",
  });
  res.status(201).json(CreateTenantResponse.parse(tenant));
});

router.get("/tenants/:id", async (req, res): Promise<void> => {
  const params = GetTenantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.id, params.data.id));
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  res.json(GetTenantResponse.parse(tenant));
});

router.patch("/tenants/:id", async (req, res): Promise<void> => {
  const params = UpdateTenantParams.safeParse(req.params);
  const parsed = UpdateTenantBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res
      .status(400)
      .json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const [tenant] = await db
    .update(tenantsTable)
    .set(parsed.data)
    .where(eq(tenantsTable.id, params.data.id))
    .returning();
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  res.json(UpdateTenantResponse.parse(tenant));
});

router.delete("/tenants/:id", async (req, res): Promise<void> => {
  const params = DeleteTenantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [tenant] = await db
    .delete(tenantsTable)
    .where(eq(tenantsTable.id, params.data.id))
    .returning();
  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/tenants/:tenantId/memberships", async (req, res): Promise<void> => {
  const params = ListMembershipsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(membershipsTable)
    .where(eq(membershipsTable.tenantId, params.data.tenantId));
  res.json(ListMembershipsResponse.parse(rows));
});

router.post("/tenants/:tenantId/memberships", async (req, res): Promise<void> => {
  const params = CreateMembershipParams.safeParse(req.params);
  const parsed = CreateMembershipBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res
      .status(400)
      .json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const [membership] = await db
    .insert(membershipsTable)
    .values({ ...parsed.data, tenantId: params.data.tenantId })
    .returning();
  res.status(201).json(CreateMembershipResponse.parse(membership));
});

router.patch("/memberships/:id", async (req, res): Promise<void> => {
  const params = UpdateMembershipParams.safeParse(req.params);
  const parsed = UpdateMembershipBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res
      .status(400)
      .json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const [membership] = await db
    .update(membershipsTable)
    .set(parsed.data)
    .where(eq(membershipsTable.id, params.data.id))
    .returning();
  if (!membership) {
    res.status(404).json({ error: "Membership not found" });
    return;
  }
  res.json(UpdateMembershipResponse.parse(membership));
});

router.delete("/memberships/:id", async (req, res): Promise<void> => {
  const params = DeleteMembershipParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [membership] = await db
    .delete(membershipsTable)
    .where(eq(membershipsTable.id, params.data.id))
    .returning();
  if (!membership) {
    res.status(404).json({ error: "Membership not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
