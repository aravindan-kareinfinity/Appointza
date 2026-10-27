
import { ReactNode, useCallback, useEffect, useState } from "react";
import {
  ORG_SIDEBAR_OFFSET_CLASS,
  readOrgSidebarCollapsed,
  writeOrgSidebarCollapsed,
} from "@/utils/orgSidebar.util";
import { useNavigate, useLocation } from "react-router-dom";
import OrganizationSidebar from "./OrganizationSidebar";
import OnboardingSidebar from "./OnboardingSidebar";
import OrganizationTopBar from "./OrganizationTopBar";
import DashboardSwitcher from "./DashboardSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";
import { OnboardingSetupScreen } from "@/components/onboarding/OrganizationOnboarding";
import { isOrganizationOnboardingRoute } from "@/utils/organizationOnboarding.util";
import {
  isPendingBusinessOnboarding,
  isRegisterCreateFlow,
  isRegisterOnboardingPath,
} from "@/utils/businessOnboarding.util";
import { OrgTemplateAssetsProvider } from "@/contexts/OrgTemplateAssetsContext";

interface OrganizationLayoutProps {
  children: ReactNode;
}

const OrganizationLayout = ({ children }: OrganizationLayoutProps) => {
  const { userType, isAuthenticated, canSwitchMode, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(readOrgSidebarCollapsed);
  const isProfileSettingsRoute = location.pathname.startsWith("/organization/profile");
  const {
    hasCustomDomain,
    hasServices,
    hasWebsite,
    hasTiming,
    isComplete,
    isLoading: isLoadingOnboarding,
    nextStep,
    backendState,
  } = useOnboardingStatus();
  
  // Get user context from localStorage
  const getUserContext = () => {
    try {
      const userContextStr = localStorage.getItem('user_context');
      if (!userContextStr) return null;
      return JSON.parse(userContextStr);
    } catch (error) {
      console.error('Error parsing user_context:', error);
      return null;
    }
  };
  
  const userContext = getUserContext();
  const userpermission = userContext?.userpermission || {};
  // Use isStaff from user_context if available, otherwise use from user object
  const isStaff = userContext?.isStaff === true || user?.isStaff === true;
  
  const isOnboardingRoute = isOrganizationOnboardingRoute(location.pathname);

  const checkRouteAccess = (route: string): boolean => {
    // Non-staff users (organization owners) have full access
    if (!isStaff) return true;
    
    // Map routes to permission properties
    const routePermissionMap: Record<string, string> = {
      '/organization/dashboard': 'editandviewDashboard',
      '/organization/appointments': 'editandviewAppointments',
      '/organization/services': 'editandviewCreateService', // Check for service or event permission
      '/organization/leads': 'editandviewClients',
      '/organization/clients': 'editandviewClients',
      '/organization/crm': 'editandviewClients',
      '/organization/crm/contacts': 'editandviewClients',
      '/organization/crm/leads': 'editandviewClients',
      '/organization/crm/pipeline': 'editandviewClients',
      '/organization/crm/inbox': 'editandviewClients',
      '/organization/crm/whatsapp/inbox': 'editandviewClients',
      '/organization/crm/email-campaigns': 'editandviewClients',
      '/organization/crm/whatsapp-campaigns': 'editandviewClients',
      '/organization/crm/whatsapp/automations': 'editandviewClients',
      '/organization/crm/templates': 'editandviewClients',
      '/organization/crm/tasks': 'editandviewClients',
      '/organization/crm/reports': 'editandviewClients',
      '/organization/crm/catalogue': 'editandviewClients',
      '/organization/crm/business-profile': 'editandviewClients',
      '/organization/reference-values': 'editandviewBusinessvalues',
    };
    
    // Check exact match first
    const permissionKey = routePermissionMap[route];
    if (permissionKey) {
      if (route === '/organization/services') {
        // Services route needs either service or event permission
        return userpermission?.editandviewCreateService === true || userpermission?.editandviewCreateEvent === true;
      }
      if (route === '/organization/appointments') {
        // Bookings merges appointments + event participants
        return (
          userpermission?.editandviewAppointments === true ||
          userpermission?.editandviewEvents === true
        );
      }
      return userpermission?.[permissionKey] === true;
    }
    
    // Check if route starts with any mapped route
    for (const [mappedRoute, permissionKey] of Object.entries(routePermissionMap)) {
      if (route.startsWith(mappedRoute)) {
        if (mappedRoute === '/organization/services') {
          return userpermission?.editandviewCreateService === true || userpermission?.editandviewCreateEvent === true;
        }
        if (mappedRoute === '/organization/appointments') {
          return (
            userpermission?.editandviewAppointments === true ||
            userpermission?.editandviewEvents === true
          );
        }
        return userpermission?.[permissionKey] === true;
      }
    }
    
    // If route not in map, allow access (for routes like /organization/profile, etc.)
    return true;
  };

  const staffHasAccess = checkRouteAccess(location.pathname);

  const handleSidebarCollapsedChange = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    writeOrgSidebarCollapsed(collapsed);
  }, []);

  useEffect(() => {
    const syncFromStorage = () => setSidebarCollapsed(readOrgSidebarCollapsed());
    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, []);

  const onRegisterOnboarding = isRegisterOnboardingPath(location.pathname);
  const allowPendingBusinessSetup =
    onRegisterOnboarding && isPendingBusinessOnboarding();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    } 
    
    if (userType === 'user' && !canSwitchMode && !allowPendingBusinessSetup) {
      navigate('/user/dashboard');
      return;
    }
  }, [
    isAuthenticated,
    userType,
    canSwitchMode,
    navigate,
    location.pathname,
    allowPendingBusinessSetup,
  ]);

  if (
    !isAuthenticated ||
    (userType !== 'organization' && !canSwitchMode && !allowPendingBusinessSetup)
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p className="text-gray-600">
            {!isAuthenticated ? 'Please log in to access this page' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  // For staff users, check privileges instead of onboarding
  if (isStaff && !staffHasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <ShieldX className="h-6 w-6 text-red-600" />
              <CardTitle className="text-xl">Access Denied</CardTitle>
            </div>
            <CardDescription className="mt-2">
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Please contact your administrator to request access to this feature.
            </p>
            <Button
              onClick={() => {
                // Redirect to dashboard if they have access, otherwise go to a safe route
                if (userpermission?.editandviewDashboard === true || !isStaff) {
                  navigate('/organization/dashboard');
                } else {
                  // Find first accessible route or go to profile
                  const accessibleRoutes = [
                    { path: '/organization/appointments', perm: 'editandviewAppointments' },
                    { path: '/organization/appointments?kind=events', perm: 'editandviewEvents' },
                    { path: '/organization/services?kind=services', perm: 'editandviewCreateService' },
                    { path: '/organization/clients', perm: 'editandviewClients' },
                    { path: '/organization/profile', perm: null }, // Profile is always accessible
                  ];
                  
                  const accessibleRoute = accessibleRoutes.find(route => 
                    !route.perm || userpermission?.[route.perm] === true
                  );
                  
                  navigate(accessibleRoute?.path || '/organization/profile');
                }
              }}
              className="w-full"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Incomplete org owners: keep them in setup (hub) unless on an allowed setup/settings route.
  const forceOnboardingHub =
    userType === "organization" &&
    !isStaff &&
    !isLoadingOnboarding &&
    !isComplete &&
    !isOnboardingRoute &&
    !isProfileSettingsRoute &&
    !isRegisterCreateFlow() &&
    !onRegisterOnboarding;

  const isTemplateBuilder = location.pathname.includes("/template-builder");
  const isClientManagement =
    /^\/organization\/clients\/?$/.test(location.pathname) ||
    /^\/organization\/crm\/clients\/?$/.test(location.pathname);
  const isClientBookPage = /^\/organization\/clients\/\d+\/book\/?$/.test(location.pathname);
  const isLeadsPage =
    /^\/organization\/leads\/?$/.test(location.pathname) ||
    /^\/organization\/crm\/leads\/?$/.test(location.pathname);
  const isCrmPage = /^\/organization\/crm(\/|$)/.test(location.pathname);
  const isProfilePage = /^\/organization\/profile\/?$/.test(location.pathname);
  const isHospitalityPage = /^\/organization\/hospitality\/?$/.test(location.pathname);
  const isFullBleedPage =
    !forceOnboardingHub &&
    !onRegisterOnboarding &&
    (isTemplateBuilder ||
      isClientManagement ||
      isClientBookPage ||
      isLeadsPage ||
      isCrmPage ||
      isProfilePage ||
      isHospitalityPage);
  /** Incomplete setup (or active register onboarding): Setup sidebar instead of Workspace. */
  const showOnboardingSidebar =
    onRegisterOnboarding ||
    (userType === "organization" && !isStaff && !isComplete);

  return (
    <OrgTemplateAssetsProvider>
    <div
      className={cn(
        "app-shell h-dvh overflow-hidden safe-area-sides",
        isMobile ? "org-flat-shell" : "org-razorpay-shell",
      )}
    >
      {!isMobile ? <OrganizationTopBar /> : null}
      {showOnboardingSidebar ? (
        <OnboardingSidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={handleSidebarCollapsedChange}
          backendState={backendState}
          hasServices={hasServices}
          hasWebsite={hasWebsite}
          hasTiming={hasTiming}
        />
      ) : (
        <OrganizationSidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={handleSidebarCollapsedChange}
        />
      )}
      <div
        className={cn(
          "h-dvh overflow-hidden transition-all duration-300",
          isMobile
            ? "safe-area-top pl-0 pb-20"
            : sidebarCollapsed
              ? `pt-12 ${ORG_SIDEBAR_OFFSET_CLASS.collapsed}`
              : `pt-12 ${ORG_SIDEBAR_OFFSET_CLASS.expanded}`,
        )}
        style={isMobile ? { paddingBottom: "calc(5rem + var(--safe-area-bottom))" } : undefined}
      >
        <main
          className={cn(
            "h-full w-full max-w-none bg-[#f5f7f9]",
            !isMobile && "org-workspace-curve-right overflow-hidden",
            isFullBleedPage
              ? cn(
                  "flex min-h-0 flex-col p-0",
                  isClientBookPage ? "overflow-y-auto overscroll-contain" : "overflow-hidden",
                )
              : "overflow-y-auto pb-4 pt-4 md:pb-5 md:pt-4 lg:pb-6 lg:pt-5",
          )}
        >
          {canSwitchMode && !isFullBleedPage && !showOnboardingSidebar && (
            <div className={cn(org.pageHeader, "mb-6 shrink-0 pb-0 pt-0")}>
              <DashboardSwitcher />
            </div>
          )}
          <div
            className={cn(
              isFullBleedPage &&
                !isClientBookPage &&
                "flex min-h-0 flex-1 flex-col overflow-hidden",
            )}
          >
            {forceOnboardingHub ? (
              <OnboardingSetupScreen
                hasCustomDomain={hasCustomDomain}
                hasServices={hasServices}
                hasWebsite={hasWebsite}
                hasTiming={hasTiming}
                nextStep={nextStep}
              />
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
    </OrgTemplateAssetsProvider>
  );
};

export default OrganizationLayout;
