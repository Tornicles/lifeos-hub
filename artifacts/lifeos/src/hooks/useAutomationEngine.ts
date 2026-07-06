import { useQuery } from '@tanstack/react-query';
import { evaluateAutomation } from "@workspace/api-client-react";

// NOTE: the backend `/api/automation/evaluate` route only returns
// `{ rulesEvaluated, actionsQueued }` after the Tech-Tate schema migration
// dropped `ultra_metrics_table` (see api-server/src/routes/automation.ts).
// The richer ultra-score/priority-hub/focus-recommendation fields this used
// to return no longer exist server-side; do not add them back here without
// a real backend computation to back them.
export interface AutomationResult {
  rulesEvaluated: number;
  actionsQueued: number;
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
