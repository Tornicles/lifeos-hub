import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, metricsTable, ultraMetricsTable } from "@workspace/db";
import { toDateOnlyString } from "../lib/dateUtils";
import {
  ListMetricsQueryParams,
  ListMetricsResponse,
  CreateMetricBody,
  CreateMetricResponse,
  DeleteMetricParams,
  ListUltraMetricsQueryParams,
  ListUltraMetricsResponse,
  CreateUltraMetricBody,
  CreateUltraMetricResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/metrics", async (req, res): Promise<void> => {
  const query = ListMetricsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const conditions = [eq(metricsTable.userId, req.userId!)];
  if (query.data.tenantId) conditions.push(eq(metricsTable.tenantId, query.data.tenantId));
  const rows = await db
    .select()
    .from(metricsTable)
    .where(and(...conditions));
  res.json(ListMetricsResponse.parse(rows));
});

router.post("/metrics", async (req, res): Promise<void> => {
  const parsed = CreateMetricBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [metric] = await db
    .insert(metricsTable)
    .values({ ...parsed.data, metricDate: toDateOnlyString(parsed.data.metricDate)!, userId: req.userId! })
    .returning();
  res.status(201).json(CreateMetricResponse.parse(metric));
});

router.delete("/metrics/:id", async (req, res): Promise<void> => {
  const params = DeleteMetricParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [metric] = await db
    .delete(metricsTable)
    .where(and(eq(metricsTable.id, params.data.id), eq(metricsTable.userId, req.userId!)))
    .returning();
  if (!metric) {
    res.status(404).json({ error: "Metric not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/ultra-metrics", async (req, res): Promise<void> => {
  const query = ListUltraMetricsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const conditions = [eq(ultraMetricsTable.userId, req.userId!)];
  if (query.data.tenantId)
    conditions.push(eq(ultraMetricsTable.tenantId, query.data.tenantId));
  const rows = await db
    .select()
    .from(ultraMetricsTable)
    .where(and(...conditions));
  res.json(ListUltraMetricsResponse.parse(rows));
});

router.post("/ultra-metrics", async (req, res): Promise<void> => {
  const parsed = CreateUltraMetricBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [metric] = await db
    .insert(ultraMetricsTable)
    .values({ ...parsed.data, metricDate: toDateOnlyString(parsed.data.metricDate)!, userId: req.userId! })
    .returning();
  res.status(201).json(CreateUltraMetricResponse.parse(metric));
});

export default router;
