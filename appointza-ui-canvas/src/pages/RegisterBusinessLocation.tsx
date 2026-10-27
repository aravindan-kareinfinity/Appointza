import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { LocationPicker } from "@/components/organization/LocationPicker";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { OrganisationLocation, OrganisationLocationSelectReq } from "@/models/organisationlocation.model";
import { cn } from "@/lib/utils";
import {
  BUSINESS_OFFERINGS_PATH,
  BUSINESS_ONBOARDING_RETURN_PATH,
  BUSINESS_ONBOARDING_TOTAL_STEPS,
  isPendingBusinessOnboarding,
  setBusinessOnboardingStep,
} from "@/utils/businessOnboarding.util";
import { USER_POST_LOGIN_PATH } from "@/utils/postAuthNavigation";
import { RegisterOnboardingFormFrame } from "@/components/layout/RegisterOnboardingFormFrame";

const fieldClass =
  "h-11 min-h-11 rounded-md border-[#dbe4f0] bg-white text-[14px] shadow-none placeholder:text-[#98a2b3] focus-visible:border-[#528ff0] focus-visible:ring-[#528ff0]/20";

const continueBtnClass =
  "h-12 min-h-12 w-full touch-manipulation rounded-md border border-[#528ff0] bg-[#528ff0] text-[15px] font-semibold text-white shadow-none hover:bg-[#3d7ae8] disabled:opacity-50 disabled:hover:bg-[#528ff0]";

const sanitizeLocationName = (value: string) => value.replace(/[^a-zA-Z0-9]/g, "");

