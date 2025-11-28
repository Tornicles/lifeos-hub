import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailyInsight {
  summary: string;
  tone: string;
  ultra_score: number;
  score_delta: number;
  best_hub: { name: string } | null;
  best_score: number;
  worst_hub: { name: string } | null;
  worst_score: number;
  logs_count: number;
  best_streak: number;
  date: string;
}

export const useDailyInsight = () => {
  return useQuery({
    queryKey: ['daily-insight'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-daily-insight');
      
      if (error) throw error;
      return data as DailyInsight;
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });
};
