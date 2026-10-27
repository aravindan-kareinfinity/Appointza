import { useState, useRef, useMemo, useEffect } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Check,
  Edit,
  Plus,
  Search,
  Trash,
  Loader2,
  Package,
  ArrowRight,
  Layers,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Upload,
  X,
  Camera,
  Ticket,
  ClipboardList,
  Save,
  LayoutGrid,
  List,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrganizationServices } from "@/hooks/useOrganizationServices";
import { OrganisationServices } from "@/models/organisationservices.model";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalId } from "@/contexts/GlobalIdContext";
import { useOrganisationLocationScope } from "@/hooks/useOrganisationLocationScope";
import { useEvents } from "@/hooks/useEvents";
import { useEventBookingForm } from "@/hooks/useEventBookingForm";
import { EventFormFieldsEditor } from "@/components/organization/EventFormFieldsEditor";
import { EventDetailsFormFields } from "@/components/organization/EventDetailsFormFields";
import { ServicePricingFields } from "@/components/organization/ServicePricingFields";
import { ResponsiveEditSheet } from "@/components/organization/ResponsiveEditSheet";
import {
  ComboEditorFields,
  ServiceEditorFields,
} from "@/components/organization/ServiceEditorFields";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";
import type { EventBookingFormField } from "@/utils/eventBookingFormFields.util";
import { ReferenceValue } from "@/models/referencevalue.model";
import { Event } from "@/models/event.model";
import { FilesService } from "@/services/files.service";
import { useOrganisationLocations } from "@/hooks/useOrganisationLocations";
import { getServicePriceSummary, getServiceStartingPrice } from "@/utils/servicePricing.util";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { useOrganisationCatalogOfferings } from "@/hooks/useOrganisationCatalogOfferings";
import { normalizeCatalogTab } from "@/utils/organisationCatalogOfferings.util";
import { onboardingStepRoute } from "@/utils/organizationOnboarding.util";
import {
  BUSINESS_CREATE_PATH,
  clearRegisterCreateReturn,
  isRegisterCreateFlow,
  readRegisterCreateReturn,
  stashRegisterCreateReturn,
} from "@/utils/businessOnboarding.util";
import { RegisterCreateSkipButton } from "@/components/onboarding/RegisterCreateSkipButton";
import { useOrgTemplateAssets } from "@/contexts/OrgTemplateAssetsContext";
import { compareDateOnly, isDateOnlyAfterToday, toDateOnlyString } from "@/utils/eventDate.util";
import {
  eventWhenBadge,
  formatOrganizationEventMetaLine,
  getEventDateBucket,
  parseTimeToMinutes,
  readEventEndTime,
  readEventStartTime,
  toTimeInputValue,
} from "@/utils/organizationEventDisplay.util";

