import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, habitsTable, habitCheckinsTable } from "@workspace/db";
import { toDateOnlyString } from "../lib/dateUtils";
import {
  ListHabitsQueryParams,
  ListHabitsResponse,
  CreateHabitBody,
  CreateHabitResponse,
  UpdateHabitParams,
  UpdateHabitBody,
  UpdateHabitResponse,
  DeleteHabitParams,
  ListHabitCheckinsParams,
  ListHabitCheckinsResponse,
  CreateHabitCheckinParams,
  CreateHabitCheckinBody,
  CreateHabitCheckinResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/habits", async (req, res): Promise<void> => {
  const query = ListHabitsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const conditions = [eq(habitsTable.userId, req.userId!)];
  if (query.data.tenantId) conditions.push(eq(habitsTable.tenantId, query.data.tenantId));
  const rows = await db
    .select()
    .from(habitsTable)
    .where(and(...conditions));
  res.json(ListHabitsResponse.parse(rows));
});

router.post("/habits", async (req, res): Promise<void> => {
  const parsed = CreateHabitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [habit] = await db
    .insert(habitsTable)
    .values({ ...parsed.data, userId: req.userId! })
    .returning();
  res.status(201).json(CreateHabitResponse.parse(habit));
});

router.patch("/habits/:id", async (req, res): Promise<void> => {
  const params = UpdateHabitParams.safeParse(req.params);
  const parsed = UpdateHabitBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res
      .status(400)
      .json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const [habit] = await db
    .update(habitsTable)
    .set({ ...parsed.data, lastCheckin: toDateOnlyString(parsed.data.lastCheckin) })
    .where(and(eq(habitsTable.id, params.data.id), eq(habitsTable.userId, req.userId!)))
    .returning();
  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }
  res.json(UpdateHabitResponse.parse(habit));
});

router.delete("/habits/:id", async (req, res): Promise<void> => {
  const params = DeleteHabitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [habit] = await db
    .delete(habitsTable)
    .where(and(eq(habitsTable.id, params.data.id), eq(habitsTable.userId, req.userId!)))
    .returning();
  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/habits/:habitId/checkins", async (req, res): Promise<void> => {
  const params = ListHabitCheckinsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [habit] = await db
    .select()
    .from(habitsTable)
    .where(and(eq(habitsTable.id, params.data.habitId), eq(habitsTable.userId, req.userId!)));
  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }
  const rows = await db
    .select()
    .from(habitCheckinsTable)
    .where(eq(habitCheckinsTable.habitId, params.data.habitId));
  res.json(ListHabitCheckinsResponse.parse(rows));
});

router.post("/habits/:habitId/checkins", async (req, res): Promise<void> => {
  const params = CreateHabitCheckinParams.safeParse(req.params);
  const parsed = CreateHabitCheckinBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res
      .status(400)
      .json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const [habit] = await db
    .select()
    .from(habitsTable)
    .where(and(eq(habitsTable.id, params.data.habitId), eq(habitsTable.userId, req.userId!)));
  if (!habit) {
    res.status(404).json({ error: "Habit not found" });
    return;
  }
  const checkinDate = toDateOnlyString(parsed.data.date)!;
  const [checkin] = await db
    .insert(habitCheckinsTable)
    .values({ ...parsed.data, date: checkinDate, habitId: params.data.habitId })
    .returning();

  const newStreak = parsed.data.done === false ? 0 : habit.streak + 1;
  await db
    .update(habitsTable)
    .set({ streak: newStreak, lastCheckin: checkinDate })
    .where(eq(habitsTable.id, habit.id));

  res.status(201).json(CreateHabitCheckinResponse.parse(checkin));
});

export default router;
