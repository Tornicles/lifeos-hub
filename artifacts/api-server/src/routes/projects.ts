import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, projectsTable, tasksTable } from "@workspace/db";
import { toDateOnlyString } from "../lib/dateUtils";
import {
  ListProjectsQueryParams,
  ListProjectsResponse,
  CreateProjectBody,
  CreateProjectResponse,
  GetProjectParams,
  GetProjectResponse,
  UpdateProjectParams,
  UpdateProjectBody,
  UpdateProjectResponse,
  DeleteProjectParams,
  ListTasksParams,
  ListTasksResponse,
  CreateTaskParams,
  CreateTaskBody,
  CreateTaskResponse,
  UpdateTaskParams,
  UpdateTaskBody,
  UpdateTaskResponse,
  DeleteTaskParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function findOwnedProject(userId: string, id: number) {
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)));
  return project;
}

router.get("/projects", async (req, res): Promise<void> => {
  const query = ListProjectsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const conditions = [eq(projectsTable.userId, req.userId!)];
  if (query.data.tenantId) conditions.push(eq(projectsTable.tenantId, query.data.tenantId));
  const rows = await db
    .select()
    .from(projectsTable)
    .where(and(...conditions));
  res.json(ListProjectsResponse.parse(rows));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [project] = await db
    .insert(projectsTable)
    .values({ ...parsed.data, dueDate: toDateOnlyString(parsed.data.dueDate), userId: req.userId! })
    .returning();
  res.status(201).json(CreateProjectResponse.parse(project));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const project = await findOwnedProject(req.userId!, params.data.id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(GetProjectResponse.parse(project));
});

router.patch("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res
      .status(400)
      .json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const [project] = await db
    .update(projectsTable)
    .set({ ...parsed.data, dueDate: toDateOnlyString(parsed.data.dueDate) })
    .where(and(eq(projectsTable.id, params.data.id), eq(projectsTable.userId, req.userId!)))
    .returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(UpdateProjectResponse.parse(project));
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [project] = await db
    .delete(projectsTable)
    .where(and(eq(projectsTable.id, params.data.id), eq(projectsTable.userId, req.userId!)))
    .returning();
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/projects/:projectId/tasks", async (req, res): Promise<void> => {
  const params = ListTasksParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const project = await findOwnedProject(req.userId!, params.data.projectId);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const rows = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.projectId, params.data.projectId));
  res.json(ListTasksResponse.parse(rows));
});

router.post("/projects/:projectId/tasks", async (req, res): Promise<void> => {
  const params = CreateTaskParams.safeParse(req.params);
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res
      .status(400)
      .json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const project = await findOwnedProject(req.userId!, params.data.projectId);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const [task] = await db
    .insert(tasksTable)
    .values({ ...parsed.data, dueDate: toDateOnlyString(parsed.data.dueDate), projectId: params.data.projectId })
    .returning();
  res.status(201).json(CreateTaskResponse.parse(task));
});

async function findOwnedTask(userId: string, taskId: number) {
  const [row] = await db
    .select({ task: tasksTable, ownerId: projectsTable.userId })
    .from(tasksTable)
    .innerJoin(projectsTable, eq(tasksTable.projectId, projectsTable.id))
    .where(and(eq(tasksTable.id, taskId), eq(projectsTable.userId, userId)));
  return row?.task;
}

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res
      .status(400)
      .json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const existing = await findOwnedTask(req.userId!, params.data.id);
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const [task] = await db
    .update(tasksTable)
    .set({ ...parsed.data, dueDate: toDateOnlyString(parsed.data.dueDate) })
    .where(eq(tasksTable.id, params.data.id))
    .returning();
  res.json(UpdateTaskResponse.parse(task));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const existing = await findOwnedTask(req.userId!, params.data.id);
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  await db.delete(tasksTable).where(eq(tasksTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
