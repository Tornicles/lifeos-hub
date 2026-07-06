import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

// NOTE: this card previously called `useAIInsights()` (backed by
// `useGenerateAiInsight()`), which returned ultra-score-derived coaching
// data (mood/energy predictions, weakest hub, active projects, etc). The
// Tech-Tate schema migration removed that data source and there is no
// `/automation/generate-ai-insight` backend route (calls would 404).
// Replaced with a placeholder until this is redesigned.
export function AICoachCard() {
  return (
    <Card className="col-span-full border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
          AI Life Coach
        </CardTitle>
        <CardDescription>
          Personalized coaching insights are being redesigned around your new Finance,
          Academy, Bible, and Couples data and aren't available yet.
        </CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
