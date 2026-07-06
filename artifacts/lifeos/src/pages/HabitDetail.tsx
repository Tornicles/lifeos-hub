import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { useListHabits, useUpdateHabit, useListHabitCheckins, useCreateHabitCheckin, getListHabitsQueryKey, getListHabitCheckinsQueryKey } from "@workspace/api-client-react";
import { 
  ArrowLeft, 
  Flame, 
  CheckCircle2,
  Circle,
  TrendingUp,
  Calendar as CalendarIcon,
  Edit
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useState, useEffect } from 'react';

export default function HabitDetail() {
  const { habitId } = useParams<{ habitId: string }>();
  const id = parseInt(habitId!);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Fetch habit details (approximated by finding in list)
  const { data: habits, isLoading: habitsLoading } = useListHabits();
  const habit = habits?.find(h => h.id === id);
  const habitLoading = habitsLoading;

  useEffect(() => {
    if (habit?.description) {
      setDescription(habit.description);
    }
  }, [habit]);

  // Fetch habit check-ins
  const { data: checkins, isLoading: checkinsLoading } = useListHabitCheckins(id);

  // Update habit description
  const updateHabit = useUpdateHabit();
  const updateDescription = {
    mutate: (newDescription: string) => {
      updateHabit.mutate({
        id,
        data: { description: newDescription }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
          toast.success('Description updated');
          setEditingDescription(false);
        }
      });
    },
    isPending: updateHabit.isPending
  };

  // Check in for today
  const createCheckin = useCreateHabitCheckin();
  const checkIn = {
    mutate: () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already checked in today
      const existing = checkins?.find(c => c.date === today);
      
      if (existing) {
        toast.error('Toggling off check-ins is not supported via current API');
      } else {
        createCheckin.mutate({
          habitId: id,
          data: {
            date: today,
            done: true
          }
        }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListHabitCheckinsQueryKey(id) });
            queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
          }
        });
      }
    },
    isPending: createCheckin.isPending
  };

  if (habitLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Habit Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested habit doesn't exist.</p>
          <Button onClick={() => navigate('/habits')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Habits
          </Button>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const checkedInToday = checkins?.some(c => c.date === today && c.done);

  // Calculate stats
  const last7Days = Array.from({ length: 7 }, (_, i) => 
    subDays(new Date(), i).toISOString().split('T')[0]
  );
  const last7DaysCheckins = checkins?.filter(c => last7Days.includes(c.date)).length || 0;
  const consistency = Math.round((last7DaysCheckins / 7) * 100);

  // Get check-in dates for calendar highlighting
  const checkinDates = checkins?.map(c => new Date(c.date)) || [];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/habits')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{habit.name}</h1>
            <p className="text-muted-foreground">Track your progress</p>
          </div>
        </div>
        <Button onClick={() => navigate('/habits')}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Habit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-600" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600">{habit.streak || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              7-Day Consistency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{consistency}%</div>
            <p className="text-sm text-muted-foreground mt-1">{last7DaysCheckins} of 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Total Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{checkins?.length || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">all time</p>
          </CardContent>
        </Card>
      </div>

      {/* Check-in Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={() => checkIn.mutate()}
            disabled={checkIn.isPending}
            size="lg"
            className="w-full"
            variant={checkedInToday ? "outline" : "default"}
          >
            {checkedInToday ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
                Checked in today!
              </>
            ) : (
              <>
                <Circle className="mr-2 h-5 w-5" />
                Check in for today
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Check-in Calendar</CardTitle>
          <CardDescription>Days you completed this habit</CardDescription>
        </CardHeader>
        <CardContent>
          {checkinsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Calendar
              mode="multiple"
              selected={checkinDates}
              className="rounded-md border"
            />
          )}
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Description</CardTitle>
          {!editingDescription && (
            <Button variant="outline" size="sm" onClick={() => setEditingDescription(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editingDescription ? (
            <div className="space-y-4">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this habit..."
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={() => updateDescription.mutate(description)}>
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDescription(habit.description || '');
                    setEditingDescription(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {habit.description || 'No description yet. Click Edit to add one.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Check-ins */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Check-ins</CardTitle>
          <CardDescription>Your last 30 check-ins</CardDescription>
        </CardHeader>
        <CardContent>
          {checkinsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : checkins && checkins.length > 0 ? (
            <div className="space-y-2">
              {checkins.slice(0, 30).map((checkin) => (
                <div
                  key={checkin.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium">
                      {format(new Date(checkin.date), 'EEEE, MMM d, yyyy')}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Completed
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No check-ins yet. Start today!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
