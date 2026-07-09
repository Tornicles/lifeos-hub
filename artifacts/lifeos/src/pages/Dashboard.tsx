import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CurriculumHomeTiles } from "@/components/dashboard/CurriculumHomeTiles";
import { useNavigate } from "react-router-dom";
import { DollarSign, Calendar, GraduationCap } from "lucide-react";
import { HubTile } from "@/components/cards/HubTile";
import { useSavingsGoals } from "@/hooks/useFinance";
import { useCalendarEntries } from "@/hooks/useCalendar";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: goals, isLoading: goalsLoading } = useSavingsGoals();
  const { data: calendar, isLoading: calendarLoading } = useCalendarEntries();

  const currentDate = new Date();
  const greeting =
    currentDate.getHours() < 12 ? "Good Morning" : currentDate.getHours() < 18 ? "Good Afternoon" : "Good Evening";
  const dateStr = currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const topGoal = goals?.[0];
  const upcomingBills = calendar?.filter((e) => e.dueDay != null).length ?? 0;

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold">{greeting}</h1>
        <p className="text-muted-foreground text-sm">{dateStr}</p>
      </div>

      <CurriculumHomeTiles />

      <div className="grid grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate("/finance")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Savings snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : topGoal ? (
              <p className="text-2xl font-bold">
                ${Number(topGoal.currentAmount).toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground"> / ${Number(topGoal.targetAmount).toLocaleString()}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No goals yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate("/calendar")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Bills tracked
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calendarLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{upcomingBills}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <HubTile name="Finance" icon={DollarSign} onClick={() => navigate("/finance")} />
        <HubTile name="Learn" icon={GraduationCap} onClick={() => navigate("/academy")} />
      </div>
    </div>
  );
}