/** Screen 3 of 7 — primary business location. Continues to Screen 4 (offerings). */
const RegisterBusinessLocation = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshAuth } = useAuth();
  const locationService = useMemo(() => new OrganisationLocationService(), []);

  const [location, setLocation] = useState<OrganisationLocation | null>(null);
  const [locationName, setLocationName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("India");
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [googlelocation, setGooglelocation] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [lookingUpPincode, setLookingUpPincode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const orgId = user?.organisationid ?? 0;
  const hasPin = lat !== 0 && lng !== 0;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/register?type=business", { replace: true });
      return;
    }
    if (!orgId) {
      if (isPendingBusinessOnboarding()) {
        navigate(BUSINESS_ONBOARDING_RETURN_PATH, { replace: true });
      } else {
        navigate(USER_POST_LOGIN_PATH, { replace: true });
      }
    }
  }, [isAuthenticated, orgId, navigate]);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const req = new OrganisationLocationSelectReq();
        req.organisationid = orgId;
        const rows = await locationService.select(req);
        const primary = (rows || [])[0];
        if (!cancelled && primary) {
          setLocation(primary);
          setLocationName(primary.name || "");
          setAddress1(primary.addressline1 || "");
          setAddress2(primary.addressline2 || "");
          setCity(primary.city || "");
          setState(primary.state || "");
          setPincode(primary.pincode || "");
          setCountry(primary.country || "India");
          setLat(primary.latitude || 0);
          setLng(primary.longitude || 0);
          setGooglelocation(primary.googlelocation || "");
        }
      } catch {
        toast({
          title: "Could not load location",
          description: "Please try again.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, locationService, toast]);

  const lookupPincode = useCallback(async (pin: string) => {
    if (pin.length !== 6) return;
    setLookingUpPincode(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      const office = data?.[0]?.Status === "Success" ? data[0]?.PostOffice?.[0] : null;
      if (office) {
        setCity((prev) => prev || office.District || office.Block || "");
        setState((prev) => prev || office.State || "");
        setCountry((prev) => prev || office.Country || "India");
        setErrors((e) => {
          const next = { ...e };
          delete next.city;
          delete next.state;
          delete next.country;
          delete next.pincode;
          return next;
        });
      }
    } catch {
      // Manual correction is always allowed
    } finally {
      setLookingUpPincode(false);
    }
  }, []);

  const validate = () => {
    const next: Record<string, string> = {};
    const cleanName = sanitizeLocationName(locationName);
    if (!cleanName) {
      next.locationName = "Location name is required (letters and numbers only).";
    }
    if (!address1.trim()) next.address1 = "Address line 1 is required.";
    if (!city.trim()) next.city = "City is required.";
    if (!state.trim()) next.state = "State is required.";
    if (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) {
      next.pincode = "Enter a valid 6-digit pincode.";
    }
    if (!country.trim()) next.country = "Country is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleContinue = async () => {
    if (!validate() || !orgId) return;
    setSaving(true);
    try {
      const base = location ?? new OrganisationLocation();
      const payload = {
        ...base,
        id: location?.id ?? 0,
        organisationid: orgId,
        name: sanitizeLocationName(locationName),
        addressline1: address1.trim(),
        addressline2: address2.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: country.trim(),
        latitude: hasPin ? lat : 0,
        longitude: hasPin ? lng : 0,
        googlelocation: googlelocation || `${city.trim()}, ${state.trim()}, ${country.trim()}`,
        isactive: true,
      } as OrganisationLocation;

      if (payload.id > 0) {
        await locationService.save(payload);
      } else {
        await locationService.insert(payload);
      }

      refreshAuth();
      setBusinessOnboardingStep("offerings");

      toast({
        title: "Location saved",
        description: "Next: what does your business offer?",
      });
      // Screen 4 — offerings
      navigate(BUSINESS_OFFERINGS_PATH, { replace: true });
    } catch (error: any) {
      toast({
        title: "Could not save location",
        description: error?.response?.data?.error || error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#528ff0]" />
      </div>
    );
  }

  return (
    <>
    <RegisterOnboardingFormFrame>
          <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#528ff0]">
            Step 3 of {BUSINESS_ONBOARDING_TOTAL_STEPS}
          </p>
          <h1 className="mb-2 text-[22px] font-semibold leading-snug tracking-tight text-[#1a1a1a]">
            Where is your business located?
          </h1>
          <p className="mb-6 text-[14px] leading-relaxed text-[#667085]">
            Add your primary business location. You can add more branches later.
          </p>

          <div className="space-y-5">
          {/* Map pin section */}
          <div className="space-y-3">
            <div>
              <p className="text-[14px] font-semibold text-[#1a1a1a]">Pin your business on the map</p>
              <p className="mt-0.5 text-[12px] text-[#667085]">
                Search for your address or select the exact location. Browser location permission is not required.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
                hasPin
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-[#dbe4f0] bg-[#f5f9ff] hover:border-[#528ff0]/50 hover:bg-[#eef4ff]",
              )}
            >
              <span
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full",
                  hasPin ? "bg-emerald-100 text-emerald-700" : "bg-[#e0efff] text-[#528ff0]",
                )}
              >
                <MapPin className="h-6 w-6" />
              </span>
              {hasPin ? (
                <>
                  <p className="text-[13px] font-semibold text-emerald-800">Location pinned</p>
                  <p className="max-w-sm text-[12px] text-emerald-700/90 line-clamp-2">
                    {googlelocation || `${lat.toFixed(5)}, ${lng.toFixed(5)}`}
                  </p>
                  <span className="text-[12px] font-medium text-[#528ff0]">Change location on map</span>
                </>
              ) : (
                <>
                  <p className="text-[13px] font-semibold text-[#1a1a1a]">Interactive map</p>
                  <p className="text-[12px] text-[#667085]">Search address · place a pin · confirm</p>
                  <span className="mt-1 inline-flex items-center rounded-md bg-[#528ff0] px-3 py-1.5 text-[12px] font-semibold text-white">
                    Choose location on map
                  </span>
                </>
              )}
            </button>
            <p className="text-[11px] text-[#98a2b3]">
              Recommended so customers can find you. You can still continue with address details alone.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#6b7280]">Location name *</Label>
            <Input
              value={locationName}
              onChange={(e) => {
                setLocationName(sanitizeLocationName(e.target.value));
                setErrors((err) => {
                  const next = { ...err };
                  delete next.locationName;
                  return next;
                });
              }}
              placeholder="e.g. MainOffice or AnnaNagarBranch"
              className={cn(fieldClass, errors.locationName && "border-red-300")}
            />
            {errors.locationName ? (
              <p className="text-[12px] text-red-600">{errors.locationName}</p>
            ) : (
              <p className="text-[11px] text-[#98a2b3]">
                Letters and numbers only, without spaces or special characters.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#6b7280]">Address line 1 *</Label>
            <Input
              value={address1}
              onChange={(e) => {
                setAddress1(e.target.value);
                setErrors((err) => {
                  const next = { ...err };
                  delete next.address1;
                  return next;
                });
              }}
              placeholder="Building number and name"
              className={cn(fieldClass, errors.address1 && "border-red-300")}
            />
            {errors.address1 && <p className="text-[12px] text-red-600">{errors.address1}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#6b7280]">Address line 2</Label>
            <Input
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="Street, area or landmark (optional)"
              className={fieldClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#6b7280]">Pincode *</Label>
            <div className="relative">
              <Input
                value={pincode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPincode(value);
                  setErrors((err) => {
                    const next = { ...err };
                    delete next.pincode;
                    return next;
                  });
                  if (value.length === 6) void lookupPincode(value);
                }}
                onBlur={(e) => {
                  if (e.target.value.length === 6) void lookupPincode(e.target.value);
                }}
                placeholder="6-digit pincode"
                className={cn(fieldClass, errors.pincode && "border-red-300")}
                inputMode="numeric"
                maxLength={6}
              />
              {lookingUpPincode && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#528ff0]" />
              )}
            </div>
            {errors.pincode ? (
              <p className="text-[12px] text-red-600">{errors.pincode}</p>
            ) : (
              <p className="text-[11px] text-[#98a2b3]">
                Used to look up city, state and country when available. You can edit the fields below.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#6b7280]">City *</Label>
              <Input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setErrors((err) => {
                    const next = { ...err };
                    delete next.city;
                    return next;
                  });
                }}
                placeholder="City"
                className={cn(fieldClass, errors.city && "border-red-300")}
              />
              {errors.city && <p className="text-[12px] text-red-600">{errors.city}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-[#6b7280]">State *</Label>
              <Input
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setErrors((err) => {
                    const next = { ...err };
                    delete next.state;
                    return next;
                  });
                }}
                placeholder="State"
                className={cn(fieldClass, errors.state && "border-red-300")}
              />
              {errors.state && <p className="text-[12px] text-red-600">{errors.state}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#6b7280]">Country *</Label>
            <Input
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setErrors((err) => {
                  const next = { ...err };
                  delete next.country;
                  return next;
                });
              }}
              placeholder="Country"
              className={cn(fieldClass, errors.country && "border-red-300")}
            />
            {errors.country && <p className="text-[12px] text-red-600">{errors.country}</p>}
          </div>

          <Button type="button" disabled={saving} onClick={() => void handleContinue()} className={continueBtnClass}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving location…
              </>
            ) : (
              "Save location & continue"
            )}
          </Button>
          </div>
    </RegisterOnboardingFormFrame>

      <LocationPicker
        open={showPicker}
        onOpenChange={setShowPicker}
        onLocationSelect={(result) => {
          setLat(result.latitude);
          setLng(result.longitude);
          setGooglelocation(result.address || "");
          // Prefill from reverse geocode; user can still edit
          if (result.address) setAddress1(result.address);
          if (result.city) setCity(result.city);
          if (result.state) setState(result.state);
          if (result.country) setCountry(result.country);
          if (result.pincode) {
            setPincode(result.pincode);
            if (result.pincode.length === 6) void lookupPincode(result.pincode);
          }
        }}
      />
    </>
  );
};

export default RegisterBusinessLocation;
