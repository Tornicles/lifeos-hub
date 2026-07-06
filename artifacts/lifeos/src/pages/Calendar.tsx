import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListCalendarEntries } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { Plus, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react";

export default function Calendar() {
  const { user } = useUser();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'day'>('week');

  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const { data: entries, isLoading } = useListCalendarEntries({
    // We'll rely on the API to return entries for the current user
    // The previous implementation used startDate and endDate in Supabase query
  });

  const getEntriesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return entries?.filter(e => e.date === dateStr) || [];
  };

  const getFocusDomainColor = (domain: string | null | undefined) => {
    const colors: Record<string, string> = {
      'Spirituality': 'bg-purple-100 text-purple-700 border-purple-200',
      'Career Master': 'bg-blue-100 text-blue-700 border-blue-200',
      'Social Life': 'bg-pink-100 text-pink-700 border-pink-200',
      'Emotional Intelligence': 'bg-green-100 text-green-700 border-green-200',
      'Personal Branding': 'bg-orange-100 text-orange-700 border-orange-200',
      'Fitness Performance': 'bg-red-100 text-red-700 border-red-200',
      'Dating & Attraction': 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return domain ? colors[domain] || 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Calendar & Planner</h1>
          <p className="text-muted-foreground text-lg">
            Time blocking and focus scheduling
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold">
            {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            {' - '}
            {weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
          Today
        </Button>
      </div>

      {/* Week View */}
      {isLoading ? (
        <div className="grid gap-3 grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-7">
          {weekDates.map((date, index) => {
            const dayEntries = getEntriesForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <Card 
                key={index} 
                className={`${isToday ? 'border-primary border-2' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-2xl font-bold ${isToday ? 'text-primary' : ''}`}>
                      {date.getDate()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dayEntries.length > 0 ? (
                    dayEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className={`p-2 rounded-md border text-xs ${getFocusDomainColor(entry.focusDomain)}`}
                      >
                        <div className="font-medium truncate">{entry.title}</div>
                        {entry.startTime && (
                          <div className="flex items-center gap-1 mt-1 opacity-75">
                            <Clock className="h-3 w-3" />
                            {entry.startTime}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      No events
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Events This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{entries?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Most Active Domain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">
              {entries && entries.length > 0
                ? Object.entries(
                    entries.reduce((acc, e) => {
                      const domain = e.focusDomain || 'None';
                      acc[domain] = (acc[domain] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).sort((a, b) => b[1] - a[1])[0]?.[0] || '--'
                : '--'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Scheduled Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {entries
                ? entries.reduce((total, e) => {
                    if (e.startTime && e.endTime) {
                      const start = parseInt(e.startTime.split(':')[0]);
                      const end = parseInt(e.endTime.split(':')[0]);
                      return total + (end - start);
                    }
                    return total;
                  }, 0)
                : 0}h
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
