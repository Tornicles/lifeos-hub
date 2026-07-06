import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  useGetNotificationPreferences, 
  useUpdateNotificationPreferences,
  getGetNotificationPreferencesQueryKey
} from "@workspace/api-client-react";
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

  const { data: preferences, isLoading } = useGetNotificationPreferences();

  const updatePreferencesMutation = useUpdateNotificationPreferences();

  const handleToggle = (field: string, value: boolean) => {
    if (preferences) {
      updatePreferencesMutation.mutate({
        data: {
          ...preferences,
          [field]: value,
        } as any
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetNotificationPreferencesQueryKey() });
          toast.success('Notification preferences updated');
        },
        onError: (error) => {
          toast.error('Failed to update preferences');
          console.error('Update preferences error:', error);
        }
      });
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    if (preferences) {
      updatePreferencesMutation.mutate({
        data: {
          ...preferences,
          [field]: value,
        } as any
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetNotificationPreferencesQueryKey() });
          toast.success('Notification preferences updated');
        },
        onError: (error) => {
          toast.error('Failed to update preferences');
          console.error('Update preferences error:', error);
        }
      });
    }
  };

  const handleNumberChange = (field: string, value: number) => {
    if (preferences) {
      updatePreferencesMutation.mutate({
        data: {
          ...preferences,
          [field]: value,
        } as any
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetNotificationPreferencesQueryKey() });
          toast.success('Notification preferences updated');
        },
        onError: (error) => {
          toast.error('Failed to update preferences');
          console.error('Update preferences error:', error);
        }
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
                // @ts-ignore
                checked={preferences?.performanceAlertsEnabled ?? preferences?.performance_alerts_enabled ?? true}
                // @ts-ignore
                onCheckedChange={(checked) => handleToggle('performanceAlertsEnabled', checked)}
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
                // @ts-ignore
                checked={preferences?.habitRemindersEnabled ?? preferences?.habit_reminders_enabled ?? true}
                // @ts-ignore
                onCheckedChange={(checked) => handleToggle('habitRemindersEnabled', checked)}
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
                // @ts-ignore
                checked={preferences?.projectAlertsEnabled ?? preferences?.project_alerts_enabled ?? true}
                // @ts-ignore
                onCheckedChange={(checked) => handleToggle('projectAlertsEnabled', checked)}
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
                // @ts-ignore
                checked={preferences?.calendarAlertsEnabled ?? preferences?.calendar_alerts_enabled ?? true}
                // @ts-ignore
                onCheckedChange={(checked) => handleToggle('calendarAlertsEnabled', checked)}
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
                // @ts-ignore
                checked={preferences?.lifeEventAlertsEnabled ?? preferences?.life_event_alerts_enabled ?? true}
                // @ts-ignore
                onCheckedChange={(checked) => handleToggle('lifeEventAlertsEnabled', checked)}
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
                // @ts-ignore
                checked={preferences?.weeklyReportsEnabled ?? preferences?.weekly_reports_enabled ?? true}
                // @ts-ignore
                onCheckedChange={(checked) => handleToggle('weeklyReportsEnabled', checked)}
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
                // @ts-ignore
                checked={preferences?.monthlyReportsEnabled ?? preferences?.monthly_reports_enabled ?? true}
                // @ts-ignore
                onCheckedChange={(checked) => handleToggle('monthlyReportsEnabled', checked)}
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
                // @ts-ignore
                value={preferences?.intensityLevel ?? preferences?.intensity_level ?? 'medium'}
                // @ts-ignore
                onValueChange={(value) => handleSelectChange('intensityLevel', value)}
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
                // @ts-ignore
                value={preferences?.maxNotificationsPerHour ?? preferences?.max_notifications_per_hour ?? 3}
                // @ts-ignore
                onChange={(e) => handleNumberChange('maxNotificationsPerHour', parseInt(e.target.value))}
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
                  // @ts-ignore
                  value={preferences?.quietHoursStart ?? preferences?.quiet_hours_start ?? '22:00'}
                  onChange={(e) =>
                    updatePreferencesMutation.mutate({
                      data: {
                        ...preferences,
                        // @ts-ignore
                        quietHoursStart: e.target.value,
                      } as any
                    }, {
                      onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: getGetNotificationPreferencesQueryKey() });
                      }
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="quiet-end">End Time</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  // @ts-ignore
                  value={preferences?.quietHoursEnd ?? preferences?.quiet_hours_end ?? '07:00'}
                  onChange={(e) =>
                    updatePreferencesMutation.mutate({
                      data: {
                        ...preferences,
                        // @ts-ignore
                        quietHoursEnd: e.target.value,
                      } as any
                    }, {
                      onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: getGetNotificationPreferencesQueryKey() });
                      }
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
