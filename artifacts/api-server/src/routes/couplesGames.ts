import { Router, type IRouter } from "express";
import { and, eq, or, desc, inArray, sql } from "drizzle-orm";
import {
  db,
  withUserContext,
  couplesTable,
  gamesTable,
  gameSessionsTable,
  gameResponsesTable,
  quizQuestionsTable,
  xpEventsTable,
  habitsTable,
  savingsGoalsTable,
} from "@workspace/db";
import {
  ListGamesResponse,
  ListGameSessionsParams,
  ListGameSessionsResponse,
  CreateGameSessionParams,
  CreateGameSessionBody,
  CreateGameSessionResponse,
  GetGameSessionParams,
  GetGameSessionResponse,
  CreateGameResponseParams,
  CreateGameResponseBody,
  CreateGameResponseResponse,
  GetHouseholdDashboardParams,
  GetHouseholdDashboardResponse,
} from "@workspace/api-zod";
import { awardXp } from "../lib/gamification";

const router: IRouter = Router();

const GAME_COMPLETE_XP = 15;

function expectedResponseCount(game: { mechanicType: string; config: any }): number {
  switch (game.mechanicType) {
    case "simultaneous_reveal":
      return (game.config.questions?.length ?? 0) * 2;
    case "point_allocation":
      return 2; // one allocation submission per partner
    case "guess": {
      // one "answer" + one "guess" per question, per pair of partners
      return (game.config.questions?.length ?? 0) * 2;
    }
    case "head_to_head_quiz":
      return undefined as unknown as number; // determined dynamically from quiz question count
    default:
      return 0;
  }
}

async function getCoupleForUser(tx: typeof db, coupleId: string, userId: string) {
  const [couple] = await tx.select().from(couplesTable).where(eq(couplesTable.id, coupleId));
  if (!couple) return null;
  if (couple.userAId !== userId && couple.userBId !== userId) return null;
  if (couple.status !== "active") return null;
  return couple;
}

router.get("/games", async (_req, res): Promise<void> => {
  const rows = await db.select().from(gamesTable);
  res.json(ListGamesResponse.parse(rows));
});

router.get("/couples/:id/game-sessions", async (req, res): Promise<void> => {
  const params = ListGameSessionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await withUserContext(req.userId!, async (tx) => {
    const couple = await getCoupleForUser(tx, params.data.id, req.userId!);
    if (!couple) return null;
    return tx
      .select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.coupleId, params.data.id))
      .orderBy(desc(gameSessionsTable.createdAt));
  });
  if (rows === null) {
    res.status(404).json({ error: "Couple not found or not active" });
    return;
  }
  res.json(ListGameSessionsResponse.parse(rows));
});

router.post("/couples/:id/game-sessions", async (req, res): Promise<void> => {
  const params = CreateGameSessionParams.safeParse(req.params);
  const parsed = CreateGameSessionBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }
  const result = await withUserContext(req.userId!, async (tx) => {
    const couple = await getCoupleForUser(tx, params.data.id, req.userId!);
    if (!couple) return { error: "not_found" as const };

    const [game] = await tx.select().from(gamesTable).where(eq(gamesTable.id, parsed.data.gameId));
    if (!game) return { error: "not_found" as const };

    const [existing] = await tx
      .select()
      .from(gameSessionsTable)
      .where(
        and(
          eq(gameSessionsTable.coupleId, params.data.id),
          eq(gameSessionsTable.gameId, game.id),
          eq(gameSessionsTable.status, "in_progress"),
        ),
      );
    if (existing) return { row: existing };

    const [created] = await tx
      .insert(gameSessionsTable)
      .values({ coupleId: params.data.id, gameId: game.id, initiatedBy: req.userId! })
      .returning();
    return { row: created };
  });
  if ("error" in result) {
    res.status(404).json({ error: "Couple not found, not active, or game not found" });
    return;
  }
  res.status(201).json(CreateGameSessionResponse.parse(result.row));
});

