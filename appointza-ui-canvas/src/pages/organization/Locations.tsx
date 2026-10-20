import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { OrganizationPageShell } from "@/components/layout/OrganizationPageShell";
import SettingsEmbeddedHeader from "@/components/layout/SettingsEmbeddedHeader";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash, 
  Loader2, 
  Home,
  Camera,
  X,
  Save,
  Search,
  Building2,
  Upload,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeCustomUrlSlug } from "@/utils/slug.util";
import {
  buildOrganisationCustomUrlHost,
  buildOrganisationPublicSiteOriginFromHost,
} from "@/utils/orgPublicSiteUrl.util";
import { OrganisationLocation, OrganisationLocationDeleteReq } from "@/models/organisationlocation.model";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { OrganisationService } from "@/services/organisation.service";
import { Organisation, OrganisationType } from "@/models/organisation.model";
import { FilesService } from "@/services/files.service";
import { LocationPicker } from "@/components/organization/LocationPicker";
import { GeocodingService } from "@/services/geocoding.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrgImageAssetField } from "@/components/organization/OrgImageAssetField";
import { HospitalityProfileSettingsReq } from "@/models/hospitality.model";
import { hospitalityService } from "@/services/hospitality.service";
import { OrganisationCatalogOfferingsSelector } from "@/components/organization/OrganisationCatalogOfferingsSelector";
import {
  mergeCatalogOfferingsIntoAttributes,
  organisationTypeFromCatalogOfferings,
  resolveInitialCatalogOfferings,
  type CatalogOfferingKind,
} from "@/utils/organisationCatalogOfferings.util";
import {
  mergeOrganisationAppointmentSettings,
  parseOrganisationAppointmentSettings,
} from "@/utils/organisationAppointmentSettings.util";
import {
  organisationLocationsQueryKey,
  useOrganisationLocations,
} from "@/hooks/useOrganisationLocations";
import { organisationQueryKey, useOrganisation } from "@/hooks/useOrganisation";
import { useReferenceValues } from "@/hooks/useReferenceValues";

// Component for handling authenticated image loading
const AuthenticatedImage = ({ imageId, alt, className, onError }: { 
  imageId: number; 
  alt: string; 
  className: string; 
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const filesService = useMemo(() => new FilesService(), []);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        // Get authentication token
        const userContext = localStorage.getItem('user_context');
        let authHeaders: Record<string, string> = {};
        
        if (userContext) {
          const user = JSON.parse(userContext);
          const token = user.accesstoken;
          if (token) {
            authHeaders['Authorization'] = `Bearer ${token}`;
          }
        }
        
        // Use fetch directly for binary data
        const response = await fetch(filesService.getImageUrl(imageId), {
          method: 'GET',
          headers: {
            'Accept': 'image/*',
            ...authHeaders
          }
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        } else {
          // Fallback: try direct URL without authentication
          setImageUrl(filesService.getImageUrl(imageId));
        }
      } catch (error) {
        console.error('❌ Error loading image:', error);
        setImageUrl('');
      } finally {
        setIsLoading(false);
      }
    };

    if (imageId) {
      loadImage();
    }
  }, [imageId, filesService]);

  if (isLoading) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <div className="text-center">
          <svg className="w-6 h-6 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <div className="text-xs text-gray-500">ID: {imageId}</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={onError}
    />
  );
};

