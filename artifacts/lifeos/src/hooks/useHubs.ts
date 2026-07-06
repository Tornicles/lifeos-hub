import {
  useListHubs as useListHubsApi,
  useListUltraDomains as useListUltraDomainsApi,
  getListHubsQueryKey,
  getListUltraDomainsQueryKey,
} from '@workspace/api-client-react';

export const useHubs = () => {
  return useListHubsApi({
    query: {
      staleTime: Infinity, // Hubs rarely change
      select: (hubs) => [...hubs].sort((a: any, b: any) => a.name.localeCompare(b.name)),
      queryKey: getListHubsQueryKey(),
    },
  });
};

export const useUltraDomains = () => {
  return useListUltraDomainsApi({
    query: {
      staleTime: Infinity, // Domains rarely change
      select: (domains) => [...domains].sort((a: any, b: any) => a.name.localeCompare(b.name)),
      queryKey: getListUltraDomainsQueryKey(),
    },
  });
};
