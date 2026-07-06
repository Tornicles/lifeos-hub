import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

interface SecuritySettings {
  mfa_enabled: boolean;
  session_timeout_minutes: number;
  login_attempts: number;
  last_failed_login: string | null;
  account_locked_until: string | null;
  password_changed_at: string | null;
}

interface AuditLog {
  id: string;
  table_name: string;
  operation: string;
  created_at: string;
  ip_address: string | null;
}

const Security = () => {
  const { hasRole: isOwner } = useIsOwner();
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(480);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load security settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('security_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      if (settingsData) {
        setSettings(settingsData);
        setSessionTimeout(settingsData.session_timeout_minutes);
      }

      // Load recent audit logs
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('id, table_name, operation, created_at, ip_address')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (logsError) throw logsError;
      setAuditLogs((logsData || []).map(log => ({
        ...log,
        ip_address: log.ip_address as string | null
      })));
    } catch (error) {
      console.error('Error loading security data:', error);
      toast.error('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  const updateMFA = async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('security_settings')
        .update({ mfa_enabled: enabled })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, mfa_enabled: enabled } : null);
      toast.success(enabled ? 'MFA enabled' : 'MFA disabled');
    } catch (error) {
      console.error('Error updating MFA:', error);
      toast.error('Failed to update MFA settings');
    }
  };

  const updateSessionTimeout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (sessionTimeout < 15 || sessionTimeout > 1440) {
        toast.error('Session timeout must be between 15 and 1440 minutes');
        return;
      }

      const { error } = await supabase
        .from('security_settings')
        .update({ session_timeout_minutes: sessionTimeout })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, session_timeout_minutes: sessionTimeout } : null);
      toast.success('Session timeout updated');
    } catch (error) {
      console.error('Error updating session timeout:', error);
      toast.error('Failed to update session timeout');
    }
  };

  if (loading) {
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
                <p className="text-2xl font-bold">{settings.login_attempts}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Account Status</p>
                {settings.account_locked_until ? (
                  <Badge variant="destructive">Locked</Badge>
                ) : (
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Password Changed</p>
                <p className="text-sm">
                  {settings.password_changed_at
                    ? new Date(settings.password_changed_at).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>

            {settings.account_locked_until && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <p className="text-sm">
                  Account locked until {new Date(settings.account_locked_until).toLocaleString()}
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
              checked={settings?.mfa_enabled || false}
              onCheckedChange={updateMFA}
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
              />
              <Button onClick={updateSessionTimeout} variant="outline">
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
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {log.operation} on {log.table_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                      {log.ip_address && ` • ${log.ip_address}`}
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
