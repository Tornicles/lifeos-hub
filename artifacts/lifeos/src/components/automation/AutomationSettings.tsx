import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetAutomationSettings, useUpdateAutomationSettings, getGetAutomationSettingsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Settings, Bell, Clock, Zap } from 'lucide-react';

interface AutomationSettingsState {
  automationEnabled: boolean;
  enabledCategories: string[];
  notificationPreferences: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  maxDailyActions: number;
  priorityOverride: string | null;
}

const CATEGORIES = [
  { id: 'score_alerts', label: 'Score Alerts', description: 'Get notified when scores drop' },
  { id: 'habit_suggestions', label: 'Habit Suggestions', description: 'Receive habit recommendations' },
  { id: 'calendar_autofill', label: 'Calendar Autofill', description: 'Auto-generate calendar blocks' },
  { id: 'task_generation', label: 'Task Generation', description: 'Auto-create tasks from patterns' },
  { id: 'state_updates', label: 'State Updates', description: 'Automatic system state changes' },
];

export function AutomationSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<AutomationSettingsState>({
    automationEnabled: true,
    enabledCategories: CATEGORIES.map(c => c.id),
    notificationPreferences: { email: true, push: false, inApp: true },
    quietHours: { enabled: false, start: '22:00', end: '07:00' },
    maxDailyActions: 20,
    priorityOverride: null,
  });

  const { data: userSettings, isLoading } = useGetAutomationSettings();

  useEffect(() => {
    if (userSettings) {
      setSettings({
        automationEnabled: userSettings.automationEnabled ?? true,
        enabledCategories: (userSettings.enabledCategories as string[]) || [],
        notificationPreferences: (userSettings.notificationPreferences as any) || settings.notificationPreferences,
        quietHours: (userSettings.quietHours as any) || settings.quietHours,
        maxDailyActions: userSettings.maxDailyActions ?? 20,
        priorityOverride: userSettings.priorityOverride ?? null,
      });
    }
  }, [userSettings]);

  const updateSettingsMutation = useUpdateAutomationSettings();

  const toggleCategory = (categoryId: string) => {
    const newCategories = settings.enabledCategories.includes(categoryId)
      ? settings.enabledCategories.filter(c => c !== categoryId)
      : [...settings.enabledCategories, categoryId];
    
    const newSettings = { ...settings, enabledCategories: newCategories };
    setSettings(newSettings);
  };

  const handleSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        data: {
          automationEnabled: settings.automationEnabled,
          enabledCategories: settings.enabledCategories,
          notificationPreferences: settings.notificationPreferences,
          quietHours: settings.quietHours,
          maxDailyActions: settings.maxDailyActions,
          priorityOverride: settings.priorityOverride ?? undefined,
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetAutomationSettingsQueryKey() });
      toast.success('Settings updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Automation Settings</CardTitle>
          </div>
          <CardDescription>
            Control how the automation engine works for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="automation-enabled">Enable Automation</Label>
              <p className="text-sm text-muted-foreground">
                Master switch for all automation features
              </p>
            </div>
            <Switch
              id="automation-enabled"
              checked={settings.automationEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, automationEnabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <Label>Automation Categories</Label>
            </div>
            <div className="space-y-4">
              {CATEGORIES.map((category) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={category.id}>{category.label}</Label>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                  <Switch
                    id={category.id}
                    checked={settings.enabledCategories.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                    disabled={!settings.automationEnabled}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <Label>Notification Preferences</Label>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notif">Email Notifications</Label>
                <Switch
                  id="email-notif"
                  checked={settings.notificationPreferences.email}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notificationPreferences: {
                        ...settings.notificationPreferences,
                        email: checked,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notif">Push Notifications</Label>
                <Switch
                  id="push-notif"
                  checked={settings.notificationPreferences.push}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notificationPreferences: {
                        ...settings.notificationPreferences,
                        push: checked,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="inapp-notif">In-App Notifications</Label>
                <Switch
                  id="inapp-notif"
                  checked={settings.notificationPreferences.inApp}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notificationPreferences: {
                        ...settings.notificationPreferences,
                        inApp: checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <Label>Quiet Hours</Label>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
              <Switch
                id="quiet-hours"
                checked={settings.quietHours.enabled}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    quietHours: { ...settings.quietHours, enabled: checked },
                  })
                }
              />
            </div>
            {settings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Start Time</Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        quietHours: {
                          ...settings.quietHours,
                          start: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-end">End Time</Label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        quietHours: { ...settings.quietHours, end: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="max-actions">Max Daily Actions</Label>
            <Input
              id="max-actions"
              type="number"
              min="1"
              max="100"
              value={settings.maxDailyActions}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxDailyActions: parseInt(e.target.value) || 20,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of automated actions per day
            </p>
          </div>

          <Button onClick={handleSave} className="w-full">
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
