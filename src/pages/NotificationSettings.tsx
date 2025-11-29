import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function NotificationSettings() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Create default if doesn't exist
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newPrefs;
      }
      
      return data;
    },
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: any) => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(updates)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Notification preferences updated');
    },
    onError: (error) => {
      toast.error('Failed to update preferences');
      console.error('Update preferences error:', error);
    },
  });

  const handleToggle = (field: string, value: boolean) => {
    if (preferences) {
      updatePreferences.mutate({
        ...preferences,
        [field]: value,
      });
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    if (preferences) {
      updatePreferences.mutate({
        ...preferences,
        [field]: value,
      });
    }
  };

  const handleNumberChange = (field: string, value: number) => {
    if (preferences) {
      updatePreferences.mutate({
        ...preferences,
        [field]: value,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Customize which notifications you receive and how often
        </p>
      </div>

      <div className="space-y-6">
        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Types</CardTitle>
            <CardDescription>
              Choose which types of notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="performance-alerts">Performance Drop Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when scores fall below thresholds
                </p>
              </div>
              <Switch
                id="performance-alerts"
                checked={preferences?.performance_alerts_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('performance_alerts_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="habit-reminders">Habit Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Daily reminders for your habits
                </p>
              </div>
              <Switch
                id="habit-reminders"
                checked={preferences?.habit_reminders_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('habit_reminders_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="project-alerts">Project & Task Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications for deadlines and overdue tasks
                </p>
              </div>
              <Switch
                id="project-alerts"
                checked={preferences?.project_alerts_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('project_alerts_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="calendar-alerts">Calendar Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Event reminders and schedule conflicts
                </p>
              </div>
              <Switch
                id="calendar-alerts"
                checked={preferences?.calendar_alerts_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('calendar_alerts_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="life-events">Life Event Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Mood patterns and emotional insights
                </p>
              </div>
              <Switch
                id="life-events"
                checked={preferences?.life_event_alerts_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('life_event_alerts_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-reports">Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Performance summaries every Sunday
                </p>
              </div>
              <Switch
                id="weekly-reports"
                checked={preferences?.weekly_reports_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('weekly_reports_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="monthly-reports">Monthly Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Detailed monthly performance analysis
                </p>
              </div>
              <Switch
                id="monthly-reports"
                checked={preferences?.monthly_reports_enabled ?? true}
                onCheckedChange={(checked) => handleToggle('monthly_reports_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Intensity & Rate Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Intensity</CardTitle>
            <CardDescription>
              Control how many notifications you receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="intensity">Intensity Level</Label>
              <Select
                value={preferences?.intensity_level ?? 'medium'}
                onValueChange={(value) => handleSelectChange('intensity_level', value)}
              >
                <SelectTrigger id="intensity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Essential notifications only</SelectItem>
                  <SelectItem value="medium">Medium - Balanced notifications</SelectItem>
                  <SelectItem value="high">High - All notifications</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="max-per-hour">Max Notifications Per Hour</Label>
              <Input
                id="max-per-hour"
                type="number"
                min="1"
                max="10"
                value={preferences?.max_notifications_per_hour ?? 3}
                onChange={(e) => handleNumberChange('max_notifications_per_hour', parseInt(e.target.value))}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Prevent notification overload (1-10)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Quiet Hours</CardTitle>
            <CardDescription>
              Set times when notifications should be muted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quiet-start">Start Time</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={preferences?.quiet_hours_start ?? '22:00'}
                  onChange={(e) =>
                    updatePreferences.mutate({
                      ...preferences,
                      quiet_hours_start: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="quiet-end">End Time</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={preferences?.quiet_hours_end ?? '07:00'}
                  onChange={(e) =>
                    updatePreferences.mutate({
                      ...preferences,
                      quiet_hours_end: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              No notifications will be sent during these hours
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
