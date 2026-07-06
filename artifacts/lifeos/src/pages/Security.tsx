import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, Lock, Clock, Activity, AlertTriangle } from "lucide-react";
import { useIsOwner } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@clerk/react";
import { 
  useGetMySecuritySettings, 
  useUpdateMySecuritySettings, 
  useListAuditLogs,
  getGetMySecuritySettingsQueryKey,
  getListAuditLogsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const Security = () => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const queryClient = useQueryClient();
  const { hasRole: isOwner } = useIsOwner();
  const [sessionTimeout, setSessionTimeout] = useState(480);

  const { data: settings, isLoading: settingsLoading } = useGetMySecuritySettings({
    query: {
      enabled: clerkLoaded && !!clerkUser,
      queryKey: getGetMySecuritySettingsQueryKey(),
    }
  });

  const { data: auditLogs = [], isLoading: logsLoading } = useListAuditLogs({
    query: {
      enabled: clerkLoaded && !!clerkUser,
      queryKey: getListAuditLogsQueryKey(),
    }
  });

  useEffect(() => {
    if (settings) {
      setSessionTimeout(settings.sessionTimeoutMinutes || 480);
    }
  }, [settings]);

  const updateSettingsMutation = useUpdateMySecuritySettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMySecuritySettingsQueryKey() });
      },
      onError: (error) => {
        console.error('Error updating security settings:', error);
        toast.error('Failed to update security settings');
      }
    }
  });

  const updateMFA = async (enabled: boolean) => {
    updateSettingsMutation.mutate({
      data: { mfaEnabled: enabled }
    }, {
      onSuccess: () => {
        toast.success(enabled ? 'MFA enabled' : 'MFA disabled');
      }
    });
  };

  const updateSessionTimeout = async () => {
    if (sessionTimeout < 15 || sessionTimeout > 1440) {
      toast.error('Session timeout must be between 15 and 1440 minutes');
      return;
    }

    updateSettingsMutation.mutate({
      data: { sessionTimeoutMinutes: sessionTimeout }
    }, {
      onSuccess: () => {
        toast.success('Session timeout updated');
      }
    });
  };

  if (!clerkLoaded || settingsLoading || logsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Activity className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Security Settings</h1>
        <p className="text-muted-foreground">
          Manage your account security and view activity logs
        </p>
      </div>

      {/* Account Status */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Login Attempts</p>
                <p className="text-2xl font-bold">{settings.loginAttempts}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Account Status</p>
                {settings.accountLockedUntil ? (
                  <Badge variant="destructive">Locked</Badge>
                ) : (
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Password Changed</p>
                <p className="text-sm">
                  {settings.passwordChangedAt
                    ? new Date(settings.passwordChangedAt).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>

            {settings.accountLockedUntil && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <p className="text-sm">
                  Account locked until {new Date(settings.accountLockedUntil).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security Features
          </CardTitle>
          <CardDescription>
            Configure additional security measures for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* MFA Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mfa">Multi-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              id="mfa"
              checked={settings?.mfaEnabled || false}
              onCheckedChange={updateMFA}
              disabled={updateSettingsMutation.isPending}
            />
          </div>

          <Separator />

          {/* Session Timeout */}
          <div className="space-y-3">
            <Label htmlFor="timeout" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Session Timeout (minutes)
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically sign out after period of inactivity (15-1440 minutes)
            </p>
            <div className="flex gap-2">
              <Input
                id="timeout"
                type="number"
                min={15}
                max={1440}
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 480)}
                className="max-w-[200px]"
                disabled={updateSettingsMutation.isPending}
              />
              <Button onClick={updateSessionTimeout} variant="outline" disabled={updateSettingsMutation.isPending}>
                Update
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            View your recent account activity and changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity to display
            </p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {log.operation} on {log.tableName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Unknown'}
                      {log.ipAddress && ` • ${log.ipAddress}`}
                    </p>
                  </div>
                  <Badge variant="outline">{log.operation}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Owner Features */}
      {isOwner && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Owner Controls
            </CardTitle>
            <CardDescription>
              Additional security features available to account owners
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">
              View All User Audit Logs
            </Button>
            <Button variant="outline" className="w-full">
              Manage User Roles
            </Button>
            <Button variant="outline" className="w-full">
              Security Analytics
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Security;