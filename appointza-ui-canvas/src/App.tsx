import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SafeArea } from "./components/common/SafeArea";
import { AppErrorBoundary } from "./components/common/AppErrorBoundary";
import { GOOGLE_WEB_CLIENT_ID } from "./config/google";
import { useSafeArea } from "./hooks/useSafeArea";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
import { isOrganisationSubdomainHost } from "@/utils/orgPublicSiteUrl.util";
import { mustUseMainAppForAuth, redirectToLogin } from "@/utils/authNavigation.util";
import { isPublicBookingPagePath } from "@/utils/publicBookingRoute.util";

const Index = lazy(() => import("./pages/Index"));
const FullAppChrome = lazy(() => import("@/components/layout/FullAppChrome"));
const OrganizationLayout = lazy(() => import("@/components/layout/OrganizationLayout"));
const UserLayout = lazy(() => import("@/components/layout/UserLayout"));
const OnboardingGuard = lazy(() =>
  import("./components/onboarding/OnboardingGuard").then((m) => ({ default: m.OnboardingGuard })),
);
const EnsureAuthOnMainHost = lazy(() =>
  import("@/components/auth/EnsureAuthOnMainHost").then((m) => ({ default: m.EnsureAuthOnMainHost })),
);

// Lazy: all other routes (auth, marketing secondary, public browse, user, org, heavy pages).
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Register = lazy(() => import("./pages/Register"));
const OtpVerification = lazy(() => import("./pages/OtpVerification"));
const PricingPlans = lazy(() => import("./pages/PricingPlans"));
const DemoRequest = lazy(() => import("./pages/DemoRequest"));
const UseCases = lazy(() => import("./pages/UseCases"));
const Features = lazy(() => import("./pages/Features"));
const Contact = lazy(() => import("./pages/Contact"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Blog = lazy(() => import("./pages/Blog"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const OrganizationDashboard = lazy(() => import("./pages/organization/Dashboard"));
const TimingScreen = lazy(() => import("./pages/organization/Timing"));
const OrganizationServices = lazy(() => import("./pages/organization/Services"));
const CustomDomainScreen = lazy(() => import("./pages/organization/CustomDomain"));
const OrganizationAppointments = lazy(() => import("./pages/organization/Appointments"));
const OrganizationCalendar = lazy(() => import("./pages/organization/OrganizationCalendar"));
const LocationsScreen = lazy(() => import("./pages/organization/Locations"));
const AddStaff = lazy(() => import("./pages/organization/AddStaff"));
const StaffManagement = lazy(() => import("./pages/organization/StaffManagement"));
const OrganizationTemplates = lazy(() => import("./pages/organization/Templates"));
const TemplateBuilder = lazy(() => import("./pages/organization/TemplateBuilder"));
const OrganizationSettings = lazy(() => import("./pages/organization/Settings"));
const OrganizationProfile = lazy(() => import("./pages/organization/Profile"));
const PaymentSettings = lazy(() => import("./pages/organization/PaymentSettings"));
const ReferenceValuesPage = lazy(() => import("./pages/organization/ReferenceValues"));
const ClientManagement = lazy(() => import("./pages/organization/ClientManagement"));
const OnSpotRegistration = lazy(() => import("./pages/organization/OnSpotRegistration"));
const ClientBookAppointment = lazy(() => import("./pages/organization/ClientBookAppointment"));
const AppointmentRecordPage = lazy(() => import("./pages/organization/AppointmentRecord"));
const ExploreServices = lazy(() => import("./pages/ExploreServices"));
const PublicBrowseEventsPage = lazy(() => import("./pages/PublicBrowseEventsPage"));
const PublicBrowseServicesPage = lazy(() => import("./pages/PublicBrowseServicesPage"));
const PublicBrowseOrganisationsPage = lazy(() => import("./pages/PublicBrowseOrganisationsPage"));
const OrganizationTemplate = lazy(() => import("./pages/OrganizationTemplate"));
const OrganizationDetail = lazy(() => import("./pages/user/OrganizationDetail"));
const UserDashboard = lazy(() => import("./pages/user/Dashboard"));
const UserProfile = lazy(() => import("./pages/user/UserProfile"));
const UserSettings = lazy(() => import("./pages/user/Settings"));
const UserAppointments = lazy(() => import("./pages/user/Appointments"));
const UserEvents = lazy(() => import("./pages/user/UserEvents"));
const EventBookingPage = lazy(() => import("./pages/user/EventBookingPage"));
const MyEventBookings = lazy(() => import("./pages/user/MyEventBookings"));
const AppointmentBooking = lazy(() => import("./pages/user/AppointmentBooking"));
const RoomBookingPage = lazy(() => import("./pages/RoomBookingPage"));
const OrganizationAssets = lazy(() => import("./pages/organization/Assets"));
const EventBookings = lazy(() => import("./pages/organization/EventBookings"));
const OrganizationLeads = lazy(() => import("./pages/organization/Leads"));
const CrmLayout = lazy(() => import("./pages/organization/CrmLayout"));
const CrmDashboard = lazy(() => import("./pages/organization/crm/CrmDashboard"));
const CrmUnifiedInbox = lazy(() => import("./pages/organization/crm/CrmUnifiedInbox"));
const CrmComingSoon = lazy(() => import("./pages/organization/crm/CrmComingSoon"));
const CrmCatalogue = lazy(() => import("./pages/organization/CrmCatalogue"));
const HospitalityContentPage = lazy(() => import("./pages/organization/HospitalityContent"));
const OrganisationLegacyRedirect = lazy(() => import("./pages/organization/OrganisationLegacyRedirect"));
const RoomDefinitionsPage = lazy(() => import("./pages/organization/RoomDefinitions"));
const RoomStatusPage = lazy(() => import("./pages/organization/RoomStatus"));
const OrganizationPublicPage = lazy(() => import("./pages/OrganizationPublicPage"));
const DynamicTemplatePage = lazy(() => import("./pages/DynamicTemplatePage"));
const CustomDomainRedirect = lazy(() => import("./pages/CustomDomainRedirect"));
const TurfDirectoryPage = lazy(() => import("./pages/TurfDirectoryPage"));
const CampuszaStaff = lazy(() => import("./pages/campusza/Staff"));

/** Lightweight route-chunk fallback — matches existing auth/loader styling. */
const RouteChunkFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-appointza-cream">
    <Loader2 className="h-8 w-8 animate-spin text-[#E85D4C]" aria-label="Loading" />
  </div>
);

/** Content-only fallback so the sidebar/shell stay mounted (Angular router-outlet style). */
const OutletFallback = () => (
  <div className="flex min-h-[40vh] w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-[#E85D4C]" aria-label="Loading" />
  </div>
);

// Sends unauthenticated users on org subdomains to main-app `/login`.
const MainAppLoginRedirect = ({ returnPath }: { returnPath: string }) => {
  useEffect(() => {
    redirectToLogin(returnPath);
  }, [returnPath]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-appointza-cream">
      <Loader2 className="h-8 w-8 animate-spin text-[#E85D4C]" aria-label="Redirecting to login" />
    </div>
  );
};

// Protected Route component - defined inside the app so it can be used after AuthProvider exists
const ProtectedRouteWrapper = ({ children, redirectTo }: { children: React.ReactNode; redirectTo: string }) => {
  const { isAuthenticated, authReady } = useAuth();
  const location = useLocation();
  const returnPath = `${location.pathname}${location.search}`;

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-appointza-cream">
        <Loader2 className="h-8 w-8 animate-spin text-[#E85D4C]" aria-label="Loading" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login from:', returnPath);
    if (mustUseMainAppForAuth()) {
      return <MainAppLoginRedirect returnPath={returnPath} />;
    }
    return <Navigate to={redirectTo} replace state={{ from: returnPath }} />;
  }

  return <>{children}</>;
};

// Organization Route wrapper that includes onboarding guard
const OrganizationRouteWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<OutletFallback />}>
      <OnboardingGuard>
        {children}
      </OnboardingGuard>
    </Suspense>
  );
};

