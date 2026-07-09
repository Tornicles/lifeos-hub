import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import {
  db,
  withUserContext,
  levelsTable,
  curriculumLessonsTable,
  lessonCardsTable,
  curriculumQuizQuestionsTable,
  userLessonProgressTable,
  userLevelProgressTable,
  userStreaksTable,
  userOnboardingTable,
} from "@workspace/db";
import {
  getCurrentDayNumber,
  upsertLessonProgress,
} from "../lib/curriculum";

const router: IRouter = Router();

function parseDayNumber(params: { dayNumber?: string }) {
  const dayNumber = Number(params.dayNumber);
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 90) return null;
  return dayNumber;
}

router.get("/curriculum/levels", async (_req, res): Promise<void> => {
  const rows = await db.select().from(levelsTable).orderBy(asc(levelsTable.levelNumber));
  res.json(rows);
});

router.get("/curriculum/days", async (req, res): Promise<void> => {
  const lessons = await db
    .select({
      lesson: curriculumLessonsTable,
      levelName: levelsTable.name,
      levelNumber: levelsTable.levelNumber,
      requiresDisclaimer: levelsTable.requiresDisclaimer,
    })
    .from(curriculumLessonsTable)
    .innerJoin(levelsTable, eq(curriculumLessonsTable.levelId, levelsTable.id))
    .orderBy(asc(curriculumLessonsTable.dayNumber));

  const progress = await withUserContext(req.userId!, (tx) =>
    tx.select().from(userLessonProgressTable).where(eq(userLessonProgressTable.userId, req.userId!)),
  );
  const progressByLesson = new Map(progress.map((p) => [p.lessonId, p]));
  const currentDay = await withUserContext(req.userId!, (tx) => getCurrentDayNumber(tx, req.userId!));

  res.json(
    lessons.map(({ lesson, levelName, levelNumber, requiresDisclaimer }) => ({
      ...lesson,
      levelName,
      levelNumber,
      requiresDisclaimer,
      progress: progressByLesson.get(lesson.id) ?? null,
      status:
        lesson.dayNumber < currentDay
          ? progressByLesson.get(lesson.id)?.dayCompletedAt
            ? "completed"
            : "in_progress"
          : lesson.dayNumber === currentDay
            ? "current"
            : "locked",
    })),
  );
});

router.get("/curriculum/days/current", async (req, res): Promise<void> => {
  const currentDay = await withUserContext(req.userId!, (tx) => getCurrentDayNumber(tx, req.userId!));
  const [lesson] = await db
    .select()
    .from(curriculumLessonsTable)
    .where(eq(curriculumLessonsTable.dayNumber, currentDay));

  if (!lesson) {
    res.json(null);
    return;
  }

  const [level] = await db.select().from(levelsTable).where(eq(levelsTable.id, lesson.levelId));
  const progress = await withUserContext(req.userId!, async (tx) => {
    const [row] = await tx
      .select()
      .from(userLessonProgressTable)
      .where(
        and(eq(userLessonProgressTable.userId, req.userId!), eq(userLessonProgressTable.lessonId, lesson.id)),
      );
    return row ?? null;
  });

  res.json({ ...lesson, level, progress });
});

router.get("/curriculum/days/:dayNumber", async (req, res): Promise<void> => {
  const dayNumber = parseDayNumber(req.params);
  if (dayNumber === null) {
    res.status(400).json({ error: "Invalid day number" });
    return;
  }

  const currentDay = await withUserContext(req.userId!, (tx) => getCurrentDayNumber(tx, req.userId!));
  if (dayNumber > currentDay) {
    res.status(403).json({ error: "This day is locked" });
    return;
  }

  const [lesson] = await db
    .select()
    .from(curriculumLessonsTable)
    .where(eq(curriculumLessonsTable.dayNumber, dayNumber));
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const [level] = await db.select().from(levelsTable).where(eq(levelsTable.id, lesson.levelId));
  const progress = await withUserContext(req.userId!, async (tx) => {
    const [row] = await tx
      .select()
      .from(userLessonProgressTable)
      .where(
        and(eq(userLessonProgressTable.userId, req.userId!), eq(userLessonProgressTable.lessonId, lesson.id)),
      );
    return row ?? null;
  });

  res.json({ ...lesson, level, progress });
});

router.get("/curriculum/days/:dayNumber/cards", async (req, res): Promise<void> => {
  const dayNumber = parseDayNumber(req.params);
  if (dayNumber === null) {
    res.status(400).json({ error: "Invalid day number" });
    return;
  }

  const [lesson] = await db
    .select()
    .from(curriculumLessonsTable)
    .where(eq(curriculumLessonsTable.dayNumber, dayNumber));
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const cards = await db
    .select()
    .from(lessonCardsTable)
    .where(eq(lessonCardsTable.lessonId, lesson.id))
    .orderBy(asc(lessonCardsTable.cardOrder));

  res.json(cards);
});

