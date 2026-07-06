import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-insights-engine');
      
      if (error) throw error;
      return data as AIInsightsResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const regenerate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-insights-engine');
      if (error) throw error;
      return data as AIInsightsResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['ai-insights'], data);
      toast({
        title: 'Insights Refreshed',
        description: 'Your AI insights have been updated',
      });
    },
    onError: (error: any) => {
      if (error.message?.includes('Rate limit')) {
        toast({
          title: 'Rate Limit',
          description: 'Too many requests. Please wait a moment and try again.',
          variant: 'destructive',
        });
      } else if (error.message?.includes('credits depleted')) {
        toast({
          title: 'Credits Depleted',
          description: 'Please add credits to your workspace to continue using AI features.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to generate insights. Please try again.',
          variant: 'destructive',
        });
      }
      console.error('AI insights error:', error);
    },
  });

  return {
    insights: data?.insights,
    context: data?.context,
    generated_at: data?.generated_at,
    isLoading,
    error,
    regenerate,
  };
};
