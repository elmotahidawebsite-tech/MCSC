import { useAuth } from "@/context/AuthContext";
import { ROLES } from "@/constants/roles";

/**
 * Hook to check user permissions based on role.
 * Use this hook to conditionally render admin-only UI elements.
 * 
 * IMPORTANT: This is frontend-only protection for UX.
 * Backend must enforce all permissions on API endpoints.
 */
export function usePermissions() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const isOfficer = user?.role === ROLES.OFFICER;

  return {
    // Admin-only permissions
    canDeleteCase: isAdmin,
    canEditCase: isAdmin,
    canImportCase: isAdmin,
    canExportCase: isAdmin,
    canManageUsers: isAdmin,
    canAccessSettings: isAdmin,
    canViewAllStations: isAdmin,
    
    // User information
    isAdmin,
    isOfficer,
    userRole: user?.role,
  };
}
