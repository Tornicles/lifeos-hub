import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { withUserContext, subscriptionsTable } from "@workspace/db";
import {
  GetMySubscriptionResponse,
  UpsertMySubscriptionBody,
  UpsertMySubscriptionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/subscriptions/me", async (req, res): Promise<void> => {
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, req.userId!)),
  );
  if (!row) {
    res.status(404).json({ error: "No subscription found" });
    return;
  }
  res.json(GetMySubscriptionResponse.parse(row));
});

router.put("/subscriptions/me", async (req, res): Promise<void> => {
  const parsed = UpsertMySubscriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .insert(subscriptionsTable)
      .values({ ...parsed.data, userId: req.userId! })
      .onConflictDoUpdate({
        target: subscriptionsTable.userId,
        set: parsed.data,
      })
      .returning(),
  );
  res.json(UpsertMySubscriptionResponse.parse(row));
});

export default router;
