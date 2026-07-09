import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

export type ParsedCard = { cardOrder: number; cardType: string; content: string };
export type ParsedQuiz = { questionOrder: number; questionText: string; answerText: string };
export type ParsedLesson = {
  dayNumber: number;
  topicTitle: string;
  morningPrayer: string;
  morningVerse: string;
  morningVerseReference: string;
  nightPrayer: string;
  nightVerse: string;
  nightVerseReference: string;
  cards: ParsedCard[];
  quiz: ParsedQuiz[];
  gameType: string;
  gameModeLabel: string;
  gameDescription: string;
};

const CARD_TYPE_MAP: Record<string, string> = {
  DEFINITION: "definition",
  ANALOGY: "analogy",
  ORIGIN: "origin",
  MECHANISM: "mechanism",
  COMPONENTS: "components",
  CAUSE: "cause",
  EFFECT: "effect",
  DIFFERENTIATION: "differentiation",
  EXAMPLE: "example",
  EXCEPTION: "exception",
  MISCONCEPTION: "misconception",
  APPLICATION: "application",
};

function parseVerse(line: string): { verse: string; reference: string } {
  const text = line.replace(/^\*\*(MORNING|NIGHT) VERSE:\*\*\s*/, "").trim();
  const match = text.match(/^["“](.+?)["”]\s*[.—–-]+\s*(.+)$/s);
  if (match) {
    return { verse: match[1].trim(), reference: match[2].trim() };
  }
  const alt = text.match(/^(.+?)\s*[—–-]\s*(.+)$/s);
  if (alt) {
    return { verse: alt[1].replace(/^["“]|["”]$/g, "").trim(), reference: alt[2].trim() };
  }
  return { verse: text, reference: "" };
}

function parsePrayer(line: string): string {
  return line
    .replace(/^\*\*(MORNING|NIGHT) PRAYER:\*\*\s*/, "")
    .replace(/^["“]|["”]$/g, "")
    .trim();
}

function parseGame(gameLine: string): { gameType: string; gameModeLabel: string; gameDescription: string } {
  const desc = gameLine.replace(/^\*\*GAME:\*\*\s*/, "").trim();
  const lower = desc.toLowerCase();

  let gameType = "grow_garden";
  if (lower.startsWith("stack the jar")) gameType = "stack_jar";
  else if (lower.startsWith("debt crusher")) gameType = "debt_crusher";
  else if (lower.startsWith("build the fortress")) gameType = "build_fortress";
  else if (lower.startsWith("dodge the leak")) gameType = "dodge_leak";
  else if (lower.startsWith("grow the garden")) gameType = "grow_garden";

  const modeMatch = desc.match(/\(([^)]+Mode[^)]*)\)/i);
  const gameModeLabel = modeMatch ? modeMatch[1] : desc.split("—")[0]?.trim() ?? gameType;

  return { gameType, gameModeLabel, gameDescription: desc };
}

function parseCards(section: string): ParsedCard[] {
  const cards: ParsedCard[] = [];
  const lines = section.split("\n").filter((l) => l.trim());
  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s+\*\*([A-Z]+):\*\*\s*(.+)$/);
    if (!match) continue;
    const cardType = CARD_TYPE_MAP[match[2]] ?? match[2].toLowerCase();
    cards.push({
      cardOrder: Number(match[1]),
      cardType,
      content: match[3].trim(),
    });
  }
  return cards;
}

function parseQuiz(section: string): ParsedQuiz[] {
  const questions: ParsedQuiz[] = [];
  const lines = section.split("\n").filter((l) => l.trim());
  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s+(.+?)\s*→\s*\*(.+?)\*\.?$/);
    if (!match) continue;
    questions.push({
      questionOrder: Number(match[1]),
      questionText: match[2].trim(),
      answerText: match[3].trim(),
    });
  }
  return questions;
}

