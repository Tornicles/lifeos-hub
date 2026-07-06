import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, logsTable } from "@workspace/db";
import { toDateOnlyString } from "../lib/dateUtils";
import {
  ListLogsQueryParams,
  ListLogsResponse,
  CreateLogBody,
  CreateLogResponse,
  UpdateLogParams,
  UpdateLogBody,
  UpdateLogResponse,
  DeleteLogParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/logs", async (req, res): Promise<void> => {
  const query = ListLogsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const conditions = [eq(logsTable.userId, req.userId!)];
  const rows = await db
    .select()
    .from(logsTable)
    .where(and(...conditions));
  res.json(ListLogsResponse.parse(rows));
});

router.post("/logs", async (req, res): Promise<void> => {
  const parsed = CreateLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [log] = await db
    .insert(logsTable)
    .values({ ...parsed.data, logDate: toDateOnlyString(parsed.data.logDate)!, userId: req.userId! })
    .returning();
  res.status(201).json(CreateLogResponse.parse(log));
});

router.patch("/logs/:id", async (req, res): Promise<void> => {
  const params = UpdateLogParams.safeParse(req.params);
  const parsed = UpdateLogBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res
      .status(400)
      .json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const [log] = await db
    .update(logsTable)
    .set(parsed.data)
    .where(and(eq(logsTable.id, params.data.id), eq(logsTable.userId, req.userId!)))
    .returning();
  if (!log) {
    res.status(404).json({ error: "Log not found" });
    return;
  }
  res.json(UpdateLogResponse.parse(log));
});

router.delete("/logs/:id", async (req, res): Promise<void> => {
  const params = DeleteLogParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [log] = await db
    .delete(logsTable)
    .where(and(eq(logsTable.id, params.data.id), eq(logsTable.userId, req.userId!)))
    .returning();
  if (!log) {
    res.status(404).json({ error: "Log not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
