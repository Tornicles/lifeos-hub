import { loadAllCurriculumLessons, validateLessons } from "./lib/parse-curriculum-markdown.ts";

const lessons = loadAllCurriculumLessons();
const errors = validateLessons(lessons);

console.log(`Lessons parsed: ${lessons.length}`);
if (errors.length) {
  console.error("Errors:");
  errors.forEach((e) => console.error(`  ${e}`));
  process.exit(1);
}

console.log("All 90 days valid.");
for (const d of [1, 15, 16, 30, 31, 45, 46, 60, 61, 75, 76, 90]) {
  const l = lessons.find((x) => x.dayNumber === d)!;
  console.log(`Day ${d}: ${l.topicTitle} | ${l.gameType} | ${l.cards.length}c ${l.quiz.length}q`);
}
