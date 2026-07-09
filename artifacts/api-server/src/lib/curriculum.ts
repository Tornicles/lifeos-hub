import { and, eq } from "drizzle-orm";
import type { db } from "@workspace/db";
import {
  curriculumLessonsTable,
  levelsTable,
  userLessonProgressTable,
  userLevelProgressTable,
  userStreaksTable,
} from "@workspace/db";

type Tx = typeof db;

export async function getCurrentDayNumber(tx: Tx, userId: string): Promise<number> {
  const progressRows = await tx
    .select({
      dayNumber: curriculumLessonsTable.dayNumber,
      dayCompletedAt: userLessonProgressTable.dayCompletedAt,
    })
    .from(userLessonProgressTable)
    .innerJoin(curriculumLessonsTable, eq(userLessonProgressTable.lessonId, curriculumLessonsTable.id))
    .where(eq(userLessonProgressTable.userId, userId));

  const maxCompleted = progressRows
    .filter((r) => r.dayCompletedAt)
    .reduce((max, r) => Math.max(max, r.dayNumber), 0);

  if (maxCompleted >= 90) return 90;
  return maxCompleted + 1;
}

export async function checkDayCompletion(tx: Tx, userId: string, lessonId: number) {
  const [progress] = await tx
    .select()
    .from(userLessonProgressTable)
    .where(and(eq(userLessonProgressTable.userId, userId), eq(userLessonProgressTable.lessonId, lessonId)));

  if (!progress) return null;

  const ready =
    progress.cardsCompletedAt &&
    progress.quizCompletedAt &&
    progress.gameCompletedAt;

  if (!ready || progress.dayCompletedAt) return progress;

  const now = new Date();
  const [updated] = await tx
    .update(userLessonProgressTable)
    .set({ dayCompletedAt: now })
    .where(and(eq(userLessonProgressTable.userId, userId), eq(userLessonProgressTable.lessonId, lessonId)))
    .returning();

  await incrementStreak(tx, userId);
  await checkLevelCompletion(tx, userId, lessonId);

  return updated;
}

async function incrementStreak(tx: Tx, userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const [existing] = await tx.select().from(userStreaksTable).where(eq(userStreaksTable.userId, userId));

  if (!existing) {
    await tx.insert(userStreaksTable).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastCompletedDate: today,
    });
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak = 1;
  if (existing.lastCompletedDate === today) {
    newStreak = existing.currentStreak;
  } else if (existing.lastCompletedDate === yesterdayStr) {
    newStreak = existing.currentStreak + 1;
  }

  await tx
    .update(userStreaksTable)
    .set({
      currentStreak: newStreak,
      longestStreak: Math.max(existing.longestStreak, newStreak),
      lastCompletedDate: today,
    })
    .where(eq(userStreaksTable.userId, userId));
}

async function checkLevelCompletion(tx: Tx, userId: string, lessonId: number) {
  const [lesson] = await tx
    .select()
    .from(curriculumLessonsTable)
    .where(eq(curriculumLessonsTable.id, lessonId));
  if (!lesson) return;

  const [level] = await tx.select().from(levelsTable).where(eq(levelsTable.id, lesson.levelId));
  if (!level || lesson.dayNumber !== level.endDay) return;

  await tx
    .insert(userLevelProgressTable)
    .values({
      userId,
      levelId: level.id,
      completedAt: new Date(),
      badgeUnlocked: true,
    })
    .onConflictDoUpdate({
      target: [userLevelProgressTable.userId, userLevelProgressTable.levelId],
      set: { completedAt: new Date(), badgeUnlocked: true },
    });
}

export async function upsertLessonProgress(
  tx: Tx,
  userId: string,
  lessonId: number,
  patch: Partial<{
    morningPrayerViewedAt: Date;
    cardsCompletedAt: Date;
    quizCompletedAt: Date;
    quizScore: number;
    gameCompletedAt: Date;
    nightPrayerViewedAt: Date;
  }>,
) {
  const [existing] = await tx
    .select()
    .from(userLessonProgressTable)
    .where(and(eq(userLessonProgressTable.userId, userId), eq(userLessonProgressTable.lessonId, lessonId)));

  if (existing) {
    const [row] = await tx
      .update(userLessonProgressTable)
      .set(patch)
      .where(and(eq(userLessonProgressTable.userId, userId), eq(userLessonProgressTable.lessonId, lessonId)))
      .returning();
    await checkDayCompletion(tx, userId, lessonId);
    return row;
  }

  const [row] = await tx
    .insert(userLessonProgressTable)
    .values({ userId, lessonId, ...patch })
    .returning();
  await checkDayCompletion(tx, userId, lessonId);
  return row;
}
