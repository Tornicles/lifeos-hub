import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  useListNotifications, 
  useUpdateNotification, 
  useDeleteNotification, 
  useGenerateNotifications,
  useProcessNotifications,
  getListNotificationsQueryKey
} from "@workspace/api-client-react";
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  user_id: string;
  tenant_id: string | null;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  metadata: Record<string, any>;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
  read_at: string | null;
  resolved_at: string | null;
}

export const useNotifications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useListNotifications();

  // Simplification: the backend might not have a separate unread count endpoint
  // We'll calculate it from the list of notifications
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const generateNotificationsMutation = useGenerateNotifications();

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      return queryClient.fetchQuery({
        queryKey: ['processNotifications', 'mark_read', notificationId],
        queryFn: () => {
          // This is a bit of a hack since useProcessNotifications is a mutation
          // but we want to use the processNotifications action
          return Promise.reject("Use mutate instead");
        }
      });
    },
    // Actually, useProcessNotifications is available
  });
  
  const processMutation = useProcessNotifications();

  const handleMarkAsRead = {
    mutate: (notificationId: string) => {
      // @ts-ignore
      processMutation.mutate({
        data: { action: 'mark_read', notificationId }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        }
      });
    }
  };

  const handleMarkAllAsRead = {
    mutate: () => {
      // @ts-ignore
      processMutation.mutate({
        data: { action: 'mark_all_read' }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
          toast({
            title: 'Success',
            description: 'All notifications marked as read',
          });
        }
      });
    }
  };

  const handleResolveNotification = {
    mutate: (notificationId: string) => {
      // @ts-ignore
      processMutation.mutate({
        data: { action: 'resolve', notificationId }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
          toast({
            title: 'Success',
            description: 'Notification resolved',
          });
        }
      });
    }
  };

  const deleteNotificationMutation = useDeleteNotification();

  const handleDeleteNotification = {
    mutate: (notificationId: string) => {
      deleteNotificationMutation.mutate({
        id: notificationId
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
          toast({
            title: 'Success',
            description: 'Notification deleted',
          });
        }
      });
    }
  };

  return {
    notifications: notifications || [],
    unreadCount,
    isLoading,
    generateNotifications: generateNotificationsMutation,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    resolveNotification: handleResolveNotification,
    deleteNotification: handleDeleteNotification,
  };
};
