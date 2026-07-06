import { useGetMyRoles, getGetMyRolesQueryKey } from "@workspace/api-client-react";

export type AppRole = 'owner' | 'admin' | 'member' | 'viewer' | 'guest';

export interface UserRole {
  id: string;
  userId: string;
  role: AppRole;
  assignedAt: string;
  assignedBy: string | null;
  expiresAt: string | null;
}

/**
 * Hook to fetch the current user's roles
 */
export const useUserRole = () => {
  return useGetMyRoles({
    query: {
      select: (roles) =>
        (roles as UserRole[]).filter(
          (r) => !r.expiresAt || new Date(r.expiresAt) > new Date(),
        ),
      staleTime: 5 * 60 * 1000,
      queryKey: getGetMyRolesQueryKey(),
    },
  });
};

/**
 * Hook to check if user has a specific role
 */
export const useHasRole = (role: AppRole) => {
  const { data: roles, isLoading } = useUserRole();

  const hasRole = roles?.some((r) => r.role === role) ?? false;

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
    if (roles.some((r) => r.role === hierarchyRole)) {
      return { role: hierarchyRole, isLoading: false };
    }
  }

  return { role: null, isLoading: false };
};
