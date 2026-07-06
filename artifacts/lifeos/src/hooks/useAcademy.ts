import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useListTopics,
  useListLessons,
  getListLessonsQueryKey,
  useListLessonProgress,
  useCreateLessonProgress,
  getListLessonProgressQueryKey,
  useGetQuiz,
  getGetQuizQueryKey,
  useListQuizAttempts,
  useCreateQuizAttempt,
  getListQuizAttemptsQueryKey,
  type QuizAttemptInput,
} from '@workspace/api-client-react';

export const useTopics = (hubId?: number) => useListTopics(hubId !== undefined ? { hubId } : undefined);

export const useLessons = (topicId: number | null) =>
  useListLessons(topicId ?? 0, {
    query: { enabled: topicId !== null, queryKey: getListLessonsQueryKey(topicId ?? 0) },
  });

export const useLessonProgress = () => useListLessonProgress();

export const useMarkLessonProgress = () => {
  const queryClient = useQueryClient();
  const mutation = useCreateLessonProgress();
  return {
    ...mutation,
    mutate: ({ lessonId, completed }: { lessonId: number; completed: boolean }) =>
      mutation.mutate(
        { data: { lessonId, completed } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListLessonProgressQueryKey() });
            toast.success(completed ? 'Lesson marked complete' : 'Lesson progress saved');
          },
          onError: (error: any) => {
            console.error('Lesson progress error:', error);
            toast.error(error?.message || 'Failed to save lesson progress');
          },
        },
      ),
  };
};

export const useQuiz = (quizId: number | null) =>
  useGetQuiz(quizId ?? 0, {
    query: { enabled: quizId !== null, queryKey: getGetQuizQueryKey(quizId ?? 0) },
  });

export const useQuizAttempts = () => useListQuizAttempts();

export const useSubmitQuizAttempt = () => {
  const queryClient = useQueryClient();
  const mutation = useCreateQuizAttempt();
  return {
    ...mutation,
    mutate: (data: QuizAttemptInput) =>
      mutation.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListQuizAttemptsQueryKey() });
            toast.success('Quiz attempt recorded');
          },
          onError: (error: any) => {
            console.error('Quiz attempt error:', error);
            toast.error(error?.message || 'Failed to record quiz attempt');
          },
        },
      ),
  };
};
