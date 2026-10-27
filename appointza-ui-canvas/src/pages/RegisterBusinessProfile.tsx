import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AuthService } from "@/services/auth.service";
import { OrganisationService } from "@/services/organisation.service";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { FilesService } from "@/services/files.service";
import { ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { OrganisationSelectReq } from "@/models/organisation.model";
import { cn } from "@/lib/utils";
import {
  BUSINESS_LOCATION_PATH,
  BUSINESS_ONBOARDING_TOTAL_STEPS,
  isAllowedLogoFile,
  isPendingBusinessOnboarding,
  isValidGstin,
  readBusinessProfileDraft,
  readRegisterPlanCode,
  saveBusinessProfileDraft,
  setBusinessOnboardingStep,
} from "@/utils/businessOnboarding.util";
import { USER_POST_LOGIN_PATH } from "@/utils/postAuthNavigation";
import { RegisterOnboardingFormFrame } from "@/components/layout/RegisterOnboardingFormFrame";

const fieldClass =
  "h-11 min-h-11 rounded-md border-[#dbe4f0] bg-white text-[14px] shadow-none placeholder:text-[#98a2b3] focus-visible:border-[#528ff0] focus-visible:ring-[#528ff0]/20";

const continueBtnClass =
  "h-12 min-h-12 w-full touch-manipulation rounded-md border border-[#528ff0] bg-[#528ff0] text-[15px] font-semibold text-white shadow-none hover:bg-[#3d7ae8] disabled:opacity-50 disabled:hover:bg-[#528ff0]";

type FieldErrors = {
  orgName?: string;
  primarytype?: string;
  secondarytype?: string;
  gst?: string;
  referral?: string;
  logo?: string;
};

/** Screen 2 of 7 — business identity (not offerings). */
const RegisterBusinessProfile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshAuth, setUserType } = useAuth();
  const authService = useMemo(() => new AuthService(), []);
  const organisationService = useMemo(() => new OrganisationService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  const draft = useMemo(() => readBusinessProfileDraft(), []);

  const [orgName, setOrgName] = useState(draft?.orgName ?? "");
  const [gst, setGst] = useState(draft?.gst ?? "");
  const [referral, setReferral] = useState(draft?.referral ?? "");
  const [referralMsg, setReferralMsg] = useState("");
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [primaryTypes, setPrimaryTypes] = useState<Array<{ id: number; displaytext: string; identifier: string }>>([]);
  const [secondaryTypes, setSecondaryTypes] = useState<Array<{ id: number; displaytext: string; identifier: string }>>([]);
  const [primarytype, setPrimarytype] = useState(draft?.primarytype ?? 0);
  const [primarytypecode, setPrimarytypecode] = useState(draft?.primarytypecode ?? "");
  const [secondarytype, setSecondarytype] = useState(draft?.secondarytype ?? 0);
  const [secondarytypecode, setSecondarytypecode] = useState(draft?.secondarytypecode ?? "");
  const [organisationlogo, setOrganisationlogo] = useState(draft?.organisationlogo ?? 0);
  const [logoPreview, setLogoPreview] = useState<string | null>(draft?.logoPreview ?? null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [checkingOrg, setCheckingOrg] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/register?type=business", { replace: true });
      return;
    }

    const orgId = user?.organisationid ?? 0;
    if (orgId <= 0) {
      setCheckingOrg(false);
      if (!isPendingBusinessOnboarding()) {
        navigate(USER_POST_LOGIN_PATH, { replace: true });
      }
      return;
    }

    // Draft orgs (created at Screen 1) stay here; completed profiles continue to location.
    let cancelled = false;
    setCheckingOrg(true);
    void (async () => {
      try {
        const req = new OrganisationSelectReq();
        req.id = orgId;
        const rows = await organisationService.select(req);
        const org = rows?.[0];
        const name = String(org?.name || "");
        const isDraft =
          !org ||
          Number(org.primarytype) <= 0 ||
          name.startsWith("Pending setup") ||
          String(org.notes || "") === "onboarding_draft";
        if (cancelled) return;
        if (!isDraft) {
          setBusinessOnboardingStep("location");
          navigate(BUSINESS_LOCATION_PATH, { replace: true });
        }
      } catch {
        // Stay on profile if we cannot load the org yet.
      } finally {
        if (!cancelled) setCheckingOrg(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.organisationid, navigate, organisationService]);

  useEffect(() => {
    const load = async () => {
      setLoadingTypes(true);
      try {
        const req = new ReferenceValueSelectReq();
        req.referencetypeid = 1;
        const rows = await referenceValueService.select(req);
        const types = (rows || [])
          .filter((r) => r.isactive !== false)
          .map((r) => ({
            id: r.id,
            displaytext: r.displaytext || String(r.id),
            identifier: r.identifier || "",
          }));
        setPrimaryTypes(types);
        if (draft?.primarytype) {
          await loadSecondary(draft.primarytype, draft.secondarytype);
        }
      } catch {
        toast({
          title: "Could not load business types",
          description: "Please refresh and try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingTypes(false);
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft while typing so back/leave keeps values
  useEffect(() => {
    saveBusinessProfileDraft({
      orgName,
      gst,
      referral,
      primarytype,
      primarytypecode,
      secondarytype,
      secondarytypecode,
      organisationlogo,
      logoPreview,
    });
  }, [
    orgName,
    gst,
    referral,
    primarytype,
    primarytypecode,
    secondarytype,
    secondarytypecode,
    organisationlogo,
    logoPreview,
  ]);

  const loadSecondary = async (parentId: number, keepSecondaryId?: number) => {
    setSecondaryTypes([]);
    if (!keepSecondaryId) {
      setSecondarytype(0);
      setSecondarytypecode("");
    }
    try {
      const req = new ReferenceValueSelectReq();
      req.referencetypeid = 2;
      req.parentid = parentId;
      const rows = await referenceValueService.select(req);
      const types = (rows || [])
        .filter((r) => r.isactive !== false)
        .map((r) => ({
          id: r.id,
          displaytext: r.displaytext || String(r.id),
          identifier: r.identifier || "",
        }));
      setSecondaryTypes(types);
      if (keepSecondaryId && types.some((t) => t.id === keepSecondaryId)) {
        const selected = types.find((t) => t.id === keepSecondaryId);
        setSecondarytype(keepSecondaryId);
        setSecondarytypecode(selected?.identifier || "");
      }
    } catch {
      setSecondaryTypes([]);
    }
  };

  const verifyReferral = async () => {
    const code = referral.trim();
    if (!code) {
      setReferralValid(null);
      setReferralMsg("");
      return true;
    }
    try {
      const result = await organisationService.verifyReferral(code);
      setReferralValid(result.valid === true);
      setReferralMsg(
        result.message ||
          (result.valid
            ? "Referral code is valid."
            : "This referral code is not valid."),
      );
      return result.valid === true;
    } catch {
      setReferralValid(null);
      setReferralMsg("Could not verify code right now. You can continue and we will check again on save.");
      return true;
    }
  };

  const handleLogo = (file: File | null) => {
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      setOrganisationlogo(0);
      setErrors((e) => ({ ...e, logo: undefined }));
      return;
    }
    const check = isAllowedLogoFile(file);
    if (!check.ok) {
      setErrors((e) => ({ ...e, logo: check.message }));
      toast({ title: "Invalid logo", description: check.message, variant: "destructive" });
      return;
    }
    setErrors((e) => ({ ...e, logo: undefined }));
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const validateForm = async (): Promise<boolean> => {
    const next: FieldErrors = {};
    if (!orgName.trim()) next.orgName = "This organization name is required.";
    if (!primarytype) next.primarytype = "Please select a business type.";
    if (secondaryTypes.length > 0 && !secondarytype) {
      next.secondarytype = "Please select business details.";
    }
    if (gst.trim() && !isValidGstin(gst)) {
      next.gst = "Invalid GSTIN. Enter a valid 15-character GST number, or leave it blank.";
    }
    if (referral.trim()) {
      const ok = await verifyReferral();
      if (!ok) next.referral = referralMsg || "Invalid referral code.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleContinue = async () => {
    if (!(await validateForm())) return;

    setSaving(true);
    try {
      let logoId = organisationlogo;
      if (logoFile) {
        const uploaded = await filesService.upload([logoFile]);
        logoId = uploaded?.[0] ?? 0;
        setOrganisationlogo(logoId);
      }

      const context = await authService.completeBusinessOnboarding({
        organisationname: orgName.trim(),
        organisationgstnumber: gst.trim().toUpperCase(),
        primarytype,
        primarytypecode,
        secondarytype,
        secondarytypecode,
        organisationlogo: logoId,
        referral_code: referral.trim(),
        plan_code: readRegisterPlanCode(),
      });

      localStorage.setItem("auth_token", context.accesstoken || "");
      localStorage.setItem("refresh_token", context.refreshtoken || "");
      localStorage.setItem("user_context", JSON.stringify(context));
      localStorage.setItem("user_type", "organization");
      setUserType("organization");
      refreshAuth();
      setBusinessOnboardingStep("location");

      toast({
        title: "Business profile saved",
        description: "Next, add your business location.",
      });
      navigate(BUSINESS_LOCATION_PATH, { replace: true });
    } catch (error: any) {
      const data = error?.response?.data;
      toast({
        title: "Could not save business profile",
        description: data?.error || data?.message || error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (checkingOrg) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#528ff0]" />
      </div>
    );
  }

  return (
    <RegisterOnboardingFormFrame>
          <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#528ff0]">
            Step 2 of {BUSINESS_ONBOARDING_TOTAL_STEPS}
          </p>
          <h1 className="mb-2 text-[22px] font-semibold leading-snug tracking-tight text-[#1a1a1a]">
            Tell us about your business
          </h1>
          <p className="mb-6 text-[14px] leading-relaxed text-[#667085]">
            Create your business identity on Appointza.
          </p>

          <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[12px] font-medium text-[#6b7280]">Business logo</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative shrink-0">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-20 w-20 rounded-full border-4 border-[#c5dbff] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleLogo(null)}
                    className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white"
                    aria-label="Remove logo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-dashed border-[#c5dbff] bg-[#f0f7ff]">
                  <Building className="h-8 w-8 text-[#528ff0]/50" />
                </div>
              )}
              <div>
                <input
                  id="biz-logo"
                  type="file"
                  accept="image/png,image/jpeg,image/gif,.jpg,.jpeg,.png,.gif"
                  className="hidden"
                  onChange={(e) => handleLogo(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-md border-[#dbe4f0] hover:border-[#528ff0]/40 hover:bg-[#f5f9ff]"
                  onClick={() => document.getElementById("biz-logo")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4 text-[#528ff0]" />
                  Upload your logo
                </Button>
                <p className="mt-1 text-[11px] text-[#98a2b3]">JPG, PNG or GIF · Maximum 2 MB</p>
                {errors.logo && <p className="mt-1 text-[12px] text-red-600">{errors.logo}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#6b7280]">Business type *</Label>
            <Select
              disabled={loadingTypes}
              value={primarytype > 0 ? String(primarytype) : undefined}
              onValueChange={(value) => {
                const selected = primaryTypes.find((t) => t.id.toString() === value);
                if (!selected) return;
                setPrimarytype(selected.id);
                setPrimarytypecode(selected.identifier);
                setErrors((e) => ({ ...e, primarytype: undefined, secondarytype: undefined }));
                void loadSecondary(selected.id);
              }}
            >
              <SelectTrigger className={cn(fieldClass, "h-11", errors.primarytype && "border-red-300")}>
                <SelectValue placeholder={loadingTypes ? "Loading…" : "Select business type"} />
              </SelectTrigger>
              <SelectContent>
                {primaryTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.displaytext}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.primarytype && <p className="text-[12px] text-red-600">{errors.primarytype}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#6b7280]">Business details *</Label>
            <Select
              disabled={!primarytype || secondaryTypes.length === 0}
              value={secondarytype > 0 ? String(secondarytype) : undefined}
              onValueChange={(value) => {
                const selected = secondaryTypes.find((t) => t.id.toString() === value);
                if (!selected) return;
                setSecondarytype(selected.id);
                setSecondarytypecode(selected.identifier);
                setErrors((e) => ({ ...e, secondarytype: undefined }));
              }}
            >
              <SelectTrigger className={cn(fieldClass, "h-11", errors.secondarytype && "border-red-300")}>
                <SelectValue
                  placeholder={
                    !primarytype
                      ? "Select business type first"
                      : secondaryTypes.length === 0
                        ? "No details for this type"
                        : "Select business details"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {secondaryTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.displaytext}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.secondarytype && <p className="text-[12px] text-red-600">{errors.secondarytype}</p>}
            <p className="text-[11px] text-[#98a2b3]">
              Options update based on the business type you selected.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#6b7280]">Organization name *</Label>
            <Input
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value);
                setErrors((err) => ({ ...err, orgName: undefined }));
              }}
              placeholder="Your business name"
              className={cn(fieldClass, errors.orgName && "border-red-300")}
            />
            {errors.orgName ? (
              <p className="text-[12px] text-red-600">{errors.orgName}</p>
            ) : (
              <p className="text-[11px] text-[#98a2b3]">
                This name appears on your dashboard and business website. You can update it later if
                permitted.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#6b7280]">GST number (Optional)</Label>
            <Input
              value={gst}
              onChange={(e) => {
                setGst(e.target.value.toUpperCase());
                setErrors((err) => ({ ...err, gst: undefined }));
              }}
              placeholder="15-character GSTIN"
              className={cn(fieldClass, errors.gst && "border-red-300")}
              maxLength={15}
            />
            {errors.gst ? (
              <p className="text-[12px] text-red-600">{errors.gst}</p>
            ) : (
              <p className="text-[11px] text-[#98a2b3]">Leave blank if your business has no GST registration.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium text-[#6b7280]">Referral code (Optional)</Label>
            <Input
              value={referral}
              onChange={(e) => {
                setReferral(e.target.value.toUpperCase());
                setReferralValid(null);
                setReferralMsg("");
                setErrors((err) => ({ ...err, referral: undefined }));
              }}
              onBlur={() => void verifyReferral()}
              placeholder="Enter referral code"
              className={cn(fieldClass, errors.referral && "border-red-300")}
            />
            {errors.referral ? (
              <p className="text-[12px] text-red-600">{errors.referral}</p>
            ) : referralMsg ? (
              <p className={cn("text-[12px]", referralValid === false ? "text-red-600" : "text-emerald-700")}>
                {referralMsg}
              </p>
            ) : (
              <p className="text-[11px] text-[#98a2b3]">
                Have a code from another business? Enter it to claim eligible referral benefits.
              </p>
            )}
          </div>

          <Button type="button" disabled={saving} onClick={() => void handleContinue()} className={continueBtnClass}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Continue"
            )}
          </Button>
          </div>
    </RegisterOnboardingFormFrame>
  );
};

export default RegisterBusinessProfile;
