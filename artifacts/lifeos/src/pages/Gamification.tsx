import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Zap, Medal, Award } from "lucide-react";
import { ChallengesTab } from "@/components/gamification/ChallengesTab";
import { BadgesTab } from "@/components/gamification/BadgesTab";
import { XpHistoryTab } from "@/components/gamification/XpHistoryTab";
import { useXpEvents, useUserBadges } from "@/hooks/useGamification";

export default function Gamification() {
  const { data: xpEvents, isLoading: xpLoading } = useXpEvents();
  const { data: userBadges, isLoading: badgesLoading } = useUserBadges();

  const totalXp = xpEvents?.reduce((sum, e) => sum + e.xpAmount, 0) ?? 0;
  const statsLoading = xpLoading || badgesLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Trophy className="h-9 w-9 text-amber-500" />
          Achievements
        </h1>
        <p className="text-muted-foreground text-lg">Challenges, badges, and XP progress</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              Total XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold text-purple-600">{totalXp} XP</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Medal className="h-4 w-4 text-amber-500" />
              Badges Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{userBadges?.length ?? 0}</div>}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="challenges" className="space-y-4">
        <TabsList>
          <TabsTrigger value="challenges" className="gap-1"><Award className="h-4 w-4" />Challenges</TabsTrigger>
          <TabsTrigger value="badges" className="gap-1"><Medal className="h-4 w-4" />Badges</TabsTrigger>
          <TabsTrigger value="xp" className="gap-1"><Zap className="h-4 w-4" />XP History</TabsTrigger>
        </TabsList>
        <TabsContent value="challenges"><ChallengesTab /></TabsContent>
        <TabsContent value="badges"><BadgesTab /></TabsContent>
        <TabsContent value="xp"><XpHistoryTab /></TabsContent>
      </Tabs>
    </div>
  );
}
