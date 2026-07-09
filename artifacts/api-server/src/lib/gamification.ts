import { and, eq, gte, sql } from "drizzle-orm";
import {
  db,
  withUserContext,
  xpEventsTable,
  badgesTable,
  userBadgesTable,
  lessonProgressTable,
  quizAttemptsTable,
  habitsTable,
  habitCheckinsTable,
  challengeCompletionsTable,
  type Badge,
} from "@workspace/db";
import { toDateOnlyString } from "./dateUtils";

type Tx = typeof db;

const DAILY_CHALLENGE_HABIT_NAME = "Daily Challenge";
const DAILY_CHALLENGE_STEPS_REQUIRED = 3;

export async function awardXp(
  tx: Tx,
  userId: string,
  eventType: string,
  xpAmount: number,
  sourceType: string,
  sourceId: string,
): Promise<void> {
  if (xpAmount <= 0) return;
  await tx.insert(xpEventsTable).values({
    userId,
    eventType,
    xpAmount,
    sourceType,
    sourceId,
  });
}

type BadgeCriteria =
  | { type: "lesson_count"; count: number }
  | { type: "quiz_count"; count: number }
  | { type: "quiz_high_score_count"; count: number; minScorePct: number }
  | { type: "streak"; count: number };

export async function checkAndAwardBadges(tx: Tx, userId: string): Promise<Badge[]> {
  const allBadges = await tx.select().from(badgesTable);
  const earned = await tx
    .select({ badgeId: userBadgesTable.badgeId })
    .from(userBadgesTable)
    .where(eq(userBadgesTable.userId, userId));
  const earnedIds = new Set(earned.map((e) => e.badgeId));

  const candidates = allBadges.filter((b) => !earnedIds.has(b.id) && b.criteria);
  if (candidates.length === 0) return [];

  const [lessonCountRow] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(lessonProgressTable)
    .where(and(eq(lessonProgressTable.userId, userId), eq(lessonProgressTable.completed, true)));
  const lessonCount = lessonCountRow?.count ?? 0;

  const quizAttempts = await tx
    .select()
    .from(quizAttemptsTable)
    .where(eq(quizAttemptsTable.userId, userId));
  const quizCount = quizAttempts.length;

  const [dailyChallengeHabit] = await tx
    .select()
    .from(habitsTable)
    .where(and(eq(habitsTable.userId, userId), eq(habitsTable.name, DAILY_CHALLENGE_HABIT_NAME)));
  const streak = dailyChallengeHabit?.streak ?? 0;

  const newlyEarned: Badge[] = [];

  for (const badge of candidates) {
    const criteria = badge.criteria as BadgeCriteria | null;
    if (!criteria) continue;
    let qualifies = false;

    if (criteria.type === "lesson_count") {
      qualifies = lessonCount >= criteria.count;
    } else if (criteria.type === "quiz_count") {
      qualifies = quizCount >= criteria.count;
    } else if (criteria.type === "quiz_high_score_count") {
      const highScoreCount = quizAttempts.filter(
        (a) => a.totalQuestions > 0 && a.score / a.totalQuestions >= criteria.minScorePct / 100,
      ).length;
      qualifies = highScoreCount >= criteria.count;
    } else if (criteria.type === "streak") {
      qualifies = streak >= criteria.count;
    }

    if (qualifies) {
      try {
        await tx.insert(userBadgesTable).values({ userId, badgeId: badge.id });
        newlyEarned.push(badge);
      } catch {
        // Concurrent insert or unique constraint - ignore, badge already earned.
      }
    }
  }

  return newlyEarned;
}

export async function ensureDailyChallengeHabit(tx: Tx, userId: string) {
  const [existing] = await tx
    .select()
    .from(habitsTable)
    .where(and(eq(habitsTable.userId, userId), eq(habitsTable.name, DAILY_CHALLENGE_HABIT_NAME)));
  if (existing) return existing;

  const [created] = await tx
    .insert(habitsTable)
    .values({
      userId,
      name: DAILY_CHALLENGE_HABIT_NAME,
      description: "Complete 3 challenges in a day to keep your streak alive.",
    })
    .returning();
  return created;
}

/**
 * After a challenge completion, checks whether the user has completed
 * DAILY_CHALLENGE_STEPS_REQUIRED challenges today. If so (and no checkin has
 * been recorded for today yet), records a checkin for the "Daily Challenge"
 * habit, reusing the exact streak-increment formula from
 * `routes/habits.ts` (`streak + 1`, or `0` on a missed day).
 */
export async function maybeRecordDailyChallengeCheckin(tx: Tx, userId: string): Promise<void> {
  const today = toDateOnlyString(new Date())!;
  const startOfDay = new Date(`${today}T00:00:00.000Z`);

  const [{ count: completionsToday }] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(challengeCompletionsTable)
    .where(
      and(eq(challengeCompletionsTable.userId, userId), gte(challengeCompletionsTable.completedAt, startOfDay)),
    );

  if (completionsToday < DAILY_CHALLENGE_STEPS_REQUIRED) return;

  const habit = await ensureDailyChallengeHabit(tx, userId);

  if (habit.lastCheckin === today) return;

  const [existingCheckin] = await tx
    .select()
    .from(habitCheckinsTable)
    .where(and(eq(habitCheckinsTable.habitId, habit.id), eq(habitCheckinsTable.date, today)));
  if (existingCheckin) return;

  await tx.insert(habitCheckinsTable).values({ habitId: habit.id, date: today, done: true });

  const newStreak = habit.streak + 1;
  await tx.update(habitsTable).set({ streak: newStreak, lastCheckin: today }).where(eq(habitsTable.id, habit.id));
}

export { withUserContext };
