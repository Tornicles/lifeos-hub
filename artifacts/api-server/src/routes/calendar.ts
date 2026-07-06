import { Router, type IRouter } from "express";
import { and, eq, gte, lt } from "drizzle-orm";
import { db, calendarEntriesTable, habitsTable } from "@workspace/db";
import { toDateOnlyString } from "../lib/dateUtils";
import {
  ListCalendarEntriesQueryParams,
  ListCalendarEntriesResponse,
  CreateCalendarEntryBody,
  CreateCalendarEntryResponse,
  UpdateCalendarEntryParams,
  UpdateCalendarEntryBody,
  UpdateCalendarEntryResponse,
  DeleteCalendarEntryParams,
  AutofillCalendarBody,
  AutofillCalendarResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/calendar-entries", async (req, res): Promise<void> => {
  const query = ListCalendarEntriesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const conditions = [eq(calendarEntriesTable.userId, req.userId!)];
  const rows = await db
    .select()
    .from(calendarEntriesTable)
    .where(and(...conditions));
  res.json(ListCalendarEntriesResponse.parse(rows));
});

router.post("/calendar-entries", async (req, res): Promise<void> => {
  const parsed = CreateCalendarEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [entry] = await db
    .insert(calendarEntriesTable)
    .values({ ...parsed.data, date: toDateOnlyString(parsed.data.date)!, userId: req.userId! })
    .returning();
  res.status(201).json(CreateCalendarEntryResponse.parse(entry));
});

router.patch("/calendar-entries/:id", async (req, res): Promise<void> => {
  const params = UpdateCalendarEntryParams.safeParse(req.params);
  const parsed = UpdateCalendarEntryBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res
      .status(400)
      .json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const [entry] = await db
    .update(calendarEntriesTable)
    .set({ ...parsed.data, date: toDateOnlyString(parsed.data.date) ?? undefined })
    .where(
      and(
        eq(calendarEntriesTable.id, params.data.id),
        eq(calendarEntriesTable.userId, req.userId!),
      ),
    )
    .returning();
  if (!entry) {
    res.status(404).json({ error: "Calendar entry not found" });
    return;
  }
  res.json(UpdateCalendarEntryResponse.parse(entry));
});

router.delete("/calendar-entries/:id", async (req, res): Promise<void> => {
  const params = DeleteCalendarEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [entry] = await db
    .delete(calendarEntriesTable)
    .where(
      and(
        eq(calendarEntriesTable.id, params.data.id),
        eq(calendarEntriesTable.userId, req.userId!),
      ),
    )
    .returning();
  if (!entry) {
    res.status(404).json({ error: "Calendar entry not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/calendar/autofill", async (req, res): Promise<void> => {
  const parsed = AutofillCalendarBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const habits = await db
    .select()
    .from(habitsTable)
    .where(eq(habitsTable.userId, req.userId!));

  const created = [];
  const start = new Date(parsed.data.weekStart);
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(start);
    day.setDate(day.getDate() + dayOffset);
    const dateStr = day.toISOString().slice(0, 10);
    for (const habit of habits) {
      const [entry] = await db
        .insert(calendarEntriesTable)
        .values({
          userId: req.userId!,
          title: habit.name,
          description: `Auto-scheduled habit: ${habit.name}`,
          date: dateStr,
          focusDomain: "habit",
        })
        .returning();
      created.push(entry);
    }
  }

  res.json(AutofillCalendarResponse.parse({ created }));
});

export default router;
