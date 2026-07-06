import { useGetAdminStats, getGetAdminStatsQueryKey } from '@workspace/api-client-react';

export const useAdminUserStats = () => {
  const query = useGetAdminStats({
    query: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false, // Don't retry if access is denied
      queryKey: getGetAdminStatsQueryKey(),
    },
  });

  const data = query.data
    ? {
        total_users: query.data.totalUsers,
        new_users_today: 0,
        new_users_week: 0,
        new_users_month: 0,
        total_tenants: query.data.totalTenants,
        starter_subscribers: 0,
        pro_subscribers: 0,
        enterprise_subscribers: 0,
      }
    : null;

  return { ...query, data };
};

export const useAdminMetricsOverview = () => {
  const query = useGetAdminStats({
    query: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false, // Don't retry if access is denied
      queryKey: getGetAdminStatsQueryKey(),
    },
  });

  const data = query.data
    ? {
        total_logs: query.data.logsToday,
        active_users: query.data.totalUsers,
        logs_today: query.data.logsToday,
        avg_ultra_score: query.data.avgUltraScore ?? 0,
        active_hubs: query.data.activeHubs,
      }
    : null;

  return { ...query, data };
};
