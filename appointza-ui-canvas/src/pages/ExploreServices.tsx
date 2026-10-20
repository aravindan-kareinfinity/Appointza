import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Clock, Phone, Mail, Calendar, Users, RefreshCw, Loader2, AlertCircle, ExternalLink, Building2, ArrowRight, Package } from "lucide-react";
import { getServiceStartingPrice } from "@/utils/servicePricing.util";
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

/** Explore page — Razorpay-style shell (blue accents, light borders). */
const exploreTabTriggerClass =
  "relative flex min-w-0 flex-1 touch-manipulation items-center justify-center gap-2 rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-2 py-3 text-sm font-medium text-[#667085] shadow-none transition-colors hover:text-[#1a1a1a] focus-visible:ring-2 focus-visible:ring-[#528ff0]/30 focus-visible:ring-offset-0 data-[state=active]:border-[#528ff0] data-[state=active]:bg-transparent data-[state=active]:text-[#2a5af5] data-[state=active]:shadow-none sm:px-3 sm:py-4";

const exploreCardClass =
  "rounded-2xl border border-[#e2e8f0] bg-white shadow-none";

const exploreInputClass =
  "rounded-md border-[#e6eaf0] bg-white focus-visible:border-[#528ff0] focus-visible:ring-2 focus-visible:ring-[#528ff0]/20 focus-visible:ring-offset-0";

const exploreOutlineBtnClass =
  "rounded-[6px] border-[#e6eaf0] text-[#344054] hover:bg-[#f8fafc]";

const explorePrimaryBtnClass =
  "rounded-[6px] bg-[#528ff0] text-white hover:bg-[#3d7ae8]";

