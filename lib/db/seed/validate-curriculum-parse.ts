import { loadAllCurriculumLessons, validateLessons } from "./parse-curriculum-markdown.ts";

const lessons = loadAllCurriculumLessons();
const errors = validateLessons(lessons);

console.log(`Lessons parsed: ${lessons.length}`);
if (errors.length) {
  console.error("Errors:");
  errors.forEach((e) => console.error(`  ${e}`));
  process.exit(1);
}
console.log("All 90 days valid.");
