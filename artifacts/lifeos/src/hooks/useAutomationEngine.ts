import { useQuery } from '@tanstack/react-query';
import { evaluateAutomation } from "@workspace/api-client-react";

export interface AutomationResult {
  ultraScore: number;
  state: string;
  baseState: string;
  stateColor: string;
  stateIcon: string;
  stateLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
  stateReasons: string[];
  priorityZone: string;
  priorityHub: { code: string; name: string } | null;
  priorityScore: number;
  weakestHub: { code: string; name: string } | null;
  weakestScore: number;
  strongestHub: { code: string; name: string } | null;
  hubsInDanger: number;
  hubImbalance: number;
  habitConsistency: number;
  calendarLoad: number;
  scoreTrend: number;
  recentActivity: number;
  triggeredActions: Array<{
    rule: string;
    target: string;
    value: string;
    reason: string;
  }>;
  focusRecommendations: {
    primaryDomain: string;
    secondaryDomain: string;
    suggestedActions: string[];
    riskFactors: string[];
    opportunities: string[];
  };
  date: string;
}

export const useAutomationEngine = () => {
  return useQuery({
    queryKey: ['evaluateAutomation'],
    queryFn: async () => {
      const data = await evaluateAutomation();
      return data as unknown as AutomationResult;
    },
    refetchInterval: 60000, // Refresh every minute
  });
};