function exploreFilterChipClass(active: boolean) {
  return cn(
    "rounded-md border text-xs shadow-none",
    active
      ? "border-[#528ff0] bg-[#528ff0] text-white hover:bg-[#3d7ae8] hover:text-white"
      : "border-[#e6eaf0] bg-white text-[#344054] hover:bg-[#f8fafc]",
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

  // Tab state — default Services so finding help is one tap away
  const resolveExploreTab = (search: string, state: unknown) => {
    const tabFromSearch = new URLSearchParams(search).get("tab");
    const stateTab = (state as { tab?: string } | null)?.tab;
    const raw = tabFromSearch || stateTab || "service";
    if (raw === "event" || raw === "organisation") return raw;
    return "service";
  };
  const [activeTab, setActiveTab] = useState(() =>
    resolveExploreTab(location.search, location.state),
  );

  useEffect(() => {
    setActiveTab(resolveExploreTab(location.search, location.state));
  }, [location.search, location.state]);

  const handleExploreTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(location.search);
    if (value === "event" || value === "organisation") {
      params.set("tab", value);
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
    setServiceSearchTerm("");
    setSearchTerm("");
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

  // Track which tabs have loaded their data (services load on mount — default tab)
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(["organisation", "service"]));

  // Load data on mount — organisations + services + types (browse without auth)
  useEffect(() => {
    loadInitialData();
    loadReferenceTypes();
    loadAllServices();
  }, [loadInitialData, loadReferenceTypes, loadAllServices]);

  // Load events only when Events tab is opened
  useEffect(() => {
    if (activeTab === "event" && !loadedTabs.has("event")) {
      loadEvents();
      setLoadedTabs((prev) => new Set([...prev, "event"]));
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
            <TabsTrigger value="service" className={cn(exploreTabTriggerClass)}>
              <Package className="h-4 w-4 shrink-0" />
              <span className="truncate">Services</span>
            </TabsTrigger>
            <TabsTrigger value="organisation" className={cn(exploreTabTriggerClass)}>
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">Places</span>
            </TabsTrigger>
            <TabsTrigger value="event" className={cn(exploreTabTriggerClass)}>
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="truncate">Events</span>
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
                <Loader2 className="h-8 w-8 animate-spin mr-3 text-[#528ff0]" />
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrganisations.map((org) => {
              const urls = organisationPublicUrls(org);
              return (
                <article
                  key={org.organisationlocationid}
                  className="flex gap-4 rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-none transition-colors hover:border-[#cfd8f0]"
                >
                  <OrgBrowseCardAvatar
                    key={`${org.organisationlocationid}-${org.organisationimageid}`}
                    org={org}
                    filesService={filesService}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-slate-900">{org.organisationname}</h3>
                      <span className="shrink-0 rounded-md border border-[#eef4ff] bg-[#eef4ff] px-2 py-0.5 text-[11px] font-semibold text-[#3538cd]">
                        Listed
                      </span>
                    </div>
                    <p className="mb-1 text-sm font-medium text-[#2a5af5]">
                      {org.organisationprimarytypecode || "Business"}
                    </p>
                    <p className="mb-3 flex items-start gap-1 text-sm text-slate-500">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden />
                      <span>
                        {org.organisationlocationname || org.organisationlocationcity}, {org.organisationlocationcity}
                        {org.organisationlocationstate ? ` • ${org.organisationlocationstate}` : ""}
                      </span>
                    </p>
                    {urls.fullUrl ? (
                      <>
                        <a
                          href={urls.fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mb-3 block truncate text-xs text-slate-500 hover:text-[#2a5af5]"
                        >
                          {urls.displayUrl}
                        </a>
                        <a
                          href={urls.fullUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-[6px] bg-[#528ff0] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3d7ae8]"
                        >
                          View profile &amp; book
                          <ArrowRight className="size-4 shrink-0" aria-hidden />
                        </a>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400">{urls.displayUrl}</p>
                    )}
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
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" aria-hidden />
                <Input
                  value={serviceSearchTerm}
                  onChange={(e) => setServiceSearchTerm(e.target.value)}
                  placeholder="Search services…"
                  className={cn("pl-10", exploreInputClass)}
                  aria-label="Search services"
                />
              </div>
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[#1a1a1a]">Pick a category</p>
                  <p className="text-xs text-[#667085]">Tap one to narrow the list</p>
                </div>
                {(selectedServicePrimaryType || selectedServiceSecondaryType || serviceSearchTerm) && (
                  <Button
                    onClick={clearServiceFilters}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[#2a5af5] hover:bg-[#eef4ff] hover:text-[#2a5af5]"
                  >
                    Clear
                  </Button>
                )}
              </div>
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
              {selectedServicePrimaryType && secondaryBusinessTypes.length > 0 ? (
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
              ) : null}
              {!isLoadingServices && filteredServices.length > 0 ? (
                <p className="text-xs text-[#667085]">
                  Showing {filteredServices.length} service{filteredServices.length === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>

            {/* Results */}
            {isLoadingServices ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="mr-3 h-8 w-8 animate-spin text-[#528ff0]" />
                <span className="text-[#667085]">Finding services…</span>
              </div>
            ) : filteredServices.length === 0 ? (
              <Card className={exploreCardClass}>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="mx-auto mb-4 h-12 w-12 text-[#98a2b3]" />
                  <h3 className="mb-2 text-lg font-medium text-[#1a1a1a]">
                    {serviceSearchTerm || selectedServicePrimaryType
                      ? "Nothing matched that search"
                      : "No services yet"}
                  </h3>
                  <p className="mb-4 text-[#667085]">
                    {serviceSearchTerm || selectedServicePrimaryType
                      ? "Try a shorter word, or tap Clear and browse."
                      : "Check back soon."}
                  </p>
                  {(serviceSearchTerm || selectedServicePrimaryType || selectedServiceSecondaryType) && (
                    <Button onClick={clearServiceFilters} variant="outline" className={exploreOutlineBtnClass}>
                      Clear
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filteredServices.map((service) => {
                  const place = [service.organisationLocationCity, service.organisationLocationState]
                    .filter(Boolean)
                    .join(", ");
                  const coverUrl = exploreServiceCardImageUrls[`${service.organisationid}-${service.id}`];
                  const starting = getServiceStartingPrice(service);
                  const durationLabel = service.timetaken ? `${service.timetaken} min` : null;
                  const priceLine =
                    service.show_price === false
                      ? durationLabel || null
                      : starting > 0
                        ? `₹${starting.toLocaleString("en-IN")}${durationLabel ? ` · ${durationLabel}` : ""}`
                        : durationLabel;
                  return (
                    <article
                      key={`${service.organisationid}-${service.id}`}
                      className="flex items-center gap-3 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white p-2.5 text-left shadow-none"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#f8fafc]">
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt=""
                            className="block h-full w-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#98a2b3]">
                            <Package className="size-5" aria-hidden />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {service.organisationName ? (
                          <p className="truncate text-[11px] font-medium text-[#98a2b3]">
                            {service.organisationName}
                          </p>
                        ) : null}
                        <div className="flex items-baseline gap-2">
                          <h3 className="m-0 truncate text-[14px] font-semibold text-[#1a1a1a]">
                            {service.Servicename || "Untitled"}
                          </h3>
                          {priceLine ? (
                            <p className="m-0 shrink-0 text-[12px] text-[#667085]">{priceLine}</p>
                          ) : null}
                        </div>
                        {place ? (
                          <p className="mt-0.5 truncate text-[12px] text-[#667085]">{place}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="inline-flex shrink-0 items-center gap-1 rounded-[6px] bg-[#528ff0] px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#3d7ae8]"
                        onClick={() => handleBookSlot(service.organisationid, service.organisationLocationId)}
                      >
                        Book
                        <ArrowRight className="size-3.5 shrink-0" aria-hidden />
                      </button>
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
                <Loader2 className="h-8 w-8 animate-spin mr-3 text-[#528ff0]" />
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredEvents.map((event) => {
                  const img = eventImageUrls[event.id]?.[0];
                  const soldOut =
                    event.slot_limit > 0 && (event.remainingslot ?? 0) <= 0;
                  return (
                    <article
                      key={event.id}
                      className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-none transition-colors hover:border-[#cfd8f0]"
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
                      <div className="flex min-w-0 flex-1 flex-col p-6">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <h3 className="min-w-0 flex-1 break-words text-xl font-semibold leading-snug text-zinc-900">
                            {event.event_name}
                          </h3>
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
                          className="mt-auto inline-flex w-fit items-center justify-center gap-2 rounded-[6px] bg-[#528ff0] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3d7ae8] disabled:pointer-events-none disabled:opacity-50"
                          onClick={() => handleBookEvent(event.id)}
                        >
                          {soldOut ? "Fully booked" : "Book Event"}
                          {!soldOut ? <ArrowRight className="size-4 shrink-0" aria-hidden /> : null}
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
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto rounded-2xl border border-[#e2e8f0] shadow-none">
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
                <div className="rounded-2xl border border-[#eef4ff] bg-[#eef4ff] p-3">
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
