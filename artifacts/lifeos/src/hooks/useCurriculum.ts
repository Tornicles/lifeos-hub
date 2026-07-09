import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";

const API = "/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export type CurriculumDay = {
  id: number;
  dayNumber: number;
  levelId: number;
  levelName?: string;
  levelNumber?: number;
  requiresDisclaimer?: boolean;
  topicTitle: string;
  morningPrayer: string;
  morningVerse: string;
  morningVerseReference: string;
  nightPrayer: string;
  nightVerse: string;
  nightVerseReference: string;
  articleBody: string | null;
  gameType: string;
  gameModeLabel: string;
  level?: { id: number; name: string; badgeName: string; requiresDisclaimer: boolean };
  progress?: UserLessonProgress | null;
};

export type UserLessonProgress = {
  id: number;
  userId: string;
  lessonId: number;
  morningPrayerViewedAt: string | null;
  cardsCompletedAt: string | null;
  quizCompletedAt: string | null;
  quizScore: number | null;
  gameCompletedAt: string | null;
  nightPrayerViewedAt: string | null;
  dayCompletedAt: string | null;
};

export type LessonCard = {
  id: number;
  lessonId: number;
  cardOrder: number;
  cardType: string;
  content: string;
};

export type CurriculumOnboarding = {
  userId: string;
  stepCompleted: number;
  completedAt: string | null;
  goalSelected: string | null;
  couplesModeOptedIn: boolean;
};

export function useCurriculumOnboarding() {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["curriculum", "onboarding"],
    queryFn: () => apiFetch<CurriculumOnboarding>("/curriculum/onboarding"),
    enabled: !!isSignedIn,
  });
}

export function useUpdateCurriculumOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CurriculumOnboarding> & { completed?: boolean }) =>
      apiFetch<CurriculumOnboarding>("/curriculum/onboarding", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["curriculum", "onboarding"] }),
  });
}

export function useCurrentDay() {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["curriculum", "current-day"],
    queryFn: () => apiFetch<CurriculumDay | null>("/curriculum/days/current"),
    enabled: !!isSignedIn,
  });
}

export function useCurriculumDay(dayNumber: number) {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["curriculum", "day", dayNumber],
    queryFn: () => apiFetch<CurriculumDay>(`/curriculum/days/${dayNumber}`),
    enabled: !!isSignedIn && dayNumber >= 1,
  });
}

export function useLessonCards(dayNumber: number) {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["curriculum", "cards", dayNumber],
    queryFn: () => apiFetch<LessonCard[]>(`/curriculum/days/${dayNumber}/cards`),
    enabled: !!isSignedIn && dayNumber >= 1,
  });
}

export function useDayQuiz(dayNumber: number) {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["curriculum", "quiz", dayNumber],
    queryFn: () =>
      apiFetch<{ lessonId: number; dayNumber: number; questions: { id: number; questionText: string; answerText: string; questionOrder: number }[] }>(
        `/curriculum/days/${dayNumber}/quiz`,
      ),
    enabled: !!isSignedIn && dayNumber >= 1,
  });
}

export function useCurriculumDays() {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["curriculum", "days"],
    queryFn: () =>
      apiFetch<(CurriculumDay & { status: string; progress: UserLessonProgress | null })[]>("/curriculum/days"),
    enabled: !!isSignedIn,
  });
}

export function useCurriculumProgress() {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: ["curriculum", "progress"],
    queryFn: () =>
      apiFetch<{
        streak: { currentStreak: number; longestStreak: number; lastCompletedDate: string | null };
        levelProgress: { levelId: number; badgeUnlocked: boolean; completedAt: string | null }[];
        lessonProgress: { dayNumber: number; topicTitle: string; quizScore: number | null; dayCompletedAt: string | null }[];
        completionPercent: number;
        stewardUnlocked: boolean;
      }>("/curriculum/progress"),
    enabled: !!isSignedIn,
  });
}

export function useUpdateDayProgress(dayNumber: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: {
      morningPrayerViewed?: boolean;
      cardsCompleted?: boolean;
      quizCompleted?: boolean;
      quizScore?: number;
      gameCompleted?: boolean;
      nightPrayerViewed?: boolean;
    }) =>
      apiFetch<UserLessonProgress>(`/curriculum/days/${dayNumber}/progress`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["curriculum"] });
    },
  });
}
