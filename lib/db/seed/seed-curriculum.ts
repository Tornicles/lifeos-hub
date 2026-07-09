/**
 * Seeds all 90 curriculum days from Docs 1-3 markdown files.
 * Run from repo root: pnpm --filter @workspace/db run seed-curriculum
 * Requires: DATABASE_URL
 */
import { eq } from "drizzle-orm";
import { db, levelsTable, curriculumLessonsTable, lessonCardsTable, curriculumQuizQuestionsTable } from "../src/index.ts";
import { loadAllCurriculumLessons, validateLessons } from "./parse-curriculum-markdown.ts";

const LEVELS = [
  { levelNumber: 1, name: "Seed", badgeName: "Seed Badge", startDay: 1, endDay: 15, requiresDisclaimer: false },
  { levelNumber: 2, name: "Root", badgeName: "Root Badge", startDay: 16, endDay: 30, requiresDisclaimer: false },
  { levelNumber: 3, name: "Sprout", badgeName: "Sprout Badge", startDay: 31, endDay: 45, requiresDisclaimer: false },
  { levelNumber: 4, name: "Growth", badgeName: "Growth Badge", startDay: 46, endDay: 60, requiresDisclaimer: false },
  { levelNumber: 5, name: "Harvest", badgeName: "Harvest Badge", startDay: 61, endDay: 75, requiresDisclaimer: true },
  { levelNumber: 6, name: "Legacy", badgeName: "Legacy Badge", startDay: 76, endDay: 90, requiresDisclaimer: true },
];

function levelIdForDay(dayNumber: number, levelRows: { id: number; startDay: number; endDay: number }[]) {
  const level = levelRows.find((l) => dayNumber >= l.startDay && dayNumber <= l.endDay);
  if (!level) throw new Error(`No level for day ${dayNumber}`);
  return level.id;
}

async function main() {
  const lessons = loadAllCurriculumLessons();
  const errors = validateLessons(lessons);
  if (errors.length) {
    console.error("Validation failed:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(`Parsed ${lessons.length} lessons successfully.`);

  for (const level of LEVELS) {
    await db
      .insert(levelsTable)
      .values(level)
      .onConflictDoUpdate({
        target: levelsTable.levelNumber,
        set: level,
      });
  }

  const levelRows = await db.select().from(levelsTable).orderBy(levelsTable.levelNumber);
  const levelMap = levelRows.map((l) => ({ id: l.id, startDay: l.startDay, endDay: l.endDay }));

  let inserted = 0;
  let updated = 0;

  for (const lesson of lessons) {
    const levelId = levelIdForDay(lesson.dayNumber, levelMap);

    const [existing] = await db
      .select()
      .from(curriculumLessonsTable)
      .where(eq(curriculumLessonsTable.dayNumber, lesson.dayNumber));

    const lessonValues = {
      dayNumber: lesson.dayNumber,
      levelId,
      topicTitle: lesson.topicTitle,
      morningPrayer: lesson.morningPrayer,
      morningVerse: lesson.morningVerse,
      morningVerseReference: lesson.morningVerseReference,
      nightPrayer: lesson.nightPrayer,
      nightVerse: lesson.nightVerse,
      nightVerseReference: lesson.nightVerseReference,
      gameType: lesson.gameType,
      gameModeLabel: lesson.gameModeLabel,
    };

    let lessonId: number;
    if (existing) {
      const [row] = await db
        .update(curriculumLessonsTable)
        .set(lessonValues)
        .where(eq(curriculumLessonsTable.id, existing.id))
        .returning();
      lessonId = row.id;
      updated++;
    } else {
      const [row] = await db.insert(curriculumLessonsTable).values(lessonValues).returning();
      lessonId = row.id;
      inserted++;
    }

    await db.delete(lessonCardsTable).where(eq(lessonCardsTable.lessonId, lessonId));
    await db.delete(curriculumQuizQuestionsTable).where(eq(curriculumQuizQuestionsTable.lessonId, lessonId));

    await db.insert(lessonCardsTable).values(
      lesson.cards.map((c) => ({
        lessonId,
        cardOrder: c.cardOrder,
        cardType: c.cardType,
        content: c.content,
      })),
    );

    await db.insert(curriculumQuizQuestionsTable).values(
      lesson.quiz.map((q) => ({
        lessonId,
        questionOrder: q.questionOrder,
        questionText: q.questionText,
        answerText: q.answerText,
      })),
    );

    if (lesson.dayNumber % 15 === 0 || lesson.dayNumber === 1) {
      console.log(`  Day ${lesson.dayNumber}: ${lesson.topicTitle}`);
    }
  }

  console.log(`\nDone. ${inserted} inserted, ${updated} updated. Total: ${lessons.length} days in database.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
