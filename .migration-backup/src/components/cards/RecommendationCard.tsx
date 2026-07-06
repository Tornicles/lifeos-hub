import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecommendationCardProps {
  title?: string;
  actions?: string[];
  opportunities?: string[];
  risks?: string[];
}

export function RecommendationCard({ 
  title = "AI Recommendations", 
  actions = [], 
  opportunities = [],
  risks = []
}: RecommendationCardProps) {
  const hasContent = actions.length > 0 || opportunities.length > 0 || risks.length > 0;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-secondary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasContent ? (
          <p className="text-sm text-muted-foreground">No suggestions today. Keep up the good work!</p>
        ) : (
          <>
            {actions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Suggested Actions
                </h4>
                <ul className="space-y-1">
                  {actions.map((action, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {opportunities.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  Opportunities
                </h4>
                <ul className="space-y-1">
                  {opportunities.map((opp, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {risks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="w-4 h-4" />
                  Risk Factors
                </h4>
                <ul className="space-y-1">
                  {risks.map((risk, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