router.get("/curriculum/days/:dayNumber/quiz", async (req, res): Promise<void> => {
  const dayNumber = parseDayNumber(req.params);
  if (dayNumber === null) {
    res.status(400).json({ error: "Invalid day number" });
    return;
  }

  const [lesson] = await db
    .select()
    .from(curriculumLessonsTable)
    .where(eq(curriculumLessonsTable.dayNumber, dayNumber));
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const questions = await db
    .select()
    .from(curriculumQuizQuestionsTable)
    .where(eq(curriculumQuizQuestionsTable.lessonId, lesson.id))
    .orderBy(asc(curriculumQuizQuestionsTable.questionOrder));

  res.json({ lessonId: lesson.id, dayNumber: lesson.dayNumber, questions });
});

router.patch("/curriculum/days/:dayNumber/progress", async (req, res): Promise<void> => {
  const dayNumber = parseDayNumber(req.params);
  if (dayNumber === null) {
    res.status(400).json({ error: "Invalid day number" });
    return;
  }

  const body = req.body as Record<string, unknown>;
  const [lesson] = await db
    .select()
    .from(curriculumLessonsTable)
    .where(eq(curriculumLessonsTable.dayNumber, dayNumber));
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found" });
    return;
  }

  const now = new Date();
  const patch: Record<string, unknown> = {};
  if (body.morningPrayerViewed) patch.morningPrayerViewedAt = now;
  if (body.cardsCompleted) patch.cardsCompletedAt = now;
  if (body.quizCompleted) {
    patch.quizCompletedAt = now;
    if (typeof body.quizScore === "number") patch.quizScore = body.quizScore;
  }
  if (body.gameCompleted) patch.gameCompletedAt = now;
  if (body.nightPrayerViewed) patch.nightPrayerViewedAt = now;

  const row = await withUserContext(req.userId!, (tx) =>
    upsertLessonProgress(tx, req.userId!, lesson.id, patch),
  );

  res.json(row);
});

router.get("/curriculum/progress", async (req, res): Promise<void> => {
  const [streak] = await withUserContext(req.userId!, (tx) =>
    tx.select().from(userStreaksTable).where(eq(userStreaksTable.userId, req.userId!)),
  );

  const levelProgress = await withUserContext(req.userId!, (tx) =>
    tx.select().from(userLevelProgressTable).where(eq(userLevelProgressTable.userId, req.userId!)),
  );

  const lessonProgress = await withUserContext(req.userId!, (tx) =>
    tx
      .select({
        dayNumber: curriculumLessonsTable.dayNumber,
        topicTitle: curriculumLessonsTable.topicTitle,
        quizScore: userLessonProgressTable.quizScore,
        dayCompletedAt: userLessonProgressTable.dayCompletedAt,
      })
      .from(userLessonProgressTable)
      .innerJoin(curriculumLessonsTable, eq(userLessonProgressTable.lessonId, curriculumLessonsTable.id))
      .where(eq(userLessonProgressTable.userId, req.userId!))
      .orderBy(asc(curriculumLessonsTable.dayNumber)),
  );

  const completedDays = lessonProgress.filter((p) => p.dayCompletedAt).length;

  res.json({
    streak: streak ?? { currentStreak: 0, longestStreak: 0, lastCompletedDate: null },
    levelProgress,
    lessonProgress,
    completionPercent: Math.round((completedDays / 90) * 100),
    stewardUnlocked: completedDays >= 90,
  });
});

router.get("/curriculum/onboarding", async (req, res): Promise<void> => {
  const [row] = await withUserContext(req.userId!, (tx) =>
    tx.select().from(userOnboardingTable).where(eq(userOnboardingTable.userId, req.userId!)),
  );
  res.json(row ?? { userId: req.userId, stepCompleted: 0, couplesModeOptedIn: false });
});

router.patch("/curriculum/onboarding", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;

  const values: Record<string, unknown> = {};
  if (typeof body.stepCompleted === "number") values.stepCompleted = body.stepCompleted;
  if (typeof body.goalSelected === "string") values.goalSelected = body.goalSelected;
  if (typeof body.couplesModeOptedIn === "boolean") values.couplesModeOptedIn = body.couplesModeOptedIn;
  if (body.completed) values.completedAt = new Date();

  const row = await withUserContext(req.userId!, async (tx) => {
    const [existing] = await tx
      .select()
      .from(userOnboardingTable)
      .where(eq(userOnboardingTable.userId, req.userId!));

    if (existing) {
      const [updated] = await tx
        .update(userOnboardingTable)
        .set(values)
        .where(eq(userOnboardingTable.userId, req.userId!))
        .returning();
      return updated;
    }

    const [created] = await tx
      .insert(userOnboardingTable)
      .values({ userId: req.userId!, ...values })
      .returning();
    return created;
  });

  res.json(row);
});

export default router;
