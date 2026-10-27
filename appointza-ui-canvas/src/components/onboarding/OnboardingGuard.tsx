import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useAuth } from '@/contexts/AuthContext';
import {
  ORGANIZATION_ONBOARDING_ROUTES,
  ORGANIZATION_ONBOARDING_WIZARD_ROUTE,
} from '@/utils/organizationOnboarding.util';

interface OnboardingGuardProps {
  children: React.ReactNode;
  allowedRoutes?: string[];
}

export const OnboardingGuard = ({ children, allowedRoutes = [] }: OnboardingGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userType, isAuthenticated } = useAuth();
  const { isComplete, isLoading, refetch } = useOnboardingStatus();
  const hasRedirected = useRef(false);

  const onboardingRoutes = [...ORGANIZATION_ONBOARDING_ROUTES];

  const allAllowedRoutes = [...onboardingRoutes, ...allowedRoutes];

  const isAllowedRoute = allAllowedRoutes.some(route =>
    location.pathname.startsWith(route)
  );

  useEffect(() => {
    if (!isAuthenticated || userType !== 'organization' || !user?.organisationid) {
      return;
    }

    if (isComplete || isAllowedRoute) {
      return;
    }

    void refetch();
  }, [isAuthenticated, userType, user?.organisationid, isComplete, isAllowedRoute, refetch]);

  useEffect(() => {
    hasRedirected.current = false;

    if (!isAuthenticated || userType !== 'organization' || !user?.organisationid) {
      return;
    }

    if (isAllowedRoute) {
      return;
    }

    if (isComplete) {
      hasRedirected.current = false;
      return;
    }

    if (isLoading) {
      return;
    }

    if (hasRedirected.current) {
      return;
    }

    // Incomplete orgs always land on the onboarding wizard hub first.
    hasRedirected.current = true;
    navigate(ORGANIZATION_ONBOARDING_WIZARD_ROUTE, {
      replace: true,
      state: { from: location.pathname, onboarding: true },
    });
  }, [isAuthenticated, userType, user, isComplete, isLoading, navigate, location.pathname, isAllowedRoute]);

  return <>{children}</>;
};
