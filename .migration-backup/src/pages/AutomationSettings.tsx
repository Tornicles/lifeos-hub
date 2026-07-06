import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AutomationSettings as SettingsComponent } from '@/components/automation/AutomationSettings';
import { ActionQueueViewer } from '@/components/automation/ActionQueueViewer';
import { AutomationLogsViewer } from '@/components/automation/AutomationLogsViewer';

export default function AutomationSettings() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Automation Control Center</h1>
        <p className="text-muted-foreground mt-2">
          Manage automation settings, view queued actions, and monitor system activity
        </p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="queue">Action Queue</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <SettingsComponent />
        </TabsContent>

        <TabsContent value="queue" className="space-y-6">
          <ActionQueueViewer />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <AutomationLogsViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