// Route layouts (React Router "router-outlet" equivalent). Layouts are lazy so
// public /template does not download org/user dashboard shells. Inner Suspense
// keeps the shell mounted when only the page chunk changes.
const OrganizationOutletLayout = () => (
  <Suspense fallback={<RouteChunkFallback />}>
    <OrganizationLayout>
      <Suspense fallback={<OutletFallback />}>
        <Outlet />
      </Suspense>
    </OrganizationLayout>
  </Suspense>
);

const UserOutletLayout = () => (
  <Suspense fallback={<RouteChunkFallback />}>
    <UserLayout>
      <Suspense fallback={<OutletFallback />}>
        <Outlet />
      </Suspense>
    </UserLayout>
  </Suspense>
);

// Root route: org subdomain → public booking site; main host → marketing home.
const OrganisationRootRoute = () =>
  isOrganisationSubdomainHost(window.location.host) ? (
    <Suspense fallback={<RouteChunkFallback />}>
      <CustomDomainRedirect />
    </Suspense>
  ) : (
    <Suspense fallback={<RouteChunkFallback />}>
      <Index />
    </Suspense>
  );

// Routes component that uses the protected route - this will be used after AuthProvider is established
const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteChunkFallback />}>
      <Routes>
        <Route path="/" element={<OrganisationRootRoute />} />
        <Route path="/login" element={<Suspense fallback={<RouteChunkFallback />}><EnsureAuthOnMainHost><Login /></EnsureAuthOnMainHost></Suspense>} />
        <Route path="/register" element={<Suspense fallback={<RouteChunkFallback />}><EnsureAuthOnMainHost><Register /></EnsureAuthOnMainHost></Suspense>} />
        <Route path="/otp" element={<Suspense fallback={<RouteChunkFallback />}><EnsureAuthOnMainHost><OtpVerification /></EnsureAuthOnMainHost></Suspense>} />
        <Route path="/plans" element={<PricingPlans />} />
        <Route path="/demo" element={<DemoRequest />} />
        <Route path="/use-cases" element={<UseCases />} />
        <Route path="/features" element={<Features />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        
        {/* Public routes - accessible without login */}
        <Route path="/explore-services" element={<ExploreServices />} />
        <Route path="/explore" element={<ExploreServices />} />
        <Route path="/events" element={<PublicBrowseEventsPage />} />
        <Route path="/services" element={<PublicBrowseServicesPage />} />
        <Route path="/organisations" element={<PublicBrowseOrganisationsPage />} />
        <Route path="/turf" element={<TurfDirectoryPage />} />
        <Route path="/organization/:id" element={<OrganizationDetail />} />
        <Route path="/org/template/:orgId/:templateType" element={<OrganizationTemplate />} />
        <Route path="/public/org/:organizationId" element={<OrganizationPublicPage />} />
        <Route path="/template/:templateId" element={<DynamicTemplatePage />} />
        
        {/* User routes - all protected with proper paths */}
        <Route
          path="/user"
          element={
            <ProtectedRouteWrapper redirectTo="/login">
              <UserOutletLayout />
            </ProtectedRouteWrapper>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="appointments" element={<UserAppointments />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="settings" element={<UserSettings />} />
          <Route path="events" element={<UserEvents />} />
          <Route path="my-event-bookings" element={<MyEventBookings />} />
          <Route path="my-room-bookings" element={<MyEventBookings />} />
        </Route>
        <Route path="/user/events/:eventId/book" element={<EventBookingPage />} />
        <Route path="/book" element={<RoomBookingPage />} />
        <Route path="/book-appointment/:organisationId/:organisationLocationId" element={<AppointmentBooking />} />
        
        {/* Legacy user routes - redirect to new paths */}
        <Route path="/profile" element={<Navigate to="/user/profile" replace />} />
        <Route path="/settings" element={<Navigate to="/user/settings" replace />} />
        
        {/* Organization routes - all protected with onboarding guard */}
        {/* Dynamic organization routes must come before static ones */}
        <Route
          path="/organization"
          element={
            <ProtectedRouteWrapper redirectTo="/login">
              <OrganizationRouteWrapper>
                <OrganizationOutletLayout />
              </OrganizationRouteWrapper>
            </ProtectedRouteWrapper>
          }
        >
          <Route path=":id/dashboard" element={<OrganizationDashboard />} />
          <Route path="dashboard" element={<OrganizationDashboard />} />
          <Route path="custom-domain" element={<CustomDomainScreen />} />
          <Route path="timing" element={<TimingScreen />} />
          <Route path="services" element={<OrganizationServices />} />
          <Route path="appointments/:id/record" element={<AppointmentRecordPage />} />
          <Route path="appointments" element={<OrganizationAppointments />} />
          <Route path="calendar" element={<OrganizationCalendar />} />
          <Route path="event-bookings" element={<EventBookings />} />
          <Route path="crm" element={<CrmLayout />}>
            <Route index element={<CrmDashboard />} />
            <Route path="contacts" element={<OrganizationLeads />} />
            <Route path="leads" element={<Navigate to="/organization/crm/contacts" replace />} />
            <Route path="pipeline" element={<CrmComingSoon title="Sales Pipeline" description="Track lead stages from new enquiry through conversion. This board is next to build." />} />
            <Route path="inbox" element={<CrmUnifiedInbox />} />
            <Route path="email-campaigns" element={<CrmComingSoon title="Email Campaigns" description="Send bulk or scheduled email. Conversations stay in Unified Inbox — this is for campaigns only." />} />
            <Route path="whatsapp-campaigns" element={<CrmComingSoon title="WhatsApp Campaigns" description="Send bulk or scheduled WhatsApp messages. Chats stay in Unified Inbox — this is for campaigns only." />} />
            <Route path="templates" element={<CrmComingSoon title="Message Templates" description="Create and manage Email and WhatsApp message templates for campaigns, booking confirmations, and reminders. Separate from your public website templates under Settings." />} />
            <Route path="tasks" element={<CrmComingSoon title="Tasks & Follow-ups" description="Assign reminders and next steps on leads and conversations." />} />
            <Route path="reports" element={<CrmComingSoon title="CRM Reports" description="Conversion, response time, and campaign performance for your organisation." />} />
            <Route path="business-profile" element={<CrmCatalogue />} />
            <Route path="catalogue" element={<Navigate to="/organization/crm/business-profile" replace />} />
            <Route path="clients" element={<Navigate to="/organization/clients" replace />} />
          </Route>
          <Route path="leads" element={<Navigate to="/organization/crm/contacts" replace />} />
          <Route path="loyalty" element={<Navigate to="/organization/profile?tab=loyalty" replace />} />
          <Route path="locations" element={<LocationsScreen />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="staff/add" element={<AddStaff />} />
          <Route path="templates" element={<OrganizationTemplates />} />
          <Route path="template-builder" element={<TemplateBuilder />} />
          <Route path="settings" element={<OrganizationSettings />} />
          <Route path="profile" element={<OrganizationProfile />} />
          <Route path="reference-values" element={<ReferenceValuesPage />} />
          <Route path="payment-settings" element={<PaymentSettings />} />
          <Route path="booking-page" element={<Navigate to="/organization/profile?tab=templates" replace />} />
          <Route path="clients" element={<ClientManagement />} />
          <Route path="clients/on-spot-registration" element={<OnSpotRegistration />} />
          <Route path="clients/:clientId/book" element={<ClientBookAppointment />} />
          <Route path="hospitality" element={<HospitalityContentPage />} />
          <Route path="assets" element={<OrganizationAssets />} />
          <Route path="organisation" element={<OrganisationLegacyRedirect />} />
          <Route path="rooms/definitions" element={<RoomDefinitionsPage />} />
          <Route path="rooms/status" element={<RoomStatusPage />} />
        </Route>
        
        {/* Campusza route - no Appointza layout */}
        <Route path="/campusza/staff" element={
          <ProtectedRouteWrapper redirectTo="/login">
            <CampuszaStaff />
          </ProtectedRouteWrapper>
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Only retry once by default
      retryDelay: 2000, // 2 second delay between retries
      staleTime: 30000, // 30 seconds
      gcTime: 60000, // 1 minute (formerly cacheTime)
      refetchOnWindowFocus: false, // Prevent constant refetching
    },
  },
});

/** Syncs safe-area CSS vars on native; initializes native Google Sign-In (WebView GIS often fails). */
function NativeBootstrap({ children }: { children: ReactNode }) {
  const location = useLocation();
  const skipNativeGoogle = isPublicBookingPagePath(location.pathname);
  useSafeArea();

  useEffect(() => {
    if (skipNativeGoogle) return;
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    (async () => {
      try {
        const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
        if (cancelled) return;
        await GoogleAuth.initialize({
          scopes: ["openid", "profile", "email"],
        });
      } catch (e) {
        console.warn("GoogleAuth.initialize:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [skipNativeGoogle]);

  return <>{children}</>;
}

/** Auth stays mounted so template → booking navigation keeps the session. Heavy chrome is deferred. */
function AppShell() {
  const location = useLocation();
  const publicSurface = isPublicBookingPagePath(location.pathname);
  const routes = (
    <AppErrorBoundary resetKey={location.pathname}>
      <AppRoutes />
    </AppErrorBoundary>
  );

  return (
    <NativeBootstrap>
      <AuthProvider>
        {publicSurface ? (
          routes
        ) : (
          <Suspense fallback={<RouteChunkFallback />}>
            <FullAppChrome>{routes}</FullAppChrome>
          </Suspense>
        )}
      </AuthProvider>
    </NativeBootstrap>
  );
}

const routerBasename =
  import.meta.env.BASE_URL === "/"
    ? undefined
    : import.meta.env.BASE_URL.replace(/\/$/, "");

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_WEB_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={routerBasename}>
        <SafeArea
          className="min-h-dvh min-h-screen"
          padding={Capacitor.isNativePlatform() ? "all" : "none"}
        >
          <AppErrorBoundary>
            <AppShell />
          </AppErrorBoundary>
        </SafeArea>
      </BrowserRouter>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
