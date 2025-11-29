import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { useAdminUserStats, useAdminMetricsOverview } from '@/hooks/useAdminStats';
import { 
  Users, 
  UserPlus, 
  Building2, 
  CreditCard,
  Activity,
  FileText,
  TrendingUp,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Admin() {
  const { data: userStats, isLoading: isLoadingUsers } = useAdminUserStats();
  const { data: metricsOverview, isLoading: isLoadingMetrics } = useAdminMetricsOverview();

  const isLoading = isLoadingUsers || isLoadingMetrics;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your LifeOS platform and user activity
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </>
          ) : (
            <>
              <AdminStatCard
                title="Total Users"
                value={userStats?.total_users || 0}
                subtitle={`+${userStats?.new_users_today || 0} today`}
                icon={Users}
              />
              <AdminStatCard
                title="New This Week"
                value={userStats?.new_users_week || 0}
                subtitle={`${userStats?.new_users_month || 0} this month`}
                icon={UserPlus}
              />
              <AdminStatCard
                title="Total Workspaces"
                value={userStats?.total_tenants || 0}
                subtitle="Active tenants"
                icon={Building2}
              />
              <AdminStatCard
                title="Paid Subscribers"
                value={
                  (userStats?.starter_subscribers || 0) +
                  (userStats?.pro_subscribers || 0) +
                  (userStats?.enterprise_subscribers || 0)
                }
                subtitle={`${userStats?.pro_subscribers || 0} Pro, ${userStats?.enterprise_subscribers || 0} Enterprise`}
                icon={CreditCard}
              />
            </>
          )}
        </div>

        {/* Activity Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </>
          ) : (
            <>
              <AdminStatCard
                title="Active Users"
                value={metricsOverview?.active_users || 0}
                subtitle="Last 30 days"
                icon={Activity}
              />
              <AdminStatCard
                title="Total Logs"
                value={metricsOverview?.total_logs || 0}
                subtitle={`${metricsOverview?.logs_today || 0} today`}
                icon={FileText}
              />
              <AdminStatCard
                title="Avg Ultra Score"
                value={metricsOverview?.avg_ultra_score?.toFixed(1) || "0.0"}
                subtitle="Platform average"
                icon={Target}
              />
              <AdminStatCard
                title="Active Hubs"
                value={metricsOverview?.active_hubs || 0}
                subtitle="In use"
                icon={TrendingUp}
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
              <Button variant="outline" className="justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Manage Hubs
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="mr-2 h-4 w-4" />
                View Audit Logs
              </Button>
              <Button variant="outline" className="justify-start">
                <CreditCard className="mr-2 h-4 w-4" />
                Billing Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Real-time system health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <span className="text-sm font-medium text-success">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Services</span>
                  <span className="text-sm font-medium text-success">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Edge Functions</span>
                  <span className="text-sm font-medium text-success">Running</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Storage</span>
                  <span className="text-sm font-medium text-success">Available</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium">New user registered</p>
                  <p className="text-muted-foreground">2 minutes ago</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Automation rule triggered</p>
                  <p className="text-muted-foreground">15 minutes ago</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Database backup completed</p>
                  <p className="text-muted-foreground">1 hour ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}