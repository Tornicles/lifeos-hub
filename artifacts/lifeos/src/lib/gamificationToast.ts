import { toast } from 'sonner';
import type { Badge } from '@workspace/api-client-react';

type GamificationResult = {
  xpAwarded?: number;
  newBadges?: Badge[];
};

export function celebrateGamification(result: GamificationResult | undefined) {
  if (!result) return;

  if (result.xpAwarded && result.xpAwarded > 0) {
    toast.success(`+${result.xpAwarded} XP earned!`);
  }

  for (const badge of result.newBadges ?? []) {
    toast.success(`🏆 Badge unlocked: ${badge.name}`, {
      description: badge.description ?? undefined,
      duration: 5000,
    });
  }
}