const LocationsScreen = ({
  embedded = false,
  section,
}: {
  embedded?: boolean;
  section?: "locations" | "organization";
}) => {
  const { toast } = useToast();
  const { user, isAuthenticated, userType } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const organizationId = user?.organisationid || 1;
  const locationSubtab: "locations" | "organization" =
    section ?? (searchParams.get("subtab") === "organization" ? "organization" : "locations");
  const hideInnerTabs = Boolean(section);

  const {
    data: locations = [],
    isFetching: isLocationsFetching,
    refetch: refetchLocations,
  } = useOrganisationLocations({
    organisationId: organizationId,
    enabled: organizationId > 0,
  });

  const { data: fetchedOrganization, refetch: refetchOrganization } = useOrganisation({
    organisationId: organizationId,
    enabled: organizationId > 0,
  });

  const { data: referenceValues = [] } = useReferenceValues({
    organisationId: organizationId,
    referencetypeid: 6,
    enabled: organizationId > 0,
  });

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<OrganisationLocation | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Organization state
  const [organization, setOrganization] = useState<Organisation | null>(null);
  const [hospitalitySettings, setHospitalitySettings] = useState<HospitalityProfileSettingsReq | null>(
    null,
  );
  const [savingOrganization, setSavingOrganization] = useState(false);
  const [selectedCatalogOfferings, setSelectedCatalogOfferings] = useState<CatalogOfferingKind[]>(
    [],
  );
  const [orgAppointmentCounter, setOrgAppointmentCounter] = useState(1);
  const [orgAppointmentOpenBefore, setOrgAppointmentOpenBefore] = useState(0);
  
  // Form state
  const [location, setLocation] = useState<OrganisationLocation>(new OrganisationLocation());
  const [isFromMap, setIsFromMap] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [images, setImages] = useState<number[]>([]);
  
  // Pincode lookup state
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const [pincodeTimeout, setPincodeTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  // API services
  const locationService = useMemo(() => new OrganisationLocationService(), []);
  const organisationService = useMemo(() => new OrganisationService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  const [selectedReferenceValueIds, setSelectedReferenceValueIds] = useState<number[]>([]);
  

  const refreshLocations = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: organisationLocationsQueryKey(organizationId, 0),
    });
    await refetchLocations();
  }, [organizationId, queryClient, refetchLocations]);

  useEffect(() => {
    if (fetchedOrganization) {
      setOrganization(fetchedOrganization);
    }
  }, [fetchedOrganization]);

  const loadHospitalitySettings = useCallback(async (orgType?: OrganisationType) => {
    if (organizationId <= 0) return;
    try {
      const profile = await hospitalityService.getProfile(organizationId);
      const settings = new HospitalityProfileSettingsReq();
      settings.organisation_id = organizationId;
      settings.organisation_type = (orgType ?? profile.organisation_type ?? "service") as OrganisationType;
      settings.property_type = profile.property_type || "hotel";
      settings.booking_type = profile.booking_type || "overnight";
      settings.minimum_hours = profile.minimum_hours || 2;
      settings.checkin_time = profile.checkin_time || "14:00";
      settings.checkout_time = profile.checkout_time || "11:00";
      settings.overnight_time_mode = profile.overnight_time_mode || "fixed";
      settings.cancellation_policy = profile.cancellation_policy || "";
      settings.payment_policy = profile.payment_policy || "";
      setHospitalitySettings(settings);
    } catch {
      setHospitalitySettings(null);
    }
  }, [organizationId]);

  const syncCatalogOfferingsFromOrg = useCallback(() => {
    const orgSnapshot = organization ?? fetchedOrganization;
    if (!orgSnapshot) return;
    setSelectedCatalogOfferings(
      resolveInitialCatalogOfferings(orgSnapshot.attributes_json, orgSnapshot.organisation_type),
    );
    const appointmentSettings = parseOrganisationAppointmentSettings(orgSnapshot.attributes_json);
    setOrgAppointmentCounter(appointmentSettings.counter);
    setOrgAppointmentOpenBefore(appointmentSettings.openbefore);
  }, [organization, fetchedOrganization]);

  const editOrganisationType = useMemo(
    (): OrganisationType => organisationTypeFromCatalogOfferings(selectedCatalogOfferings),
    [selectedCatalogOfferings],
  );

  const syncLocationSubtab = (subtab: "locations" | "organization") => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (subtab === "organization") next.set("subtab", "organization");
        else next.delete("subtab");
        return next;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    if (locationSubtab === "organization" && organization) {
      syncCatalogOfferingsFromOrg();
    }
  }, [locationSubtab, organization, syncCatalogOfferingsFromOrg]);

  useEffect(() => {
    if (locationSubtab !== "organization") return;
    if (editOrganisationType === "hospitality" || editOrganisationType === "both") {
      void loadHospitalitySettings(editOrganisationType);
    }
  }, [locationSubtab, editOrganisationType, loadHospitalitySettings]);

  useEffect(() => {
    // Deep links that used ?edit=organization no longer open a side panel.
    if (searchParams.get("edit") === "organization") {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("edit");
          if (!next.get("subtab")) next.set("subtab", "organization");
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (
      organization &&
      (organization.organisation_type === "hospitality" || organization.organisation_type === "both")
    ) {
      void loadHospitalitySettings(organization.organisation_type);
    } else if (
      !(
        editOrganisationType === "hospitality" ||
        editOrganisationType === "both"
      )
    ) {
      setHospitalitySettings(null);
    }
  }, [organization, editOrganisationType, loadHospitalitySettings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pincodeTimeout) {
        clearTimeout(pincodeTimeout);
      }
    };
  }, [pincodeTimeout]);

  // Generate Google Maps URL from lat/lon
  const generateGoogleMapsUrl = (latitude: number, longitude: number): string => {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  };

  // Handle location selection from map
  const handleLocationSelect = (locationData: {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  }) => {
    const googleMapsUrl = generateGoogleMapsUrl(locationData.latitude, locationData.longitude);
    
    setLocation(prev => ({
      ...prev,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      googlelocation: locationData.address,
      geolocation_url: googleMapsUrl,
      addressline1: locationData.address.split(',')[0] || locationData.address,
      city: locationData.city || prev.city,
      state: locationData.state || prev.state,
      country: locationData.country || prev.country,
      pincode: locationData.pincode || prev.pincode,
      locationname: locationData.address,
      locationcity: locationData.city || '',
      locationstate: locationData.state || '',
      locationcountry: locationData.country || '',
      locationpincode: locationData.pincode || '',
    }));
    setIsFromMap(true);
  };

  // Handle custom URL change
  const handleCustomUrlChange = (text: string) => {
    const slug = normalizeCustomUrlSlug(text);
    setCustomUrlInput(slug);
    setLocation(prev => ({ ...prev, customurl: slug }));
  };

  // Pincode lookup functions
  const lookupPincode = async (pincode: string) => {
    if (!pincode || pincode.length !== 6) return;
    
    setIsLookingUpPincode(true);
    try {
      // Using a free pincode API
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        
        setLocation(prev => ({
          ...prev,
          city: postOffice.District || '',
          state: postOffice.State || '',
          country: postOffice.Country || 'India',
          pincode: pincode
        }));
        
        toast({
          title: "Location Found",
          description: `Auto-filled: ${postOffice.District}, ${postOffice.State}`,
        });
      } else {
        toast({
          title: "Pincode Not Found",
          description: "Please enter a valid 6-digit pincode",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error looking up pincode:", error);
      toast({
        title: "Lookup Failed",
        description: "Could not fetch location details. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsLookingUpPincode(false);
    }
  };

  const handlePincodeChange = (value: string) => {
    // Clear existing timeout
    if (pincodeTimeout) {
      clearTimeout(pincodeTimeout);
    }
    
    // Set new timeout for debounced lookup
    const timeout = setTimeout(() => {
      if (value.length === 6) {
        lookupPincode(value);
      }
    }, 1000); // 1 second delay
    
    setPincodeTimeout(timeout);
  };

  // Validate form fields
  const validateFields = (): boolean => {
    const requiredFields = ['name', 'addressline1', 'city', 'state', 'pincode'];
    const missingFields = requiredFields.filter(
      field => !location[field as keyof OrganisationLocation]?.toString().trim()
    );

    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in all required fields: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  // Handle save location
  const handleSave = async () => {
    if (!validateFields()) return;
    
    setIsLoading(true);
    try {
      const isNewLocation = !location.id || location.id === 0;
      // Helper function to convert Date to Date object (for model compatibility)
      const toDate = (date: Date | string | undefined): Date => {
        if (!date) return new Date();
        if (typeof date === 'string') return new Date(date);
        return date;
      };

      // Ensure latitude and longitude are properly converted to decimal numbers
      // Use parseFloat to preserve decimal precision (e.g., 13.1104768, not 13)
      const latitude = location.latitude != null ? parseFloat(String(location.latitude)) : 0;
      const longitude = location.longitude != null ? parseFloat(String(location.longitude)) : 0;
      
      console.log('📍 Location coordinates:', {
        original: { lat: location.latitude, lng: location.longitude },
        parsed: { latitude, longitude },
        types: { 
          latType: typeof latitude, 
          lngType: typeof longitude,
          latIsNumber: !isNaN(latitude),
          lngIsNumber: !isNaN(longitude)
        }
      });

      const locationToSave = {
        ...location,
        organisationid: organizationId,
        id: location.id || 0,
        // Persist without any whitespace (matches UI restriction).
        name: location.name?.replace(/\s+/g, "").trim() || '',
        addressline1: location.addressline1?.trim() || '',
        addressline2: location.addressline2?.trim() || '',
        city: location.city?.trim() || '',
        state: location.state?.trim() || '',
        country: location.country?.trim() || 'India',
        pincode: location.pincode?.trim() || '',
        customurl: normalizeCustomUrlSlug(location.customurl) || '',
        latitude: latitude,
        longitude: longitude,
        googlelocation: location.googlelocation?.trim() || '',
        geolocation_url: location.geolocation_url?.trim() || (latitude && longitude ? generateGoogleMapsUrl(latitude, longitude) : ''),
        images: images.slice(0, 5) || [],
        facility_list: selectedReferenceValueIds.map(id => Number(id)), // Ensure all IDs are numbers
        email: location.email?.trim() || '',
        whatsapp_mobile: location.whatsapp_mobile?.trim() || '',
        attributes: typeof location.attributes === 'object' && location.attributes ? location.attributes : {},
        isactive: true,
        version: isNewLocation ? 1 : (location.version || 1),
        createdby: isNewLocation ? (user?.id || 0) : (location.createdby || user?.id || 0),
        createdon: isNewLocation ? new Date() : toDate(location.createdon),
        modifiedby: user?.id || 0,
        modifiedon: new Date(),
        issuspended: false,
        isfactory: false,
        notes: location.notes?.trim() || ""
      };

      console.log('💾 Saving location:', locationToSave);
      console.log('🖼️ Images being sent:', images);
      console.log('🖼️ Images in locationToSave:', locationToSave.images);
      console.log('✅ Facility List being sent:', selectedReferenceValueIds);
      console.log('✅ Facility List in locationToSave:', locationToSave.facility_list);
      
      const response = await locationService.save(locationToSave);
      
      if (response) {
        toast({
          title: "Success",
          description: "Location saved successfully",
        });
        setShowAddDialog(false);
        setShowEditDialog(false);
        resetForm();
        await refreshLocations();
      } else {
        throw new Error('Empty response from server');
      }
    } catch (error: any) {
      console.error('❌ Error saving location:', error);
      const errorMessage = error?.response?.data?.message || 
                         error?.response?.data?.error || 
                         error?.message || 
                         'Failed to save location';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete location
  const handleDelete = async () => {
    if (!selectedLocation?.id) return;
    
    setIsLoading(true);
    try {
      const req = new OrganisationLocationDeleteReq();
      req.id = selectedLocation.id;
      
      const response = await locationService.delete(req);
      
      if (response) {
        toast({
          title: "Success",
          description: "Location deleted successfully",
        });
        setShowDeleteDialog(false);
        setSelectedLocation(null);
        await refreshLocations();
      } else {
        throw new Error('Failed to delete location');
      }
    } catch (error: any) {
      console.error('❌ Error deleting location:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to delete location';
    toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setLocation(new OrganisationLocation());
    setImages([]);
    setIsFromMap(false);
    setCustomUrlInput("");
    setSelectedReferenceValueIds([]);
  };

  // Auto-get current location when adding new location
  const autoGetCurrentLocation = async () => {
    try {
      const geocodingService = new GeocodingService();
      
      // Check if running on native platform (iOS/Android)
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        // Use Capacitor Geolocation for native platforms
        try {
          const { Geolocation } = await import('@capacitor/geolocation');
          
          const permissionStatus = await Geolocation.requestPermissions();
          
          if (permissionStatus.location !== 'granted') {
            console.log('⚠️ Location permission not granted, user can select manually');
            return;
          }

          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000
          });

          const { latitude, longitude } = position.coords;
          console.log('✅ Auto-detected current location:', latitude, longitude);
          
          // Reverse geocode to get address
          const locationDetails = await geocodingService.reverseGeocode(latitude, longitude);
          
          handleLocationSelect({
            latitude,
            longitude,
            address: locationDetails.address,
            city: locationDetails.city,
            state: locationDetails.state,
            country: locationDetails.country,
            pincode: locationDetails.pincode
          });
        } catch (error: any) {
          console.warn('⚠️ Auto-location detection failed (native):', error);
          // Don't show error, user can select manually
        }
      } else {
        // Use browser geolocation for web
        if (!navigator.geolocation) {
          console.log('⚠️ Geolocation not supported');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log('✅ Auto-detected current location (web):', latitude, longitude);
            
            // Reverse geocode to get address
            const locationDetails = await geocodingService.reverseGeocode(latitude, longitude);
            
            handleLocationSelect({
              latitude,
              longitude,
              address: locationDetails.address,
              city: locationDetails.city,
              state: locationDetails.state,
              country: locationDetails.country,
              pincode: locationDetails.pincode
            });
          },
          (error) => {
            console.warn('⚠️ Auto-location detection failed (web):', error);
            // Don't show error, user can select manually
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000
          }
        );
      }
    } catch (error) {
      console.warn('⚠️ Error in auto-get location:', error);
      // Don't show error, user can select manually
    }
  };

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
    // Automatically get current location when adding new location
    autoGetCurrentLocation();
  };

  // Open edit dialog
  const openEditDialog = (locationItem: OrganisationLocation) => {
    // Generate geolocation_url if lat/lon exist but URL is missing
    let locationToEdit = { ...locationItem };
    
    // Ensure latitude and longitude are properly parsed as decimal numbers when loading for edit
    // This ensures full precision is maintained even if database returns them as strings or integers
    if (locationToEdit.latitude != null) {
      locationToEdit.latitude = parseFloat(String(locationToEdit.latitude));
    }
    if (locationToEdit.longitude != null) {
      locationToEdit.longitude = parseFloat(String(locationToEdit.longitude));
    }
    
    if (locationToEdit.latitude && locationToEdit.longitude && !locationToEdit.geolocation_url) {
      locationToEdit.geolocation_url = generateGoogleMapsUrl(locationToEdit.latitude, locationToEdit.longitude);
    }
    
    console.log('📥 Loading location for edit:', {
      original: { lat: locationItem.latitude, lng: locationItem.longitude },
      parsed: { lat: locationToEdit.latitude, lng: locationToEdit.longitude }
    });
    
    setLocation(locationToEdit);
    setImages(locationToEdit.images || []);
    setIsFromMap(!!locationToEdit.googlelocation);
    setCustomUrlInput(normalizeCustomUrlSlug(locationToEdit.customurl) || "");
    
    // Load selected ReferenceValue IDs from facility_list
    const facilityList = locationToEdit.facility_list || [];
    console.log('📥 Loading facility_list for edit:', facilityList);
    setSelectedReferenceValueIds(facilityList.map(id => Number(id))); // Ensure all IDs are numbers
    
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (locationItem: OrganisationLocation) => {
    setSelectedLocation(locationItem);
    setShowDeleteDialog(true);
  };

  // Save organization details
  const handleSaveOrganization = async () => {
    if (!organization) return;

    if (selectedCatalogOfferings.length === 0) {
      toast({
        title: "Select what you provide",
        description: "Choose at least one option: services, events, or rooms.",
        variant: "destructive",
      });
      return;
    }

    const derivedOrganisationType =
      organisationTypeFromCatalogOfferings(selectedCatalogOfferings);

    const attributesJson = mergeOrganisationAppointmentSettings(
      mergeCatalogOfferingsIntoAttributes(
        organization.attributes_json,
        selectedCatalogOfferings,
      ),
      {
        counter: orgAppointmentCounter,
        openbefore: orgAppointmentOpenBefore,
      },
    );

    let attributesPayload: Organisation.AttributesData = new Organisation.AttributesData();
    try {
      attributesPayload = JSON.parse(attributesJson) as Organisation.AttributesData;
    } catch {
      attributesPayload = {
        catalog_offerings: selectedCatalogOfferings,
        appointment_counter: orgAppointmentCounter,
        appointment_openbefore: orgAppointmentOpenBefore,
      };
    }

    const updatedOrganization = {
      ...organization,
      name: organization?.name?.trim() || "",
      gstnumber: organization?.gstnumber?.trim() || "",
      primarytypecode: organization?.primarytypecode?.trim() || "",
      secondarytypecode: organization?.secondarytypecode?.trim() || "",
      notes: organization?.notes?.trim() || "",
      organisation_type: derivedOrganisationType,
      booking_amount: organization?.booking_amount ?? 0,
      attributes_json: attributesJson,
      // Backend persists Serialize(attributes) — must include catalog_offerings here.
      attributes: attributesPayload,
    };

    const savingHospitality =
      (updatedOrganization.organisation_type === "hospitality" ||
        updatedOrganization.organisation_type === "both") &&
      hospitalitySettings;

    setSavingOrganization(true);
    setIsLoading(true);
    try {
      await organisationService.update(updatedOrganization);

      if (savingHospitality && hospitalitySettings) {
        const hospitalityPayload = {
          ...hospitalitySettings,
          organisation_id: organizationId,
          organisation_type: updatedOrganization.organisation_type,
        };
        if (hospitalityPayload.booking_type !== "hourly") {
          hospitalityPayload.minimum_hours = 0;
        }
        await hospitalityService.saveSettings(hospitalityPayload);
      }

      toast({
        title: "Saved",
        description: "Organization details updated.",
      });
      await queryClient.invalidateQueries({ queryKey: organisationQueryKey(organizationId) });
      await refetchOrganization();
    } catch (error: unknown) {
      console.error("❌ Error updating organization:", error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to update organization details";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSavingOrganization(false);
      setIsLoading(false);
    }
  };

  // Filter locations based on search term
  const filteredLocations = locations.filter(location =>
    location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.addressline1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  if ((isLoading || isLocationsFetching) && locations.length === 0) {
    return (
      <OrganizationPageShell embedded={embedded}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading locations...</span>
        </div>
      </OrganizationPageShell>
    );
  }

  return (
    <OrganizationPageShell embedded={embedded}>
      {embedded ? (
        <SettingsEmbeddedHeader
          icon={hideInnerTabs && locationSubtab === "organization" ? Building2 : MapPin}
          title={hideInnerTabs && locationSubtab === "organization" ? "Organisation" : "Location"}
          description={
            hideInnerTabs && locationSubtab === "organization"
              ? "Organisation details, what you provide, and appointment options."
              : "Manage your business locations."
          }
        />
      ) : null}
      <div className={cn(embedded ? settingsEmbedded.sectionBody : "space-y-6")}>
        {!embedded ? (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="p-2"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <Tabs
          value={locationSubtab}
          onValueChange={(value) => syncLocationSubtab(value as "locations" | "organization")}
          className="w-full"
        >
          <TabsList className={cn(
            "grid w-full grid-cols-2 rounded-xl border border-stone-200 bg-white p-1 shadow-none",
            hideInnerTabs && "hidden",
          )}>
            <TabsTrigger value="locations" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none">
              <MapPin className="h-4 w-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="organization" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none">
              <Building2 className="h-4 w-4" />
              Organization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="locations" className="space-y-6">
            {/* Show form when adding or editing */}
            {(showAddDialog || showEditDialog) ? (
              <Card className="rounded-2xl border-stone-200 bg-white shadow-none">
                <CardHeader className="border-b border-stone-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{showAddDialog ? 'Add Location' : 'Edit Location'}</CardTitle>
                      <CardDescription>
                        {showAddDialog ? 'Add a new business location with address details.' : 'Update the location details.'}
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => {
                      setShowAddDialog(false);
                      setShowEditDialog(false);
                      resetForm();
                    }}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Location Name *</Label>
                        <Input
                          id="name"
                          value={location.name || ''}
                          // Disallow whitespace in location name (auto-strip spaces).
                          onChange={(e) =>
                            setLocation((prev) => ({
                              ...prev,
                              name: e.target.value.replace(/\s+/g, "").trim(),
                            }))
                          }
                          placeholder="Enter location name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="customurl">Custom URL slug</Label>
                        <Input
                          id="customurl"
                          value={customUrlInput}
                          onChange={(e) => handleCustomUrlChange(e.target.value.trim())}
                          placeholder="e.g. awonderonesurprise"
                        />
                        {customUrlInput ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Full URL: {buildOrganisationCustomUrlHost({ customUrl: customUrlInput })}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Location Picker Button */}
                    <div>
                      <Label>Location on Map</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowLocationPicker(true)}
                        className="w-full sm:w-auto"
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        {location.latitude && location.longitude ? 'Update Location' : 'Select Location on Map'}
                      </Button>
                      {location.latitude && location.longitude && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Location set: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="addressline1">Building Details *</Label>
                      <Input
                        id="addressline1"
                        value={location.addressline1 || ''}
                        onChange={(e) => setLocation(prev => ({ ...prev, addressline1: e.target.value.trim() }))}
                        placeholder="Enter building number and name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="addressline2">Area Details</Label>
                      <Input
                        id="addressline2"
                        value={location.addressline2 || ''}
                        onChange={(e) => setLocation(prev => ({ ...prev, addressline2: e.target.value.trim() }))}
                        placeholder="Enter road name and area"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <div className="relative">
                          <Input
                            id="city"
                            value={location.city || ''}
                            onChange={(e) => setLocation(prev => ({ ...prev, city: e.target.value.trim() }))}
                            placeholder="Enter city"
                            disabled={isFromMap}
                            className={location.city ? "bg-green-50 border-green-300" : ""}
                          />
                          {location.city && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="state">State *</Label>
                        <div className="relative">
                          <Input
                            id="state"
                            value={location.state || ''}
                            onChange={(e) => setLocation(prev => ({ ...prev, state: e.target.value.trim() }))}
                            placeholder="Enter state"
                            disabled={isFromMap}
                            className={location.state ? "bg-green-50 border-green-300" : ""}
                          />
                          {location.state && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="pincode">Pincode *</Label>
                        <div className="relative">
                          <Input
                            id="pincode"
                            value={location.pincode || ''}
                            onChange={(e) => {
                              const value = e.target.value.trim().replace(/\D/g, '').slice(0, 6);
                              setLocation(prev => ({ ...prev, pincode: value }));
                              handlePincodeChange(value);
                            }}
                            onBlur={(e) => {
                              if (e.target.value.trim().length === 6) {
                                lookupPincode(e.target.value.trim());
                              }
                            }}
                            placeholder="Enter 6-digit pincode"
                            maxLength={6}
                          />
                          {isLookingUpPincode && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Enter pincode to auto-fill city, state, and country
                        </p>
                      </div>
                    </div>

                    {/* Location contact for booking notifications */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Location Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={location.email || ''}
                          onChange={(e) => setLocation(prev => ({ ...prev, email: e.target.value.trim() }))}
                          placeholder="location@example.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Email for booking notifications at this location
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="whatsapp_mobile">WhatsApp / Mobile</Label>
                        <Input
                          id="whatsapp_mobile"
                          value={location.whatsapp_mobile || ''}
                          onChange={(e) => setLocation(prev => ({ ...prev, whatsapp_mobile: e.target.value.trim().replace(/\D/g, '').slice(0, 15) }))}
                          placeholder="10-digit mobile number"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Booking notifications sent to this number when someone books
                        </p>
                      </div>
                    </div>

                    {/* ReferenceValue Checkboxes (referencetypeid = 6) */}
                    {referenceValues.length > 0 && (
                      <div>
                        <Label>Options</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2 p-4 border rounded-lg">
                          {referenceValues.map((refValue) => (
                            <div key={refValue.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`refvalue-${refValue.id}`}
                                checked={selectedReferenceValueIds.includes(refValue.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedReferenceValueIds(prev => [...prev, refValue.id]);
                                  } else {
                                    setSelectedReferenceValueIds(prev => prev.filter(id => id !== refValue.id));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`refvalue-${refValue.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {refValue.displaytext || refValue.identifier}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <OrgImageAssetField
                      label="Photos"
                      description="Upload or pick from organisation assets."
                      imageIds={images}
                      onChange={setImages}
                      maxImages={5}
                      idPrefix="location-photos"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setShowAddDialog(false);
                    setShowEditDialog(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 shadow-none hover:bg-blue-700">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {showAddDialog ? 'Saving...' : 'Updating...'}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {showAddDialog ? 'Save Location' : 'Update Location'}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Business Locations</h3>
                    <p className="text-muted-foreground">
                      Manage your business locations and addresses.
                    </p>
                  </div>
                  <Button onClick={openAddDialog} className="bg-blue-600 shadow-none hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Location
                  </Button>
                </div>

                {/* Search */}
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.trim())}
                    className="w-full"
                  />
                  <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {/* Locations List */}
                {filteredLocations.length === 0 ? (
          <Card className="rounded-2xl border-stone-200 bg-white shadow-none">
            <CardContent className="py-8 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No locations found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "No locations match your search." : "Add your first location to get started!"}
              </p>
              {!searchTerm && (
                <Button onClick={openAddDialog} className="bg-blue-600 shadow-none hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Location
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>

            <div className="grid gap-4">
          {filteredLocations.map((locationItem) => (
            <Card key={locationItem.id} className="rounded-xl border-stone-200 bg-white shadow-none transition-colors hover:border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Location Icon */}
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Home className="h-6 w-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{locationItem.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {locationItem.addressline1}
                        {locationItem.addressline2 && `, ${locationItem.addressline2}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {locationItem.city}, {locationItem.state} {locationItem.pincode}
                      </p>
                      {locationItem.customurl && (
                        <p className="text-sm text-blue-600 mt-1">
                          <a
                            href={buildOrganisationPublicSiteOriginFromHost(
                              buildOrganisationCustomUrlHost({ customUrl: locationItem.customurl }),
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {buildOrganisationCustomUrlHost({ customUrl: locationItem.customurl })}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(locationItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(locationItem)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
            </div>
          </>
        )}
              </>
            )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent className="rounded-2xl border-stone-200 bg-white shadow-none">
            <DialogHeader>
              <DialogTitle>Delete Location</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedLocation?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
              </DialogContent>
            </Dialog>

          </TabsContent>

          <TabsContent value="organization" className="space-y-4">
            {!organization ? (
              <div className="flex items-center gap-2 py-10 text-[13px] text-[#667085]">
                <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
                Loading organisation…
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#e6eaf0] bg-white shadow-none">
                <div className="border-b border-[#e6eaf0] px-4 py-3 sm:px-5">
                  <p className="text-[13px] font-semibold text-[#1a1a1a]">Organisation details</p>
                  <p className="text-[12px] text-[#667085]">
                    Change anything below, then tap Save at the bottom right.
                  </p>
                </div>

                <div className="space-y-5 px-4 py-4 pb-24 sm:px-5">
                  <OrganisationCatalogOfferingsSelector
                    value={selectedCatalogOfferings}
                    onChange={setSelectedCatalogOfferings}
                  />

                  {(selectedCatalogOfferings.includes("services") ||
                    selectedCatalogOfferings.includes("events")) && (
                    <div className="space-y-3 rounded-xl border border-[#e6eaf0] bg-[#fafbfc] p-4">
                      <div>
                        <p className="text-[13px] font-semibold text-[#1a1a1a]">
                          Service appointment options
                        </p>
                        <p className="text-[12px] text-[#667085]">
                          Applies to every location. Opening hours are under Business hours.
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="org-appointment-counter" className={org.label}>
                            Counters
                          </Label>
                          <NumberInput
                            id="org-appointment-counter"
                            min={1}
                            value={orgAppointmentCounter}
                            onValueChange={setOrgAppointmentCounter}
                            emptyWhenZero={false}
                            className={cn(org.input, "h-9")}
                          />
                          <p className="text-[12px] text-[#667085]">
                            Same time slot can be booked this many times.
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="org-appointment-window" className={org.label}>
                            Booking window (days)
                          </Label>
                          <NumberInput
                            id="org-appointment-window"
                            min={0}
                            value={orgAppointmentOpenBefore}
                            onValueChange={setOrgAppointmentOpenBefore}
                            emptyWhenZero={false}
                            className={cn(org.input, "h-9")}
                          />
                          <p className="text-[12px] text-[#667085]">
                            How many days ahead customers can book. 0 = no limit.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {(editOrganisationType === "hospitality" || editOrganisationType === "both") &&
                  hospitalitySettings ? (
                    <div className="space-y-3 rounded-xl border border-[#e6eaf0] bg-[#fafbfc] p-4">
                      <div>
                        <p className="text-[13px] font-semibold text-[#1a1a1a]">Stay booking settings</p>
                        <p className="text-[12px] text-[#667085]">
                          Full policies are in{" "}
                          <Link
                            to="/organization/hospitality?section=policies"
                            className="font-medium text-[#2a5af5] hover:underline"
                          >
                            Hospitality → Policies
                          </Link>
                          .
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label className={org.label}>Booking type</Label>
                          <Select
                            value={hospitalitySettings.booking_type}
                            onValueChange={(value) =>
                              setHospitalitySettings({
                                ...hospitalitySettings,
                                booking_type: value,
                                minimum_hours:
                                  value === "hourly" ? hospitalitySettings.minimum_hours || 2 : 0,
                              })
                            }
                          >
                            <SelectTrigger className={cn(org.selectTrigger, "h-9")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="overnight">Overnight (per night)</SelectItem>
                              <SelectItem value="hourly">Hourly (per hour / slots)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {hospitalitySettings.booking_type === "hourly" ? (
                          <div className="space-y-1.5">
                            <Label className={org.label}>Minimum hours</Label>
                            <Input
                              type="number"
                              min={1}
                              className={cn(org.input, "h-9")}
                              value={hospitalitySettings.minimum_hours || ""}
                              onChange={(e) =>
                                setHospitalitySettings({
                                  ...hospitalitySettings,
                                  minimum_hours: Number(e.target.value) || 2,
                                })
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="org-name" className={org.label}>
                        Organization name
                      </Label>
                      <Input
                        id="org-name"
                        value={organization.name || ""}
                        onChange={(e) =>
                          setOrganization((prev) => (prev ? { ...prev, name: e.target.value } : null))
                        }
                        placeholder="Enter organization name"
                        className={cn(org.input, "h-9")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="org-gst" className={org.label}>
                        GST number
                      </Label>
                      <Input
                        id="org-gst"
                        value={organization.gstnumber || ""}
                        onChange={(e) =>
                          setOrganization((prev) =>
                            prev ? { ...prev, gstnumber: e.target.value } : null,
                          )
                        }
                        placeholder="Enter GST number"
                        className={cn(org.input, "h-9")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="org-primary-type" className={org.label}>
                        Primary type code
                      </Label>
                      <Input
                        id="org-primary-type"
                        value={organization.primarytypecode || ""}
                        onChange={(e) =>
                          setOrganization((prev) =>
                            prev ? { ...prev, primarytypecode: e.target.value } : null,
                          )
                        }
                        placeholder="Enter primary type code"
                        className={cn(org.input, "h-9")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="org-secondary-type" className={org.label}>
                        Secondary type code
                      </Label>
                      <Input
                        id="org-secondary-type"
                        value={organization.secondarytypecode || ""}
                        onChange={(e) =>
                          setOrganization((prev) =>
                            prev ? { ...prev, secondarytypecode: e.target.value } : null,
                          )
                        }
                        placeholder="Enter secondary type code"
                        className={cn(org.input, "h-9")}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="org-notes" className={org.label}>
                      Notes
                    </Label>
                    <Textarea
                      id="org-notes"
                      value={organization.notes || ""}
                      onChange={(e) =>
                        setOrganization((prev) => (prev ? { ...prev, notes: e.target.value } : null))
                      }
                      placeholder="Short description of your business"
                      rows={3}
                      className={cn(org.input, "min-h-[4.5rem] resize-y")}
                    />
                  </div>

                  <OrgImageAssetField
                    label="Organization logo"
                    description="Upload or pick from organisation assets."
                    imageIds={organization.organisationlogo ? [organization.organisationlogo] : []}
                    onChange={(ids) =>
                      setOrganization((prev) =>
                        prev ? { ...prev, organisationlogo: ids[0] ?? 0 } : null,
                      )
                    }
                    multiple={false}
                    maxImages={1}
                    idPrefix="org-logo-edit"
                  />
                </div>

                <div className={org.saveBar}>
                  <Button
                    type="button"
                    onClick={() => void handleSaveOrganization()}
                    disabled={savingOrganization}
                    className={org.saveBtn}
                  >
                    {savingOrganization ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Location Picker Dialog */}
        <LocationPicker
          open={showLocationPicker}
          onOpenChange={setShowLocationPicker}
          onLocationSelect={handleLocationSelect}
        />
      </div>
    </OrganizationPageShell>
  );
};

export default LocationsScreen;