import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  withUserContext,
  savingsGoalsTable,
  savingsGoalContributionsTable,
  debtsTable,
  savingsChallengesTable,
  shareableCardsTable,
  habitsTable,
  habitCheckinsTable,
} from "@workspace/db";
import { toDateOnlyString } from "../lib/dateUtils";
import {
  ListSavingsGoalsResponse,
  CreateSavingsGoalBody,
  CreateSavingsGoalResponse,
  UpdateSavingsGoalParams,
  UpdateSavingsGoalBody,
  UpdateSavingsGoalResponse,
  DeleteSavingsGoalParams,
  ListSavingsGoalContributionsParams,
  ListSavingsGoalContributionsResponse,
  CreateSavingsGoalContributionParams,
  CreateSavingsGoalContributionBody,
  CreateSavingsGoalContributionResponse,
  ListDebtsResponse,
  CreateDebtBody,
  CreateDebtResponse,
  UpdateDebtParams,
  UpdateDebtBody,
  UpdateDebtResponse,
  DeleteDebtParams,
  ListSavingsChallengesResponse,
  CreateSavingsChallengeBody,
  CreateSavingsChallengeResponse,
  CheckInSavingsChallengeParams,
  ListShareableCardsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/savings-goals", async (req, res): Promise<void> => {
  const rows = await withUserContext(req.userId!, (tx) =>
    tx.select().from(savingsGoalsTable).where(eq(savingsGoalsTable.userId, req.userId!)),
  );
  res.json(ListSavingsGoalsResponse.parse(rows));
});

router.post("/savings-goals", async (req, res): Promise<void> => {
  const parsed = CreateSavingsGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .insert(savingsGoalsTable)
      .values({
        ...parsed.data,
        userId: req.userId!,
        targetDate: toDateOnlyString(parsed.data.targetDate),
      })
      .returning(),
  );
  res.status(201).json(CreateSavingsGoalResponse.parse(row));
});

router.patch("/savings-goals/:id", async (req, res): Promise<void> => {
  const params = UpdateSavingsGoalParams.safeParse(req.params);
  const parsed = UpdateSavingsGoalBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .update(savingsGoalsTable)
      .set({ ...parsed.data, targetDate: toDateOnlyString(parsed.data.targetDate) })
      .where(and(eq(savingsGoalsTable.id, params.data.id), eq(savingsGoalsTable.userId, req.userId!)))
      .returning(),
  );
  if (!row) {
    res.status(404).json({ error: "Savings goal not found" });
    return;
  }
  res.json(UpdateSavingsGoalResponse.parse(row));
});

router.delete("/savings-goals/:id", async (req, res): Promise<void> => {
  const params = DeleteSavingsGoalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .delete(savingsGoalsTable)
      .where(and(eq(savingsGoalsTable.id, params.data.id), eq(savingsGoalsTable.userId, req.userId!)))
      .returning(),
  );
  if (!row) {
    res.status(404).json({ error: "Savings goal not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/savings-goals/:id/contributions", async (req, res): Promise<void> => {
  const params = ListSavingsGoalContributionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await withUserContext(req.userId!, (tx) =>
    tx
      .select()
      .from(savingsGoalContributionsTable)
      .where(eq(savingsGoalContributionsTable.goalId, params.data.id)),
  );
  res.json(ListSavingsGoalContributionsResponse.parse(rows));
});

router.post("/savings-goals/:id/contributions", async (req, res): Promise<void> => {
  const params = CreateSavingsGoalContributionParams.safeParse(req.params);
  const parsed = CreateSavingsGoalContributionBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const result = await withUserContext(req.userId!, async (tx) => {
    // RLS scopes this select to the owner or, if the goal is shared, either
    // partner in the linked couple — so a 0-row result means "not visible to
    // this user", which we treat the same as not found.
    const [goal] = await tx.select().from(savingsGoalsTable).where(eq(savingsGoalsTable.id, params.data.id));
    if (!goal) return null;

    await tx.insert(savingsGoalContributionsTable).values({
      goalId: goal.id,
      userId: req.userId!,
      amount: parsed.data.amount,
      note: parsed.data.note,
    });

    const newAmount = (parseFloat(goal.currentAmount) + parseFloat(parsed.data.amount)).toFixed(2);
    const [updated] = await tx
      .update(savingsGoalsTable)
      .set({ currentAmount: newAmount })
      .where(eq(savingsGoalsTable.id, goal.id))
      .returning();
    return updated;
  });
  if (!result) {
    res.status(404).json({ error: "Savings goal not found" });
    return;
  }
  res.status(201).json(CreateSavingsGoalContributionResponse.parse(result));
});

router.get("/debts", async (req, res): Promise<void> => {
  const rows = await withUserContext(req.userId!, (tx) =>
    tx.select().from(debtsTable).where(eq(debtsTable.userId, req.userId!)),
  );
  res.json(ListDebtsResponse.parse(rows));
});

router.post("/debts", async (req, res): Promise<void> => {
  const parsed = CreateDebtBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .insert(debtsTable)
      .values({ ...parsed.data, userId: req.userId! })
      .returning(),
  );
  res.status(201).json(CreateDebtResponse.parse(row));
});

router.patch("/debts/:id", async (req, res): Promise<void> => {
  const params = UpdateDebtParams.safeParse(req.params);
  const parsed = UpdateDebtBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .update(debtsTable)
      .set(parsed.data)
      .where(and(eq(debtsTable.id, params.data.id), eq(debtsTable.userId, req.userId!)))
      .returning(),
  );
  if (!row) {
    res.status(404).json({ error: "Debt not found" });
    return;
  }
  res.json(UpdateDebtResponse.parse(row));
});

router.delete("/debts/:id", async (req, res): Promise<void> => {
  const params = DeleteDebtParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .delete(debtsTable)
      .where(and(eq(debtsTable.id, params.data.id), eq(debtsTable.userId, req.userId!)))
      .returning(),
  );
  if (!row) {
    res.status(404).json({ error: "Debt not found" });
    return;
  }
  res.sendStatus(204);
});

