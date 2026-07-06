import { useQueryClient } from '@tanstack/react-query';
import { useGenerateAiInsight } from "@workspace/api-client-react";
import { useToast } from '@/hooks/use-toast';

export interface AIInsights {
  daily_focus: string;
  primary_action: string;
  secondary_actions: string[];
  weakest_area: string;
  weakest_area_advice: string;
  strengths: string[];
  mood_prediction: 'positive' | 'neutral' | 'challenged';
  energy_recommendation: 'rest' | 'balance' | 'push';
  weekly_theme: string;
}

export interface InsightsContext {
  ultra_score: number;
  score_trend: number;
  weakest_hub: { name: string; score: number; code: string } | null;
  strongest_hub: { name: string; score: number; code: string } | null;
  broken_streaks: number;
  strong_streaks: number;
  active_projects: number;
  overdue_tasks: number;
  today_events: number;
  recent_activity: number;
  hubs_below_50: number;
}

export interface AIInsightsResponse {
  insights: AIInsights;
  context: InsightsContext;
  generated_at: string;
}

export const useAIInsights = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateAiInsightMutation = useGenerateAiInsight();

  const regenerate = {
    mutate: () => {
      // @ts-ignore
      generateAiInsightMutation.mutate({ data: {} }, {
        onSuccess: () => {
          toast({
            title: 'Insights Refreshed',
            description: 'Your AI insights have been updated',
          });
          queryClient.invalidateQueries({ queryKey: ['generateAiInsight'] });
        }
      });
    },
    isLoading: generateAiInsightMutation.isPending,
  };

  return {
    // @ts-ignore
    insights: generateAiInsightMutation.data?.insights,
    // @ts-ignore
    context: generateAiInsightMutation.data?.context,
    // @ts-ignore
    generated_at: generateAiInsightMutation.data?.generatedAt || generateAiInsightMutation.data?.generated_at,
    isLoading: generateAiInsightMutation.isPending,
    error: generateAiInsightMutation.error,
    regenerate,
  };
};
