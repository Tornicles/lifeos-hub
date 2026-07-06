import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  withUserContext,
  budgetsTable,
  incomeTable,
  expensesTable,
  savingsGoalsTable,
  debtsTable,
  investmentEntriesTable,
  netWorthSnapshotsTable,
} from "@workspace/db";
import { toDateOnlyString } from "../lib/dateUtils";
import {
  ListBudgetsResponse,
  CreateBudgetBody,
  CreateBudgetResponse,
  UpdateBudgetParams,
  UpdateBudgetBody,
  UpdateBudgetResponse,
  DeleteBudgetParams,
  ListIncomeResponse,
  CreateIncomeBody,
  CreateIncomeResponse,
  UpdateIncomeParams,
  UpdateIncomeBody,
  UpdateIncomeResponse,
  DeleteIncomeParams,
  ListExpensesResponse,
  CreateExpenseBody,
  CreateExpenseResponse,
  UpdateExpenseParams,
  UpdateExpenseBody,
  UpdateExpenseResponse,
  DeleteExpenseParams,
  ListSavingsGoalsResponse,
  CreateSavingsGoalBody,
  CreateSavingsGoalResponse,
  UpdateSavingsGoalParams,
  UpdateSavingsGoalBody,
  UpdateSavingsGoalResponse,
  DeleteSavingsGoalParams,
  ListDebtsResponse,
  CreateDebtBody,
  CreateDebtResponse,
  UpdateDebtParams,
  UpdateDebtBody,
  UpdateDebtResponse,
  DeleteDebtParams,
  ListInvestmentEntriesResponse,
  CreateInvestmentEntryBody,
  CreateInvestmentEntryResponse,
  DeleteInvestmentEntryParams,
  ListNetWorthSnapshotsResponse,
  CreateNetWorthSnapshotBody,
  CreateNetWorthSnapshotResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/budgets", async (req, res): Promise<void> => {
  const rows = await withUserContext(req.userId!, (tx) =>
    tx.select().from(budgetsTable).where(eq(budgetsTable.userId, req.userId!)),
  );
  res.json(ListBudgetsResponse.parse(rows));
});

router.post("/budgets", async (req, res): Promise<void> => {
  const parsed = CreateBudgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .insert(budgetsTable)
      .values({ ...parsed.data, userId: req.userId! })
      .returning(),
  );
  res.status(201).json(CreateBudgetResponse.parse(row));
});

router.patch("/budgets/:id", async (req, res): Promise<void> => {
  const params = UpdateBudgetParams.safeParse(req.params);
  const parsed = UpdateBudgetBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .update(budgetsTable)
      .set(parsed.data)
      .where(and(eq(budgetsTable.id, params.data.id), eq(budgetsTable.userId, req.userId!)))
      .returning(),
  );
  if (!row) {
    res.status(404).json({ error: "Budget not found" });
    return;
  }
  res.json(UpdateBudgetResponse.parse(row));
});

