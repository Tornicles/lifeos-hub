import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  withUserContext,
  topicsTable,
  lessonsTable,
  lessonProgressTable,
  quizzesTable,
  quizQuestionsTable,
  quizAttemptsTable,
} from "@workspace/db";
import { awardXp, checkAndAwardBadges } from "../lib/gamification";
import {
  ListTopicsQueryParams,
  ListTopicsResponse,
  ListLessonsParams,
  ListLessonsResponse,
  ListLessonProgressResponse,
  CreateLessonProgressBody,
  CreateLessonProgressResponse,
  GetQuizParams,
  GetQuizResponse,
  ListQuizAttemptsResponse,
  CreateQuizAttemptBody,
  CreateQuizAttemptResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/topics", async (req, res): Promise<void> => {
  const query = ListTopicsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const conditions = query.data.hubId !== undefined ? [eq(topicsTable.hubId, query.data.hubId)] : [];
  const rows = await db
    .select()
    .from(topicsTable)
    .where(conditions.length ? and(...conditions) : undefined);
  res.json(ListTopicsResponse.parse(rows));
});

router.get("/topics/:topicId/lessons", async (req, res): Promise<void> => {
  const params = ListLessonsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.topicId, params.data.topicId));
  res.json(ListLessonsResponse.parse(rows));
});

router.get("/lesson-progress", async (req, res): Promise<void> => {
  const rows = await withUserContext(req.userId!, (tx) =>
    tx.select().from(lessonProgressTable).where(eq(lessonProgressTable.userId, req.userId!)),
  );
  res.json(ListLessonProgressResponse.parse(rows));
});

router.post("/lesson-progress", async (req, res): Promise<void> => {
  const parsed = CreateLessonProgressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const completed = parsed.data.completed ?? true;

  const result = await withUserContext(req.userId!, async (tx) => {
    const [existing] = await tx
      .select()
      .from(lessonProgressTable)
      .where(
        and(eq(lessonProgressTable.userId, req.userId!), eq(lessonProgressTable.lessonId, parsed.data.lessonId)),
      );
    const alreadyCompleted = existing?.completed === true;

    const [row] = await tx
      .insert(lessonProgressTable)
      .values({
        lessonId: parsed.data.lessonId,
        userId: req.userId!,
        completed,
        completedAt: completed ? new Date() : null,
      })
      .returning();

    let xpAwarded = 0;
    let newBadges: Awaited<ReturnType<typeof checkAndAwardBadges>> = [];
    if (completed && !alreadyCompleted) {
      const [lesson] = await tx.select().from(lessonsTable).where(eq(lessonsTable.id, parsed.data.lessonId));
      xpAwarded = lesson?.xpReward ?? 0;
      await awardXp(tx, req.userId!, "lesson_completed", xpAwarded, "lesson", String(parsed.data.lessonId));
      newBadges = await checkAndAwardBadges(tx, req.userId!);
    }

    return { row, xpAwarded, newBadges };
  });

  res.status(201).json(
    CreateLessonProgressResponse.parse({ ...result.row, xpAwarded: result.xpAwarded, newBadges: result.newBadges }),
  );
});

router.get("/quizzes/:id", async (req, res): Promise<void> => {
  const params = GetQuizParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, params.data.id));
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }
  const questions = await db
    .select()
    .from(quizQuestionsTable)
    .where(eq(quizQuestionsTable.quizId, params.data.id));
  res.json(GetQuizResponse.parse({ ...quiz, questions }));
});

router.get("/quiz-attempts", async (req, res): Promise<void> => {
  const rows = await withUserContext(req.userId!, (tx) =>
    tx.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.userId, req.userId!)),
  );
  res.json(ListQuizAttemptsResponse.parse(rows));
});

router.post("/quiz-attempts", async (req, res): Promise<void> => {
  const parsed = CreateQuizAttemptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const result = await withUserContext(req.userId!, async (tx) => {
    const [row] = await tx
      .insert(quizAttemptsTable)
      .values({ ...parsed.data, userId: req.userId! })
      .returning();

    const scorePct = row.totalQuestions > 0 ? row.score / row.totalQuestions : 0;
    const xpAwarded = scorePct >= 0.7 ? 15 : 5;
    await awardXp(tx, req.userId!, "quiz_completed", xpAwarded, "quiz", String(row.quizId));
    const newBadges = await checkAndAwardBadges(tx, req.userId!);

    return { row, xpAwarded, newBadges };
  });

  res.status(201).json(
    CreateQuizAttemptResponse.parse({ ...result.row, xpAwarded: result.xpAwarded, newBadges: result.newBadges }),
  );
});

export default router;