const OrganizationServices = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const {
    isComplete,
    nextStep,
    refetch: refetchOnboarding,
  } = useOnboardingStatus();
  const { user, isAuthenticated, userType } = useAuth();
  const { id: globalLocationId, setId: setGlobalLocationId } = useGlobalId();
  const organizationId = user?.organisationid ?? 0;
  /** Register Screen 5: same services UI as production; return path is in sessionStorage. */
  const isRegisterOnboarding =
    searchParams.get("onboarding") === "1" || isRegisterCreateFlow();
  const {
    offerings: catalogOfferings,
    offersServices,
    offersEvents,
    offersRooms,
    isLoading: isLoadingCatalogOfferings,
  } = useOrganisationCatalogOfferings(organizationId);
  const { locationId: scopedLocationId, locationLabel: scopedLocationLabel } =
    useOrganisationLocationScope(organizationId);
  type CatalogTab = "services" | "events" | "rooms";
  const kindFromUrl = searchParams.get("kind");
  const [activeTab, setActiveTabState] = useState<CatalogTab>(() =>
    normalizeCatalogTab(kindFromUrl, ["services", "events", "rooms"]),
  );

  const setActiveTab = (tab: CatalogTab) => {
    if (!catalogOfferings.includes(tab)) return;
    setActiveTabState(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("kind", tab);
        if (tab !== "rooms") next.delete("roomId");
        return next;
      },
      { replace: true },
    );
  };

  // Legacy ?onboarding=1&return=… → clean production URL (return kept in sessionStorage).
  useEffect(() => {
    if (searchParams.get("onboarding") !== "1") return;
    const returnTo = searchParams.get("return");
    const kind = searchParams.get("kind") || "services";
    stashRegisterCreateReturn(
      returnTo && returnTo.startsWith("/") ? returnTo : BUSINESS_CREATE_PATH,
      kind === "events" ? "events" : kind === "services" ? "services" : undefined,
    );
    navigate(`/organization/services?kind=${encodeURIComponent(kind)}`, { replace: true });
  }, [searchParams, navigate]);

  useEffect(() => {
    if (isLoadingCatalogOfferings || organizationId <= 0) return;
    const normalized = normalizeCatalogTab(kindFromUrl, catalogOfferings);
    if (activeTab !== normalized) {
      setActiveTabState(normalized);
    }
    if (kindFromUrl !== normalized) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("kind", normalized);
          if (normalized !== "rooms") next.delete("roomId");
          return next;
        },
        { replace: true },
      );
    } else if (!kindFromUrl) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("kind", normalized);
          return next;
        },
        { replace: true },
      );
    }
  }, [
    kindFromUrl,
    catalogOfferings,
    isLoadingCatalogOfferings,
    organizationId,
    activeTab,
    setSearchParams,
  ]);

  const [selectedLocationId, setSelectedLocationId] = useState<number>(0);
  const { data: locationsData } = useOrganisationLocations({
    organisationId: organizationId,
    staffLocationId: user?.locationid || 0,
    enabled: !!organizationId,
  });
  const locations = locationsData ?? [];
  const filesService = useMemo(() => new FilesService(), []);

  useEffect(() => {
    if (locations.length > 0 && selectedLocationId === 0) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  const organisationDisplayName = useMemo(() => {
    try {
      const raw = localStorage.getItem("user_context");
      if (!raw) return "Your business";
      const parsed = JSON.parse(raw) as { organisationname?: string };
      return parsed.organisationname?.trim() || "Your business";
    } catch {
      return "Your business";
    }
  }, []);

  // Event image upload state
  const [eventImages, setEventImages] = useState<number[]>([]);

  // Service image upload state (stored in OrganisationServices.attributes.ImageIds)
  const [serviceImages, setServiceImages] = useState<number[]>([]);
  const { registerFileIds } = useOrgTemplateAssets();

  const syncImagesToAssets = async (ids: number[]) => {
    const unique = ids.map(Number).filter((id) => id > 0);
    if (!unique.length) return;
    try {
      await registerFileIds(unique);
    } catch (error) {
      console.error("Failed to sync images into Assets library:", error);
    }
  };

  // Events state - use globalLocationId from GlobalIdContext
  const eventLocationId = globalLocationId ? Number(globalLocationId) : undefined;
  const serviceLocationId = eventLocationId;
  const {
    events,
    isLoading: isLoadingEvents,
    createEventAsync,
    updateEvent,
    deleteEvent,
    isCreating: isCreatingEvent,
    isUpdating: isUpdatingEvent,
    isDeleting: isDeletingEvent,
  } = useEvents(organizationId, eventLocationId, {
    enabled: offersEvents && activeTab === "events",
  });

  const {
    loadFormForEvent,
    saveFormForEvent,
    isLoading: isLoadingBookingForm,
    isSaving: isSavingBookingForm,
  } = useEventBookingForm(organizationId);

  const organizationEventCardImageUrls = useMemo(() => {
    const map: Record<number, string | undefined> = {};
    for (const ev of events) {
      const firstId = ev.images?.ImageIds?.find((id) => id > 0);
      if (firstId) map[ev.id] = filesService.getImageUrl(firstId);
    }
    return map;
  }, [events, filesService]);

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [event, setEvent] = useState<Event>(new Event());
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [addEventStep, setAddEventStep] = useState<"details" | "booking">("details");
  const [showEventBookingPanel, setShowEventBookingPanel] = useState(false);
  const [bookingFormEventId, setBookingFormEventId] = useState(0);
  const [bookingFormEventName, setBookingFormEventName] = useState("");
  const [eventBookingFormFields, setEventBookingFormFields] = useState<EventBookingFormField[]>([]);
  const [existingBookingFormValue, setExistingBookingFormValue] = useState<ReferenceValue | null>(null);
  const [showEditEventForm, setShowEditEventForm] = useState(false);
  const [eventSearchTerm, setEventSearchTerm] = useState("");
  const [eventDateFilter, setEventDateFilter] = useState<"all" | "past" | "today" | "future">("all");
  const [eventPublicFilter, setEventPublicFilter] = useState<"all" | "public" | "private">("all");
  /** Card is default; table matches Razorpay Customers-style list. */
  const [catalogListView, setCatalogListView] = useState<"card" | "table">(() => {
    try {
      const saved = sessionStorage.getItem("org_catalog_list_view");
      return saved === "table" ? "table" : "card";
    } catch {
      return "card";
    }
  });

  const setCatalogView = (view: "card" | "table") => {
    setCatalogListView(view);
    try {
      sessionStorage.setItem("org_catalog_list_view", view);
    } catch {
      /* ignore */
    }
  };
  const [deleteConfirm, setDeleteConfirm] = useState<
    | { kind: "service"; id: number; name: string }
    | { kind: "event"; id: number; name: string }
    | null
  >(null);

  console.log("OrganizationServices: isAuthenticated =", isAuthenticated);
  console.log("OrganizationServices: userType =", userType);
  console.log("OrganizationServices: user =", user);
  console.log("OrganizationServices: organizationId =", organizationId);

  const {
    services,
    isLoading,
    createServiceAsync,
    updateService,
    deleteService,
    isCreating,
    isUpdating,
    isDeleting,
  } = useOrganizationServices(organizationId, serviceLocationId, {
    enabled: offersServices && activeTab === "services",
  });

  const organizationServiceCardImageUrls = useMemo(() => {
    const map: Record<number, string | undefined> = {};
    for (const svc of services) {
      const firstId = svc.attributes?.ImageIds?.find((id) => id > 0);
      if (firstId) map[svc.id] = filesService.getImageUrl(firstId);
    }
    return map;
  }, [services, filesService]);

  const [searchTerm, setSearchTerm] = useState("");
  const [editingService, setEditingService] =
    useState<OrganisationServices | null>(null);
  const [service, setService] = useState<OrganisationServices>(
    new OrganisationServices()
  );
  const [selectedComboServices, setSelectedComboServices] = useState<
    OrganisationServices[]
  >([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showComboForm, setShowComboForm] = useState(false);
  const [serviceFormError, setServiceFormError] = useState("");

  const openServiceForm = (
    item?: OrganisationServices,
    isCombo: boolean = false
  ) => {
    setServiceFormError("");
    const newService = item ? { ...item } : new OrganisationServices();
    // Load existing images from attributes
    setServiceImages(item?.attributes?.ImageIds || []);

    // Initialize weekday_price and weekend_price if not set
    if (!newService.weekday_price || newService.weekday_price === 0) {
      newService.weekday_price = newService.prize || 0;
    }
    if (!newService.weekend_price || newService.weekend_price === 0) {
      newService.weekend_price = newService.prize || 0;
    }

    // Determine if this is a combo based on item or isCombo parameter
    const isComboService = isCombo || item?.Iscombo === true;

    if (isComboService) {
      newService.Iscombo = true;
      if (!newService.servicesids) {
        newService.servicesids = { combolist: [] };
      }
      if (!newService.servicesids.combolist) {
        newService.servicesids.combolist = [];
      }
      // Combos always use same price
      newService.is_price_different = false;
    }

    setService(newService);
    setSelectedComboServices(
      isComboService && item && item.servicesids?.combolist
        ? services.filter((s) =>
            item.servicesids.combolist?.some((c) => c.id === s.id)
          )
        : []
    );

    if (item) {
      setEditingService(item);
      if (isComboService) {
        setShowComboForm(true);
        setShowEditForm(false);
        setShowAddForm(false);
      } else {
        setShowEditForm(true);
        setShowAddForm(false);
        setShowComboForm(false);
      }
    } else {
      setEditingService(null);
      if (isComboService) {
        setShowComboForm(true);
        setShowAddForm(false);
        setShowEditForm(false);
      } else {
        setShowAddForm(true);
        setShowEditForm(false);
        setShowComboForm(false);
      }
    }
  };

  const handleSaveService = async () => {
    if (!validateService()) return;

    try {
      const serviceToSave = prepareServiceForSave();
      await syncImagesToAssets(serviceImages);

      if (editingService) {
        // Ensure we preserve the ID and version when editing
        serviceToSave.id = editingService.id;
        serviceToSave.version = editingService.version || 1;
        serviceToSave.createdby = editingService.createdby || user?.id || 0;
        serviceToSave.createdon = editingService.createdon || new Date();

        updateService(serviceToSave);
        setEditingService(null);
        setShowEditForm(false);
        setShowComboForm(false);
        setService(new OrganisationServices());
        setSelectedComboServices([]);
        setServiceImages([]);
      } else {
        const wasFirstService = services.length === 0;
        await createServiceAsync(serviceToSave);
        setShowAddForm(false);
        setShowComboForm(false);
        setService(new OrganisationServices());
        setSelectedComboServices([]);
        setServiceImages([]);

        if (isRegisterOnboarding || isRegisterCreateFlow()) {
          // Opened from Screen 5 — return so the router can open the next item / website.
          await refetchOnboarding();
          const returnTo =
            readRegisterCreateReturn() ||
            (searchParams.get("return")?.startsWith("/")
              ? searchParams.get("return")!
              : "/register/create");
          clearRegisterCreateReturn();
          navigate(returnTo, { replace: true });
        } else if (!isComplete && wasFirstService) {
          await refetchOnboarding();
          navigate(
            onboardingStepRoute(
              "website",
              selectedLocationId > 0 ? selectedLocationId : undefined,
            ),
          );
        }
      }
    } catch (error) {
      console.error("Error saving service:", error);
      setServiceFormError("Failed to save service. Please try again.");
    }
  };

  const failServiceValidation = (message: string): boolean => {
    setServiceFormError(message);
    return false;
  };

  const validateService = (): boolean => {
    setServiceFormError("");

    if (!service.Servicename.trim()) {
      return failServiceValidation("Please enter a service name");
    }

    if (service.Iscombo && selectedComboServices.length < 2) {
      return failServiceValidation("A combo must include at least 2 services");
    }

    // For combos, price is calculated from selected services, so skip price validation
    // For individual services, validate price
    if (!service.Iscombo) {
      if (!service.is_price_different) {
        // Same price for all days
        if (service.prize <= 0) {
          return failServiceValidation("Price must be greater than 0");
        }
      } else {
        // Different prices for weekdays/weekends
        if (!service.weekday_price || service.weekday_price <= 0) {
          return failServiceValidation("Weekday price must be greater than 0");
        }
        if (!service.weekend_price || service.weekend_price <= 0) {
          return failServiceValidation("Weekend price must be greater than 0");
        }
      }
    }

    // Offer price is optional. If provided, it must be > 0.
    // Offer price only when same price all days
    if (service.is_price_different && service.offerprize > 0) {
      return failServiceValidation("Offer price is only available when same price applies all week");
    }

    if (service.offerprize && service.offerprize < 0) {
      return failServiceValidation("Offer price must be 0 or greater");
    }

    // Validate duration
    if (!service.timetaken || service.timetaken <= 0) {
      return failServiceValidation("Please enter a valid duration in minutes");
    }

    return true;
  };

  const prepareServiceForSave = (): OrganisationServices => {
    const serviceToSave = { ...service };
    serviceToSave.organisationid = organizationId;
    serviceToSave.organisationlocationid = serviceLocationId || selectedLocationId || 0;
    serviceToSave.isactive = true;
    serviceToSave.attributes = {
      ...(serviceToSave.attributes || {}),
      ImageIds: serviceImages,
    };

    // Only set createdby/createdon for new services
    if (!editingService) {
      serviceToSave.createdby = user?.id || 0;
      serviceToSave.createdon = new Date();
    } else {
      // Preserve original createdby/createdon when editing
      serviceToSave.createdby = editingService.createdby || user?.id || 0;
      serviceToSave.createdon = editingService.createdon || new Date();
    }

    // Always set modifiedby/modifiedon
    serviceToSave.modifiedby = user?.id || 0;
    serviceToSave.modifiedon = new Date();

    // weekday_price always mirrors Mon–Fri / single price field
    serviceToSave.weekday_price = serviceToSave.prize;

    if (!serviceToSave.is_price_different) {
      serviceToSave.weekend_price = serviceToSave.prize;
    } else {
      if (!serviceToSave.weekend_price || serviceToSave.weekend_price <= 0) {
        serviceToSave.weekend_price = serviceToSave.prize;
      }
      // Offer does not apply when weekday/weekend prices differ
      serviceToSave.offerprize = 0;
    }

    if (serviceToSave.Iscombo) {
      // Calculate combo price as sum of selected services
      const totalPrice = selectedComboServices.reduce(
        (sum, s) => sum + s.prize,
        0
      );
      serviceToSave.prize = totalPrice;

      // Offer price is optional for combos too.
      if (!serviceToSave.offerprize || serviceToSave.offerprize <= 0) {
        serviceToSave.offerprize = 0;
      }

      // For combos, keep same price for weekdays/weekends
      serviceToSave.is_price_different = false;
      serviceToSave.weekday_price = totalPrice;
      serviceToSave.weekend_price = totalPrice;

      // Update combo list
      serviceToSave.servicesids.combolist = selectedComboServices.map((s) => ({
        id: s.id,
        servicename: s.Servicename,
      }));
    }

    return serviceToSave;
  };

  const handleComboSelection = (items: OrganisationServices[]) => {
    setSelectedComboServices(items);

    const totalPrice = items.reduce((sum, item) => sum + item.prize, 0);
    setService((prev) => ({
      ...prev,
      prize: totalPrice,
    }));
  };

  const requestDeleteService = (serviceItem: OrganisationServices) => {
    setDeleteConfirm({
      kind: "service",
      id: serviceItem.id,
      name: serviceItem.Servicename,
    });
  };

  const requestDeleteEvent = (eventItem: Event) => {
    setDeleteConfirm({
      kind: "event",
      id: eventItem.id,
      name: eventItem.event_name,
    });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.kind === "service") {
      deleteService(deleteConfirm.id);
    } else {
      deleteEvent(deleteConfirm.id);
    }
    setDeleteConfirm(null);
  };

  const filteredServices = services.filter(
    (service) =>
      service.Servicename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Event handlers
  const resetEventFlow = () => {
    setShowAddEventForm(false);
    setShowEditEventForm(false);
    setShowEventBookingPanel(false);
    setAddEventStep("details");
    setBookingFormEventId(0);
    setBookingFormEventName("");
    setEventBookingFormFields([]);
    setExistingBookingFormValue(null);
    setEvent(new Event());
    setEventImages([]);
    setEditingEvent(null);
  };

  const closeServiceForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setShowComboForm(false);
    setEditingService(null);
    setService(new OrganisationServices());
    setSelectedComboServices([]);
    setServiceImages([]);
    setServiceFormError("");
  };

  const openEventBookingForm = async (eventItem: Event) => {
    setShowAddEventForm(false);
    setShowEditEventForm(false);
    setShowEventBookingPanel(true);
    setBookingFormEventId(eventItem.id);
    setBookingFormEventName(eventItem.event_name);

    const { fields, existing } = await loadFormForEvent(eventItem.id);
    setEventBookingFormFields(fields);
    setExistingBookingFormValue(existing);
  };

  const handleSaveEventBookingForm = async () => {
    if (!bookingFormEventId) return;

    try {
      await saveFormForEvent(
        bookingFormEventId,
        bookingFormEventName,
        eventBookingFormFields,
        existingBookingFormValue,
      );

      toast({
        title: existingBookingFormValue ? "Booking form updated" : "Booking form saved",
        description: `Guests booking “${bookingFormEventName}” will see these questions.`,
      });

      resetEventFlow();
    } catch (error) {
      console.error("Error saving booking form:", error);
      toast({
        title: "Error",
        description: "Failed to save booking form. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openEventForm = (item?: Event) => {
    if (item) {
      setEditingEvent(item);
      setEvent({
        ...item,
        event_date: toDateOnlyString(item.event_date),
        from_date: toDateOnlyString(item.from_date),
        to_date: toDateOnlyString(item.to_date),
        timing_config: item.timing_config || new Event.TimingConfigData(),
      });
      // Load existing images
      setEventImages(item.images?.ImageIds || []);
      setShowEditEventForm(true);
      setShowAddEventForm(false);
    } else {
      const newEvent = new Event();
      newEvent.organisation_id = organizationId;
      newEvent.organisation_location_id = eventLocationId || 0;
      newEvent.event_type = "single";
      newEvent.payment_type = "userpay";
      newEvent.status = "active";
      newEvent.is_public = true;
      newEvent.timing_config = new Event.TimingConfigData();
      setEvent(newEvent);
      setEventImages([]);
      setShowAddEventForm(true);
      setShowEditEventForm(false);
      setShowEventBookingPanel(false);
      setAddEventStep("details");
      setBookingFormEventId(0);
      setBookingFormEventName("");
      setEventBookingFormFields([]);
      setExistingBookingFormValue(null);
      setEditingEvent(null);
    }
  };

  const handleSaveEvent = async () => {
    if (!validateEvent()) return;

    try {
      const eventToSave = prepareEventForSave();
      await syncImagesToAssets(eventImages);

      if (editingEvent) {
        updateEvent(eventToSave);
        setEditingEvent(null);
        setShowEditEventForm(false);
        setEventImages([]);
        toast({
          title: "Event updated",
          description: "Your event has been saved.",
        });
      } else {
        const savedEvent = await createEventAsync(eventToSave);
        const eventId = savedEvent?.id ?? 0;
        const eventName = savedEvent?.event_name || eventToSave.event_name || "Event";

        if (eventId > 0) {
          setBookingFormEventId(eventId);
          setBookingFormEventName(eventName);
          setAddEventStep("booking");
          const { fields, existing } = await loadFormForEvent(eventId);
          setEventBookingFormFields(fields);
          setExistingBookingFormValue(existing);

          toast({
            title: "Event created",
            description: "Add the questions guests answer when booking.",
          });
        } else {
          resetEventFlow();
        }
      }
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Error",
        description: "Failed to save event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const validateEvent = (): boolean => {
    if (!event.event_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an event name",
        variant: "destructive",
      });
      return false;
    }

    if (!event.event_type) {
      toast({
        title: "Validation Error",
        description: "Please select an event type",
        variant: "destructive",
      });
      return false;
    }

    if (event.event_type === "single" && !event.event_date) {
      toast({
        title: "Validation Error",
        description: "Please select an event date for single events",
        variant: "destructive",
      });
      return false;
    }

    // Validate single event date is in the future
    if (event.event_type === "single" && event.event_date) {
      if (!isDateOnlyAfterToday(event.event_date)) {
        toast({
          title: "Validation Error",
          description: "Event date must be a future date",
          variant: "destructive",
        });
        return false;
      }
    }

    if (event.event_type === "range" && (!event.from_date || !event.to_date)) {
      toast({
        title: "Validation Error",
        description: "Please select both from and to dates for range events",
        variant: "destructive",
      });
      return false;
    }

    // Validate range event dates are in the future
    if (event.event_type === "range" && event.from_date && event.to_date) {
      if (!isDateOnlyAfterToday(event.from_date)) {
        toast({
          title: "Validation Error",
          description: "From date must be a future date",
          variant: "destructive",
        });
        return false;
      }

      if (!isDateOnlyAfterToday(event.to_date)) {
        toast({
          title: "Validation Error",
          description: "To date must be a future date",
          variant: "destructive",
        });
        return false;
      }

      if (compareDateOnly(event.to_date, event.from_date) < 0) {
        toast({
          title: "Validation Error",
          description: "To date must be after or equal to from date",
          variant: "destructive",
        });
        return false;
      }
    }

    // Validate Location is mandatory
    if (!event.location || !event.location.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an event location",
        variant: "destructive",
      });
      return false;
    }

    if (event.entry_amount < 0) {
      toast({
        title: "Validation Error",
        description: "Entry amount cannot be negative",
        variant: "destructive",
      });
      return false;
    }

    const startTime = readEventStartTime(event);
    const endTime = readEventEndTime(event);
    if (!startTime || !endTime) {
      toast({
        title: "Validation Error",
        description: "Please enter both start time and end time",
        variant: "destructive",
      });
      return false;
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    if (startMinutes != null && endMinutes != null && endMinutes <= startMinutes) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const prepareEventForSave = (): Event => {
    const eventToSave = { ...event };
    eventToSave.organisation_id = organizationId;
    eventToSave.organisation_location_id = eventLocationId || 0;
    eventToSave.created_by = user?.id || 0;
    eventToSave.images = { ...eventToSave.images, ImageIds: eventImages };
    eventToSave.start_time = toTimeInputValue(readEventStartTime(event));
    eventToSave.end_time = toTimeInputValue(readEventEndTime(event));
    // When creating a new event, set remainingslot equal to slot_limit
    if (!editingEvent) {
      eventToSave.remainingslot = eventToSave.slot_limit || 0;
    }
    return eventToSave;
  };

  const handleEnableClick = () => {
    if (!isComplete && nextStep) {
      navigate(onboardingStepRoute(nextStep));
      return;
    }
    navigate("/organization/dashboard");
  };

  const filteredEvents = events.filter((eventItem) => {
    const searchValue = eventSearchTerm.toLowerCase();
    const matchesSearch =
      eventItem.event_name.toLowerCase().includes(searchValue) ||
      (eventItem.description || "").toLowerCase().includes(searchValue) ||
      (eventItem.location || "").toLowerCase().includes(searchValue);

    if (!matchesSearch) return false;

    if (eventDateFilter !== "all" && getEventDateBucket(eventItem) !== eventDateFilter) {
      return false;
    }

    if (eventPublicFilter === "public" && !eventItem.is_public) return false;
    if (eventPublicFilter === "private" && eventItem.is_public) return false;

    return true;
  });

  if (
    !isLoadingCatalogOfferings &&
    (kindFromUrl === "rooms" || (offersRooms && !offersServices && !offersEvents))
  ) {
    const next = new URLSearchParams();
    next.set("section", "room-status");
    const roomId = searchParams.get("roomId");
    if (roomId) next.set("roomId", roomId);
    return <Navigate to={`/organization/hospitality?${next.toString()}`} replace />;
  }

  if (!isAuthenticated) {
    console.log(
      "OrganizationServices: Not authenticated, showing auth required message"
    );
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-stone-600">Please log in to access this page.</p>
          <p className="text-sm text-stone-500 mt-2">
            Debug: isAuthenticated = {String(isAuthenticated)}, userType ={" "}
            {userType}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading services...</span>
      </div>
    );
  }

  return (
    <div className="org-page">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as CatalogTab)}
          className="w-full"
        >
          {/* Tabs + primary action in one row */}
          <div className="org-panel-section px-6 md:px-8 py-4 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {catalogOfferings.length > 1 ? (
              <TabsList className="flex w-full max-w-full overflow-x-auto rounded-xl border border-stone-200 bg-white p-1 shadow-none sm:w-auto">
                {offersServices ? (
                <TabsTrigger
                  value="services"
                  className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-stone-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Services
                </TabsTrigger>
                ) : null}
                {offersEvents ? (
                <TabsTrigger
                  value="events"
                  className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-stone-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Events
                </TabsTrigger>
                ) : null}
              </TabsList>
              ) : (
                <p className="text-sm font-semibold text-appointza-navy">
                  {offersServices ? "Services" : "Events"}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="inline-flex h-8 overflow-hidden rounded-md border border-[#e6eaf0] bg-white">
                  <button
                    type="button"
                    onClick={() => setCatalogView("card")}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 px-2.5 text-[12px] font-medium",
                      catalogListView === "card"
                        ? "bg-[#f2f4f7] text-[#1a1a1a]"
                        : "text-[#667085] hover:bg-[#f8fafc]",
                    )}
                    aria-pressed={catalogListView === "card"}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogView("table")}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 border-l border-[#e6eaf0] px-2.5 text-[12px] font-medium",
                      catalogListView === "table"
                        ? "bg-[#f2f4f7] text-[#1a1a1a]"
                        : "text-[#667085] hover:bg-[#f8fafc]",
                    )}
                    aria-pressed={catalogListView === "table"}
                  >
                    <List className="h-3.5 w-3.5" />
                    Table
                  </button>
                </div>

                {!showAddForm &&
                !showEditForm &&
                !showComboForm &&
                !showAddEventForm &&
                !showEditEventForm &&
                !showEventBookingPanel ? (
                  <RegisterCreateSkipButton
                    fallbackOffering={activeTab === "events" ? "events" : "services"}
                  />
                ) : null}

                {activeTab === "services" ? (
                  <>
                    {services.length >= 2 && !showAddForm && !showEditForm && !showComboForm && (
                      <Button
                        variant="outline"
                        onClick={() => openServiceForm(undefined, true)}
                        className={cn(org.btnOutline, "h-8")}
                      >
                        <Layers className="mr-1.5 h-3.5 w-3.5" />
                        Create Combo
                      </Button>
                    )}
                    {!showAddForm && !showEditForm && !showComboForm && (
                      <Button
                        onClick={() => {
                          setShowAddForm(true);
                          setShowEditForm(false);
                          setShowComboForm(false);
                          setService(new OrganisationServices());
                        }}
                        className={cn(org.btnPrimary, "h-8")}
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add Service
                      </Button>
                    )}
                  </>
                ) : activeTab === "events" &&
                  !showAddEventForm &&
                  !showEditEventForm &&
                  !showEventBookingPanel ? (
                  <Button onClick={() => openEventForm()} className={cn(org.btnPrimary, "h-8")}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Event
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <TabsContent value="services" className="mt-0 px-6 md:px-8 py-6 space-y-6 focus-visible:outline-none">
            {/* Search row (actions live in the top segmented header) */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 w-full rounded-xl border-stone-200 bg-white py-2.5 pl-11 pr-4 shadow-none focus-visible:border-blue-500 focus-visible:ring-blue-100"
                />
              </div>
            </div>

            {/* Services List */}
            <div className="space-y-4">
                {filteredServices.length === 0 ? (
                  <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-none">
                    <Package className="h-12 w-12 mx-auto text-zinc-400 mb-2" aria-hidden />
                    <h3 className="text-lg font-semibold text-appointza-navy">No services available</h3>
                    <p className="text-stone-600 text-sm mb-4">Add your first service to get started!</p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        onClick={() => openServiceForm(undefined, false)}
                        className="rounded-xl border border-stone-200 bg-white text-appointza-navy shadow-none hover:border-blue-300 hover:bg-blue-50"
                        variant="outline"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Service
                      </Button>
                      <RegisterCreateSkipButton
                        fallbackOffering="services"
                        className="h-auto rounded-xl border-stone-200 bg-white text-appointza-navy shadow-none hover:border-blue-300 hover:bg-blue-50"
                      />
                    </div>
                  </div>
                ) : catalogListView === "table" ? (
                  <div className="overflow-hidden rounded-lg border border-[#e6eaf0] bg-white">
                    <p className="border-b border-[#eef1f5] px-4 py-2.5 text-[12px] text-[#667085]">
                      Showing {filteredServices.length} of {filteredServices.length} services
                    </p>
                    <div className="overflow-x-auto">
                      <Table className="min-w-[720px]">
                        <TableHeader>
                          <TableRow className="border-[#eef1f5] bg-[#f8fafc] hover:bg-[#f8fafc]">
                            <TableHead className="h-9 px-4 text-[12px] font-medium text-[#667085]">
                              Service
                            </TableHead>
                            <TableHead className="h-9 px-4 text-[12px] font-medium text-[#667085]">
                              Type
                            </TableHead>
                            <TableHead className="h-9 px-4 text-[12px] font-medium text-[#667085]">
                              Duration
                            </TableHead>
                            <TableHead className="h-9 px-4 text-[12px] font-medium text-[#667085]">
                              Price
                            </TableHead>
                            <TableHead className="h-9 w-12 px-2" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredServices.map((serviceItem) => {
                            const s = getServicePriceSummary(serviceItem);
                            const priceLabel =
                              serviceItem.show_price === false
                                ? "Hidden"
                                : s.offer > 0 && s.offer < Math.min(s.weekday || s.offer, s.weekend || s.offer)
                                  ? `₹${s.offer.toLocaleString("en-IN")}`
                                  : s.different
                                    ? `₹${s.weekday.toLocaleString("en-IN")} · ₹${s.weekend.toLocaleString("en-IN")}`
                                    : `₹${s.weekday.toLocaleString("en-IN")}`;
                            return (
                              <TableRow
                                key={serviceItem.id}
                                className="border-[#eef1f5] hover:bg-[#fafbfc]"
                              >
                                <TableCell className="px-4 py-3">
                                  <p className="text-[13px] font-medium text-[#1a1a1a]">
                                    {serviceItem.Servicename || "—"}
                                  </p>
                                  {serviceItem.notes?.trim() ? (
                                    <p className="mt-0.5 line-clamp-1 text-[12px] text-[#667085]">
                                      {serviceItem.notes}
                                    </p>
                                  ) : null}
                                </TableCell>
                                <TableCell className="px-4 py-3 text-[13px] text-[#344054]">
                                  {serviceItem.Iscombo ? "Combo" : "Service"}
                                </TableCell>
                                <TableCell className="px-4 py-3 text-[13px] text-[#344054]">
                                  {serviceItem.timetaken ? `${serviceItem.timetaken} min` : "—"}
                                </TableCell>
                                <TableCell className="px-4 py-3 text-[13px] tabular-nums text-[#1a1a1a]">
                                  {priceLabel}
                                </TableCell>
                                <TableCell className="px-2 py-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="flex h-7 w-7 items-center justify-center rounded-md text-[#667085] hover:bg-[#f2f4f7]"
                                        aria-label="More actions"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                      <DropdownMenuItem
                                        onClick={() =>
                                          openServiceForm(serviceItem, serviceItem.Iscombo)
                                        }
                                      >
                                        <Edit className="mr-2 h-3.5 w-3.5" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-[#b42318] focus:text-[#b42318]"
                                        onClick={() => requestDeleteService(serviceItem)}
                                      >
                                        <Trash className="mr-2 h-3.5 w-3.5" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-[12px] text-[#667085]">
                      Showing {filteredServices.length} of {filteredServices.length} services
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {filteredServices.map((serviceItem) => {
                        const notes =
                          serviceItem.notes?.trim() ||
                          (serviceItem.Iscombo && serviceItem.servicesids?.combolist?.length
                            ? `Includes: ${serviceItem.servicesids.combolist
                                .map((c) => c.servicename)
                                .join(", ")}`
                            : "");
                        const coverUrl = organizationServiceCardImageUrls[serviceItem.id];
                        const starting = getServiceStartingPrice(serviceItem);
                        const durationLabel = serviceItem.timetaken
                          ? `${serviceItem.timetaken} min`
                          : null;
                        const priceLine =
                          serviceItem.show_price === false
                            ? durationLabel || "Price hidden"
                            : starting > 0
                              ? `₹${starting.toLocaleString("en-IN")}${durationLabel ? ` · ${durationLabel}` : ""}`
                              : durationLabel || "Set price";

                        return (
                          <article
                            key={serviceItem.id}
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
                              <div className="flex items-baseline gap-2">
                                <h3 className="m-0 truncate text-[14px] font-semibold text-[#1a1a1a]">
                                  {serviceItem.Servicename || "Untitled"}
                                  {serviceItem.Iscombo ? (
                                    <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-[#2a5af5]">
                                      Combo
                                    </span>
                                  ) : null}
                                </h3>
                                <p className="m-0 shrink-0 text-[12px] text-[#667085]">{priceLine}</p>
                              </div>
                              {notes ? (
                                <p className="mt-0.5 line-clamp-1 text-[12px] text-[#667085]">{notes}</p>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-[6px] bg-[#528ff0] px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#3d7ae8]"
                                onClick={() => openServiceForm(serviceItem, serviceItem.Iscombo)}
                              >
                                Edit
                                <ArrowRight className="size-3.5 shrink-0" aria-hidden />
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-[6px] border border-[#e2e8f0] bg-white p-2 text-[#667085] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                aria-label="Delete service"
                                onClick={() => requestDeleteService(serviceItem)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                                ) : (
                                  <Trash className="size-3.5" aria-hidden />
                                )}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
          </TabsContent>

          <TabsContent value="events" className="mt-0 px-6 md:px-8 py-6 space-y-6 focus-visible:outline-none">
            <div className="space-y-4">
                <div className="flex w-full flex-col lg:flex-row lg:items-center gap-4 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                    <Input
                      placeholder="Search events..."
                      value={eventSearchTerm}
                      onChange={(e) => setEventSearchTerm(e.target.value)}
                      className="h-12 w-full rounded-xl border-stone-200 bg-white py-3 pl-11 pr-4 shadow-none focus-visible:border-blue-500 focus-visible:ring-blue-100"
                    />
                  </div>
                  <div className="flex w-full flex-col sm:flex-row gap-3 sm:w-auto shrink-0">
                    <div className="w-full sm:w-44">
                      <Select
                        value={eventDateFilter}
                        onValueChange={(value) =>
                          setEventDateFilter(value as "all" | "past" | "today" | "future")
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white shadow-none">
                          <SelectValue placeholder="Filter by date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All dates</SelectItem>
                          <SelectItem value="past">Past</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="future">Future</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-full sm:w-44">
                      <Select
                        value={eventPublicFilter}
                        onValueChange={(value) =>
                          setEventPublicFilter(value as "all" | "public" | "private")
                        }
                      >
                        <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white shadow-none">
                          <SelectValue placeholder="Visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All visibility</SelectItem>
                          <SelectItem value="public">Public only</SelectItem>
                          <SelectItem value="private">Private only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {isLoadingEvents ? (
                  <div className="flex h-64 items-center justify-center rounded-xl border border-stone-200 bg-white shadow-none">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" aria-hidden />
                    <span className="ml-3 text-stone-600">Loading events…</span>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <Card className="rounded-2xl border-stone-200 bg-white shadow-none">
                    <CardContent className="py-14 text-center">
                      <Calendar className="h-14 w-14 mx-auto text-zinc-300 mb-4" aria-hidden />
                      <h3 className="text-lg font-semibold mb-2 text-appointza-navy">No events found</h3>
                      <p className="text-stone-600 mb-6 text-sm">
                        Try changing search, date, or visibility filters, or add a new event.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                          onClick={() => openEventForm()}
                          className="rounded-xl bg-blue-600 text-white shadow-none hover:bg-blue-700"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Event
                        </Button>
                        <RegisterCreateSkipButton
                          fallbackOffering="events"
                          className="h-auto rounded-xl border-stone-200 bg-white text-appointza-navy shadow-none hover:border-blue-300 hover:bg-blue-50"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : catalogListView === "table" ? (
                  <div className="overflow-hidden rounded-lg border border-[#e6eaf0] bg-white">
                    <p className="border-b border-[#eef1f5] px-4 py-2.5 text-[12px] text-[#667085]">
                      Showing {filteredEvents.length} of {filteredEvents.length} events
                    </p>
                    <div className="overflow-x-auto">
                      <Table className="min-w-[860px]">
                        <TableHeader>
                          <TableRow className="border-[#eef1f5] bg-[#f8fafc] hover:bg-[#f8fafc]">
                            <TableHead className="h-9 px-4 text-[12px] font-medium text-[#667085]">
                              Event
                            </TableHead>
                            <TableHead className="h-9 px-4 text-[12px] font-medium text-[#667085]">
                              When
                            </TableHead>
                            <TableHead className="h-9 px-4 text-[12px] font-medium text-[#667085]">
                              Status
                            </TableHead>
                            <TableHead className="h-9 px-4 text-[12px] font-medium text-[#667085]">
                              Entry
                            </TableHead>
                            <TableHead className="h-9 px-4 text-[12px] font-medium text-[#667085]">
                              Slots
                            </TableHead>
                            <TableHead className="h-9 w-12 px-2" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEvents.map((eventItem) => {
                            const whenBucket = getEventDateBucket(eventItem);
                            const whenBadge = eventWhenBadge(whenBucket);
                            const metaLine = formatOrganizationEventMetaLine(eventItem);
                            const soldOut =
                              eventItem.slot_limit > 0 &&
                              (eventItem.remainingslot ?? 0) <= 0;
                            return (
                              <TableRow
                                key={eventItem.id}
                                className="border-[#eef1f5] hover:bg-[#fafbfc]"
                              >
                                <TableCell className="px-4 py-3">
                                  <p className="text-[13px] font-medium text-[#1a1a1a]">
                                    {eventItem.event_name || "—"}
                                  </p>
                                  <p className="mt-0.5 text-[12px] text-[#667085]">
                                    {eventItem.is_public ? "Public" : "Private"}
                                    {eventItem.event_type ? ` · ${eventItem.event_type}` : ""}
                                  </p>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <p className="text-[13px] text-[#1a1a1a]">{whenBadge.label}</p>
                                  {metaLine ? (
                                    <p className="mt-0.5 line-clamp-1 text-[12px] text-[#667085]">
                                      {metaLine}
                                    </p>
                                  ) : null}
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <span
                                    className={cn(
                                      "inline-flex rounded px-2 py-0.5 text-[12px] font-medium capitalize",
                                      eventItem.status === "active"
                                        ? "bg-[#ecfdf3] text-[#067647]"
                                        : eventItem.status === "completed"
                                          ? "bg-[#eef4ff] text-[#3538cd]"
                                          : "bg-[#fef3f2] text-[#b42318]",
                                    )}
                                  >
                                    {eventItem.status || "—"}
                                  </span>
                                  {soldOut ? (
                                    <span className="ml-1.5 inline-flex rounded px-2 py-0.5 text-[11px] font-medium bg-[#fff4e5] text-[#b54708]">
                                      Full
                                    </span>
                                  ) : null}
                                </TableCell>
                                <TableCell className="px-4 py-3 text-[13px] tabular-nums text-[#1a1a1a]">
                                  {eventItem.entry_amount > 0
                                    ? `₹${eventItem.entry_amount.toLocaleString("en-IN")}`
                                    : "—"}
                                </TableCell>
                                <TableCell className="px-4 py-3 text-[13px] text-[#344054]">
                                  {eventItem.slot_limit > 0
                                    ? `${eventItem.remainingslot ?? 0} / ${eventItem.slot_limit}`
                                    : "—"}
                                </TableCell>
                                <TableCell className="px-2 py-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="flex h-7 w-7 items-center justify-center rounded-md text-[#667085] hover:bg-[#f2f4f7]"
                                        aria-label="More actions"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => openEventForm(eventItem)}>
                                        <Ticket className="mr-2 h-3.5 w-3.5" />
                                        Manage event
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => openEventBookingForm(eventItem)}
                                      >
                                        <ClipboardList className="mr-2 h-3.5 w-3.5" />
                                        Booking form
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-[#b42318] focus:text-[#b42318]"
                                        onClick={() => requestDeleteEvent(eventItem)}
                                      >
                                        <Trash className="mr-2 h-3.5 w-3.5" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-[12px] text-[#667085]">
                      Showing {filteredEvents.length} of {filteredEvents.length} events
                    </p>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredEvents.map((eventItem) => {
                        const img = organizationEventCardImageUrls[eventItem.id];
                        const soldOut =
                          eventItem.slot_limit > 0 &&
                          (eventItem.remainingslot ?? 0) <= 0;
                        const metaLine = formatOrganizationEventMetaLine(eventItem);
                        const whenBucket = getEventDateBucket(eventItem);
                        const whenBadge = eventWhenBadge(whenBucket);
                        const desc = eventItem.description?.trim() || "";
                        return (
                          <article
                            key={eventItem.id}
                            className="flex flex-col overflow-hidden rounded-lg border border-[#e6eaf0] bg-white shadow-none transition-colors hover:border-[#cfd8f0]"
                          >
                            <div className="relative h-44 w-full shrink-0 overflow-hidden bg-blue-600">
                              {img ? (
                                <img
                                  src={img}
                                  alt={eventItem.event_name || "Event"}
                                  className="absolute inset-0 h-full w-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white/80" aria-hidden>
                                  <Calendar className="h-10 w-10" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/5" aria-hidden />
                            </div>

                            <div className="flex flex-col flex-1 p-6">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                                  {eventItem.event_type || "Event"}
                                </span>
                                {eventItem.entry_amount > 0 ? (
                                  <span className="text-sm font-semibold tabular-nums text-appointza-navy">
                                    From ₹{eventItem.entry_amount.toLocaleString("en-IN")}
                                  </span>
                                ) : null}
                              </div>
                              <h3 className="text-xl font-semibold mb-2 text-appointza-navy line-clamp-2">
                                {eventItem.event_name}
                              </h3>
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span
                                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${whenBadge.className}`}
                                >
                                  {whenBadge.label}
                                </span>
                                <span
                                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${
                                    eventItem.status === "active"
                                      ? "bg-green-100 text-green-800"
                                      : eventItem.status === "completed"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {eventItem.status}
                                </span>
                                {eventItem.is_public ? (
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-medium">
                                    Public
                                  </span>
                                ) : (
                                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                                    Private
                                  </span>
                                )}
                                {soldOut && (
                                  <span className="text-xs bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full font-medium border border-amber-200">
                                    Fully booked
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col gap-2 mb-4 flex-1 min-h-0">
                                {metaLine ? (
                                  <p className="text-stone-600 text-sm leading-snug line-clamp-2">{metaLine}</p>
                                ) : null}
                                {desc ? (
                                  <p className="text-stone-600 text-sm leading-relaxed line-clamp-5">{desc}</p>
                                ) : null}
                                {eventItem.slot_limit > 0 ? (
                                  <p className="text-xs text-stone-500">
                                    Availability:{" "}
                                    <span className="font-medium text-stone-700">
                                      {eventItem.remainingslot ?? 0} / {eventItem.slot_limit} slots
                                    </span>
                                  </p>
                                ) : null}
                                {eventItem.dress_code?.trim() ? (
                                  <p className="text-xs text-stone-500">
                                    Dress code:{" "}
                                    <span className="font-medium text-stone-700">{eventItem.dress_code}</span>
                                  </p>
                                ) : null}
                                {!metaLine &&
                                  !desc &&
                                  !(eventItem.slot_limit > 0) &&
                                  !eventItem.dress_code?.trim() ? (
                                  <p className="text-stone-400 text-sm italic">Details on booking page.</p>
                                ) : null}
                              </div>
                              <div className="mt-auto flex flex-col gap-2 w-full">
                                <button
                                  type="button"
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-medium text-white transition-colors hover:bg-blue-700"
                                  onClick={() => openEventForm(eventItem)}
                                >
                                  <Ticket className="size-4 shrink-0" aria-hidden />
                                  Manage event
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-3 font-medium text-stone-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                  onClick={() => openEventBookingForm(eventItem)}
                                >
                                  <ClipboardList className="size-4 shrink-0" aria-hidden />
                                  Booking form
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-3 font-medium text-stone-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                  onClick={() => requestDeleteEvent(eventItem)}
                                  disabled={isDeletingEvent}
                                >
                                  {isDeletingEvent ? (
                                    <Loader2 className="size-4 animate-spin shrink-0" aria-hidden />
                                  ) : (
                                    <Trash className="size-4 shrink-0" aria-hidden />
                                  )}
                                  Delete
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
          </TabsContent>
        </Tabs>

        <ResponsiveEditSheet
          open={showAddForm || showEditForm}
          onOpenChange={() => {}}
          title={showEditForm ? "Edit service" : "Add new service"}
          subtitle={
            showEditForm ?
              "Update name, pricing, duration, and images for this service."
            : "Enter the details of the service you want to offer."
          }
          errorMessage={serviceFormError || undefined}
          isEdit={showEditForm}
          saving={showEditForm ? isUpdating : isCreating}
          onCancel={closeServiceForm}
          onSave={() => void handleSaveService()}
          saveLabel={showEditForm ? "Save changes" : "Add service"}
        >
          <ServiceEditorFields
            service={service}
            onChange={setService}
            idPrefix={showEditForm ? "edit" : undefined}
            serviceImages={serviceImages}
            onServiceImagesChange={setServiceImages}
          />
        </ResponsiveEditSheet>

        <ResponsiveEditSheet
          open={showComboForm}
          onOpenChange={() => {}}
          title={editingService ? "Edit combo package" : "Create combo package"}
          subtitle={
            editingService
              ? "Update included services, pricing, duration, and images for this combo."
              : "Bundle two or more services and add a combo image customers will see."
          }
          errorMessage={serviceFormError || undefined}
          isEdit={Boolean(editingService)}
          saving={editingService ? isUpdating : isCreating}
          onCancel={closeServiceForm}
          onSave={() => void handleSaveService()}
          saveLabel={editingService ? "Save changes" : "Create combo"}
        >
          <ComboEditorFields
            service={service}
            onChange={setService}
            services={services}
            selectedComboServices={selectedComboServices}
            onSelectedComboServicesChange={handleComboSelection}
            serviceImages={serviceImages}
            onServiceImagesChange={setServiceImages}
            idPrefix={editingService ? "edit-combo" : "combo"}
          />
        </ResponsiveEditSheet>

        <ResponsiveEditSheet
          open={showAddEventForm && addEventStep === "details"}
          onOpenChange={() => {}}
          title="Add new event"
          subtitle="Step 1 of 2 — Enter event details, then set up the booking form."
          saving={isCreatingEvent}
          onCancel={resetEventFlow}
          onSave={() => void handleSaveEvent()}
          saveLabel="Create & set up booking form"
        >
          <EventDetailsFormFields
            event={event}
            setEvent={setEvent}
            idPrefix="event"
            toast={toast}
            eventImages={eventImages}
            onEventImagesChange={setEventImages}
          />
        </ResponsiveEditSheet>

        <ResponsiveEditSheet
          open={showAddEventForm && addEventStep === "booking"}
          onOpenChange={() => {}}
          title={`Booking form — ${bookingFormEventName}`}
          subtitle="Step 2 of 2 — Add questions guests answer when booking this event online."
          saving={isSavingBookingForm}
          onCancel={resetEventFlow}
          onSave={() => void handleSaveEventBookingForm()}
          saveLabel="Save booking form"
        >
          {isLoadingBookingForm ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-600" />
              <span className="text-sm text-stone-600">Loading booking form…</span>
            </div>
          ) : (
            <EventFormFieldsEditor
              idPrefix="services-create"
              fields={eventBookingFormFields}
              onChange={setEventBookingFormFields}
            />
          )}
        </ResponsiveEditSheet>

        <ResponsiveEditSheet
          open={showEditEventForm}
          onOpenChange={() => {}}
          title="Edit event"
          subtitle="Make changes to the event details."
          isEdit
          saving={isUpdatingEvent}
          onCancel={resetEventFlow}
          onSave={() => void handleSaveEvent()}
          saveLabel="Save changes"
        >
          <EventDetailsFormFields
            event={event}
            setEvent={setEvent}
            idPrefix="edit-event"
            toast={toast}
            eventImages={eventImages}
            onEventImagesChange={setEventImages}
          />
        </ResponsiveEditSheet>

        <ResponsiveEditSheet
          open={showEventBookingPanel}
          onOpenChange={() => {}}
          title={`Booking form — ${bookingFormEventName}`}
          subtitle="Questions guests answer when booking this event on your public page."
          saving={isSavingBookingForm}
          onCancel={resetEventFlow}
          onSave={() => void handleSaveEventBookingForm()}
          saveLabel="Save booking form"
        >
          {isLoadingBookingForm ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-600" />
              <span className="text-sm text-stone-600">Loading booking form…</span>
            </div>
          ) : (
            <EventFormFieldsEditor
              idPrefix="services-edit"
              fields={eventBookingFormFields}
              onChange={setEventBookingFormFields}
            />
          )}
        </ResponsiveEditSheet>

        <AlertDialog
          open={deleteConfirm !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteConfirm(null);
          }}
        >
          <AlertDialogContent className="max-h-[min(90dvh,40rem)] w-[calc(100vw-1.5rem)] max-w-lg gap-3 overflow-y-auto rounded-2xl border-stone-200 p-4 shadow-none md:p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-appointza-navy">
                Delete {deleteConfirm?.kind === "service" ? "service" : "event"}?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-stone-600">
                {deleteConfirm ? (
                  <>
                    <span className="font-medium text-appointza-navy">{deleteConfirm.name}</span>{" "}
                    will be permanently removed. This action cannot be undone.
                  </>
                ) : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel className={cn(org.btnOutline, "min-h-11 w-full sm:w-auto")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={
                  deleteConfirm?.kind === "service" ? isDeleting : isDeletingEvent
                }
                className="min-h-11 w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
              >
                {(deleteConfirm?.kind === "service" ? isDeleting : isDeletingEvent) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
};

export default OrganizationServices;