router.get("/game-sessions/:id", async (req, res): Promise<void> => {
  const params = GetGameSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const result = await withUserContext(req.userId!, async (tx) => {
    const [session] = await tx.select().from(gameSessionsTable).where(eq(gameSessionsTable.id, params.data.id));
    if (!session) return null;
    const [game] = await tx.select().from(gamesTable).where(eq(gamesTable.id, session.gameId));
    const responses = await tx
      .select()
      .from(gameResponsesTable)
      .where(eq(gameResponsesTable.sessionId, session.id));
    return { session, game, responses };
  });
  if (!result) {
    res.status(404).json({ error: "Game session not found" });
    return;
  }
  res.json(GetGameSessionResponse.parse(result));
});

router.post("/game-sessions/:id/responses", async (req, res): Promise<void> => {
  const params = CreateGameResponseParams.safeParse(req.params);
  const parsed = CreateGameResponseBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.success ? parsed.error!.message : params.error.message });
    return;
  }

  const result = await withUserContext(req.userId!, async (tx) => {
    const [session] = await tx.select().from(gameSessionsTable).where(eq(gameSessionsTable.id, params.data.id));
    if (!session) return null;
    if (session.status === "completed") return { session, alreadyCompleted: true as const };

    const [game] = await tx.select().from(gamesTable).where(eq(gamesTable.id, session.gameId));
    if (!game) return null;

    const [existing] = await tx
      .select()
      .from(gameResponsesTable)
      .where(
        and(
          eq(gameResponsesTable.sessionId, session.id),
          eq(gameResponsesTable.userId, req.userId!),
          eq(gameResponsesTable.promptKey, parsed.data.promptKey),
        ),
      );
    if (existing) return { session, alreadyCompleted: session.status === "completed" };

    let isCorrect: string | null = null;
    if (game.mechanicType === "head_to_head_quiz") {
      const questionId = Number(parsed.data.promptKey.replace("q", ""));
      const [question] = await tx.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.id, questionId));
      if (question) {
        const selected = (parsed.data.response as any)?.selectedOptionId ?? (parsed.data.response as any)?.selected;
        isCorrect = String(selected === question.correctAnswer);
      }
    }

    await tx.insert(gameResponsesTable).values({
      sessionId: session.id,
      userId: req.userId!,
      promptKey: parsed.data.promptKey,
      response: parsed.data.response,
      isCorrect,
    });

    const allResponses = await tx
      .select()
      .from(gameResponsesTable)
      .where(eq(gameResponsesTable.sessionId, session.id));

    let expected = expectedResponseCount(game);
    if (game.mechanicType === "head_to_head_quiz") {
      const questions = await tx
        .select()
        .from(quizQuestionsTable)
        .where(eq(quizQuestionsTable.quizId, (game.config as any).quizId));
      expected = questions.length * 2;
    }

    let updatedSession = session;
    if (expected > 0 && allResponses.length >= expected) {
      const [couple] = await tx.select().from(couplesTable).where(eq(couplesTable.id, session.coupleId));
      const result_ = buildResult(game, allResponses, couple!);
      const [updated] = await tx
        .update(gameSessionsTable)
        .set({ status: "completed", completedAt: new Date(), result: result_ })
        .where(eq(gameSessionsTable.id, session.id))
        .returning();
      updatedSession = updated;

      if (couple) {
        await awardXp(tx, couple.userAId, "game_completed", GAME_COMPLETE_XP, "game_session", session.id);
        if (couple.userBId) {
          await awardXp(tx, couple.userBId, "game_completed", GAME_COMPLETE_XP, "game_session", session.id);
        }
      }
    }

    return { session: updatedSession, game, responses: allResponses };
  });

  if (!result) {
    res.status(404).json({ error: "Game session not found" });
    return;
  }
  if ("alreadyCompleted" in result && !("responses" in result)) {
    res.status(409).json({ error: "This game session is already complete" });
    return;
  }

  const finalResult = result as { session: any; game: any; responses: any[] };
  res.status(201).json(
    GetGameSessionResponse.parse({
      session: finalResult.session,
      game: finalResult.game,
      responses: finalResult.responses,
    }),
  );
});

