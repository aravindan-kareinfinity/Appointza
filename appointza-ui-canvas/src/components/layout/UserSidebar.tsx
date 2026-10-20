import React, { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CalendarDays,
  CalendarCheck,
  BedDouble,
  Home,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import UserBottomNav from "./UserBottomNav";
import {
  resolveProfileImageId,
  useAuthenticatedProfileImage,
} from "@/hooks/useAuthenticatedProfileImage";

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
  const isActive =
    location.pathname === to ||
    (to === "/user/dashboard" &&
      (location.pathname === "/user" || location.pathname === "/user/dashboard"));

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
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#2a5af5]" aria-hidden />
      ) : null}
      <Icon
        className={cn(
          "size-[18px] shrink-0",
          isActive ? "text-[#2a5af5]" : "text-[#7a8494]",
        )}
        strokeWidth={1.75}
        aria-hidden
      />
      {!collapsed && <span className="truncate">{children}</span>}
    </Link>
  );
};

const UserSidebar = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);

  const profileImageId = useMemo(() => {
    void imageVersion;
    return resolveProfileImageId(undefined, user?.imageid);
  }, [user?.imageid, imageVersion]);

  const { blobUrl: userImageUrl } = useAuthenticatedProfileImage(profileImageId, imageVersion);

  const hideSidebar =
    location.pathname.startsWith("/campusza");

  useEffect(() => {
    const stored = localStorage.getItem("user_sidebar_collapsed");
    setIsCollapsed(stored === "1");
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("user_sidebar_collapsed", next ? "1" : "0");
    window.dispatchEvent(new CustomEvent("user-sidebar-toggle", { detail: { collapsed: next } }));
  };

  useEffect(() => {
    const onContextUpdated = () => setImageVersion((v) => v + 1);
    window.addEventListener("userContextUpdated", onContextUpdated);
    return () => window.removeEventListener("userContextUpdated", onContextUpdated);
  }, []);

  if (hideSidebar) {
    return null;
  }

  if (isMobile) {
    return <UserBottomNav />;
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[#e6eaf0] bg-white shadow-none transition-all duration-200 lg:flex",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {user ? (
        <div
          className={cn(
            "relative shrink-0 border-b border-[#e6eaf0]",
            isCollapsed ? "flex flex-col items-center gap-2 p-3" : "px-3 py-3 pr-11",
          )}
        >
          {isCollapsed ? (
            <>
              <Avatar className="h-9 w-9 shrink-0 ring-1 ring-[#e6eaf0]">
                <AvatarImage src={userImageUrl} alt={user.firstname || user.username || "User"} />
                <AvatarFallback className="bg-[#eef2f7] text-[12px] font-semibold text-[#5b6572]">
                  {(user.firstname || user.username || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="h-7 w-7 text-[#7a8494] hover:bg-[#f4f6f9] hover:text-[#1a1a1a]"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-2.5">
                <Avatar className="h-9 w-9 shrink-0 ring-1 ring-[#e6eaf0]">
                  <AvatarImage src={userImageUrl} alt={user.firstname || user.username || "User"} />
                  <AvatarFallback className="bg-[#eef2f7] text-[12px] font-semibold text-[#5b6572]">
                    {(user.firstname || user.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-[13px] font-semibold text-[#1a1a1a]">
                    {user.firstname || user.username || "User"}
                  </p>
                  {user.email && (
                    <p className="truncate text-[12px] text-[#7a8494]">{user.email}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 text-[#7a8494] hover:bg-[#f4f6f9] hover:text-[#1a1a1a]"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="size-4" />
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="relative flex shrink-0 justify-center border-b border-[#e6eaf0] p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-7 w-7 text-[#7a8494] hover:bg-[#f4f6f9] hover:text-[#1a1a1a]"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>
      )}

      <nav className="flex min-h-0 flex-1 flex-col">
        <div className={cn("min-h-0 flex-1 space-y-0.5 overflow-y-auto", isCollapsed ? "px-2 py-3" : "px-2 py-3")}>
          <SidebarLink to="/explore" icon={Home} collapsed={isCollapsed}>
            Home
          </SidebarLink>
          <SidebarLink to="/user/dashboard" icon={LayoutDashboard} collapsed={isCollapsed}>
            Dashboard
          </SidebarLink>
          <SidebarLink to="/user/appointments" icon={CalendarDays} collapsed={isCollapsed}>
            Appointments
          </SidebarLink>
          <SidebarLink to="/user/my-event-bookings" icon={CalendarCheck} collapsed={isCollapsed}>
            Events
          </SidebarLink>
          <SidebarLink to="/user/my-room-bookings" icon={BedDouble} collapsed={isCollapsed}>
            Rooms
          </SidebarLink>
        </div>

        <div className="mt-auto shrink-0 border-t border-[#e6eaf0] p-2">
          <SidebarLink to="/user/profile" icon={Settings} collapsed={isCollapsed}>
            Settings
          </SidebarLink>
        </div>
      </nav>
    </aside>
  );
};

export default UserSidebar;
