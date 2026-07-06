import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useGetMyProfile,
  useUpdateMyProfile,
  getGetMyProfileQueryKey,
  type Profile,
} from '@workspace/api-client-react';

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

// localStorage flag so a user who clicked "Get Started" but closed the app
// before making their step-2 selection doesn't see the Welcome screen again.
// Step 1 collects no profile field, so it can't be resumed from the DB alone;
// a brand-new profile (nothing set, flag never written) still starts at step 1.
function hasSeenWelcome(userId: string): boolean {
  return localStorage.getItem(`onboarding_started_${userId}`) === 'true';
}
export function markWelcomeSeen(userId: string): void {
  localStorage.setItem(`onboarding_started_${userId}`, 'true');
}

// Determines which step an in-progress user should resume at, based on which
// profile fields are already set. Step 6 has no dedicated "seen this screen"
// field: since finishing step 6 is exactly what sets onboardingCompletedAt,
// having every other field set while onboardingCompletedAt is still null
// unambiguously means step 6 is the only one left.
export function getResumeStep(
  userId: string,
  profile: Pick<Profile, 'accountType' | 'financialGoal' | 'knowledgeLevel' | 'dailyLearningMinutes'>,
): OnboardingStep {
  if (!profile.accountType) return hasSeenWelcome(userId) ? 2 : 1;
  if (!profile.financialGoal) return 3;
  if (!profile.knowledgeLevel) return 4;
  if (profile.dailyLearningMinutes == null) return 5;
  return 6;
}

export function useOnboardingProfile() {
  return useGetMyProfile({
    query: { queryKey: getGetMyProfileQueryKey() },
  });
}

export function useCompleteOnboardingStep() {
  const queryClient = useQueryClient();
  return useUpdateMyProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
      },
      onError: (error: any) => {
        console.error('Onboarding update error:', error);
        toast.error(error?.message || 'Something went wrong, please try again');
      },
    },
  });
}
