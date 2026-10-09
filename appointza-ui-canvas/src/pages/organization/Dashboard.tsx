import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { RefreshCw, Users, AlertCircle, Search, Phone, User, FileText, Eye, Download, MapPin, Plus, Smartphone, Copy, ExternalLink, Globe, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { useToast } from "@/hooks/use-toast";
import { UserTypeUtil } from "@/utils/userType.util";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { AppoinmentService } from "@/services/appoinment.service";
import { persistOrganisationLocationSelection } from "@/utils/organisationLocationSelection.util";
import { FilesService } from "@/services/files.service";
import { OrgLocationReq, OrganisationDashboardStats, OrganisationLocation } from "@/models/organisationlocation.model";
import { BookedAppoinmentRes, SearchAppointmentByMobileReq, FileItem } from "@/models/appoinment.model";
import UserAppointmentDetails from "@/components/organization/UserAppointmentDetails";
import FileViewer from "@/components/common/FileViewer";
// import DashboardRightRail from "@/components/organization/DashboardRightRail";
import { org } from "@/lib/orgTheme";
import { useOrganisationLocations } from "@/hooks/useOrganisationLocations";
import {
  buildOrganisationCustomUrlHost,
  buildOrganisationPublicSiteOriginFromHost,
} from "@/utils/orgPublicSiteUrl.util";
import { normalizeCustomUrlSlug } from "@/utils/slug.util";

const DashboardChartsPanel = lazy(
  () => import("@/components/organization/DashboardChartsPanel"),
);

const EMPTY_DASHBOARD_STATS = new OrganisationDashboardStats();

const CHART_CORAL_LIGHT = "#3B82F6";
const CHART_BLUE = "#2F80ED";

function MiniSparkline({
  values,
  variant,
}: {
  values: number[];
  variant: "coral" | "blue";
}) {
  const series = values.length > 0 ? values : [0, 0, 0, 0, 0, 0, 0];
  const max = Math.max(...series, 1);
  const color = variant === "coral" ? CHART_CORAL_LIGHT : CHART_BLUE;

  return (
    <div className="mt-4 flex h-9 items-end gap-[3px]" aria-hidden>
      {series.map((v, i) => (
        <div
          key={i}
          className="min-h-[3px] flex-1 rounded-[2px]"
          style={{
            height: `${Math.max(14, (v / max) * 100)}%`,
            backgroundColor: color,
            opacity: 0.9,
          }}
        />
      ))}
    </div>
  );
}

function DashboardStatCard({
  label,
  children,
  variant,
  sparkValues,
}: {
  label: string;
  children: React.ReactNode;
  variant: "coral" | "blue";
  sparkValues: number[];
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-none">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <div className="mt-2 text-2xl font-bold tracking-tight text-appointza-navy tabular-nums sm:text-3xl">
        {children}
      </div>
      <MiniSparkline values={sparkValues} variant={variant} />
    </div>
  );
}

const OrganizationDashboard = () => {
  const { user, isAuthenticated, refreshAuth } = useAuth();
  const { id: globalLocationId, setId: setGlobalLocationId } = useGlobalId();
  const { toast } = useToast();
  const organizationId = user?.organisationid || 0;

  const organisationLocationService = useMemo(() => new OrganisationLocationService(), []);
  const appointmentService = useMemo(() => new AppoinmentService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  const { data: locations = [], isLoading: isLoadingLocations, isSuccess: locationsLoaded } =
    useOrganisationLocations({
      organisationId: user?.organisationid || 0,
      staffLocationId: user?.locationid || 0,
      enabled: isAuthenticated,
    });

  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<OrganisationDashboardStats>(EMPTY_DASHBOARD_STATS);
  const [selectedLocationId, setSelectedLocationId] = useState<number>(0);
  
  // Search functionality
  const [searchPhone, setSearchPhone] = useState('');
  const [searchResults, setSearchResults] = useState<BookedAppoinmentRes[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Appointment details dialog
  const [selectedAppointment, setSelectedAppointment] = useState<BookedAppoinmentRes | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // File viewer dialog
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [copiedUrlField, setCopiedUrlField] = useState<"slug" | "full" | null>(null);
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof win.requestIdleCallback === "function") {
      const id = win.requestIdleCallback(() => setChartsReady(true), { timeout: 1200 });
      return () => win.cancelIdleCallback?.(id);
    }
    const timeoutId = window.setTimeout(() => setChartsReady(true), 200);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const globalLocationIdRef = useRef(globalLocationId);
  globalLocationIdRef.current = globalLocationId;
  const locationInitDoneRef = useRef(false);
  const lastFetchedLocationRef = useRef(0);
  const prevLocationIdRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  const resolveInitialLocationId = useCallback((locationList: OrganisationLocation[]): number => {
    const pick = (id: number) =>
      id > 0 && locationList.some((loc) => loc.id === id) ? id : 0;

    const fromGlobal = pick(Number(globalLocationIdRef.current) || 0);
    if (fromGlobal) return fromGlobal;

    const fromStorage = pick(Number(localStorage.getItem("organizationlocationid") || 0));
    if (fromStorage) return fromStorage;

    try {
      const userContextStr = localStorage.getItem("user_context");
      if (userContextStr) {
        const fromContext = pick(JSON.parse(userContextStr).organisationlocationid || 0);
        if (fromContext) return fromContext;
      }
    } catch {
      // ignore malformed user_context
    }

    return locationList[0]?.id ?? 0;
  }, []);

  // Resolve initial location once when shared locations cache loads
  useEffect(() => {
    if (!locationsLoaded || locations.length === 0 || locationInitDoneRef.current) return;

    const initialId = resolveInitialLocationId(locations);
    if (initialId <= 0) return;

    locationInitDoneRef.current = true;
    setSelectedLocationId(initialId);
    prevLocationIdRef.current = initialId;
    if (!globalLocationIdRef.current || Number(globalLocationIdRef.current) !== initialId) {
      setGlobalLocationId(initialId);
    }
    const initialLocation = locations.find((loc) => loc.id === initialId);
    if (initialLocation) {
      persistOrganisationLocationSelection(initialLocation);
    }
    window.setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);
  }, [locationsLoaded, locations, resolveInitialLocationId, setGlobalLocationId]);

  const loadDashboardStats = useCallback(async () => {
    if (!isAuthenticated || !selectedLocationId) return;

    setIsLoading(true);
    try {
      const req = new OrgLocationReq();
      req.orglocid = selectedLocationId;
      const response = await organisationLocationService.selectOrganisationDashboardStats(req);
      setDashboardStats(response ?? EMPTY_DASHBOARD_STATS);
    } catch (error) {
      console.error('❌ Error loading dashboard stats:', error);
      setDashboardStats(EMPTY_DASHBOARD_STATS);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, selectedLocationId, organisationLocationService, toast]);

  // Update loading state when user becomes available
  useEffect(() => {
    if (user) {
      const isStaff = UserTypeUtil.isStaff(user);
      // Check if staff user has location ID, if not, don't show loading
      if (isStaff && !user?.organisationlocationid && !user?.locationid) {
        setIsLoading(false);
      }
    }
  }, [user]);

  // Sync when location changes elsewhere after initial load
  const updateUserContextLocation = useCallback((locationId: number) => {
    try {
      const userContextStr = localStorage.getItem('user_context');
      if (!userContextStr) {
        console.warn('⚠️ user_context not found in localStorage');
        return;
      }
      
      const userContext = JSON.parse(userContextStr);
      const oldLocationId = userContext.organisationlocationid || 0;
      
      // Update organisationlocationid in user_context
      userContext.organisationlocationid = locationId;
      
      // Save back to localStorage
      localStorage.setItem('user_context', JSON.stringify(userContext));
      console.log('✅ Updated user_context.organisationlocationid from', oldLocationId, 'to', locationId);
      // UPDATE organizationlocationid in a separate key for easy access
      localStorage.setItem('organizationlocationid', locationId.toString());
      console.log('✅ UPDATED organizationlocationid in localStorage:', locationId);
      
      // Dispatch custom event to notify other components (for same-tab updates)
      window.dispatchEvent(new CustomEvent('userContextUpdated', { 
        detail: { organisationlocationid: locationId } 
      }));
      
      // Dispatch custom event specifically for organizationlocationid changes
      window.dispatchEvent(new CustomEvent('organizationlocationidChanged', { 
        detail: { organizationlocationid: locationId } 
      }));
      
      // Refresh auth context to update user object
      if (refreshAuth) {
        refreshAuth();
      }
      
      toast({
        title: "Location Updated",
        description: `Location changed to ID: ${locationId}`,
      });
    } catch (error) {
      console.error('❌ Error updating user_context:', error);
      toast({
        title: "Error",
        description: "Failed to update location in user context",
        variant: "destructive"
      });
    }
  }, [refreshAuth, toast]);

  // Handle location change from Select component
  const handleLocationChange = useCallback((value: string) => {
    const newLocationId = Number(value);
    const previousLocationId = prevLocationIdRef.current;
    const nextLocation = locations.find((loc) => loc.id === newLocationId);
    
    console.log('🔄 Location change detected:', {
      previous: previousLocationId,
      new: newLocationId,
      isInitialLoad: isInitialLoadRef.current
    });
    
    setSelectedLocationId(newLocationId);
    
    // Store location ID in global context (accessible by all components)
    setGlobalLocationId(newLocationId);
    console.log('✅ Stored location ID in GlobalIdContext:', newLocationId);

    if (nextLocation) {
      persistOrganisationLocationSelection(nextLocation, {
        refreshAuth: !isInitialLoadRef.current ? refreshAuth : undefined,
      });
    } else if (!isInitialLoadRef.current && previousLocationId !== newLocationId) {
      updateUserContextLocation(newLocationId);
    }
    
    prevLocationIdRef.current = newLocationId;
  }, [locations, updateUserContextLocation, setGlobalLocationId, refreshAuth]);

  // Sync when location changes elsewhere (sidebar / other pages) after initial load
  useEffect(() => {
    if (!locationInitDoneRef.current || !globalLocationId || locations.length === 0) return;
    const storedLocationId = Number(globalLocationId);
    const locationExists = locations.some((loc) => loc.id === storedLocationId);
    if (locationExists && selectedLocationId !== storedLocationId) {
      setSelectedLocationId(storedLocationId);
      prevLocationIdRef.current = storedLocationId;
    }
  }, [globalLocationId, locations, selectedLocationId]);

  // One stats fetch per location
  useEffect(() => {
    if (selectedLocationId <= 0) return;
    if (lastFetchedLocationRef.current === selectedLocationId) return;
    lastFetchedLocationRef.current = selectedLocationId;
    void loadDashboardStats();
  }, [selectedLocationId, loadDashboardStats]);

  const handleRefresh = async () => {
    lastFetchedLocationRef.current = 0;
    await loadDashboardStats();
    if (selectedLocationId > 0) {
      lastFetchedLocationRef.current = selectedLocationId;
    }
  };

  // Search appointments by phone number
  const searchAppointmentsByPhone = async () => {
    if (!searchPhone.trim() || !isAuthenticated) return;
    
    // For staff users, we need to check if they have a location ID
    const isStaff = UserTypeUtil.isStaff(user);
    if (isStaff && !user?.organisationlocationid) {
      toast({
        title: "No Location Access",
        description: "Staff user must have a location assigned to search appointments",
        variant: "destructive"
      });
      return;
    }
    
    setIsSearching(true);
    try {
      console.log('🔍 Searching appointments for phone:', searchPhone);
      const req = new SearchAppointmentByMobileReq();
      
      req.organisationid = organizationId;
      
      req.mobilenumber = searchPhone.trim();
      
      const response = await appointmentService.searchByMobile(req);
      console.log('✅ Search API response:', response);
      
      setSearchResults(response || []);
      setShowSearchResults(true);
      
      if (!response || response.length === 0) {
        toast({
          title: "No Results",
          description: `No appointments found for "${searchPhone}"`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Search Complete",
          description: `Found ${response.length} appointment(s) for "${searchPhone}"`,
        });
      }
    } catch (error) {
      console.error('❌ Error searching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to search appointments",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search results
  const clearSearch = () => {
    setSearchPhone('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleFilePreview = (file: FileItem) => {
    console.log('Preview clicked, file:', file);
    setSelectedFile(file);
    setIsFileViewerOpen(true);
  };

  const totalRevenue = dashboardStats.totalrevenue ?? 0;

  const trendChartData = useMemo(
    () =>
      (dashboardStats.trend_last_7_days ?? []).map((point) => ({
        name: point.name,
        appointments: point.appointments,
      })),
    [dashboardStats.trend_last_7_days],
  );

  const statusChartData = dashboardStats.status_breakdown ?? [];

  const revenueMonthBars = useMemo(
    () =>
      (dashboardStats.revenue_by_week_this_month ?? []).map((point) => ({
        name: point.name,
        revenue: point.revenue,
      })),
    [dashboardStats.revenue_by_week_this_month],
  );

  const appointmentSpark = useMemo(
    () => trendChartData.map((d) => d.appointments),
    [trendChartData]
  );
  const revenueSpark = useMemo(
    () => revenueMonthBars.map((d) => d.revenue),
    [revenueMonthBars]
  );
  const statusSpark = useMemo(
    () => statusChartData.map((d) => d.value),
    [statusChartData]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const userFirstName =
    user?.username?.trim().split(/\s+/)[0] ||
    user?.name?.trim().split(/\s+/)[0] ||
    "there";

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === selectedLocationId) ?? null,
    [locations, selectedLocationId],
  );

  const publicUrlSlug = useMemo(
    () => normalizeCustomUrlSlug(selectedLocation?.customurl),
    [selectedLocation],
  );

  const publicUrlHost = useMemo(
    () => (publicUrlSlug ? buildOrganisationCustomUrlHost({ customUrl: publicUrlSlug }) : ""),
    [publicUrlSlug],
  );

  const publicSiteUrl = useMemo(
    () => (publicUrlHost ? buildOrganisationPublicSiteOriginFromHost(publicUrlHost) : ""),
    [publicUrlHost],
  );

  const copyPublicBookingUrl = useCallback(
    async (field: "slug" | "full") => {
      const value = field === "slug" ? publicUrlSlug : publicSiteUrl;
      if (!value) {
        toast({
          title: "No URL yet",
          description: "Set your booking page address in Custom domain first.",
          variant: "destructive",
        });
        return;
      }

      try {
        await navigator.clipboard.writeText(value);
        setCopiedUrlField(field);
        window.setTimeout(() => setCopiedUrlField(null), 2000);
        toast({
          title: "Copied",
          description:
            field === "slug"
              ? "Booking page name copied to clipboard."
              : "Full booking URL copied to clipboard.",
        });
      } catch (error) {
        console.error("Error copying booking URL:", error);
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard. Try selecting the text manually.",
          variant: "destructive",
        });
      }
    },
    [publicSiteUrl, publicUrlSlug, toast],
  );

  return (
    <div className={cn(org.page, "bg-white")}>
      <div className={cn(org.pageSection, "space-y-4 pb-6 pt-0")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <h1 className={org.title}>
              {greeting}, {userFirstName} 👋
            </h1>
            <p className={org.description}>
              {user?.organisationlocationname
                ? `Here’s what’s happening at ${user.organisationlocationname} today.`
                : "Track appointments, revenue, and activity for your location."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <Button
              type="button"
              variant="outline"
              asChild
              className={cn(org.btnOutline, "h-10 border-stone-200 bg-white px-4 shadow-none")}
            >
              <Link to="/organization/clients/on-spot-registration">
                <Smartphone className="mr-2 h-4 w-4" />
                Walk-in OTP
              </Link>
            </Button>
            <Button
              type="button"
              asChild
              className={cn(org.btnPrimary, "h-10 bg-none bg-blue-600 shadow-none hover:bg-blue-700")}
            >
              <Link to="/organization/appointments">
                <Plus className="mr-2 h-4 w-4" />
                New booking
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-10 w-10 rounded-xl text-stone-500 shadow-none hover:bg-blue-50 hover:text-blue-700"
              aria-label="Refresh dashboard"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {locations.length > 0 ? (
          <div className="space-y-4">
            <div className="flex w-full flex-col items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-none sm:flex-row sm:items-center sm:gap-4">
              <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-stone-600">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MapPin className="h-4 w-4" aria-hidden />
                </span>
                Location
              </span>
              <Select
                value={selectedLocationId.toString()}
                onValueChange={handleLocationChange}
                disabled={isLoadingLocations}
              >
                <SelectTrigger
                  id="location-select"
                  className="h-10 w-full min-w-0 rounded-xl border-stone-200 bg-white text-left shadow-none sm:w-auto sm:min-w-[18rem] sm:max-w-xl [&>span]:line-clamp-1"
                >
                  <SelectValue placeholder="Select a location" className="text-left" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      <span>
                        {location.name}
                        {location.city ? ` — ${location.city}` : ""}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoadingLocations ?
                <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-blue-600" aria-hidden />
              : null}
            </div>

            <div className="flex w-full flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-none sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Globe className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-600">Your booking URL</p>
                  {publicSiteUrl ? (
                    <>
                      <a
                        href={publicSiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block break-all font-mono text-sm font-semibold text-blue-700 hover:underline"
                      >
                        {publicSiteUrl}
                      </a>
                      {publicUrlSlug ? (
                        <p className="mt-0.5 text-xs text-stone-500">
                          Page name: <span className="font-medium text-stone-700">{publicUrlSlug}</span>
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-stone-500">
                      No custom URL yet. Set your booking page address — once set, it will show here.
                    </p>
                  )}
                </div>
              </div>
              {publicSiteUrl ? (
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(org.btnOutline, "h-10 min-w-0 flex-1 border-stone-200 bg-white shadow-none sm:flex-none")}
                    onClick={() => copyPublicBookingUrl("slug")}
                  >
                    {copiedUrlField === "slug" ? (
                      <Check className="mr-2 h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    Copy name
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(org.btnOutline, "h-10 min-w-0 flex-1 border-stone-200 bg-white shadow-none sm:flex-none")}
                    onClick={() => copyPublicBookingUrl("full")}
                  >
                    {copiedUrlField === "full" ? (
                      <Check className="mr-2 h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    Copy URL
                  </Button>
                  <Button
                    type="button"
                    className={cn(org.btnPrimary, "h-10 min-w-0 flex-1 bg-none bg-blue-600 shadow-none hover:bg-blue-700 sm:flex-none")}
                    onClick={() => window.open(publicSiteUrl, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  asChild
                  className={cn(org.btnPrimary, "h-10 w-full bg-none bg-blue-600 shadow-none hover:bg-blue-700 sm:w-auto")}
                >
                  <Link to="/organization/custom-domain">Set booking page address</Link>
                </Button>
              )}
            </div>
          </div>
        ) : null}

        {UserTypeUtil.isStaff(user) ? (
          <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-none">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-none">
                <Users className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 text-sm leading-relaxed">
                <h3 className="font-semibold text-appointza-navy">Staff view</h3>
                <p className="mt-0.5 text-stone-600">
                  Search appointments below. Contact your administrator if you need more access.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-[18rem] items-center justify-center">
            <div className="rounded-2xl border border-stone-200 bg-white px-10 py-12 text-center shadow-none">
              <RefreshCw className="mx-auto mb-4 h-9 w-9 animate-spin text-blue-600" aria-hidden />
              <p className="text-sm font-medium text-stone-600">Loading your dashboard…</p>
              <p className="mt-1 text-xs text-stone-400">Fetching appointments and payments</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <DashboardStatCard
                label="Total appointments"
                variant="coral"
                sparkValues={appointmentSpark}
              >
                {dashboardStats.totalappointments ?? 0}
              </DashboardStatCard>
              <DashboardStatCard
                label="Revenue"
                variant="coral"
                sparkValues={revenueSpark.length ? revenueSpark : appointmentSpark}
              >
                ₹{totalRevenue.toLocaleString("en-IN")}
              </DashboardStatCard>
              <DashboardStatCard
                label="Confirmed"
                variant="blue"
                sparkValues={statusSpark.length ? statusSpark : appointmentSpark}
              >
                {dashboardStats.confirmedcount ?? 0}
              </DashboardStatCard>
              <DashboardStatCard
                label="Completed"
                variant="blue"
                sparkValues={appointmentSpark}
              >
                {dashboardStats.completedcount ?? 0}
              </DashboardStatCard>
            </div>

            {chartsReady ? (
            <Suspense
              fallback={
                <div className="flex h-[240px] items-center justify-center rounded-2xl border border-stone-200 bg-white text-sm text-stone-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-appointza-coral" />
                  Loading charts…
                </div>
              }
            >
              <DashboardChartsPanel
                trendChartData={trendChartData}
                statusChartData={statusChartData}
                revenueMonthBars={revenueMonthBars}
              />
            </Suspense>
            ) : (
              <div className="flex h-[240px] items-center justify-center rounded-2xl border border-stone-200 bg-white text-sm text-stone-500">
                Preparing charts…
              </div>
            )}
          </div>
        )}

        {/* Appointment search UI – set condition to `!isLoading` to show again */}
        {!isLoading ? false ? (
          <div className="space-y-4">
        <Card className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-none">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-blue-600"
            aria-hidden
          />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-zinc-900">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Search className="h-5 w-5" aria-hidden />
              </span>
              Search appointments
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-zinc-500">
              Find bookings by phone number or customer name for your organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <div className="relative min-w-0 flex-1">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-zinc-400" />
                <Input
                  placeholder="Phone or name…"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="h-11 rounded-xl border-stone-200 bg-white pl-10 shadow-none focus-visible:ring-blue-500/25"
                  onKeyPress={(e) => e.key === 'Enter' && searchAppointmentsByPhone()}
                />
              </div>
              <Button 
                onClick={searchAppointmentsByPhone}
                disabled={isSearching || !searchPhone.trim()}
                className="h-11 shrink-0 gap-2 rounded-xl bg-blue-600 px-6 font-semibold text-white shadow-none hover:bg-blue-700"
              >
                {isSearching ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </Button>
              {showSearchResults && (
                <Button 
                  onClick={clearSearch}
                  variant="outline"
                  className="h-11 shrink-0 rounded-xl border-stone-200 bg-white shadow-none"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {showSearchResults && (
          <Card className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <User className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-lg font-semibold text-zinc-900">Results</span>
                </div>
                <Badge variant="secondary" className="w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                  {searchResults.length} found
                </Badge>
              </CardTitle>
              <CardDescription className="text-sm text-zinc-500">
                Matches for <span className="font-medium text-zinc-700">"{searchPhone}"</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-none"
                    >
                      <div className="space-y-4">
                        {/* Header with customer info and status */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <User className="h-6 w-6" aria-hidden />
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate text-base font-semibold text-zinc-900">
                                {appointment.username}
                              </h3>
                              <p className="text-sm text-zinc-500">
                                {appointment.mobile}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge 
                                  className={cn(
                                    "rounded-full font-medium",
                                    appointment.statuscode === 'COMPLETED' && "border-0 bg-emerald-50 text-emerald-800",
                                    appointment.statuscode === 'CONFIRMED' && "border-0 bg-sky-50 text-sky-800",
                                    appointment.statuscode === 'CANCELLED' && "border-0 bg-red-50 text-red-800",
                                    appointment.statuscode !== 'COMPLETED' && appointment.statuscode !== 'CONFIRMED' && appointment.statuscode !== 'CANCELLED' && "border-0 bg-amber-50 text-amber-900"
                                  )}
                                >
                                  {appointment.statuscode || 'PENDING'}
                                </Badge>
                                {appointment.ispaid && (
                                  <Badge className="rounded-full border-0 bg-emerald-100 text-emerald-800">
                                    Paid
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-lg font-semibold tabular-nums text-blue-600">
                              ₹{appointment.attributes?.servicelist?.reduce(
                                (total, service) => total + (Number(service.serviceprice) || 0),
                                0
                              ).toLocaleString('en-IN') || '0'}
                            </p>
                          </div>
                        </div>

                        {/* Appointment details grid */}
                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                          <div className="rounded-xl border border-stone-200 bg-white p-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Date & time</span>
                            <p className="mt-1 font-medium text-zinc-900">
                              {new Date(appointment.appoinmentdate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-zinc-600">
                              {appointment.fromtime?.toString().substring(0, 5)} – {appointment.totime?.toString().substring(0, 5)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-stone-200 bg-white p-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Staff</span>
                            <p className="mt-1 font-medium text-zinc-900">{appointment.staffname || 'Not assigned'}</p>
                          </div>
                        </div>

                        {/* Services */}
                        {appointment.attributes?.servicelist?.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Services</span>
                            <div className="mt-2 space-y-2">
                              {appointment.attributes.servicelist.map((service, index) => (
                                <div key={index} className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2">
                                  <span className="font-medium text-zinc-800">{service.servicename}</span>
                                  <span className="font-semibold tabular-nums text-blue-600">₹{service.serviceprice}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {appointment.notes && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Notes</span>
                            <p className="mt-1 rounded-xl border border-stone-200 bg-white p-3 text-sm leading-relaxed text-zinc-700">
                              {appointment.notes}
                            </p>
                          </div>
                        )}

                        {/* Tasks */}
                        {appointment.tasklist?.tasks?.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Tasks</span>
                            <div className="mt-2 space-y-2">
                              {appointment.tasklist.tasks.map((task, index) => (
                                <div key={index} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", task.iscompleted ? 'bg-emerald-500' : 'bg-zinc-300')} />
                                    <span className={cn("text-sm", task.iscompleted ? 'text-zinc-500 line-through' : 'text-zinc-800')}>
                                      {task.taskname}
                                    </span>
                                    {task.value && (
                                      <span className="rounded-xl bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">
                                        {task.value}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Documents */}
                        {appointment.fileid?.files?.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Documents</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {appointment.fileid.files.map((file, index) => (
                                <div key={index} className="flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-none">
                                  <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
                                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-700">{file.filename}</span>
                                  <div className="flex shrink-0 items-center gap-0.5">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleFilePreview(file)}
                                      className="h-8 w-8 rounded-lg p-0 shadow-none hover:bg-blue-50"
                                      title="Preview file"
                                    >
                                      <Eye className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        const fileUrl = filesService.get(file.id);
                                        const link = document.createElement('a');
                                        link.href = fileUrl;
                                        link.download = file.filename;
                                        link.target = '_blank';
                                        link.click();
                                      }}
                                      className="h-8 w-8 rounded-lg p-0 shadow-none hover:bg-blue-50"
                                      title="Download file"
                                    >
                                      <Download className="h-4 w-4 text-emerald-600" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 py-10 text-center">
                  <AlertCircle className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
                  <h3 className="text-base font-semibold text-zinc-900">
                    No appointments
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Nothing found for "{searchPhone}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
          </div>
        ) : null
        : null}

        {/* Appointment Details Dialog */}
        {selectedAppointment && (
          <UserAppointmentDetails
            appointment={selectedAppointment}
            isOpen={isDetailsOpen}
            onClose={() => {
              setIsDetailsOpen(false);
              setSelectedAppointment(null);
            }}
            onAppointmentUpdate={(updatedAppointment) => {
              // Update the selected appointment with the new data
              setSelectedAppointment(updatedAppointment);
              
              // Also update the appointment in the search results
              setSearchResults(prevResults => 
                prevResults.map(app => 
                  app.id === updatedAppointment.id ? updatedAppointment : app
                )
              );
            }}
            onRefresh={() => {
              // Refresh search results if needed
              if (searchPhone.trim()) {
                searchAppointmentsByPhone();
              }
            }}
          />
        )}

        {/* File Viewer Dialog */}
        {selectedFile && (
          <FileViewer
            file={selectedFile}
            isOpen={isFileViewerOpen}
            onClose={() => {
              setIsFileViewerOpen(false);
              setSelectedFile(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default OrganizationDashboard;