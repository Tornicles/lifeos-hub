import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useHubs = () => {
  return useQuery({
    queryKey: ['hubs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hubs')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    staleTime: Infinity, // Hubs rarely change
  });
};

export const useUltraDomains = () => {
  return useQuery({
    queryKey: ['ultra-domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ultra_domains')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
    staleTime: Infinity, // Domains rarely change
  });
};