import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAIInsights } from '@/hooks/useAIInsights';
import { 
  Sparkles, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  Lightbulb, 
  RefreshCw,
  Battery,
  Smile,
  Meh,
  Frown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AICoachCard() {
  const { insights, context, isLoading, regenerate } = useAIInsights();

  const moodIcons = {
    positive: Smile,
    neutral: Meh,
    challenged: Frown,
  };

  const energyColors = {
    rest: 'text-blue-600 bg-blue-100 dark:bg-blue-950',
    balance: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950',
    push: 'text-green-600 bg-green-100 dark:bg-green-950',
  };

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="col-span-full border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-12">
          <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Insights Not Available</h3>
          <p className="text-muted-foreground text-center mb-4">
            Generate personalized insights based on your LifeOS data
          </p>
          <Button onClick={() => regenerate.mutate()} disabled={regenerate.isPending}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Insights
          </Button>
        </CardContent>
      </Card>
    );
  }

  const MoodIcon = moodIcons[insights.mood_prediction];

  return (
    <Card className="col-span-full bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              AI Life Coach
            </CardTitle>
            <CardDescription className="mt-2">
              {insights.weekly_theme}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending}
          >
            <RefreshCw className={cn('h-4 w-4', regenerate.isPending && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Focus */}
        <div className="p-4 rounded-lg bg-background border-2 border-primary/30">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Today's Focus</h3>
              <p className="text-sm text-muted-foreground">{insights.daily_focus}</p>
            </div>
          </div>
        </div>

        {/* Primary Action */}
        <div className="p-4 rounded-lg bg-background">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Top Priority</h3>
              <p className="text-sm">{insights.primary_action}</p>
            </div>
          </div>
        </div>

        {/* Secondary Actions */}
        {insights.secondary_actions.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Additional Actions
            </h3>
            <div className="space-y-2">
              {insights.secondary_actions.map((action, index) => (
                <div key={index} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                  <span className="text-muted-foreground">•</span>
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weakest Area */}
        {insights.weakest_area && (
          <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Needs Attention: {insights.weakest_area}</h3>
                <p className="text-sm text-muted-foreground">{insights.weakest_area_advice}</p>
              </div>
            </div>
          </div>
        )}

        {/* Strengths */}
        {insights.strengths.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Your Strengths</h3>
            <div className="flex flex-wrap gap-2">
              {insights.strengths.map((strength, index) => (
                <Badge key={index} variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Mood & Energy */}
        <div className="flex gap-4">
          <div className="flex-1 p-3 rounded-lg bg-background flex items-center gap-2">
            <MoodIcon className="h-5 w-5" />
            <div>
              <p className="text-xs text-muted-foreground">Predicted Mood</p>
              <p className="font-semibold capitalize">{insights.mood_prediction}</p>
            </div>
          </div>
          <div className={cn('flex-1 p-3 rounded-lg flex items-center gap-2', energyColors[insights.energy_recommendation])}>
            <Battery className="h-5 w-5" />
            <div>
              <p className="text-xs opacity-80">Energy Mode</p>
              <p className="font-semibold capitalize">{insights.energy_recommendation}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {context && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Ultra Score</p>
                <p className="font-bold text-lg">{context.ultra_score}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">7-Day Trend</p>
                <p className={cn('font-bold text-lg', context.score_trend > 0 ? 'text-green-600' : 'text-red-600')}>
                  {context.score_trend > 0 ? '+' : ''}{context.score_trend.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Active Projects</p>
                <p className="font-bold text-lg">{context.active_projects}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Strong Streaks</p>
                <p className="font-bold text-lg">{context.strong_streaks}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
