import { useHighestRole } from './useUserRole';

/**
 * Hook to check if the current user has admin access
 * Admins are users with 'owner' role (admin role will be added to types after migration)
 */
export const useAdminAccess = () => {
  const { role, isLoading } = useHighestRole();
  
  // For now, only 'owner' role has admin access
  // Once the 'admin' role is added to the TypeScript types, we can check for it too
  const isAdmin = role === 'owner';
  
  return {
    isAdmin,
    isLoading,
    role
  };
};