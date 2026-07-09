import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  withUserContext,
  challengesTable,
  challengeCompletionsTable,
  xpEventsTable,
  badgesTable,
  userBadgesTable,
} from "@workspace/db";
import { awardXp, checkAndAwardBadges, maybeRecordDailyChallengeCheckin } from "../lib/gamification";
import {
  ListChallengesResponse,
  ListChallengeCompletionsResponse,
  CreateChallengeCompletionBody,
  CreateChallengeCompletionResponse,
  ListXpEventsResponse,
  CreateXpEventBody,
  CreateXpEventResponse,
  ListBadgesResponse,
  ListUserBadgesResponse,
  CreateUserBadgeBody,
  CreateUserBadgeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/challenges", async (_req, res): Promise<void> => {
  const rows = await db.select().from(challengesTable);
  res.json(ListChallengesResponse.parse(rows));
});

router.get("/challenge-completions", async (req, res): Promise<void> => {
  const rows = await withUserContext(req.userId!, (tx) =>
    tx.select().from(challengeCompletionsTable).where(eq(challengeCompletionsTable.userId, req.userId!)),
  );
  res.json(ListChallengeCompletionsResponse.parse(rows));
});

router.post("/challenge-completions", async (req, res): Promise<void> => {
  const parsed = CreateChallengeCompletionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const result = await withUserContext(req.userId!, async (tx) => {
    const [row] = await tx
      .insert(challengeCompletionsTable)
      .values({ ...parsed.data, userId: req.userId! })
      .returning();

    const [challenge] = await tx
      .select()
      .from(challengesTable)
      .where(eq(challengesTable.id, parsed.data.challengeId));
    const xpAwarded = challenge?.xpReward ?? 0;
    await awardXp(tx, req.userId!, "challenge_completed", xpAwarded, "challenge", String(parsed.data.challengeId));

    await maybeRecordDailyChallengeCheckin(tx, req.userId!);
    const newBadges = await checkAndAwardBadges(tx, req.userId!);

    return { row, xpAwarded, newBadges };
  });

  res.status(201).json(
    CreateChallengeCompletionResponse.parse({
      ...result.row,
      xpAwarded: result.xpAwarded,
      newBadges: result.newBadges,
    }),
  );
});

router.get("/xp-events", async (req, res): Promise<void> => {
  const rows = await withUserContext(req.userId!, (tx) =>
    tx.select().from(xpEventsTable).where(eq(xpEventsTable.userId, req.userId!)),
  );
  res.json(ListXpEventsResponse.parse(rows));
});

router.post("/xp-events", async (req, res): Promise<void> => {
  const parsed = CreateXpEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .insert(xpEventsTable)
      .values({ ...parsed.data, userId: req.userId! })
      .returning(),
  );
  res.status(201).json(CreateXpEventResponse.parse(row));
});

router.get("/badges", async (_req, res): Promise<void> => {
  const rows = await db.select().from(badgesTable);
  res.json(ListBadgesResponse.parse(rows));
});

router.get("/user-badges", async (req, res): Promise<void> => {
  const rows = await withUserContext(req.userId!, (tx) =>
    tx.select().from(userBadgesTable).where(eq(userBadgesTable.userId, req.userId!)),
  );
  res.json(ListUserBadgesResponse.parse(rows));
});

router.post("/user-badges", async (req, res): Promise<void> => {
  const parsed = CreateUserBadgeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx
      .insert(userBadgesTable)
      .values({ ...parsed.data, userId: req.userId! })
      .returning(),
  );
  res.status(201).json(CreateUserBadgeResponse.parse(row));
});

export default router;
