import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutomationEngine } from "@/hooks/useAutomationEngine";
import { HubTile } from "@/components/cards/HubTile";
import { AICoachCard } from "@/components/dashboard/AICoachCard";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles,
  DollarSign,
  Heart,
  Briefcase,
  GraduationCap,
  User,
  Home,
  Users,
  FolderKanban,
  Brain,
  Zap
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: automation, isLoading: automationLoading } = useAutomationEngine();

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

      {/* AI Coach Dashboard */}
      <AICoachCard />

      {/* Automation Engine Summary */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Automation Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          {automationLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-bold">{automation?.rulesEvaluated ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Active rules evaluated</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{automation?.actionsQueued ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Actions queued</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hubs Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Life Hubs</h2>
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

    </div>
  );
}
