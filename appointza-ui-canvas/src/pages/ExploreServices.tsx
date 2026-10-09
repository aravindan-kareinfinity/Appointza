import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Clock, Phone, Mail, Calendar, Users, RefreshCw, Loader2, AlertCircle, ExternalLink, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { OrganisationService } from "@/services/organisation.service";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { FilesService } from "@/services/files.service";
import { EventService } from "@/services/event.service";
import { OrganisationServicesService } from "@/services/organisationservices.service";
import { OrganisationDetail, OrganisationSelectReq } from "@/models/organisation.model";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { OrgLocationReq, OrgLocationStaffResponse, Service, Timing } from "@/models/organisationlocation.model";
import { Event } from "@/models/event.model";
import { OrganisationServices, OrganisationServicesSelectReq } from "@/models/organisationservices.model";
import { REFERENCETYPE } from "@/models/users.model";
import { DayOfWeekUtil } from "@/utils/dayofweek.util";
import { cn } from "@/lib/utils";
import UserLayout from "@/components/layout/UserLayout";
import { useNavigate, useLocation } from "react-router-dom";
import { useSafeArea } from "@/hooks/useSafeArea";
import { useIsMobile } from "@/hooks/use-mobile";
import { Capacitor } from "@capacitor/core";
import { organisationPublicUrls } from "@/utils/publicBrowse.util";
import { OrgBrowseCardAvatar } from "@/components/public/OrgBrowseCardAvatar";
import {
  formatEventDateOnly,
  isDateOnlyInRange,
  toDateOnlyString,
} from "@/utils/eventDate.util";

/** Explore page — matches user/org dashboard theme (orange accents, rounded cards). */
const exploreTabTriggerClass =
  "relative flex min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-2 py-3 text-sm font-medium text-gray-500 shadow-none transition-colors hover:text-gray-800 focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:ring-offset-0 data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-orange-600 data-[state=active]:shadow-none sm:px-3 sm:py-4";

const exploreCardClass =
  "rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg";

const exploreInputClass =
  "rounded-2xl border-gray-200 bg-white focus-visible:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/25 focus-visible:ring-offset-0";

const exploreOutlineBtnClass =
  "rounded-2xl border-gray-200 hover:bg-gray-50";

const explorePrimaryBtnClass = "bg-orange-600 text-white hover:bg-orange-700";

function exploreFilterChipClass(active: boolean) {
  return cn(
    "rounded-xl border text-xs",
    active
      ? "border-orange-600 bg-orange-600 text-white hover:bg-orange-700 hover:text-white"
      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
  );
}

