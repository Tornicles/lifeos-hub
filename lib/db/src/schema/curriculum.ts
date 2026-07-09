import {
  boolean,
  date,
  integer,
  pgPolicy,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";
import { profilesTable } from "./profiles";

const userIsolation = () =>
  pgPolicy("user_isolation", {
    as: "permissive",
    for: "all",
    to: "public",
    using: sql`user_id = current_setting('app.current_user_id', true)`,
    withCheck: sql`user_id = current_setting('app.current_user_id', true)`,
  });

/** Six seasons: Seed, Root, Sprout, Growth, Harvest, Legacy */
export const levelsTable = pgTable("levels", {
  id: serial("id").primaryKey(),
  levelNumber: integer("level_number").notNull().unique(),
  name: text("name").notNull(),
  badgeName: text("badge_name").notNull(),
  startDay: integer("start_day").notNull(),
  endDay: integer("end_day").notNull(),
  requiresDisclaimer: boolean("requires_disclaimer").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const curriculumLessonsTable = pgTable("curriculum_lessons", {
  id: serial("id").primaryKey(),
  dayNumber: integer("day_number").notNull().unique(),
  levelId: integer("level_id")
    .notNull()
    .references(() => levelsTable.id),
  topicTitle: text("topic_title").notNull(),
  morningPrayer: text("morning_prayer").notNull(),
  morningVerse: text("morning_verse").notNull(),
  morningVerseReference: text("morning_verse_reference").notNull(),
  nightPrayer: text("night_prayer").notNull(),
  nightVerse: text("night_verse").notNull(),
  nightVerseReference: text("night_verse_reference").notNull(),
  articleBody: text("article_body"),
  gameType: text("game_type").notNull(),
  gameModeLabel: text("game_mode_label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessonCardsTable = pgTable(
  "lesson_cards",
  {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => curriculumLessonsTable.id, { onDelete: "cascade" }),
    cardOrder: integer("card_order").notNull(),
    cardType: text("card_type").notNull(),
    content: text("content").notNull(),
  },
  (table) => [unique().on(table.lessonId, table.cardOrder)],
);

export const curriculumQuizQuestionsTable = pgTable(
  "curriculum_quiz_questions",
  {
    id: serial("id").primaryKey(),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => curriculumLessonsTable.id, { onDelete: "cascade" }),
    questionOrder: integer("question_order").notNull(),
    questionText: text("question_text").notNull(),
    answerText: text("answer_text").notNull(),
  },
  (table) => [unique().on(table.lessonId, table.questionOrder)],
);

export const userLevelProgressTable = pgTable(
  "user_level_progress",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    levelId: integer("level_id")
      .notNull()
      .references(() => levelsTable.id),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    badgeUnlocked: boolean("badge_unlocked").notNull().default(false),
  },
  (table) => [unique().on(table.userId, table.levelId), userIsolation()],
).enableRLS();

export const userLessonProgressTable = pgTable(
  "user_lesson_progress",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => curriculumLessonsTable.id),
    morningPrayerViewedAt: timestamp("morning_prayer_viewed_at", { withTimezone: true }),
    cardsCompletedAt: timestamp("cards_completed_at", { withTimezone: true }),
    quizCompletedAt: timestamp("quiz_completed_at", { withTimezone: true }),
    quizScore: integer("quiz_score"),
    gameCompletedAt: timestamp("game_completed_at", { withTimezone: true }),
    nightPrayerViewedAt: timestamp("night_prayer_viewed_at", { withTimezone: true }),
    dayCompletedAt: timestamp("day_completed_at", { withTimezone: true }),
  },
  (table) => [unique().on(table.userId, table.lessonId), userIsolation()],
).enableRLS();

export const userStreaksTable = pgTable(
  "user_streaks",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" })
      .unique(),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastCompletedDate: date("last_completed_date"),
  },
  () => [userIsolation()],
).enableRLS();

export const userOnboardingTable = pgTable(
  "user_onboarding",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" })
      .unique(),
    stepCompleted: integer("step_completed").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    goalSelected: text("goal_selected"),
    couplesModeOptedIn: boolean("couples_mode_opted_in").notNull().default(false),
  },
  () => [userIsolation()],
).enableRLS();

export const insertLevelSchema = createInsertSchema(levelsTable).omit({ id: true, createdAt: true });
export type Level = typeof levelsTable.$inferSelect;

export const insertCurriculumLessonSchema = createInsertSchema(curriculumLessonsTable).omit({
  id: true,
  createdAt: true,
});
export type CurriculumLesson = typeof curriculumLessonsTable.$inferSelect;

export const insertLessonCardSchema = createInsertSchema(lessonCardsTable).omit({ id: true });
export type LessonCard = typeof lessonCardsTable.$inferSelect;

export const insertUserOnboardingSchema = createInsertSchema(userOnboardingTable).omit({ id: true });
export type UserOnboarding = typeof userOnboardingTable.$inferSelect;
