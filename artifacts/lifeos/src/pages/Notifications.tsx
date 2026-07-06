import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Heart,
  FileText,
  Target,
  Trash2,
  Check,
  RefreshCw,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const notificationIcons = {
  performance_drop: AlertTriangle,
  positive_growth: TrendingUp,
  habit_reminder: Clock,
  project_task: CheckCircle2,
  calendar: Calendar,
  life_event: Heart,
  report: FileText,
  ultra_state: Target,
};

const severityColors = {
  low: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200',
  medium: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200',
  high: 'bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200',
  critical: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200',
};

export default function Notifications() {
  const {
    notifications,
    isLoading,
    generateNotifications,
    markAsRead,
    markAllAsRead,
    resolveNotification,
    deleteNotification,
  } = useNotifications();
  const [filter, setFilter] = useState<string>('all');

  const filteredNotifications = notifications.filter((n: any) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    if (filter === 'resolved') return n.isResolved;
    return n.type === filter;
  });

  const unreadNotifications = notifications.filter((n: any) => !n.isRead);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground mt-2">
              Stay updated with your LifeOS performance and reminders
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateNotifications.mutate()}
              disabled={generateNotifications.isPending}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', generateNotifications.isPending && 'animate-spin')} />
              Generate
            </Button>
            {unreadNotifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              <Badge variant="secondary" className="ml-2">
                {unreadNotifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="performance_drop">Performance</TabsTrigger>
            <TabsTrigger value="habit_reminder">Habits</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-4 mt-6">
            {isLoading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Loading notifications...</p>
              </Card>
            ) : filteredNotifications.length === 0 ? (
              <Card className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground mb-4">
                  {filter === 'all'
                    ? "You're all caught up!"
                    : `No ${filter} notifications`}
                </p>
                {filter === 'all' && (
                  <Button
                    variant="outline"
                    onClick={() => generateNotifications.mutate()}
                    disabled={generateNotifications.isPending}
                  >
                    <RefreshCw className={cn('h-4 w-4 mr-2', generateNotifications.isPending && 'animate-spin')} />
                    Generate Notifications
                  </Button>
                )}
              </Card>
            ) : (
              filteredNotifications.map((notification: any) => {
                const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || Bell;
                
                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      'p-4 transition-all',
                      !notification.isRead && 'border-l-4 border-l-primary bg-muted/50'
                    )}
                  >
                    <div className="flex gap-4">
                      <div
                        className={cn(
                          'flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center',
                          severityColors[notification.severity as keyof typeof severityColors]
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold">{notification.title}</h3>
                          <Badge variant="outline" className="flex-shrink-0">
                            {notification.severity}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <Clock className="h-3 w-3" />
                          {new Date(notification.createdAt).toLocaleString()}
                        </div>

                        <div className="flex gap-2">
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead.mutate(notification.id)}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark Read
                            </Button>
                          )}
                          {!notification.isResolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveNotification.mutate(notification.id)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Resolve
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification.mutate(notification.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
