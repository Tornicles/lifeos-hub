import { useGenerateDailyInsight } from "@workspace/api-client-react";

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
  const mutation = useGenerateDailyInsight();
  
  // Daily insight was a query, but the API has it as a mutation (POST)
  // We'll wrap it in a useEffect or similar if needed, 
  // but for now let's just use the mutation.
  // Actually, we should probably trigger it.
  
  return mutation;
};
