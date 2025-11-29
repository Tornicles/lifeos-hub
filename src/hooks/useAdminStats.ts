import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminUserStats {
  total_users: number;
  new_users_today: number;
  new_users_week: number;
  new_users_month: number;
  total_tenants: number;
  starter_subscribers: number;
  pro_subscribers: number;
  enterprise_subscribers: number;
}

interface AdminMetricsOverview {
  total_logs: number;
  active_users: number;
  logs_today: number;
  avg_ultra_score: number;
  active_hubs: number;
}

export const useAdminUserStats = () => {
  return useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_user_stats')
        .select('*')
        .single();
      
      if (error) {
        // If RLS blocks access, return null instead of throwing
        if (error.code === 'PGRST116') {
          console.warn('Admin access required for user stats');
          return null;
        }
        throw error;
      }
      return data as AdminUserStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry if access is denied
  });
};

export const useAdminMetricsOverview = () => {
  return useQuery({
    queryKey: ['admin-metrics-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_metrics_overview')
        .select('*')
        .single();
      
      if (error) {
        // If RLS blocks access, return null instead of throwing
        if (error.code === 'PGRST116') {
          console.warn('Admin access required for metrics overview');
          return null;
        }
        throw error;
      }
      return data as AdminMetricsOverview;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry if access is denied
  });
};