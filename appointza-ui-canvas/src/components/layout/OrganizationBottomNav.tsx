import { Link, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  Home,
  Briefcase,
  Settings,
  ContactRound,
  ConciergeBell,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganisationCatalogOfferings } from '@/hooks/useOrganisationCatalogOfferings';
import {
  bookingsNavVisible,
  catalogNavLabel,
  catalogNavShortLabel,
  catalogServicesNavTo,
} from '@/utils/organisationCatalogOfferings.util';

interface NavItem {
  id: string;
  to: string;
  icon: React.ElementType;
  label: string;
  shortLabel: string;
  hasAccess: boolean;
}

const OrganizationBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const organisationId = user?.organisationid ?? 0;
  const { offerings, offersRooms, offersServices, offersEvents } =
    useOrganisationCatalogOfferings(organisationId);

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
  const isStaff =
    userContext?.isStaff === true ||
    (userContext?.organisationlocationid &&
      userContext?.organisationlocationid > 0 &&
      (!userContext?.organisationid || userContext?.organisationid === 0));

  const hasDashboardAccess = !isStaff || userpermission?.editandviewDashboard === true;
  const hasAppointmentsAccess = !isStaff || userpermission?.editandviewAppointments === true;
  const hasEventsAccess = !isStaff || userpermission?.editandviewEvents === true;
  const hasBookingsAccess = hasAppointmentsAccess || hasEventsAccess;
  const hasServicesAccess =
    !isStaff ||
    (userpermission?.editandviewCreateService === true ||
      userpermission?.editandviewCreateEvent === true);
  const hasClientsAccess = !isStaff || userpermission?.editandviewClients === true;

  const showBookingsNav = hasBookingsAccess && bookingsNavVisible(offerings);
  const showCatalogNav =
    hasServicesAccess && (offersServices || offersEvents);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      to: '/organization/dashboard',
      icon: Home,
      label: 'Dashboard',
      shortLabel: 'Dash',
      hasAccess: hasDashboardAccess,
    },
    {
      id: 'bookings',
      to: '/organization/appointments',
      icon: CalendarDays,
      label: 'Bookings',
      shortLabel: 'Bookings',
      hasAccess: showBookingsNav,
    },
    {
      id: 'catalog',
      to: catalogServicesNavTo(offerings),
      icon: Briefcase,
      label: catalogNavLabel(offerings),
      shortLabel: catalogNavShortLabel(offerings),
      hasAccess: showCatalogNav,
    },
    {
      id: 'customers',
      to: '/organization/clients',
      icon: Users,
      label: 'Customers',
      shortLabel: 'Clients',
      hasAccess: hasClientsAccess,
    },
    {
      id: 'crm',
      to: '/organization/crm',
      icon: ContactRound,
      label: 'CRM',
      shortLabel: 'CRM',
      hasAccess: hasClientsAccess,
    },
    {
      id: 'hospitality',
      to: '/organization/hospitality?section=room-status',
      icon: ConciergeBell,
      label: 'Hospitality',
      shortLabel: 'Stay',
      hasAccess: !isStaff && offersRooms,
    },
    {
      id: 'settings',
      to: '/organization/profile',
      icon: Settings,
      label: 'Settings',
      shortLabel: 'Settings',
      hasAccess: true,
    },
  ];

  const visibleNavItems = navItems.filter((item) => item.hasAccess);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white shadow-none safe-area-sides lg:hidden"
      aria-label="Organization navigation"
    >
      <div className="flex min-h-[3.75rem] w-full overflow-x-auto pb-[env(safe-area-inset-bottom,0px)] pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const pathOnly = item.to.split('?')[0];
          const isActive =
            item.id === 'crm'
              ? location.pathname.startsWith('/organization/crm')
              : location.pathname === pathOnly ||
                (pathOnly !== '/organization/dashboard' &&
                  location.pathname.startsWith(pathOnly));

          return (
            <Link
              key={item.id}
              to={item.to}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex w-[4.5rem] shrink-0 flex-col items-center justify-center gap-0.5 px-1 py-1.5 touch-manipulation transition-colors sm:w-[5.25rem]',
                isActive ? 'text-blue-600' : 'text-slate-400 active:text-slate-700'
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors',
                  isActive ? 'bg-blue-600 text-white shadow-none' : 'bg-transparent'
                )}
              >
                <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={isActive ? 2.25 : 2} />
              </span>
              <span
                className={cn(
                  'block w-full max-w-full truncate text-center text-[10px] font-semibold leading-tight tracking-tight',
                  isActive ? 'text-blue-600' : 'text-slate-400'
                )}
              >
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default OrganizationBottomNav;
