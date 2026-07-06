import { useHighestRole } from './useUserRole';

/**
 * Hook to check if the current user has admin access
 * Admins are users with 'owner' or 'admin' role
 * 
 * After security hardening:
 * - Admin views now require admin/owner role via RLS
 * - Non-admin users receive null data instead of errors
 */
export const useAdminAccess = () => {
  const { role, isLoading } = useHighestRole();
  
  // Both 'owner' and 'admin' roles have admin access
  const isAdmin = role === 'owner' || role === 'admin';
  
  return {
    isAdmin,
    isLoading,
    role
  };
};