router.delete("/budgets/:id", async (req, res): Promise<void> => {
  const params = DeleteBudgetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .delete(budgetsTable)
      .where(and(eq(budgetsTable.id, params.data.id), eq(budgetsTable.userId, req.userId!)))
      .returning(),
  );
  if (!row) {
    res.status(404).json({ error: "Budget not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/income", async (req, res): Promise<void> => {
  const rows = await withUserContext(req.userId!, (tx) =>
    tx.select().from(incomeTable).where(eq(incomeTable.userId, req.userId!)),
  );
  res.json(ListIncomeResponse.parse(rows));
});

router.post("/income", async (req, res): Promise<void> => {
  const parsed = CreateIncomeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .insert(incomeTable)
      .values({
        ...parsed.data,
        userId: req.userId!,
        receivedDate: toDateOnlyString(parsed.data.receivedDate)!,
      })
      .returning(),
  );
  res.status(201).json(CreateIncomeResponse.parse(row));
});

router.patch("/income/:id", async (req, res): Promise<void> => {
  const params = UpdateIncomeParams.safeParse(req.params);
  const parsed = UpdateIncomeBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .update(incomeTable)
      .set({ ...parsed.data, receivedDate: toDateOnlyString(parsed.data.receivedDate) as string | undefined })
      .where(and(eq(incomeTable.id, params.data.id), eq(incomeTable.userId, req.userId!)))
      .returning(),
  );
  if (!row) {
    res.status(404).json({ error: "Income entry not found" });
    return;
  }
  res.json(UpdateIncomeResponse.parse(row));
});

router.delete("/income/:id", async (req, res): Promise<void> => {
  const params = DeleteIncomeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .delete(incomeTable)
      .where(and(eq(incomeTable.id, params.data.id), eq(incomeTable.userId, req.userId!)))
      .returning(),
  );
  if (!row) {
    res.status(404).json({ error: "Income entry not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/expenses", async (req, res): Promise<void> => {
  const rows = await withUserContext(req.userId!, (tx) =>
    tx.select().from(expensesTable).where(eq(expensesTable.userId, req.userId!)),
  );
  res.json(ListExpensesResponse.parse(rows));
});

router.post("/expenses", async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .insert(expensesTable)
      .values({
        ...parsed.data,
        userId: req.userId!,
        expenseDate: toDateOnlyString(parsed.data.expenseDate)!,
      })
      .returning(),
  );
  res.status(201).json(CreateExpenseResponse.parse(row));
});

router.patch("/expenses/:id", async (req, res): Promise<void> => {
  const params = UpdateExpenseParams.safeParse(req.params);
  const parsed = UpdateExpenseBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .update(expensesTable)
      .set({ ...parsed.data, expenseDate: toDateOnlyString(parsed.data.expenseDate) as string | undefined })
      .where(and(eq(expensesTable.id, params.data.id), eq(expensesTable.userId, req.userId!)))
      .returning(),
  );
  if (!row) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  res.json(UpdateExpenseResponse.parse(row));
});

router.delete("/expenses/:id", async (req, res): Promise<void> => {
  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .delete(expensesTable)
      .where(and(eq(expensesTable.id, params.data.id), eq(expensesTable.userId, req.userId!)))
      .returning(),
  );
  if (!row) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  res.sendStatus(204);
});

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

router.get("/investments", async (req, res): Promise<void> => {
  const rows = await withUserContext(req.userId!, (tx) =>
    tx.select().from(investmentEntriesTable).where(eq(investmentEntriesTable.userId, req.userId!)),
  );
  res.json(ListInvestmentEntriesResponse.parse(rows));
});

router.post("/investments", async (req, res): Promise<void> => {
  const parsed = CreateInvestmentEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .insert(investmentEntriesTable)
      .values({
        ...parsed.data,
        userId: req.userId!,
        entryDate: toDateOnlyString(parsed.data.entryDate)!,
      })
      .returning(),
  );
  res.status(201).json(CreateInvestmentEntryResponse.parse(row));
});

router.delete("/investments/:id", async (req, res): Promise<void> => {
  const params = DeleteInvestmentEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .delete(investmentEntriesTable)
      .where(and(eq(investmentEntriesTable.id, params.data.id), eq(investmentEntriesTable.userId, req.userId!)))
      .returning(),
  );
  if (!row) {
    res.status(404).json({ error: "Investment entry not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/net-worth-snapshots", async (req, res): Promise<void> => {
  const rows = await withUserContext(req.userId!, (tx) =>
    tx.select().from(netWorthSnapshotsTable).where(eq(netWorthSnapshotsTable.userId, req.userId!)),
  );
  res.json(ListNetWorthSnapshotsResponse.parse(rows));
});

router.post("/net-worth-snapshots", async (req, res): Promise<void> => {
  const parsed = CreateNetWorthSnapshotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .insert(netWorthSnapshotsTable)
      .values({
        ...parsed.data,
        userId: req.userId!,
        snapshotDate: toDateOnlyString(parsed.data.snapshotDate)!,
      })
      .returning(),
  );
  res.status(201).json(CreateNetWorthSnapshotResponse.parse(row));
});

export default router;
