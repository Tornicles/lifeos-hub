import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEvaluateAutomation } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { 
  Brain, 
  Target, 
  TrendingDown, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { ScoreRing } from "@/components/ui/score-ring";

export default function AutomationDiagnostics() {
  const evaluateMutation = useEvaluateAutomation();

  const { data: diagnostics, isLoading, refetch } = useQuery({
    queryKey: ['automation-diagnostics'],
    queryFn: async () => {
      return await evaluateMutation.mutateAsync();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const runDiagnostics = async () => {
    toast.loading('Running diagnostics...');
    await refetch();
    toast.dismiss();
    toast.success('Diagnostics complete');
  };

  const getStateColor = (state: string) => {
    const stateMap: Record<string, string> = {
      'Elite': 'text-ultra-peak',
      'Excellent': 'text-success',
      'Good': 'text-success',
      'Stable': 'text-primary',
      'Weak': 'text-warning',
      'Danger': 'text-ultra-danger',
      'Critical': 'text-ultra-danger',
    };
    return stateMap[state] || 'text-muted-foreground';
  };

  const getPriorityColor = (level: string) => {
    if (level.includes('Emergency')) return 'destructive';
    if (level.includes('High')) return 'default';
    if (level.includes('Medium')) return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-ultra bg-clip-text text-transparent">
            System Diagnostics
          </h1>
          <p className="text-muted-foreground text-lg">
            Complete automation engine analysis and evaluation
          </p>
        </div>
        <Button onClick={runDiagnostics} size="lg">
          <RefreshCw className="h-5 w-5 mr-2" />
          Run Diagnostics
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : diagnostics ? (
        <>
          {/* Daily Brief */}
          <Card className="border-2 border-primary/30 shadow-lg">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                Daily Intelligence Brief
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-lg leading-relaxed whitespace-pre-line">
                {/* Approximate since schema changed */}
                System evaluation completed with {diagnostics.rulesEvaluated} rules evaluated and {diagnostics.actionsQueued} actions queued.
              </p>
            </CardContent>
          </Card>

          {/* Triggered Rules */}
          <Card className="border-2 border-accent/30 shadow-lg">
            <CardHeader className="bg-accent/5">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent" />
                Triggered Automation Rules
              </CardTitle>
              <CardDescription>
                Rules that activated during evaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 text-muted-foreground italic">
                Automation engine diagnostics currently simplified. Check rules for specific triggers.
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert>
          <AlertDescription>
            No diagnostics data available. Click "Run Diagnostics" to evaluate your system.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function calculateState(score: number): string {
  if (score >= 91) return 'Elite';
  if (score >= 81) return 'Excellent';
  if (score >= 71) return 'Good';
  if (score >= 56) return 'Stable';
  if (score >= 41) return 'Weak';
  if (score >= 21) return 'Danger';
  return 'Critical';
}