const ExploreServices = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const insets = useSafeArea();
  const isMobile = useIsMobile();
  const isNative = Capacitor.isNativePlatform();

  // API services
  const organisationService = useMemo(() => new OrganisationService(), []);
  const organisationLocationService = useMemo(() => new OrganisationLocationService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const filesService = useMemo(() => new FilesService(), []);
  const eventService = useMemo(() => new EventService(), []);
  const organisationServicesService = useMemo(() => new OrganisationServicesService(), []);

  // Tab state — URL `?tab=` and marketing home `Link state={{ tab: 'event' }}`
  const tabFromSearch = new URLSearchParams(location.search).get("tab");
  const stateTab = (location.state as { tab?: string } | null)?.tab;
  const initialTab =
    tabFromSearch === "event" || stateTab === "event" ? "event" : "organisation";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const next =
      new URLSearchParams(location.search).get("tab") === "event" ||
      (location.state as { tab?: string } | null)?.tab === "event"
        ? "event"
        : "organisation";
    setActiveTab(next);
  }, [location.search, location.state]);

  const handleExploreTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(location.search);
    if (value === "event") {
      params.set("tab", "event");
    } else {
      params.delete("tab");
    }
    const qs = params.toString();
    navigate(
      { pathname: location.pathname, search: qs ? `?${qs}` : "" },
      { replace: true },
    );
  };

  // State for organisations
  const [organisations, setOrganisations] = useState<OrganisationDetail[]>([]);
  const [filteredOrganisations, setFilteredOrganisations] = useState<OrganisationDetail[]>([]);

  // State for services
  interface ServiceWithOrg extends OrganisationServices {
    organisationName: string;
    organisationLocationId: number;
    organisationLocationCity: string;
    organisationLocationState: string;
    organisationImageId: number;
  }
  const [allServices, setAllServices] = useState<ServiceWithOrg[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceWithOrg[]>([]);

  const exploreServiceCardImageUrls = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of allServices) {
      const firstId = s.attributes?.ImageIds?.find((id) => (id ?? 0) > 0);
      if (firstId) map[`${s.organisationid}-${s.id}`] = filesService.getImageUrl(firstId);
    }
    return map;
  }, [allServices, filesService]);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [selectedServicePrimaryType, setSelectedServicePrimaryType] = useState<number | null>(null);
  const [selectedServiceSecondaryType, setSelectedServiceSecondaryType] = useState<number | null>(null);
  
  // State for events
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [eventSearchTerm, setEventSearchTerm] = useState('');
  const [eventImageUrls, setEventImageUrls] = useState<{ [eventId: number]: string[] }>({});
  const [selectedEventDate, setSelectedEventDate] = useState<Date | null>(null);
  const [selectedEventPaymentType, setSelectedEventPaymentType] = useState<string>('all'); // 'all', 'userpay', 'clientpay'
  const [selectedEventType, setSelectedEventType] = useState<string>('all'); // 'all', 'single', 'range', 'daily'
  const [selectedEventPrimaryType, setSelectedEventPrimaryType] = useState<number | null>(null);
  const [selectedEventSecondaryType, setSelectedEventSecondaryType] = useState<number | null>(null);
  
  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrimaryType, setSelectedPrimaryType] = useState<number | null>(null);
  const [selectedSecondaryType, setSelectedSecondaryType] = useState<number | null>(null);
  const [primaryBusinessTypes, setPrimaryBusinessTypes] = useState<ReferenceValue[]>([]);
  const [secondaryBusinessTypes, setSecondaryBusinessTypes] = useState<ReferenceValue[]>([]);
  const [showBusinessDetails, setShowBusinessDetails] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<OrgLocationStaffResponse | null>(null);
  const [selectedOrganisationId, setSelectedOrganisationId] = useState<number | null>(null);
  const [selectedOrganisationLocationId, setSelectedOrganisationLocationId] = useState<number | null>(null);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const req = new OrganisationSelectReq();
      const response = await organisationService.selectOrganisationDetail(req);

      if (response && Array.isArray(response)) {
        // Filter to only show verified organization locations
        // The server should already filter for isverified=true, but we add client-side validation
        const verifiedOrganisations = response.filter(org => 
          org.organisationlocationid > 0 // Ensure it has a location
          // Note: Server-side filtering for isverified=true should already be applied
        );
        
        setOrganisations(verifiedOrganisations);
        setFilteredOrganisations(verifiedOrganisations);
        console.log(`✅ Loaded ${verifiedOrganisations.length} verified organizations (filtered from ${response.length} total)`);
        console.log('🔍 Server-side filtering for isverified=true should already be applied');
        
        // Debug: Check image IDs in the response
        response.forEach((org, index) => {
          console.log(`📸 Organization ${index + 1}:`, {
            name: org.organisationname,
            organisationimageid: org.organisationimageid,
            imageid: (org as any).imageid,
            organisationlogo: (org as any).organisationlogo,
            allFields: Object.keys(org),
            imageUrl: org.organisationimageid ? filesService.get(org.organisationimageid) : 'No image'
          });
        });
      } else {
        console.warn('⚠️ No organizations returned or invalid response format');
        setOrganisations([]);
        setFilteredOrganisations([]);
      }
    } catch (error) {
      console.error('❌ Error loading organizations:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      let errorMessage = "Failed to load organizations";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [organisationService, toast]);

  // Load reference types
  const loadReferenceTypes = useCallback(async () => {
    try {
      console.log('🔍 Loading primary business types...');
      const req = new ReferenceValueSelectReq();
      req.referencetypeid = REFERENCETYPE.ORGANISATIONPRIMARYTYPE;
      req.organisationid = 0; // Get all primary types
      console.log('📤 Primary business types request:', JSON.stringify(req, null, 2));
      
      const response = await referenceValueService.select(req);
      console.log('✅ Primary business types API response:', response);
      
      if (response) {
        setPrimaryBusinessTypes(response);
        console.log(`✅ Loaded ${response.length} primary business types`);
      }
    } catch (error) {
      console.error('❌ Error loading primary business types:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      let errorMessage = "Failed to load business types";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [referenceValueService, toast]);

  // Load secondary types
  const loadSecondaryTypes = useCallback(async (primaryId: number) => {
    try {
      console.log('🔍 Loading secondary business types for primary:', primaryId);
      const req = new ReferenceValueSelectReq();
      req.parentid = primaryId;
      req.referencetypeid = REFERENCETYPE.ORGANISATIONSECONDARYTYPE;
      req.organisationid = 0; // Get all secondary types for this primary
      console.log('📤 Secondary business types request:', JSON.stringify(req, null, 2));
      
      const response = await referenceValueService.select(req);
      console.log('✅ Secondary business types API response:', response);
      
      if (response) {
        setSecondaryBusinessTypes(response);
        console.log(`✅ Loaded ${response.length} secondary business types`);
      }
    } catch (error) {
      console.error('❌ Error loading secondary business types:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      let errorMessage = "Failed to load secondary business types";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [referenceValueService, toast]);

  // Load business details
  const loadBusinessDetails = useCallback(async (orgLocationId: number, organisationId?: number) => {
    try {
      console.log('🔍 Loading business details for location:', orgLocationId);
      
      // Find the organisation from the list to get organisationid if not provided
      let orgId = organisationId;
      if (!orgId) {
        const org = organisations.find(o => o.organisationlocationid === orgLocationId);
        if (org) {
          orgId = org.organisationid;
        }
      }
      
      const req = new OrgLocationReq();
      req.orglocid = orgLocationId;
      console.log('📤 Business details request:', JSON.stringify(req, null, 2));
      
      const response = await organisationLocationService.SelectlocationDetail(req);
      console.log('✅ Business details API response:', response);
      
      if (response && response.length > 0) {
        const locationDetail = new OrgLocationStaffResponse();
        const responseData = response[0];

        // Map properties
        locationDetail.BusinessName = responseData.BusinessName || '';
        locationDetail.StreetName = responseData.StreetName || '';
        locationDetail.Area = responseData.Area || '';
        locationDetail.City = responseData.City || '';
        locationDetail.State = responseData.State || '';
        locationDetail.PostalCode = responseData.PostalCode || '';

        // Map Services
        locationDetail.Services = responseData.Services?.map(service => {
          const s = new Service();
          s.ServiceName = service.ServiceName || '';
          s.Price = service.Price || 0;
          s.OfferPrice = service.OfferPrice || 0;
          s.Duration = service.Duration || 0;
          return s;
        }) || [];

        // Map Timings
        locationDetail.Timings = responseData.Timings?.map(timing => {
          const t = new Timing();
          t.Day = timing.Day || 0;
          t.StartTime = typeof timing.StartTime === 'string' 
            ? timing.StartTime 
            : timing.StartTime 
              ? String(timing.StartTime) 
              : '';
          t.EndTime = typeof timing.EndTime === 'string' 
            ? timing.EndTime 
            : timing.EndTime 
              ? String(timing.EndTime) 
              : '';
          return t;
        }) || [];

        setSelectedBusiness(locationDetail);
        setSelectedOrganisationId(orgId || null);
        setSelectedOrganisationLocationId(orgLocationId);
        setShowBusinessDetails(true);
        console.log('✅ Business details loaded successfully:', locationDetail);
      } else {
        console.warn('⚠️ No business details returned for location:', orgLocationId);
        toast({
          title: "No Details",
          description: "No business details available for this location",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error loading business details:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      let errorMessage = "Failed to load business details";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [organisationLocationService, toast, organisations]);

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...organisations];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(org => 
        org.organisationname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.organisationlocationcity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.organisationprimarytypecode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Primary type filter
    if (selectedPrimaryType) {
      filtered = filtered.filter(org => org.organisationprimarytype === selectedPrimaryType);
    }

    // Secondary type filter
    if (selectedSecondaryType) {
      filtered = filtered.filter(org => org.organisationsecondarytype === selectedSecondaryType);
    }

    setFilteredOrganisations(filtered);
  }, [organisations, searchTerm, selectedPrimaryType, selectedSecondaryType]);

  // Handle primary type selection
  const handlePrimaryTypeSelect = (typeId: number) => {
    setSelectedPrimaryType(typeId);
    setSelectedSecondaryType(null);
    loadSecondaryTypes(typeId);
  };

  // Handle secondary type selection
  const handleSecondaryTypeSelect = (typeId: number) => {
    setSelectedSecondaryType(typeId);
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedPrimaryType(null);
    setSelectedSecondaryType(null);
    setSearchTerm('');
    setFilteredOrganisations(organisations);
  };

  // Helper functions
  const getDayName = (dayNumber: number): string => {
    return DayOfWeekUtil.getDayNameFromNumber(dayNumber);
  };

  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hourNum = parseInt(hours, 10);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum % 12 || 12;
      return `${displayHour}:${minutes} ${period}`;
    } catch (e) {
      return timeString;
    }
  };

  // Load all services from all organisations (batched parallel — avoids sequential N+1)
  const loadAllServices = useCallback(async () => {
    setIsLoadingServices(true);
    try {
      console.log('🔍 Loading all services from all organisations...');
      
      console.log(`📋 Found ${organisations.length} organisation locations`);
      
      const req = new OrganisationServicesSelectReq();
      req.public_catalogue = true;
      req.take = 300;
      req.skip = 0;
      const catalogue = await organisationServicesService.selectPublicCatalogue(req);
      const servicesWithOrg = (catalogue || []).map((service) => ({
        ...service,
        organisationName: service.organisationName || "Unknown Organisation",
        organisationLocationId: service.organisationlocationid || 0,
        organisationLocationCity: service.organisationLocationCity || "",
        organisationLocationState: service.organisationLocationState || "",
        organisationImageId: service.organisationImageId || 0,
      }));
      
      setAllServices(servicesWithOrg);
      setFilteredServices(servicesWithOrg);
      console.log(`✅ Loaded ${servicesWithOrg.length} services from ${organisations.length} locations`);
    } catch (error) {
      console.error('❌ Error loading all services:', error);
      setAllServices([]);
      setFilteredServices([]);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive"
      });
    } finally {
      setIsLoadingServices(false);
    }
  }, [organisationServicesService, toast]);

  // Load event images
  const loadEventImages = useCallback(async (eventsList: Event[]) => {
    const imageUrlsMap: { [eventId: number]: string[] } = {};
    
    for (const event of eventsList) {
      if (event.images?.ImageIds && event.images.ImageIds.length > 0) {
        const urls: string[] = [];
        for (const imageId of event.images.ImageIds) {
          if (imageId > 0) {
            const imageUrl = filesService.getImageUrl(imageId);
            urls.push(imageUrl);
          }
        }
        if (urls.length > 0) {
          imageUrlsMap[event.id] = urls;
        }
      }
    }
    
    setEventImageUrls(imageUrlsMap);
  }, [filesService]);

  // Get event type badge color
  const getEventTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'single':
        return 'border-0 bg-amber-100 text-amber-900 hover:bg-amber-100';
      case 'range':
        return 'border-0 bg-orange-100 text-orange-900 hover:bg-orange-100';
      case 'daily':
        return 'border-0 bg-orange-50 text-orange-900 hover:bg-orange-50';
      default:
        return 'border-0 bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  // Get event type display name
  const getEventTypeDisplayName = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'single':
        return 'Single Event';
      case 'range':
        return 'Date Range';
      case 'daily':
        return 'Daily Recurring';
      default:
        return type;
    }
  };

  // Load events
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading events...');
      const response = await eventService.selectPublicBrowse();
      
      // Server already returns public-only; treat missing is_public as public (JSON edge cases)
      const publicEvents = (response || []).filter((event) => event.is_public !== false);
      setEvents(publicEvents);
      setFilteredEvents(publicEvents);
      console.log(`✅ Loaded ${publicEvents.length} public upcoming/ongoing events`);
      
      // Load images for all events
      if (publicEvents.length > 0) {
        await loadEventImages(publicEvents);
      }
    } catch (error) {
      console.error('❌ Error loading events:', error);
      setEvents([]);
      setFilteredEvents([]);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [eventService, toast, loadEventImages]);

  // Apply service filters
  useEffect(() => {
    if (activeTab === 'service') {
      let filtered = [...allServices];
      
      // Search filter
      if (serviceSearchTerm.trim()) {
        filtered = filtered.filter(service => 
          service.Servicename.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
          service.organisationName.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
          service.organisationLocationCity.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
          (service.notes && service.notes.toLowerCase().includes(serviceSearchTerm.toLowerCase()))
        );
      }
      
      // Primary type filter - filter by organisation's primary type
      if (selectedServicePrimaryType) {
        filtered = filtered.filter(service => {
          const org = organisations.find(o => o.organisationid === service.organisationid);
          return org?.organisationprimarytype === selectedServicePrimaryType;
        });
      }
      
      // Secondary type filter - filter by organisation's secondary type
      if (selectedServiceSecondaryType) {
        filtered = filtered.filter(service => {
          const org = organisations.find(o => o.organisationid === service.organisationid);
          return org?.organisationsecondarytype === selectedServiceSecondaryType;
        });
      }
      
      setFilteredServices(filtered);
    }
  }, [allServices, serviceSearchTerm, selectedServicePrimaryType, selectedServiceSecondaryType, activeTab, organisations]);

  // Handle service primary type selection
  const handleServicePrimaryTypeSelect = (typeId: number) => {
    setSelectedServicePrimaryType(typeId);
    setSelectedServiceSecondaryType(null);
    loadSecondaryTypes(typeId);
  };

  // Handle service secondary type selection
  const handleServiceSecondaryTypeSelect = (typeId: number) => {
    setSelectedServiceSecondaryType(typeId);
  };

  // Clear service filters
  const clearServiceFilters = () => {
    setSelectedServicePrimaryType(null);
    setSelectedServiceSecondaryType(null);
    setServiceSearchTerm('');
    setFilteredServices(allServices);
  };

  // Apply event filters
  useEffect(() => {
    if (activeTab === 'event') {
      let filtered = [...events];
      
      // Search filter
      if (eventSearchTerm.trim()) {
        filtered = filtered.filter(event => 
          event.event_name.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(eventSearchTerm.toLowerCase()) ||
          event.location.toLowerCase().includes(eventSearchTerm.toLowerCase())
        );
      }
      
      // Payment type filter
      if (selectedEventPaymentType !== 'all') {
        filtered = filtered.filter(event => event.payment_type === selectedEventPaymentType);
      }
      
      // Event type filter
      if (selectedEventType !== 'all') {
        filtered = filtered.filter(event => event.event_type === selectedEventType);
      }
      
      // Date filter
      if (selectedEventDate) {
        const filterDay = toDateOnlyString(selectedEventDate) ?? "";
        filtered = filtered.filter(event => {
          if (event.event_type === 'single' && event.event_date) {
            return toDateOnlyString(event.event_date) === filterDay;
          } else if (event.event_type === 'range' && event.from_date && event.to_date) {
            return isDateOnlyInRange(filterDay, event.from_date, event.to_date);
          } else if (event.event_type === 'daily') {
            return true;
          }
          return false;
        });
      }
      
      // Primary type filter - filter by organisation's primary type
      if (selectedEventPrimaryType) {
        filtered = filtered.filter(event => {
          const org = organisations.find(o => o.organisationid === event.organisation_id);
          return org?.organisationprimarytype === selectedEventPrimaryType;
        });
      }
      
      // Secondary type filter - filter by organisation's secondary type
      if (selectedEventSecondaryType) {
        filtered = filtered.filter(event => {
          const org = organisations.find(o => o.organisationid === event.organisation_id);
          return org?.organisationsecondarytype === selectedEventSecondaryType;
        });
      }
      
      setFilteredEvents(filtered);
    }
  }, [events, eventSearchTerm, selectedEventPaymentType, selectedEventType, selectedEventDate, selectedEventPrimaryType, selectedEventSecondaryType, activeTab, organisations]);

  // Handle event primary type selection
  const handleEventPrimaryTypeSelect = (typeId: number) => {
    setSelectedEventPrimaryType(typeId);
    setSelectedEventSecondaryType(null);
    loadSecondaryTypes(typeId);
  };

  // Handle event secondary type selection
  const handleEventSecondaryTypeSelect = (typeId: number) => {
    setSelectedEventSecondaryType(typeId);
  };

  // Clear event filters
  const clearEventFilters = () => {
    setSelectedEventDate(null);
    setSelectedEventPaymentType('all');
    setSelectedEventType('all');
    setSelectedEventPrimaryType(null);
    setSelectedEventSecondaryType(null);
    setEventSearchTerm('');
    setFilteredEvents(events);
  };

  // Track which tabs have loaded their data
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['organisation'])); // Organisation tab loads on mount

  // Load data on component mount - only organisations and reference types
  // Allow browsing without authentication (public page)
  useEffect(() => {
    loadInitialData();
    loadReferenceTypes();
  }, [loadInitialData, loadReferenceTypes]);

  // Load events only when event tab is clicked
  useEffect(() => {
    if (activeTab === 'event' && !loadedTabs.has('event')) {
      console.log('🔍 Event tab clicked, loading events...');
      loadEvents();
      setLoadedTabs(prev => new Set([...prev, 'event']));
    }
  }, [activeTab, loadedTabs, loadEvents]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
  };

  const handleBookSlot = (orgId: number, locationId: number) => {
    const dest = `/book-appointment/${orgId}/${locationId}`;
    if (isAuthenticated) {
      navigate(dest);
    } else {
      navigate("/login", { state: { from: dest } });
    }
  };

  const handleBookEvent = (eventId: number) => {
    const dest = `/user/events/${eventId}/book`;
    if (isAuthenticated) {
      navigate(dest);
    } else {
      navigate("/login", { state: { from: dest } });
    }
  };

  return (
    <UserLayout>
      <div className="space-y-6">
     

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleExploreTabChange} className="space-y-6">
          <TabsList className="inline-flex h-auto w-full min-w-0 justify-stretch gap-0 overflow-x-auto rounded-none bg-transparent p-0 text-left shadow-none [scrollbar-width:thin]">
            <TabsTrigger value="organisation" className={cn(exploreTabTriggerClass)}>
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">Organisation</span>
            </TabsTrigger>
            <TabsTrigger value="event" className={cn(exploreTabTriggerClass)}>
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="truncate">Event</span>
            </TabsTrigger>
          </TabsList>

          {/* Organisation Tab */}
          <TabsContent value="organisation" className="space-y-6">
            {/* Filters and search */}
            <div className="mb-6 space-y-4">
              {/* Filters */}
            <Card className={exploreCardClass}>
              <CardHeader>
                <CardTitle className="text-lg">Filter by Business Type</CardTitle>
                <CardDescription>
                  Select primary and secondary business types to narrow down your search
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Primary Types */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Primary Business Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {primaryBusinessTypes.map((type) => (
                        <Button
                          key={type.id}
                          variant={selectedPrimaryType === type.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePrimaryTypeSelect(type.id)}
                          className={exploreFilterChipClass(selectedPrimaryType === type.id)}
                        >
                          {type.displaytext}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Secondary Types */}
                  {selectedPrimaryType && secondaryBusinessTypes.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Secondary Business Type
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {secondaryBusinessTypes.map((type) => (
                          <Button
                            key={type.id}
                            variant={selectedSecondaryType === type.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSecondaryTypeSelect(type.id)}
                            className={exploreFilterChipClass(selectedSecondaryType === type.id)}
                          >
                            {type.displaytext}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clear Filters */}
                  {(selectedPrimaryType || selectedSecondaryType || searchTerm) && (
                    <Button
                      onClick={clearFilters}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search by business name, location, or service type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn("pl-10", exploreInputClass)}
                />
              </div>
        </div>

            {/* Results */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-3 text-orange-600" />
                <span className="text-gray-600">Loading organisations...</span>
              </div>
            ) : filteredOrganisations.length === 0 ? (
          <Card className={exploreCardClass}>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedPrimaryType || selectedSecondaryType
                  ? 'No organisations match your filters'
                  : 'No organisations available'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedPrimaryType || selectedSecondaryType
                  ? 'Try adjusting your search criteria or filters'
                  : 'Check back later for available organisations'}
              </p>
              {(searchTerm || selectedPrimaryType || selectedSecondaryType) && (
                <Button onClick={clearFilters} variant="outline" className={exploreOutlineBtnClass}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrganisations.map((org) => {
              const urls = organisationPublicUrls(org);
              return (
                <article
                  key={org.organisationlocationid}
                  className="flex gap-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg shadow-zinc-200/50 transition-colors hover:border-zinc-300"
                >
                  <OrgBrowseCardAvatar
                    key={`${org.organisationlocationid}-${org.organisationimageid}`}
                    org={org}
                    filesService={filesService}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-zinc-900">{org.organisationname}</h3>
                      <span className="shrink-0 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs text-sky-600">
                        Listed
                      </span>
                    </div>
                    <p className="mb-1 text-sm font-medium text-orange-600">
                      {org.organisationprimarytypecode || "Business"}
                    </p>
                    <p className="mb-3 flex items-start gap-1 text-sm text-zinc-500">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-zinc-400" aria-hidden />
                      <span>
                        {org.organisationlocationname || org.organisationlocationcity}, {org.organisationlocationcity}
                        {org.organisationlocationstate ? ` • ${org.organisationlocationstate}` : ""}
                      </span>
                    </p>
                    <a
                      href={urls.fullUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mb-3 block truncate text-xs text-zinc-500 hover:text-orange-600"
                    >
                      {urls.displayUrl}
                    </a>
                    <a
                      href={urls.fullUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                    >
                      View profile &amp; book →
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}

            {/* Refresh Button */}
            <div className="mt-6 text-center">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                className={cn("mx-auto flex items-center gap-2", exploreOutlineBtnClass)}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            </div>
          </TabsContent>

          {/* Service Tab */}
          <TabsContent value="service" className="space-y-6">
            {/* Filters and search */}
            <div className="mb-6 space-y-4">
              {/* Filters */}
                <Card className={exploreCardClass}>
                  <CardHeader>
                    <CardTitle className="text-lg">Filter by Business Type</CardTitle>
                    <CardDescription>
                      Select primary and secondary business types to narrow down your search
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Primary Types */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Primary Business Type
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {primaryBusinessTypes.map((type) => (
                            <Button
                              key={type.id}
                              variant={selectedServicePrimaryType === type.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleServicePrimaryTypeSelect(type.id)}
                              className={exploreFilterChipClass(selectedServicePrimaryType === type.id)}
                            >
                              {type.displaytext}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Secondary Types */}
                      {selectedServicePrimaryType && secondaryBusinessTypes.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Secondary Business Type
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {secondaryBusinessTypes.map((type) => (
                              <Button
                                key={type.id}
                                variant={selectedServiceSecondaryType === type.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleServiceSecondaryTypeSelect(type.id)}
                                className={exploreFilterChipClass(selectedServiceSecondaryType === type.id)}
                              >
                                {type.displaytext}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Clear Filters */}
                      {(selectedServicePrimaryType || selectedServiceSecondaryType || serviceSearchTerm) && (
                        <Button
                          onClick={clearServiceFilters}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  className={cn("pl-10", exploreInputClass)}
                  placeholder="Search services by name, organisation, or location..."
                  value={serviceSearchTerm}
                  onChange={(e) => setServiceSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Results */}
            {isLoadingServices ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-3 text-orange-600" />
                <span className="text-gray-600">Loading services...</span>
              </div>
            ) : filteredServices.length === 0 ? (
              <Card className={exploreCardClass}>
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {serviceSearchTerm || selectedServicePrimaryType || selectedServiceSecondaryType
                      ? 'No services match your filters'
                      : 'No services available'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {serviceSearchTerm || selectedServicePrimaryType || selectedServiceSecondaryType
                      ? 'Try adjusting your search criteria or filters'
                      : 'Check back later for available services'}
                  </p>
                  {(serviceSearchTerm || selectedServicePrimaryType || selectedServiceSecondaryType) && (
                    <Button onClick={clearServiceFilters} variant="outline" className={exploreOutlineBtnClass}>
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredServices.map((service) => {
                  const sub =
                    service.notes?.trim() ||
                    [service.organisationLocationCity, service.organisationLocationState].filter(Boolean).join(", ");
                  const coverUrl = exploreServiceCardImageUrls[`${service.organisationid}-${service.id}`];
                  return (
                    <article
                      key={`${service.organisationid}-${service.id}`}
                      className="flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50/80 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
                    >
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={service.Servicename}
                          className="h-40 w-full border-b border-zinc-200 object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-24 w-full border-b border-zinc-200 bg-gradient-to-br from-orange-50 to-zinc-100" />
                      )}
                      <div className="flex flex-col p-6">
                      <span className="mb-1 line-clamp-1 text-sm font-medium text-orange-600">
                        {service.organisationName}
                      </span>
                      <h3 className="mb-1 line-clamp-2 text-xl font-semibold text-zinc-900">{service.Servicename}</h3>
                      {sub ? (
                        <p className="mb-4 line-clamp-3 flex-grow text-sm text-zinc-600">{sub}</p>
                      ) : (
                        <div className="mb-4 flex-grow" />
                      )}
                      <div className="mb-5 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5 text-zinc-400" aria-hidden />
                          {service.timetaken ? `${service.timetaken} min` : "Duration at booking"}
                        </span>
                        {service.show_price ? (
                          <span className="font-semibold text-zinc-900">
                            {service.offerprize > 0 ? (
                              <>
                                <span className="mr-1 font-normal text-zinc-400 line-through">₹{service.prize}</span>₹
                                {service.offerprize}
                              </>
                            ) : (
                              <>from ₹{service.prize}</>
                            )}
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="mt-auto w-full rounded-2xl border border-zinc-300 bg-white py-3.5 font-medium text-zinc-900 transition-colors hover:border-orange-400 hover:bg-orange-50/50"
                        onClick={() => handleBookSlot(service.organisationid, service.organisationLocationId)}
                      >
                        Book slot
                      </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Refresh Button */}
            <div className="mt-6 text-center">
              <Button
                onClick={() => {
                  setIsRefreshing(true);
                  loadAllServices().finally(() => setIsRefreshing(false));
                }}
                disabled={isRefreshing || isLoadingServices}
                variant="outline"
                className={cn("mx-auto flex items-center gap-2", exploreOutlineBtnClass)}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            </div>
          </TabsContent>

          {/* Event Tab */}
          <TabsContent value="event" className="space-y-6">
            {/* Filters and search */}
            <div className="mb-6 space-y-4">
              {/* Filters */}
                <Card className={exploreCardClass}>
                  <CardHeader>
                    <CardTitle className="text-lg">Filter Events</CardTitle>
                    <CardDescription>
                      Filter events by date, payment type, and business type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Event date + Payment type (one row on md+) */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start md:gap-6">
                        <div className="flex min-w-0 flex-col gap-2">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                            <label
                              htmlFor="explore-event-date-filter"
                              className="text-sm font-medium text-gray-700"
                            >
                              Event Date
                            </label>
                            <span className="text-xs text-gray-500">dd-mm-yyyy</span>
                          </div>
                          <Input
                            id="explore-event-date-filter"
                            type="date"
                            value={selectedEventDate ? selectedEventDate.toISOString().split("T")[0] : ""}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : null;
                              setSelectedEventDate(date);
                            }}
                            className={cn("h-11 w-full", exploreInputClass)}
                          />
                          {selectedEventDate && (
                            <Button
                              onClick={() => setSelectedEventDate(null)}
                              variant="ghost"
                              size="sm"
                              className="w-fit px-0 text-xs"
                            >
                              Clear Date
                            </Button>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col gap-2">
                          <label className="text-sm font-medium text-gray-700">Payment Type</label>
                          <div className="flex min-h-11 flex-wrap items-center gap-2">
                            <Button
                              variant={selectedEventPaymentType === "all" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedEventPaymentType("all")}
                              className={exploreFilterChipClass(selectedEventPaymentType === "all")}
                            >
                              All
                            </Button>
                            <Button
                              variant={selectedEventPaymentType === "userpay" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedEventPaymentType("userpay")}
                              className={exploreFilterChipClass(selectedEventPaymentType === "userpay")}
                            >
                              User Pay
                            </Button>
                            <Button
                              variant={selectedEventPaymentType === "clientpay" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedEventPaymentType("clientpay")}
                              className={exploreFilterChipClass(selectedEventPaymentType === "clientpay")}
                            >
                              Client Pay
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Event Type Filter */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Event Type
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant={selectedEventType === 'all' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedEventType('all')}
                            className={exploreFilterChipClass(selectedEventType === 'all')}
                          >
                            All
                          </Button>
                          <Button
                            variant={selectedEventType === 'single' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedEventType('single')}
                            className={exploreFilterChipClass(selectedEventType === 'single')}
                          >
                            Single Event
                          </Button>
                          <Button
                            variant={selectedEventType === 'range' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedEventType('range')}
                            className={exploreFilterChipClass(selectedEventType === 'range')}
                          >
                            Date Range
                          </Button>
                          <Button
                            variant={selectedEventType === 'daily' ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedEventType('daily')}
                            className={exploreFilterChipClass(selectedEventType === 'daily')}
                          >
                            Daily Recurring
                          </Button>
                        </div>
                      </div>

                      {/* Primary Business Type */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Primary Business Type
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {primaryBusinessTypes.map((type) => (
                            <Button
                              key={type.id}
                              variant={selectedEventPrimaryType === type.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleEventPrimaryTypeSelect(type.id)}
                              className={exploreFilterChipClass(selectedEventPrimaryType === type.id)}
                            >
                              {type.displaytext}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Secondary Business Type */}
                      {selectedEventPrimaryType && secondaryBusinessTypes.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Secondary Business Type
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {secondaryBusinessTypes.map((type) => (
                              <Button
                                key={type.id}
                                variant={selectedEventSecondaryType === type.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleEventSecondaryTypeSelect(type.id)}
                                className={exploreFilterChipClass(selectedEventSecondaryType === type.id)}
                              >
                                {type.displaytext}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Clear Filters */}
                      {(selectedEventDate || selectedEventPaymentType !== 'all' || selectedEventType !== 'all' || selectedEventPrimaryType || selectedEventSecondaryType || eventSearchTerm) && (
                        <Button
                          onClick={clearEventFilters}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search events by name, description, or location..."
                  value={eventSearchTerm}
                  onChange={(e) => setEventSearchTerm(e.target.value)}
                  className={cn("pl-10", exploreInputClass)}
                />
              </div>
            </div>

            {!isLoading && filteredEvents.length > 0 && (
              <p className="text-sm font-medium text-foreground">
                Showing {filteredEvents.length} event
                {filteredEvents.length !== 1 ? "s" : ""}
              </p>
            )}

            {/* Results */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-3 text-orange-600" />
                <span className="text-gray-600">Loading events...</span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card className={exploreCardClass}>
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {eventSearchTerm || selectedEventDate || selectedEventPaymentType !== 'all' || selectedEventType !== 'all' || selectedEventPrimaryType || selectedEventSecondaryType
                      ? 'No events match your filters'
                      : 'No events available'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {eventSearchTerm || selectedEventDate || selectedEventPaymentType !== 'all' || selectedEventType !== 'all' || selectedEventPrimaryType || selectedEventSecondaryType
                      ? 'Try adjusting your search criteria or filters'
                      : 'Check back later for available events'}
                  </p>
                  {(eventSearchTerm || selectedEventDate || selectedEventPaymentType !== 'all' || selectedEventType !== 'all' || selectedEventPrimaryType || selectedEventSecondaryType) && (
                    <Button onClick={clearEventFilters} variant="outline" className={exploreOutlineBtnClass}>
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((event) => {
                  const img = eventImageUrls[event.id]?.[0];
                  const soldOut =
                    event.slot_limit > 0 && (event.remainingslot ?? 0) <= 0;
                  return (
                    <article
                      key={event.id}
                      className="flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-lg shadow-zinc-200/50 transition-all hover:border-zinc-300 hover:shadow-xl"
                    >
                      <div className="relative h-48 w-full shrink-0 bg-gradient-to-br from-zinc-100 to-zinc-200">
                        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center text-zinc-400">
                          <Calendar className="size-14" aria-hidden />
                        </div>
                        {img ? (
                          <img
                            src={img}
                            alt={event.event_name}
                            className="relative z-10 h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.remove();
                            }}
                          />
                        ) : null}
                        <div className="absolute right-2 top-2 z-20">
                          <Badge className={cn("text-xs", getEventTypeColor(event.event_type))}>
                            {getEventTypeDisplayName(event.event_type)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 text-xl font-semibold text-zinc-900">{event.event_name}</h3>
                          {event.entry_amount > 0 ? (
                            <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
                              ₹{event.entry_amount.toLocaleString("en-IN")}
                            </span>
                          ) : null}
                        </div>
                        {event.description ? (
                          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-zinc-600">
                            {event.description}
                          </p>
                        ) : (
                          <div className="mb-4 flex-grow" />
                        )}
                        <div className="mb-5 flex flex-col gap-2 text-sm text-zinc-500">
                          {event.location ? (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="mt-0.5 size-3.5 shrink-0 text-zinc-400" aria-hidden />
                              <span className="line-clamp-2">{event.location}</span>
                            </div>
                          ) : null}
                          {event.event_type === "single" && event.event_date ? (
                            <div className="inline-flex items-center gap-1.5">
                              <Calendar className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
                              <span>{formatEventDateOnly(event.event_date)}</span>
                            </div>
                          ) : null}
                          {event.event_type === "range" && event.from_date && event.to_date ? (
                            <div className="inline-flex items-center gap-1.5">
                              <Calendar className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
                              <span>
                                {formatEventDateOnly(event.from_date)} –{" "}
                                {formatEventDateOnly(event.to_date)}
                              </span>
                            </div>
                          ) : null}
                          {event.event_type === "daily" ? (
                            <div className="inline-flex items-center gap-1.5">
                              <Calendar className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
                              <span>Daily recurring</span>
                            </div>
                          ) : null}
                          {event.slot_limit > 0 ? (
                            <div className="inline-flex items-center gap-1.5">
                              <Users className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
                              <span>
                                {soldOut
                                  ? "Fully booked"
                                  : `${event.remainingslot ?? event.slot_limit} slots available`}
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          disabled={soldOut}
                          className="mt-auto w-full rounded-2xl border border-zinc-300 bg-white py-3.5 font-medium text-zinc-900 transition-colors hover:border-orange-400 hover:bg-orange-50/50 disabled:pointer-events-none disabled:opacity-50"
                          onClick={() => handleBookEvent(event.id)}
                        >
                          {soldOut ? "Fully booked" : "Book Event"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Refresh Button */}
            <div className="mt-6 text-center">
              <Button
                onClick={() => {
                  setIsRefreshing(true);
                  loadEvents().finally(() => setIsRefreshing(false));
                }}
                disabled={isRefreshing}
                variant="outline"
                className={cn("mx-auto flex items-center gap-2", exploreOutlineBtnClass)}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Business Details Modal */}
      <Dialog open={showBusinessDetails} onOpenChange={setShowBusinessDetails}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto rounded-3xl border border-gray-100 shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedBusiness?.BusinessName || 'Business Details'}
            </DialogTitle>
            <DialogDescription>
              Complete information about this business
            </DialogDescription>
          </DialogHeader>

          {selectedBusiness && (
            <div className="space-y-6">
              {/* Address */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Address
                </h4>
                <div className="rounded-2xl border border-orange-100/80 bg-orange-50/50 p-3">
                  <p className="text-sm text-gray-700">
                    {selectedBusiness.StreetName && `${selectedBusiness.StreetName}, `}
                    {selectedBusiness.Area}
                  </p>
                  <p className="text-sm text-gray-700">
                    {selectedBusiness.City && `${selectedBusiness.City}, `}
                    {selectedBusiness.State && `${selectedBusiness.State}`}
                    {selectedBusiness.PostalCode && ` - ${selectedBusiness.PostalCode}`}
                  </p>
                </div>
              </div>

              {/* Services */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Services Offered
                </h4>
                {selectedBusiness.Services.length > 0 ? (
                  <div className="space-y-3">
                    {selectedBusiness.Services.map((service, index) => (
                      <div key={index} className="rounded-2xl border border-gray-100 bg-white p-3">
                        <h5 className="font-medium text-gray-900">
                          {service.ServiceName || 'Unnamed Service'}
                        </h5>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          {(service as any).show_price !== false && (
                            <>
                              <span>Price: ₹{service.Price || 0}</span>
                              {service.OfferPrice > 0 && (
                                <span className="text-green-600">
                                  Offer: ₹{service.OfferPrice}
                                </span>
                              )}
                            </>
                          )}
                          <span>Duration: {service.Duration || 0} mins</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No services listed</p>
                )}
              </div>

              {/* Business Hours */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Business Hours
                </h4>
                {selectedBusiness.Timings.length > 0 ? (
                  <div className="space-y-2">
                    {selectedBusiness.Timings.map((timing, index) => (
                      <div key={index} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-3">
                        <span className="font-medium text-gray-900">
                          {getDayName(timing.Day)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatTime(timing.StartTime)} - {formatTime(timing.EndTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No timings available</p>
                )}
              </div>

              {/* Book Now Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowBusinessDetails(false);
                    if (selectedOrganisationId && selectedOrganisationLocationId) {
                      handleBookSlot(selectedOrganisationId, selectedOrganisationLocationId);
                    } else {
                      toast({
                        title: "Error",
                        description: "Unable to book appointment. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className={cn("w-full", explorePrimaryBtnClass)}
                  disabled={!selectedOrganisationId || !selectedOrganisationLocationId}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </UserLayout>
  );
};

export default ExploreServices;