function buildResult(game: { mechanicType: string; config: any }, responses: any[], couple: { userAId: string; userBId: string | null }) {
  if (game.mechanicType === "simultaneous_reveal") {
    const byQuestion: Record<string, any[]> = {};
    for (const r of responses) {
      (byQuestion[r.promptKey] ??= []).push(r);
    }
    let matches = 0;
    let total = 0;
    for (const key of Object.keys(byQuestion)) {
      const pair = byQuestion[key];
      if (pair.length === 2) {
        total++;
        if (pair[0].response?.optionId === pair[1].response?.optionId) matches++;
      }
    }
    return { type: "simultaneous_reveal", matches, total };
  }
  if (game.mechanicType === "point_allocation") {
    const [a, b] = responses;
    return { type: "point_allocation", allocations: responses.map((r) => ({ userId: r.userId, points: r.response })) };
  }
  if (game.mechanicType === "guess") {
    const byQuestion: Record<string, any[]> = {};
    for (const r of responses) {
      const qId = r.promptKey.split(":")[1];
      (byQuestion[qId] ??= []).push(r);
    }
    let correctGuesses = 0;
    let total = 0;
    for (const qId of Object.keys(byQuestion)) {
      const answer = byQuestion[qId].find((r) => r.promptKey.startsWith("answer:"));
      const guess = byQuestion[qId].find((r) => r.promptKey.startsWith("guess:"));
      if (answer && guess) {
        total++;
        if (Number(answer.response?.value) === Number(guess.response?.value)) correctGuesses++;
      }
    }
    return { type: "guess", correctGuesses, total };
  }
  if (game.mechanicType === "head_to_head_quiz") {
    const scores: Record<string, number> = {};
    if (couple.userAId) scores[couple.userAId] = 0;
    if (couple.userBId) scores[couple.userBId] = 0;
    const byQuestion: Record<string, any[]> = {};
    for (const r of responses) {
      (byQuestion[r.promptKey] ??= []).push(r);
    }
    for (const key of Object.keys(byQuestion)) {
      const pair = byQuestion[key].filter((r) => r.isCorrect === "true");
      if (pair.length === 0) continue;
      const winner = pair.reduce((fastest, r) =>
        (r.response?.responseTimeMs ?? Infinity) < (fastest.response?.responseTimeMs ?? Infinity) ? r : fastest,
      );
      scores[winner.userId] = (scores[winner.userId] ?? 0) + 1;
    }
    return { type: "head_to_head_quiz", scores };
  }
  return null;
}

router.get("/couples/:id/household-dashboard", async (req, res): Promise<void> => {
  const params = GetHouseholdDashboardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const result = await withUserContext(req.userId!, async (tx) => {
    const couple = await getCoupleForUser(tx, params.data.id, req.userId!);
    if (!couple || !couple.userBId) return null;

    const partnerIds = [couple.userAId, couple.userBId];

    const habits = await tx.select().from(habitsTable).where(inArray(habitsTable.userId, partnerIds));
    const streaks = partnerIds.map((userId) => ({
      userId,
      streak: Math.max(0, ...habits.filter((h) => h.userId === userId).map((h) => h.streak), 0),
    }));

    const sharedGoals = await tx
      .select()
      .from(savingsGoalsTable)
      .where(and(eq(savingsGoalsTable.coupleId, couple.id), eq(savingsGoalsTable.isShared, true)));

    const recentGames = await tx
      .select()
      .from(gameSessionsTable)
      .where(eq(gameSessionsTable.coupleId, couple.id))
      .orderBy(desc(gameSessionsTable.createdAt))
      .limit(10);

    const [{ total } = { total: 0 }] = await tx
      .select({ total: sql<number>`coalesce(sum(${xpEventsTable.xpAmount}), 0)` })
      .from(xpEventsTable)
      .where(inArray(xpEventsTable.userId, partnerIds));

    return { couple, streaks, sharedGoals, recentGames, teamXp: Number(total) };
  });

  if (!result) {
    res.status(404).json({ error: "Couple not found, not active, or not fully linked" });
    return;
  }

  res.json(GetHouseholdDashboardResponse.parse(result));
});

export default router;
