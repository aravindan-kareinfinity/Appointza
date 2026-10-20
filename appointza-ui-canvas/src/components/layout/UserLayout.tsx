import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import UserSidebar from "./UserSidebar";
import UserBottomNav from "./UserBottomNav";

interface UserLayoutProps {
  children: React.ReactNode;
}

import { useIsMobile } from "@/hooks/use-mobile";
import { useSafeArea } from "@/hooks/useSafeArea";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const insets = useSafeArea();
  const isNative = Capacitor.isNativePlatform();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user_sidebar_collapsed");
    setSidebarCollapsed(stored === "1");
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ collapsed?: boolean }>;
      setSidebarCollapsed(
        !!ce.detail?.collapsed || localStorage.getItem("user_sidebar_collapsed") === "1",
      );
    };
    window.addEventListener("user-sidebar-toggle", handler as EventListener);
    return () => window.removeEventListener("user-sidebar-toggle", handler as EventListener);
  }, []);
  
  // Campusza has its own product layout.
  const hideLayout = location.pathname.startsWith("/campusza");
  
  if (hideLayout) {
    return <>{children}</>;
  }
  
  return (
    <div className="app-shell min-h-screen bg-[#f5f7f9] safe-area-sides">
      <UserSidebar />
      <div
        className={cn(
          "min-h-screen transition-all duration-300",
          isMobile ? "safe-area-top pb-20" : "",
          !isMobile && (sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"),
        )}
      >
        <main
          className="px-4 pb-4 pt-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8"
          style={isMobile && isNative ? {
            paddingLeft: `max(${insets.left}px, 1rem)`,
            paddingRight: `max(${insets.right}px, 1rem)`
          } : undefined}
        >
          {children}
        </main>
      </div>
      {isMobile && <UserBottomNav />}
    </div>
  );
};

export default UserLayout;
