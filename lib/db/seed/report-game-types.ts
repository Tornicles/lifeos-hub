import { loadAllCurriculumLessons } from "./parse-curriculum-markdown.ts";

const lessons = loadAllCurriculumLessons();
const gameCounts: Record<string, number> = {};
for (const l of lessons) {
  gameCounts[l.gameType] = (gameCounts[l.gameType] ?? 0) + 1;
}
console.log("Game type distribution across 90 days:");
for (const [type, count] of Object.entries(gameCounts).sort()) {
  console.log(`  ${type}: ${count}`);
}
