import {
  ORG_SIDEBAR_WIDTH_CLASS,
} from '@/utils/orgSidebar.util';
import { Link, useLocation } from 'react-router-dom';
import { 
  CalendarDays,
  LayoutGrid, 
  Package,
  ConciergeBell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Images,
  ContactRound,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganisationCatalogOfferings } from '@/hooks/useOrganisationCatalogOfferings';
import {
  bookingsNavVisible,
  catalogNavLabel,
  catalogServicesNavTo,
} from '@/utils/organisationCatalogOfferings.util';
import OrganizationBottomNav from './OrganizationBottomNav';
import { OrganizationSidebarLocation } from './OrganizationSidebarLocation';

const SidebarLink = ({ 
  to, 
  icon: Icon, 
  children,
  onClick,
  collapsed,
}: { 
  to: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
  onClick?: () => void;
  collapsed?: boolean;
}) => {
  const location = useLocation();
  const pathOnly = to.split("?")[0];
  const isActive =
    pathOnly === '/organization/crm'
      ? location.pathname === '/organization/crm' ||
        location.pathname.startsWith('/organization/crm/')
      : location.pathname === pathOnly ||
        (pathOnly !== '/organization/dashboard' &&
          location.pathname.startsWith(`${pathOnly}/`));

  return (
    <Link
      to={to}
      title={collapsed ? String(children) : undefined}
      className={cn(
        "relative flex items-center gap-2.5 rounded-md py-2 text-[13px] font-medium transition-colors",
        collapsed ? "justify-center px-2" : "px-3",
        isActive
          ? "bg-[#eef2f7] text-[#1a1a1a]"
          : "text-[#5b6572] hover:bg-[#f4f6f9] hover:text-[#1a1a1a]",
      )}
      onClick={onClick}
    >
      {isActive && !collapsed ? (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#528ff0]" aria-hidden />
      ) : null}
      <Icon
        className={cn(
          "size-[18px] shrink-0",
          isActive ? "text-[#528ff0]" : "text-[#7a8494]"
        )}
        strokeWidth={1.75}
        aria-hidden
      />
      {!collapsed && <span className="truncate">{children}</span>}
    </Link>
  );
};

function NavSectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed?: boolean }) {
  if (collapsed) return <div className="my-2 border-t border-[#e8ecf1]" />;
  return (
    <p className="mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa3b2] first:mt-0">
      {children}
    </p>
  );
}

interface OrganizationSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const OrganizationSidebar = ({ collapsed, onCollapsedChange }: OrganizationSidebarProps) => {
  const isMobile = useIsMobile();
  const isCollapsed = collapsed;
  const { user } = useAuth();
  const organisationId = user?.organisationid ?? 0;
  const {
    offerings,
    offersRooms,
    offersServices,
    offersEvents,
  } = useOrganisationCatalogOfferings(organisationId);

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
  const isStaff = userContext?.isStaff === true || (userContext?.organisationlocationid && userContext?.organisationlocationid > 0 && (!userContext?.organisationid || userContext?.organisationid === 0));
  
  const hasDashboardAccess = !isStaff || userpermission?.editandviewDashboard === true;
  const hasAppointmentsAccess = !isStaff || userpermission?.editandviewAppointments === true;
  const hasEventsAccess = !isStaff || userpermission?.editandviewEvents === true;
  const hasBookingsAccess = hasAppointmentsAccess || hasEventsAccess;
  const hasServicesAccess = !isStaff || (userpermission?.editandviewCreateService === true || userpermission?.editandviewCreateEvent === true);
  const hasClientsAccess = !isStaff || userpermission?.editandviewClients === true;

  const showBookingsNav = hasBookingsAccess && bookingsNavVisible(offerings);
  const showCatalogNav =
    hasServicesAccess &&
    (offersServices || offersEvents);
  const catalogLinkTo = catalogServicesNavTo(offerings);
  const catalogLinkLabel = catalogNavLabel(offerings);
  
  const toggleCollapse = () => {
    onCollapsedChange(!isCollapsed);
  };

  if (isMobile) {
    return <OrganizationBottomNav />;
  }

  return (
    <aside
      className={cn(
        "org-workspace-curve fixed left-0 top-12 z-40 hidden h-[calc(100dvh-3rem)] flex-col overflow-hidden border-r border-[#e6eaf0] bg-white shadow-none lg:flex transition-all duration-200",
        isCollapsed ? ORG_SIDEBAR_WIDTH_CLASS.collapsed : ORG_SIDEBAR_WIDTH_CLASS.expanded
      )}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center border-b border-[#e6eaf0]",
          isCollapsed ? "justify-center p-3" : "justify-between gap-2 px-3 py-3"
        )}
      >
        {!isCollapsed ? (
          <p className="text-[13px] font-semibold text-[#1a1a1a]">Workspace</p>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className={cn(
            "h-7 w-7 text-[#7a8494] hover:bg-[#f4f6f9] hover:text-[#1a1a1a]",
            isCollapsed && "mx-auto",
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>

      <OrganizationSidebarLocation collapsed={isCollapsed} />

      <nav className="flex min-h-0 flex-1 flex-col">
        <div className={cn("flex-1 overflow-y-auto", isCollapsed ? "px-2 py-3" : "px-2 py-3")}>
          <NavSectionLabel collapsed={isCollapsed}>Main</NavSectionLabel>
          {hasDashboardAccess && (
            <SidebarLink to="/organization/dashboard" icon={LayoutGrid} collapsed={isCollapsed}>
              Home
            </SidebarLink>
          )}
          {showBookingsNav && (
            <SidebarLink to="/organization/appointments" icon={CalendarDays} collapsed={isCollapsed}>
              Bookings
            </SidebarLink>
          )}

          <NavSectionLabel collapsed={isCollapsed}>Catalogue</NavSectionLabel>
          {showCatalogNav && (
            <SidebarLink to={catalogLinkTo} icon={Package} collapsed={isCollapsed}>
              {catalogLinkLabel}
            </SidebarLink>
          )}
          {!isStaff && offersRooms && (
            <SidebarLink to="/organization/hospitality" icon={ConciergeBell} collapsed={isCollapsed}>
              Hospitality
            </SidebarLink>
          )}
          {!isStaff && (
            <SidebarLink to="/organization/assets" icon={Images} collapsed={isCollapsed}>
              Assets
            </SidebarLink>
          )}

          <NavSectionLabel collapsed={isCollapsed}>Customers</NavSectionLabel>
          {hasClientsAccess && (
            <SidebarLink to="/organization/clients" icon={Users} collapsed={isCollapsed}>
              Customers
            </SidebarLink>
          )}
          {hasClientsAccess && (
            <SidebarLink to="/organization/crm" icon={ContactRound} collapsed={isCollapsed}>
              CRM
            </SidebarLink>
          )}
        </div>

        <div className={cn("mt-auto shrink-0 border-t border-[#e6eaf0] p-2")}>
          <SidebarLink to="/organization/profile" icon={Settings} collapsed={isCollapsed}>
            Account & Settings
          </SidebarLink>
        </div>
      </nav>
    </aside>
  );
};

export default OrganizationSidebar;
