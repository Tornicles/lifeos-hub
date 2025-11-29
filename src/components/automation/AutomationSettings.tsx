import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Settings, Bell, Clock, Zap } from 'lucide-react';

interface AutomationSettings {
  automation_enabled: boolean;
  enabled_categories: string[];
  notification_preferences: {
    email: boolean;
    push: boolean;
    in_app: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  max_daily_actions: number;
  priority_override: string | null;
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
  const [settings, setSettings] = useState<AutomationSettings>({
    automation_enabled: true,
    enabled_categories: CATEGORIES.map(c => c.id),
    notification_preferences: { email: true, push: false, in_app: true },
    quiet_hours: { enabled: false, start: '22:00', end: '07:00' },
    max_daily_actions: 20,
    priority_override: null,
  });

  const { data: userSettings, isLoading } = useQuery({
    queryKey: ['automation-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_automation_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  useEffect(() => {
    if (userSettings) {
      setSettings({
        automation_enabled: userSettings.automation_enabled,
        enabled_categories: (userSettings.enabled_categories as string[]) || [],
        notification_preferences: (userSettings.notification_preferences as any) || settings.notification_preferences,
        quiet_hours: (userSettings.quiet_hours as any) || settings.quiet_hours,
        max_daily_actions: userSettings.max_daily_actions,
        priority_override: userSettings.priority_override,
      });
    }
  }, [userSettings]);

  const updateSettings = useMutation({
    mutationFn: async (newSettings: AutomationSettings) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_automation_settings')
        .upsert({
          user_id: user.id,
          ...newSettings,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const toggleCategory = (categoryId: string) => {
    const newCategories = settings.enabled_categories.includes(categoryId)
      ? settings.enabled_categories.filter(c => c !== categoryId)
      : [...settings.enabled_categories, categoryId];
    
    const newSettings = { ...settings, enabled_categories: newCategories };
    setSettings(newSettings);
  };

  const handleSave = () => {
    updateSettings.mutate(settings);
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
              checked={settings.automation_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, automation_enabled: checked })
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
                    checked={settings.enabled_categories.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                    disabled={!settings.automation_enabled}
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
                  checked={settings.notification_preferences.email}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notification_preferences: {
                        ...settings.notification_preferences,
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
                  checked={settings.notification_preferences.push}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notification_preferences: {
                        ...settings.notification_preferences,
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
                  checked={settings.notification_preferences.in_app}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notification_preferences: {
                        ...settings.notification_preferences,
                        in_app: checked,
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
                checked={settings.quiet_hours.enabled}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    quiet_hours: { ...settings.quiet_hours, enabled: checked },
                  })
                }
              />
            </div>
            {settings.quiet_hours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Start Time</Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={settings.quiet_hours.start}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        quiet_hours: {
                          ...settings.quiet_hours,
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
                    value={settings.quiet_hours.end}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        quiet_hours: { ...settings.quiet_hours, end: e.target.value },
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
              value={settings.max_daily_actions}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  max_daily_actions: parseInt(e.target.value) || 20,
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
