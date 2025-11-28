import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAutomationEngine } from "@/hooks/useAutomationEngine";
import { useDailyInsight } from "@/hooks/useDailyInsight";
import { StateBadge } from "@/components/automation/StateBadge";
import { PriorityHubCard } from "@/components/automation/PriorityHubCard";
import { HubTile } from "@/components/cards/HubTile";
import { RecommendationCard } from "@/components/cards/RecommendationCard";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  TrendingDown,
  Sparkles,
  Plus,
  DollarSign,
  Heart,
  Briefcase,
  GraduationCap,
  User,
  Home,
  Users,
  FolderKanban,
  Brain
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: automation, isLoading: automationLoading } = useAutomationEngine();
  const { data: insight, isLoading: insightLoading } = useDailyInsight();

  const currentDate = new Date();
  const greeting = currentDate.getHours() < 12 ? "Good Morning" : currentDate.getHours() < 18 ? "Good Afternoon" : "Good Evening";
  const dateStr = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Hub data with icons
  const hubs = [
    { name: "Finance", icon: DollarSign, code: "FIN" },
    { name: "Health", icon: Heart, code: "HEA" },
    { name: "Work", icon: Briefcase, code: "WOR" },
    { name: "Academy", icon: GraduationCap, code: "ACA" },
    { name: "Personal Dev", icon: User, code: "PER" },
    { name: "Household", icon: Home, code: "HOU" },
    { name: "Relationships", icon: Users, code: "REL" },
    { name: "Projects", icon: FolderKanban, code: "PRO" },
    { name: "Mindset", icon: Brain, code: "MIN" },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Greeting Header */}
      <div className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold">{greeting}!</h1>
        <p className="text-primary-foreground/80 flex items-center gap-2 mt-1">
          <Sparkles className="w-4 h-4" />
          {dateStr}
        </p>
      </div>

      {/* Ultra Score & System State */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1 bg-gradient-to-br from-primary/10 to-secondary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ultra Score</CardTitle>
          </CardHeader>
          <CardContent>
            {automationLoading ? (
              <Skeleton className="h-16 w-24" />
            ) : (
              <div className="space-y-2">
                <p className="text-4xl font-bold">{automation?.ultra_score || 0}</p>
                {automation && <StateBadge automation={automation} size="sm" showReasons={false} />}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {automationLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Priority Zone</span>
                  <span className="font-medium">{automation?.priority_zone || "Balanced"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">7-Day Trend</span>
                  <span className="font-medium flex items-center gap-1">
                    {automation?.score_trend && automation.score_trend > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">+{automation.score_trend}</span>
                      </>
                    ) : automation?.score_trend && automation.score_trend < 0 ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <span className="text-red-600">{automation.score_trend}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">No change</span>
                    )}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Insight */}
      {!insightLoading && insight && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Daily Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{insight.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Hubs Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Life Hubs</h2>
          <Button variant="outline" size="sm" onClick={() => navigate("/logs")}>
            <Plus className="w-4 h-4 mr-2" />
            Add Log
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {hubs.map((hub) => (
            <HubTile
              key={hub.code}
              name={hub.name}
              icon={hub.icon}
              onClick={() => navigate(`/hubs/${hub.code}`)}
            />
          ))}
        </div>
      </div>

      {/* Priority Hub & AI Recommendations */}
      <div className="grid gap-4 md:grid-cols-2">
        {!automationLoading && automation?.priority_hub && (
          <PriorityHubCard automation={automation} />
        )}
        
        {!automationLoading && automation?.focus_recommendations && (
          <RecommendationCard
            actions={automation.focus_recommendations.suggested_actions}
            opportunities={automation.focus_recommendations.opportunities}
            risks={automation.focus_recommendations.risk_factors}
          />
        )}
      </div>

      {/* AI Action Plan - Detailed */}
      {!automationLoading && automation?.focus_recommendations && (
        <Card className="border-2 border-accent/30 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-accent/5 to-primary/5">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-accent" />
              AI Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">Primary Focus</h3>
                <div className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold text-lg">
                  {automation.focus_recommendations.primary_domain}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">Secondary Focus</h3>
                <div className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-semibold text-lg">
                  {automation.focus_recommendations.secondary_domain}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Today's Action Items</h3>
              <ul className="space-y-3">
                {automation.focus_recommendations.suggested_actions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="text-2xl font-bold text-primary mt-0.5">{idx + 1}.</span>
                    <span className="text-base flex-1">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