const SAVINGS_CHALLENGE_HABIT_PREFIX = "Savings Challenge: ";

router.get("/savings-challenges", async (req, res): Promise<void> => {
  const rows = await withUserContext(req.userId!, (tx) =>
    tx.select().from(savingsChallengesTable).where(eq(savingsChallengesTable.userId, req.userId!)),
  );
  res.json(ListSavingsChallengesResponse.parse(rows));
});

router.post("/savings-challenges", async (req, res): Promise<void> => {
  const parsed = CreateSavingsChallengeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const row = await withUserContext(req.userId!, async (tx) => {
    const [habit] = await tx
      .insert(habitsTable)
      .values({
        userId: req.userId!,
        name: `${SAVINGS_CHALLENGE_HABIT_PREFIX}${parsed.data.name}`,
        description: `Daily check-in for the "${parsed.data.name}" savings challenge.`,
      })
      .returning();

    const [challenge] = await tx
      .insert(savingsChallengesTable)
      .values({
        ...parsed.data,
        userId: req.userId!,
        habitId: habit.id,
        startDate: toDateOnlyString(parsed.data.startDate)!,
      })
      .returning();
    return challenge;
  });
  res.status(201).json(CreateSavingsChallengeResponse.parse(row));
});

router.post("/savings-challenges/:id/check-in", async (req, res): Promise<void> => {
  const params = CheckInSavingsChallengeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const amount = typeof req.body?.amount === "string" ? req.body.amount : undefined;

  const result = await withUserContext(req.userId!, async (tx) => {
    const [challenge] = await tx
      .select()
      .from(savingsChallengesTable)
      .where(and(eq(savingsChallengesTable.id, params.data.id), eq(savingsChallengesTable.userId, req.userId!)));
    if (!challenge) return null;

    const newSaved = (parseFloat(challenge.savedAmount) + parseFloat(amount ?? "0")).toFixed(2);
    const reachedGoal = parseFloat(newSaved) >= parseFloat(challenge.targetAmount);
    const wasAlreadyComplete = challenge.status === "completed";

    const [updated] = await tx
      .update(savingsChallengesTable)
      .set({ savedAmount: newSaved, status: reachedGoal ? "completed" : challenge.status })
      .where(eq(savingsChallengesTable.id, challenge.id))
      .returning();

    if (challenge.habitId) {
      const today = toDateOnlyString(new Date())!;
      const [habit] = await tx.select().from(habitsTable).where(eq(habitsTable.id, challenge.habitId));
      if (habit && habit.lastCheckin !== today) {
        const [existingCheckin] = await tx
          .select()
          .from(habitCheckinsTable)
          .where(and(eq(habitCheckinsTable.habitId, habit.id), eq(habitCheckinsTable.date, today)));
        if (!existingCheckin) {
          await tx.insert(habitCheckinsTable).values({ habitId: habit.id, date: today, done: true });
          await tx
            .update(habitsTable)
            .set({ streak: habit.streak + 1, lastCheckin: today })
            .where(eq(habitsTable.id, habit.id));
        }
      }
    }

    if (reachedGoal && !wasAlreadyComplete) {
      await tx.insert(shareableCardsTable).values({
        userId: req.userId!,
        cardType: "savings_challenge_complete",
        title: `Challenge complete: ${challenge.name}`,
        subtitle: `Saved $${newSaved} in ${challenge.durationDays} days`,
        sourceType: "savings_challenge",
        sourceId: challenge.id,
      });
    }

    return updated;
  });

  if (!result) {
    res.status(404).json({ error: "Savings challenge not found" });
    return;
  }
  res.json(CreateSavingsChallengeResponse.parse(result));
});

router.get("/shareable-cards", async (req, res): Promise<void> => {
  const rows = await withUserContext(req.userId!, (tx) =>
    tx.select().from(shareableCardsTable).where(eq(shareableCardsTable.userId, req.userId!)),
  );
  res.json(ListShareableCardsResponse.parse(rows));
});

export default router;
