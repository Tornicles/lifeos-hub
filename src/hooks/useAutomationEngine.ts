import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AutomationResult {
  ultra_score: number;
  state: string;
  state_color: string;
  state_icon: string;
  weakest_hub: { code: string; name: string } | null;
  weakest_score: number;
  hubs_in_danger: number;
  triggered_actions: Array<{
    rule: string;
    target: string;
    value: string;
    reason: string;
  }>;
  focus_recommendations: {
    primary_domain: string;
    secondary_domain: string;
    suggested_actions: string[];
  };
  date: string;
}

export const useAutomationEngine = () => {
  return useQuery({
    queryKey: ['automation-engine'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('evaluate-automation');
      
      if (error) throw error;
      return data as AutomationResult;
    },
    refetchInterval: 60000, // Refresh every minute
  });
};
