import { UsersPermissionData } from '@/models/users.model';

/**
 * Utility functions for checking staff privileges
 */
export class PrivilegeUtil {
  /**
   * Check if user has view access to a specific permission group
   */
  static hasViewAccess(permission: UsersPermissionData | null | undefined, permissionGroup: keyof UsersPermissionData): boolean {
    if (!permission) return false;
    const group = permission[permissionGroup];
    return group?.view === true;
  }

  /**
   * Check if user has manage access to a specific permission group
   */
  static hasManageAccess(permission: UsersPermissionData | null | undefined, permissionGroup: keyof UsersPermissionData): boolean {
    if (!permission) return false;
    const group = permission[permissionGroup];
    return group?.manage === true;
  }

  /**
   * Check if user has either view or manage access
   */
  static hasAccess(permission: UsersPermissionData | null | undefined, permissionGroup: keyof UsersPermissionData): boolean {
    return this.hasViewAccess(permission, permissionGroup) || this.hasManageAccess(permission, permissionGroup);
  }

  /**
   * Route to permission mapping
   * Maps organization routes to required permission groups
   */
  static getRequiredPermission(route: string): keyof UsersPermissionData | null {
    const routeMap: Record<string, keyof UsersPermissionData> = {
      '/organization/dashboard': 'dashboard',
      '/organization/appointments': 'approveappoinment',
      '/organization/services': 'manageservices',
      '/organization/timing': 'manageservices', // Timing is part of service management
      '/organization/staff': 'createstaff',
      '/organization/clients': 'viewcustomers',
      '/organization/crm': 'viewcustomers',
    };

    // Check exact match first
    if (routeMap[route]) {
      return routeMap[route];
    }

    // Check if route starts with any mapped route
    for (const [mappedRoute, permission] of Object.entries(routeMap)) {
      if (route.startsWith(mappedRoute)) {
        return permission;
      }
    }

    return null;
  }

  /**
   * Check if user can access a specific route
   * @param permission User's permission data
   * @param route Route path to check
   * @param requireManage If true, requires manage access; if false, view access is sufficient
   */
  static canAccessRoute(
    permission: UsersPermissionData | null | undefined,
    route: string,
    requireManage: boolean = false
  ): boolean {
    // If no permission data, deny access (for staff users)
    if (!permission) {
      return false;
    }

    const requiredPermission = this.getRequiredPermission(route);
    
    // If route doesn't require specific permission, allow access
    if (!requiredPermission) {
      return true;
    }

    // Check access based on requirement
    if (requireManage) {
      return this.hasManageAccess(permission, requiredPermission);
    } else {
      return this.hasAccess(permission, requiredPermission);
    }
  }

  /**
   * Check if staff user has dashboard access
   */
  static hasDashboardAccess(permission: UsersPermissionData | null | undefined): boolean {
    return this.hasAccess(permission, 'dashboard');
  }

  /**
   * Check if staff user has appointment access
   */
  static hasAppointmentAccess(permission: UsersPermissionData | null | undefined, requireManage: boolean = false): boolean {
    if (requireManage) {
      return this.hasManageAccess(permission, 'approveappoinment');
    }
    return this.hasAccess(permission, 'approveappoinment');
  }

  /**
   * Check if staff user has service management access
   */
  static hasServiceAccess(permission: UsersPermissionData | null | undefined, requireManage: boolean = false): boolean {
    if (requireManage) {
      return this.hasManageAccess(permission, 'manageservices');
    }
    return this.hasAccess(permission, 'manageservices');
  }

  /**
   * Check if staff user has location management access
   */
  static hasLocationAccess(permission: UsersPermissionData | null | undefined, requireManage: boolean = false): boolean {
    if (requireManage) {
      return this.hasManageAccess(permission, 'managelocations');
    }
    return this.hasAccess(permission, 'managelocations');
  }

  /**
   * Check if staff user has staff management access
   */
  static hasStaffManagementAccess(permission: UsersPermissionData | null | undefined, requireManage: boolean = false): boolean {
    if (requireManage) {
      return this.hasManageAccess(permission, 'createstaff');
    }
    return this.hasAccess(permission, 'createstaff');
  }
}

