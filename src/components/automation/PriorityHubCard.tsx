import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target,
  AlertTriangle, 
  Briefcase,
  Heart,
  Dumbbell,
  GraduationCap,
  Brain,
  Home,
  Users,
  FolderKanban
} from "lucide-react";
import { AutomationResult } from "@/hooks/useAutomationEngine";

interface PriorityHubCardProps {
  automation: AutomationResult;
}

const hubIcons: Record<string, any> = {
  FINANCE: Briefcase,
  HEALTH: Dumbbell,
  WORK: Briefcase,
  ACADEMY: GraduationCap,
  PERSONAL_DEV: Brain,
  HOUSEHOLD: Home,
  RELATIONSHIPS: Heart,
  PROJECTS: FolderKanban,
  MINDSET: Brain,
};

export function PriorityHubCard({ automation }: PriorityHubCardProps) {
  const priorityHub = automation.priority_hub || automation.weakest_hub;
  
  if (!priorityHub) {
    return null;
  }

  const Icon = hubIcons[priorityHub.code] || Target;
  const scoreColor = automation.priority_score > 70 ? 'text-ultra-danger' : 
                     automation.priority_score > 50 ? 'text-warning' : 
                     'text-ultra-stable';

  return (
    <Card className="border-2 border-primary/30 shadow-lg">
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Priority Hub
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{priorityHub.name}</h3>
              <p className="text-sm text-muted-foreground">Needs immediate attention</p>
            </div>
          </div>
          {automation.priority_score > 60 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              High Priority
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current Score</span>
            <span className={`text-xl font-bold ${scoreColor}`}>
              {automation.weakest_score.toFixed(1)}
            </span>
          </div>
          <Progress 
            value={automation.weakest_score} 
            className="h-2"
          />
          
          <div className="pt-3 border-t space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Priority Score</span>
              <span className="font-medium">{automation.priority_score.toFixed(0)}/100</span>
            </div>
            {automation.hub_imbalance > 30 && (
              <div className="flex items-center gap-1 text-xs text-warning">
                <AlertTriangle className="h-3 w-3" />
                <span>High domain imbalance detected ({automation.hub_imbalance.toFixed(0)} points)</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