function parseDayBlock(block: string): ParsedLesson | null {
  const headerMatch = block.match(/^## DAY (\d+) — (.+?)(?:\r?\n|$)/);
  if (!headerMatch) return null;

  const dayNumber = Number(headerMatch[1]);
  const topicTitle = headerMatch[2].trim();

  const morningPrayerMatch = block.match(/\*\*MORNING PRAYER:\*\*\s*(.+?)(?=\r?\n\r?\n\*\*MORNING VERSE)/s);
  const morningVerseLine = block.match(/\*\*MORNING VERSE:\*\*\s*(.+?)(?:\r?\n)/)?.[1] ?? "";
  const nightPrayerMatch = block.match(/\*\*NIGHT PRAYER:\*\*\s*(.+?)(?=\r?\n\r?\n\*\*NIGHT VERSE)/s);
  const nightVerseLine = block.match(/\*\*NIGHT VERSE:\*\*\s*(.+?)(?:\r?\n|$)/s)?.[1] ?? "";

  const cardsSection = block.match(/\*\*THE 12 CARDS:\*\*\s*([\s\S]+?)(?=\r?\n\r?\n\*\*Read the full article)/)?.[1] ?? "";
  const quizSection = block.match(/\*\*QUIZ:\*\*\s*([\s\S]+?)(?=\r?\n\r?\n\*\*GAME)/)?.[1] ?? "";
  const gameLine = block.match(/\*\*GAME:\*\*\s*(.+?)(?=\r?\n\r?\n\*\*NIGHT PRAYER)/s)?.[1] ?? "";

  const morningVerse = parseVerse(`**MORNING VERSE:** ${morningVerseLine}`);
  const nightVerse = parseVerse(`**NIGHT VERSE:** ${nightVerseLine}`);
  const game = parseGame(`**GAME:** ${gameLine}`);
  const cards = parseCards(cardsSection);
  const quiz = parseQuiz(quizSection);

  return {
    dayNumber,
    topicTitle,
    morningPrayer: morningPrayerMatch ? parsePrayer(`**MORNING PRAYER:** ${morningPrayerMatch[1].trim()}`) : "",
    morningVerse: morningVerse.verse,
    morningVerseReference: morningVerse.reference,
    nightPrayer: nightPrayerMatch ? parsePrayer(`**NIGHT PRAYER:** ${nightPrayerMatch[1].trim()}`) : "",
    nightVerse: nightVerse.verse,
    nightVerseReference: nightVerse.reference,
    cards,
    quiz,
    ...game,
  };
}

export function parseCurriculumMarkdown(content: string): ParsedLesson[] {
  const blocks = content.split(/\r?\n---\r?\n/).flatMap((chunk) => {
    const dayParts = chunk.split(/(?=## DAY \d+ —)/);
    return dayParts.filter((p) => p.match(/^## DAY \d+ —/));
  });

  const lessons: ParsedLesson[] = [];
  for (const block of blocks) {
    const parsed = parseDayBlock(block.trim());
    if (parsed) lessons.push(parsed);
  }

  return lessons.sort((a, b) => a.dayNumber - b.dayNumber);
}

export function loadAllCurriculumLessons(dataDir?: string): ParsedLesson[] {
  const base =
    dataDir ??
    join(dirname(fileURLToPath(import.meta.url)), "data");

  const files = [
    "TechTate_Doc1_Lessons_Days1-30.md",
    "TechTate_Doc2_Lessons_Days31-60.md",
    "TechTate_Doc3_Lessons_Days61-90.md",
  ];

  const all: ParsedLesson[] = [];
  for (const file of files) {
    const content = readFileSync(join(base, file), "utf-8");
    all.push(...parseCurriculumMarkdown(content));
  }

  const byDay = new Map<number, ParsedLesson>();
  for (const lesson of all) {
    byDay.set(lesson.dayNumber, lesson);
  }

  return Array.from(byDay.values()).sort((a, b) => a.dayNumber - b.dayNumber);
}

export function validateLessons(lessons: ParsedLesson[]): string[] {
  const errors: string[] = [];
  if (lessons.length !== 90) {
    errors.push(`Expected 90 lessons, got ${lessons.length}`);
  }
  for (let d = 1; d <= 90; d++) {
    if (!lessons.find((l) => l.dayNumber === d)) {
      errors.push(`Missing day ${d}`);
    }
  }
  for (const lesson of lessons) {
    if (lesson.cards.length !== 12) {
      errors.push(`Day ${lesson.dayNumber}: expected 12 cards, got ${lesson.cards.length}`);
    }
    if (lesson.quiz.length !== 3) {
      errors.push(`Day ${lesson.dayNumber}: expected 3 quiz questions, got ${lesson.quiz.length}`);
    }
    if (!lesson.morningPrayer) errors.push(`Day ${lesson.dayNumber}: missing morning prayer`);
    if (!lesson.nightPrayer) errors.push(`Day ${lesson.dayNumber}: missing night prayer`);
    if (!lesson.gameType) errors.push(`Day ${lesson.dayNumber}: missing game type`);
  }
  return errors;
}
