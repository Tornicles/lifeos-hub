import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'owner' | 'admin' | 'member' | 'viewer' | 'guest';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_at: string;
  assigned_by: string | null;
  expires_at: string | null;
}

/**
 * Hook to fetch the current user's roles
 */
export const useUserRole = () => {
  return useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .or('expires_at.is.null,expires_at.gt.now()'); // Only active roles

      if (error) throw error;
      
      return data as UserRole[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to check if user has a specific role
 */
export const useHasRole = (role: AppRole) => {
  const { data: roles, isLoading } = useUserRole();
  
  const hasRole = roles?.some(r => r.role === role) ?? false;
  
  return { hasRole, isLoading };
};

/**
 * Hook to check if user is an owner
 */
export const useIsOwner = () => {
  return useHasRole('owner');
};

/**
 * Hook to get the user's highest privilege role
 */
export const useHighestRole = (): {
  role: AppRole | null;
  isLoading: boolean;
} => {
  const { data: roles, isLoading } = useUserRole();
  
  if (isLoading || !roles) {
    return { role: null, isLoading };
  }
  
  // Role hierarchy: owner > admin > member > viewer > guest
  const roleHierarchy: AppRole[] = ['owner', 'admin', 'member', 'viewer', 'guest'];
  
  for (const hierarchyRole of roleHierarchy) {
    if (roles.some(r => r.role === hierarchyRole)) {
      return { role: hierarchyRole, isLoading: false };
    }
  }
  
  return { role: null, isLoading: false };
};
