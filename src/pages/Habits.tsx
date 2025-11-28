import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Flame, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function Habits() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: habits, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from('habits')
        .select('*, habit_checkins(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async ({ habitId, done }: { habitId: number; done: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (done) {
        // Create check-in
        const { error } = await supabase
          .from('habit_checkins')
          .upsert({
            habit_id: habitId,
            date: today,
            done: true,
          }, {
            onConflict: 'habit_id,date',
          });

        if (error) throw error;

        // Update habit streak
        const { data: habit } = await supabase
          .from('habits')
          .select('streak, last_checkin')
          .eq('id', habitId)
          .single();

        if (habit) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          const newStreak = habit.last_checkin === yesterday ? (habit.streak || 0) + 1 : 1;

          await supabase
            .from('habits')
            .update({
              streak: newStreak,
              last_checkin: today,
            })
            .eq('id', habitId);
        }
      } else {
        // Delete check-in
        const { error } = await supabase
          .from('habit_checkins')
          .delete()
          .eq('habit_id', habitId)
          .eq('date', today);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success("Habit updated");
    },
    onError: () => {
      toast.error("Failed to update habit");
    },
  });

  const isCheckedToday = (habit: any) => {
    return habit.habit_checkins?.some((c: any) => c.date === today && c.done);
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-purple-600";
    if (streak >= 14) return "text-green-600";
    if (streak >= 7) return "text-blue-600";
    return "text-muted-foreground";
  };

  const getWeekDates = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      dates.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }
    return dates;
  };

  const weekDates = getWeekDates();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Habits</h1>
          <p className="text-muted-foreground text-lg">
            Build consistency, one day at a time
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Habit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Habits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{habits?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {habits?.filter(h => isCheckedToday(h)).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 flex items-center gap-2">
              <Flame className="h-8 w-8" />
              {Math.max(...(habits?.map(h => h.streak || 0) || [0]))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {habits && habits.length > 0
                ? Math.round((habits.filter(h => isCheckedToday(h)).length / habits.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habits List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : habits && habits.length > 0 ? (
        <div className="space-y-4">
          {habits.map((habit) => {
            const checkedToday = isCheckedToday(habit);
            
            return (
              <Card key={habit.id} className={`transition-all ${checkedToday ? 'border-green-200 bg-green-50/50' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={checkedToday}
                      onCheckedChange={(checked) => {
                        checkInMutation.mutate({
                          habitId: habit.id,
                          done: !!checked,
                        });
                      }}
                      className="mt-1"
                    />

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">{habit.name}</h3>
                          {habit.description && (
                            <p className="text-sm text-muted-foreground">{habit.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`gap-1 ${getStreakColor(habit.streak || 0)}`}>
                            <Flame className="h-3 w-3" />
                            {habit.streak || 0} day streak
                          </Badge>
                        </div>
                      </div>

                      {/* Weekly Grid */}
                      <div className="flex items-center gap-2">
                        {weekDates.map(({ date, day }) => {
                          const isChecked = habit.habit_checkins?.some((c: any) => c.date === date && c.done);
                          const isToday = date === today;

                          return (
                            <div key={date} className="flex flex-col items-center gap-1">
                              <span className="text-xs text-muted-foreground">{day}</span>
                              <div
                                className={`h-8 w-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                                  isChecked
                                    ? 'bg-green-500 text-white'
                                    : isToday
                                    ? 'border-2 border-primary bg-primary/5'
                                    : 'bg-muted'
                                }`}
                              >
                                {isChecked && '✓'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No habits yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first habit to start building consistency
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Habit
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
