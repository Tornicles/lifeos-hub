import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

// NOTE: this page previously called `useGenerateWeeklyInsight()` /
// `useGenerateMonthlyInsight()` for AI-generated weekly/monthly reviews.
// The Tech-Tate schema migration removed the ultra-score/project data those
// reviews were built from, and no `/automation/*-insight` backend routes
// exist (calls would 404). Replaced with a placeholder until this is
// redesigned around the new Finance/Academy/Bible/Couples data.
export default function Insights() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Coach</h1>
        <p className="text-muted-foreground">Weekly and monthly performance analysis</p>
      </div>

      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-muted-foreground" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            AI-generated weekly and monthly reviews are being redesigned around your new
            Finance, Academy, Bible, and Couples data and aren't available yet.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
