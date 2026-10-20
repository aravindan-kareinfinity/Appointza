import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  User,
  Camera,
  Save,
  Trash2,
  ArrowLeft,
  LogOut,
  Loader2,
  MapPin,
  Gift,
  Wallet,
  Copy,
  Award,
  Clock,
  Users as UsersIcon,
  FileText,
  CreditCard,
  Settings,
  Building2,
  MessageCircle,
  Mail,
  Database,
} from "lucide-react";
import { org } from "@/lib/orgTheme";
import { settingsEmbedded, profileSettingsX } from "@/lib/settingsEmbedded";
import SettingsEmbeddedHeader from "@/components/layout/SettingsEmbeddedHeader";
import OrganizationPageShell from "@/components/layout/OrganizationPageShell";
import { CreditWalletBillingPanel } from "@/components/organization/CreditWalletBillingPanel";
import { cn } from "@/lib/utils";
import TimingScreen from "@/pages/organization/Timing";
import StaffManagement from "@/pages/organization/StaffManagement";
import LocationsScreen from "@/pages/organization/Locations";
import OrganizationTemplates from "@/pages/organization/Templates";
import PaymentSettings from "@/pages/organization/PaymentSettings";
import OrganizationLoyalty from "@/pages/organization/Loyalty";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UsersService } from "@/services/users.service";
import { OrganisationService } from "@/services/organisation.service";
import { Users, UsersSelectReq, UsersGetOtpReq, Organisationdeletereq } from "@/models/users.model";
import OtpInput from "@/components/auth/OtpInput";
import type { OrganisationReferralInfoRes } from "@/models/organisation.model";
import { FilesService } from "@/services/files.service";
import { useLocation } from "@/hooks/useLocation";
import { useLocationList } from "@/hooks/useLocationList";
import IntegrationTokenPanel from "@/components/organization/IntegrationTokenPanel";
import WhatsAppIntegrationSettings from "@/pages/organization/WhatsAppIntegrationSettings";
import EmailIntegrationSettings from "@/pages/organization/EmailIntegrationSettings";
import ReferenceValuesPage from "@/pages/organization/ReferenceValues";

/** Settings nav — vertical sidebar on desktop. Mobile uses a select dropdown. */
const profileSidebarTriggerClass =
  "relative h-auto w-full justify-start gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium text-[#5b6572] shadow-none hover:bg-[#f4f6f9] hover:text-[#1a1a1a] data-[state=active]:bg-[#eef2f7] data-[state=active]:text-[#1a1a1a] data-[state=active]:shadow-none data-[state=active]:before:absolute data-[state=active]:before:left-0 data-[state=active]:before:top-1.5 data-[state=active]:before:bottom-1.5 data-[state=active]:before:w-[3px] data-[state=active]:before:rounded-r-full data-[state=active]:before:bg-[#2a5af5]";

const profileSidebarListClass =
  "hidden !h-auto w-full flex-col items-stretch justify-start gap-0.5 rounded-none border-0 bg-transparent p-0 shadow-none lg:flex";

const profileCardHeaderClass = cn(profileSettingsX, "w-full space-y-1.5 py-5 md:py-6");
const profileCardContentClass = cn(profileSettingsX, "w-full pt-0");
const profileCardTitleClass = "text-lg font-semibold leading-snug text-appointza-navy md:text-xl";
const profileCardDescClass = "text-sm text-stone-500";

const profileTabPanelClass = "m-0 mt-0 focus-visible:outline-none";

const profileFieldInputClass = cn(org.input, "mt-1.5 h-11 min-h-11 md:h-10 md:min-h-10");

const profileSectionDivider = "border-t border-stone-200 pt-6 md:pt-8";

const profileSectionIconWrap =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600";

function usersProfileFromAuthUser(user: {
  id: number;
  username?: string;
  firstname?: string;
  email?: string;
  mobile: string;
  organisationid: number;
  locationid: number;
  imageid?: number;
}): Users {
  const next = new Users();
  next.id = user.id || 0;
  next.name = user.username || user.firstname || "";
  next.email = user.email || "";
  next.mobile = user.mobile || "";
  next.designation = "";
  next.organisationid = user.organisationid || 0;
  next.locationid = user.locationid || 0;
  next.profileimage = user.imageid || 0;
  next.notes = "";
  return next;
}

type ProfileSettingsTab =
  | "profile"
  | "business-hours"
  | "staff"
  | "organization"
  | "location"
  | "templates"
  | "payment"
  | "loyalty"
  | "billing"
  | "whatsapp"
  | "email"
  | "appointment-values"
  | "account";

const OrganizationProfile = () => {
  const { user, isAuthenticated, logout, refreshAuth } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = user?.id || 0;
  const organizationId = user?.organisationid || 0;
  
  // Check if user is staff - use from user context (already calculated correctly in AuthContext)
  const isStaff = user?.isStaff === true;
  
  // Get user context from localStorage for permissions
  const getUserContext = () => {
    try {
      const userContextStr = localStorage.getItem('user_context');
      if (!userContextStr) return null;
      return JSON.parse(userContextStr);
    } catch (error) {
      console.error('Error parsing user_context:', error);
      return null;
    }
  };
  
  const userContext = getUserContext();
  const userpermission = userContext?.userpermission || {};
  
  // Check permissions for Quick Navigation buttons (non-staff users have full access)
  const hasBusinessHoursAccess = !isStaff || userpermission?.editandviewBusinessHours === true;
  const hasStaffManagementAccess = !isStaff || userpermission?.editandviewStaffManagement === true;
  const hasLocationManagementAccess = !isStaff || userpermission?.editandviewLocationManagement === true;
  const hasTemplatesAccess = !isStaff || userpermission?.editandviewTemplates === true;
  const hasPaymentSettingsAccess = !isStaff || userpermission?.editandviewPaymentSettings === true;
  const hasBusinessValuesAccess = !isStaff || userpermission?.editandviewBusinessvalues === true;

  const accessibleTabValues = useMemo((): ProfileSettingsTab[] => {
    const list: ProfileSettingsTab[] = ["profile"];
    if (hasBusinessHoursAccess) list.push("business-hours");
    if (hasStaffManagementAccess) list.push("staff");
    if (hasLocationManagementAccess) {
      list.push("organization");
      list.push("location");
    }
    if (hasTemplatesAccess) list.push("templates");
    if (hasPaymentSettingsAccess) list.push("payment");
    if (!isStaff) list.push("loyalty");
    if (!isStaff) list.push("billing");
    if (!isStaff) {
      list.push("whatsapp");
      list.push("email");
    }
    if (hasBusinessValuesAccess) list.push("appointment-values");
    list.push("account");
    return list;
  }, [
    hasBusinessHoursAccess,
    hasStaffManagementAccess,
    hasLocationManagementAccess,
    hasTemplatesAccess,
    hasPaymentSettingsAccess,
    hasBusinessValuesAccess,
    isStaff,
  ]);

  const settingsNavItems = useMemo(
    () =>
      (
        [
          { value: "profile", label: "Profile", icon: User },
          { value: "business-hours", label: "Business Hours", icon: Clock },
          { value: "staff", label: "Staff", icon: UsersIcon },
          { value: "organization", label: "Organisation", icon: Building2 },
          { value: "location", label: "Location", icon: MapPin },
          { value: "templates", label: "Templates", icon: FileText },
          { value: "payment", label: "Payment Settings", icon: CreditCard },
          { value: "loyalty", label: "Loyalty", icon: Award },
          { value: "billing", label: "Credit Wallet", icon: Wallet },
          { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
          { value: "email", label: "Email", icon: Mail },
          { value: "appointment-values", label: "Reference Values", icon: Database },
          { value: "account", label: "Account", icon: Settings },
        ] as const
      ).filter((item) => accessibleTabValues.includes(item.value)),
    [accessibleTabValues],
  );

  const activeTab = useMemo(() => {
    const raw = searchParams.get("tab");
    if (raw === "integrations") return "whatsapp";
    const tab = raw as ProfileSettingsTab | null;
    if (tab === "location" && searchParams.get("subtab") === "organization") {
      return hasLocationManagementAccess ? "organization" : "profile";
    }
    if (tab && accessibleTabValues.includes(tab)) return tab;
    return "profile";
  }, [searchParams, accessibleTabValues, hasLocationManagementAccess]);

  const setActiveTab = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", value);
        next.delete("section");
        next.delete("subtab");
        next.delete("edit");
        return next;
      },
      { replace: true },
    );
  };

  const { 
    currentLocation, 
    getLocationDisplayName, 
    getFullAddress 
  } = useLocation();

  const { 
    locations: availableLocations, 
    isLoading: isLocationListLoading,
  } = useLocationList();

  // API services
  const usersService = useMemo(() => new UsersService(), []);
  const organisationService = useMemo(() => new OrganisationService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  // State
  const [profile, setProfile] = useState<Users>(new Users());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImageVersion, setProfileImageVersion] = useState(0);
  const [profileImageBlobUrl, setProfileImageBlobUrl] = useState("");
  const [isProfileImageLoading, setIsProfileImageLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [otp, setOtp] = useState('');
  const [isSendingDeleteOtp, setIsSendingDeleteOtp] = useState(false);
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [referralInfo, setReferralInfo] = useState<OrganisationReferralInfoRes | null>(null);
  const [referralAlreadyApplied, setReferralAlreadyApplied] = useState(false);
  const [canApplyReferralCode, setCanApplyReferralCode] = useState(true);
  const [isLoadingReferralStatus, setIsLoadingReferralStatus] = useState(false);
  const [isApplyingReferral, setIsApplyingReferral] = useState(false);

  // Update user_context in localStorage with latest user data
  const updateUserContext = useCallback(async (userData: Users) => {
    try {
      const userContextStr = localStorage.getItem('user_context');
      if (!userContextStr) {
        console.warn('⚠️ user_context not found in localStorage');
        return;
      }
      
      const userContext = JSON.parse(userContextStr);
      const oldPermissions = JSON.stringify(userContext.userpermission || {});
      
      // Update user data from fetched profile
      userContext.userid = userData.id || userContext.userid;
      userContext.username = userData.name || userContext.username;
      userContext.useremail = userData.email || userContext.useremail;
      userContext.usermobile = userData.mobile || userContext.usermobile;
      userContext.userimageid = userData.profileimage || userContext.userimageid;
      userContext.organisationid = userData.organisationid || userContext.organisationid;
      userContext.organisationlocationid = userData.locationid || userContext.organisationlocationid;
      
      // Update permissions from userData.attributes.permission
      if (userData.attributes && userData.attributes.permission) {
        userContext.userpermission = userData.attributes.permission;
      }
      
      // Save updated user_context back to localStorage
      localStorage.setItem('user_context', JSON.stringify(userContext));
      console.log('✅ Updated user_context in localStorage with latest user data');
      
      // Dispatch custom event to notify other components (for same-tab updates)
      // This allows components to react without causing full re-renders
      window.dispatchEvent(new CustomEvent('userContextUpdated', { 
        detail: { userpermission: userContext.userpermission } 
      }));
      
      // Note: We don't call refreshAuth() immediately to prevent flickering
      // Components (sidebar, route protection, etc.) read directly from localStorage
      // AuthContext will be refreshed naturally on next navigation or page interaction
    } catch (error) {
      console.error('❌ Error updating user_context:', error);
    }
  }, []);

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      return;
    }
    
    setIsLoading(true);
    try {
      const req = new UsersSelectReq();
      req.id = userId;
      
      const response = await usersService.select(req);
      
      if (response && response.length > 0) {
        const userData = response[0];
        setProfile(userData);
        
        // Update user_context in localStorage with latest data
        await updateUserContext(userData);
      } else {
        // Fallback to user context data if API returns empty
        if (user) {
          const fallbackProfile = usersProfileFromAuthUser(user);
          console.log('✅ Setting fallback profile with ID:', fallbackProfile.id);
          setProfile(fallbackProfile);
        }
      }
    } catch (error) {
      // Fallback to user context data on error
      if (user) {
        const fallbackProfile = usersProfileFromAuthUser(user);
        console.log('✅ Setting error fallback profile with ID:', fallbackProfile.id);
        setProfile(fallbackProfile);
      }
      
      toast({
        title: "Warning",
        description: "Using cached profile data. Some information may be outdated.",
        variant: "default"
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, usersService, toast, user, updateUserContext]);

  const loadReferralStatus = useCallback(async () => {
    if (!isAuthenticated || isStaff || organizationId <= 0) {
      return;
    }
    setIsLoadingReferralStatus(true);
    try {
      const info = await organisationService.getReferral(organizationId);
      setReferralInfo(info ?? null);
      setReferralAlreadyApplied(info?.referral_already_applied ?? false);
      setCanApplyReferralCode(
        info?.can_apply_referral_code ?? !info?.referral_already_applied,
      );
    } catch {
      setReferralInfo(null);
      setCanApplyReferralCode(true);
    } finally {
      setIsLoadingReferralStatus(false);
    }
  }, [isAuthenticated, isStaff, organizationId, organisationService]);

  const referralSignupUrl = useMemo(() => {
    if (!referralInfo?.referral_code) return "";
    const params = new URLSearchParams({ ref: referralInfo.referral_code });
    return `${window.location.origin}/register?${params.toString()}`;
  }, [referralInfo?.referral_code]);

  const copyReferralCode = async () => {
    if (!referralInfo?.referral_code) return;
    try {
      await navigator.clipboard.writeText(referralInfo.referral_code);
      toast({ title: "Copied", description: "Your referral code was copied." });
    } catch {
      toast({
        title: "Could not copy",
        description: "Please copy the code manually.",
        variant: "destructive",
      });
    }
  };

  const copyReferralLink = async () => {
    if (!referralSignupUrl) return;
    try {
      await navigator.clipboard.writeText(referralSignupUrl);
      toast({ title: "Copied", description: "Referral signup link copied." });
    } catch {
      toast({
        title: "Could not copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleApplyReferralCode = async () => {
    const code = referralCodeInput.trim();
    if (!code) {
      toast({
        title: "Enter a code",
        description: "Please enter a referral code.",
        variant: "destructive",
      });
      return;
    }
    setIsApplyingReferral(true);
    try {
      const result = await organisationService.applyReferral(code, organizationId);
      if (result?.success) {
        toast({
          title: "Referral applied",
          description: result.message || "Referral code applied successfully.",
        });
        setReferralCodeInput("");
        setReferralAlreadyApplied(true);
        setCanApplyReferralCode(false);
        void loadReferralStatus();
      } else {
        toast({
          title: "Could not apply",
          description: result?.message || "Invalid referral code.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to apply referral code.",
        variant: "destructive",
      });
    } finally {
      setIsApplyingReferral(false);
    }
  };

  // Load profile data when profile or account tab is active
  const needsUserProfile = activeTab === "profile" || activeTab === "account";

  // Load profile on component mount
  useEffect(() => {
    if (needsUserProfile) {
      void loadProfile();
    }
  }, [needsUserProfile, loadProfile]);

  useEffect(() => {
    if (activeTab === "profile" && !isStaff) {
      void loadReferralStatus();
    }
  }, [activeTab, isStaff, loadReferralStatus]);

  // Immediate fallback if user context is available but profile is empty
  useEffect(() => {
    if (user && (!profile.name || profile.name === '')) {
      const immediateProfile = usersProfileFromAuthUser(user);
      console.log('✅ Setting immediate fallback profile with ID:', immediateProfile.id);
      setProfile(immediateProfile);
    }
  }, [user, profile.name]);

  // Load profile image via authenticated fetch (img src cannot send Authorization header)
  useEffect(() => {
    if (activeTab !== "profile") {
      return;
    }

    let cancelled = false;

    const loadProfileImage = async () => {
      const imageId = profile.profileimage;
      if (!imageId || imageId <= 0) {
        setProfileImageBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return "";
        });
        setIsProfileImageLoading(false);
        return;
      }

      setIsProfileImageLoading(true);
      try {
        const userContextStr = localStorage.getItem("user_context");
        const authHeaders: Record<string, string> = {};
        if (userContextStr) {
          const userContext = JSON.parse(userContextStr);
          const token = userContext.accesstoken;
          if (token) {
            authHeaders.Authorization = `Bearer ${token}`;
          }
        }

        const response = await fetch(
          `${filesService.getImageUrl(imageId)}&v=${profileImageVersion}`,
          {
            method: "GET",
            headers: { Accept: "image/*", ...authHeaders },
          },
        );

        if (cancelled) return;

        if (response.ok) {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setProfileImageBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return objectUrl;
          });
        } else {
          console.error("Failed to load profile image:", response.status);
          setProfileImageBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return "";
          });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading profile image:", error);
          setProfileImageBlobUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return "";
          });
        }
      } finally {
        if (!cancelled) {
          setIsProfileImageLoading(false);
        }
      }
    };

    loadProfileImage();

    return () => {
      cancelled = true;
    };
  }, [activeTab, profile.profileimage, profileImageVersion, filesService]);

  // Save profile
  const handleSaveProfile = async () => {
    console.log('🔍 Save button clicked');
    console.log('🔍 isAuthenticated:', isAuthenticated);
    console.log('🔍 userId:', userId);
    console.log('🔍 profile data:', profile);
    
    if (!isAuthenticated || !userId) {
      console.log('❌ Cannot save - not authenticated or no userId');
      toast({
        title: "Error",
        description: "Please log in to save your profile",
        variant: "destructive"
      });
      return;
    }
    
    if (!profile.id || profile.id === 0) {
      console.log('❌ Cannot save - profile has no ID');
      toast({
        title: "Error",
        description: "Profile data is not loaded properly. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('💾 Saving profile:', profile);
      const result = await usersService.save(profile);
      console.log('✅ Save result:', result);

      const savedProfile = result ?? profile;
      setProfile(savedProfile);
      await updateUserContext(savedProfile);
      refreshAuth();
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      console.error('❌ Error details:', error);
      toast({
        title: "Error",
        description: `Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle profile image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    if (!isAuthenticated || !userId || !profile.id) {
      toast({
        title: "Error",
        description: "Profile not loaded. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadedFiles = await filesService.upload([file]);

      if (!uploadedFiles?.length) {
        throw new Error("No file ID returned from upload");
      }

      const imageId = uploadedFiles[0];
      const updatedProfile = { ...profile, profileimage: imageId };
      setProfile(updatedProfile);
      setProfileImageVersion((v) => v + 1);

      const savedProfile = await usersService.save(updatedProfile);
      const persistedProfile = savedProfile ?? updatedProfile;
      setProfile(persistedProfile);
      await updateUserContext(persistedProfile);
      refreshAuth();

      toast({
        title: "Success",
        description: "Profile photo updated",
      });
    } catch (error) {
      console.error("❌ Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteOtpMobile = (profile.mobile || user?.mobile || "").replace(/[\s\-()]/g, "");

  const resetDeleteDialogState = () => {
    setOtp("");
    setDeleteOtpSent(false);
    setIsSendingDeleteOtp(false);
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setShowDeleteDialog(open);
    if (!open) {
      resetDeleteDialogState();
    }
  };

  const sendDeleteConfirmationOtp = async () => {
    if (!deleteOtpMobile) {
      toast({
        title: "Mobile number required",
        description: "Add a mobile number to your profile before deleting the organization.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingDeleteOtp(true);
    try {
      const getOtpReq = new UsersGetOtpReq();
      getOtpReq.mobile = deleteOtpMobile;
      await usersService.getotp(getOtpReq);
      setDeleteOtpSent(true);
      setOtp("");
      toast({
        title: "OTP sent",
        description: `Enter the verification code sent to ${deleteOtpMobile}.`,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { key?: string; message?: string } }; message?: string };
      const key = err?.response?.data?.key;
      const message = err?.response?.data?.message || err?.message || "Failed to send OTP";
      toast({
        title: key === "UserNotFound" ? "Account not found" : "Failed to send OTP",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSendingDeleteOtp(false);
    }
  };

  const getDeleteOrganizationErrorMessage = (error: unknown) => {
    const err = error as { response?: { data?: { key?: string; message?: string } }; message?: string };
    const key = err?.response?.data?.key;
    switch (key) {
      case "OtpInvalid":
        return "The verification code is incorrect. Request a new OTP and try again.";
      case "OtpExpired":
        return "The verification code has expired. Request a new OTP and try again.";
      case "UsersNotFound":
        return "Your account could not be found. Please sign in again.";
      default:
        return err?.response?.data?.message || err?.message || "Failed to delete organization";
    }
  };

  // Handle organization deletion
  const handleDeleteOrganization = async () => {
    if (!isAuthenticated || !userId || !organizationId) return;

    if (!deleteOtpSent || otp.length !== 6) {
      toast({
        title: "Verification required",
        description: "Send an OTP to your mobile number and enter the 6-digit code to confirm deletion.",
        variant: "destructive",
      });
      return;
    }
    
    setIsDeleting(true);
    try {
      const req = new Organisationdeletereq();
      req.organisationid = organizationId;
      req.userid = userId;
      req.otp = otp;

      await usersService.DeleteOrganisationPermananet(req);
      localStorage.clear();
      toast({
        title: "Organization Deleted",
        description: "Your organization has been permanently deleted.",
      });
      window.location.href = '/login';
    } catch (error) {
      console.error('❌ Error deleting organization:', error);
      toast({
        title: "Error",
        description: getDeleteOrganizationErrorMessage(error),
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const showProfileImage =
    profile.profileimage > 0 && (profileImageBlobUrl || isProfileImageLoading);

  const legacyOrganisationTab = searchParams.get("tab");
  if (legacyOrganisationTab === "organisation") {
    const section = searchParams.get("section");
    const to =
      section ?
        `/organization/hospitality?section=${encodeURIComponent(section)}`
      : "/organization/hospitality";
    return <Navigate to={to} replace />;
  }

  if (activeTab === "profile" && isLoading) {
    return (
      <div className={cn(org.loading, "flex-col gap-3")}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-stone-600">Loading profile…</p>
      </div>
    );
  }
  
  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className={cn(org.page, "flex h-full min-h-0 flex-col bg-white lg:flex-row")}
    >
        <aside className="shrink-0 border-b border-stone-200 bg-white lg:h-full lg:w-56 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="px-4 py-3 md:px-6 lg:px-3 lg:py-5">
            <p className="mb-3 hidden px-3 text-xs font-semibold uppercase tracking-wide text-stone-400 lg:block">
              Settings
            </p>
            <div className="lg:hidden">
              <label htmlFor="profile-settings-nav" className="sr-only">
                Settings
              </label>
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger
                  id="profile-settings-nav"
                  className="h-11 min-h-11 border-stone-200 shadow-none"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="item-aligned" className="z-[110] max-h-[min(24rem,70dvh)]">
                  {settingsNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SelectItem key={item.value} value={item.value} className="min-h-11">
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0" aria-hidden />
                          {item.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <TabsList className={profileSidebarListClass}>
              <TabsTrigger value="profile" className={profileSidebarTriggerClass}>
                <User className="h-4 w-4 shrink-0" />
                Profile
              </TabsTrigger>
              {hasBusinessHoursAccess && (
                <TabsTrigger value="business-hours" className={profileSidebarTriggerClass}>
                  <Clock className="h-4 w-4 shrink-0" />
                  Business Hours
                </TabsTrigger>
              )}
              {hasStaffManagementAccess && (
                <TabsTrigger value="staff" className={profileSidebarTriggerClass}>
                  <UsersIcon className="h-4 w-4 shrink-0" />
                  Staff
                </TabsTrigger>
              )}
              {hasLocationManagementAccess && (
                <TabsTrigger value="organization" className={profileSidebarTriggerClass}>
                  <Building2 className="h-4 w-4 shrink-0" />
                  Organisation
                </TabsTrigger>
              )}
              {hasLocationManagementAccess && (
                <TabsTrigger value="location" className={profileSidebarTriggerClass}>
                  <MapPin className="h-4 w-4 shrink-0" />
                  Location
                </TabsTrigger>
              )}
              {hasTemplatesAccess && (
                <TabsTrigger value="templates" className={profileSidebarTriggerClass}>
                  <FileText className="h-4 w-4 shrink-0" />
                  Templates
                </TabsTrigger>
              )}
              {hasPaymentSettingsAccess && (
                <TabsTrigger value="payment" className={profileSidebarTriggerClass}>
                  <CreditCard className="h-4 w-4 shrink-0" />
                  Payment Settings
                </TabsTrigger>
              )}
              {!isStaff && (
                <TabsTrigger value="loyalty" className={profileSidebarTriggerClass}>
                  <Award className="h-4 w-4 shrink-0" />
                  Loyalty
                </TabsTrigger>
              )}
              {!isStaff && (
                <TabsTrigger value="billing" className={profileSidebarTriggerClass}>
                  <Wallet className="h-4 w-4 shrink-0" />
                  Credit Wallet
                </TabsTrigger>
              )}
              {!isStaff && (
                <TabsTrigger value="whatsapp" className={profileSidebarTriggerClass}>
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  WhatsApp
                </TabsTrigger>
              )}
              {!isStaff && (
                <TabsTrigger value="email" className={profileSidebarTriggerClass}>
                  <Mail className="h-4 w-4 shrink-0" />
                  Email
                </TabsTrigger>
              )}
              <TabsTrigger value="account" className={profileSidebarTriggerClass}>
                <Settings className="h-4 w-4 shrink-0" />
                Account
              </TabsTrigger>
            </TabsList>
          </div>
        </aside>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-white pt-0">
            <Card className={cn(org.card, "min-h-full w-full rounded-none border-0 bg-white shadow-none")}>
            <TabsContent value="profile" className={profileTabPanelClass}>
              <div className="w-full">
            {/* Profile Photo */}
            <div className={cn(profileCardHeaderClass, "bg-white")}>
              <CardTitle className={`flex items-center gap-3 ${profileCardTitleClass}`}>
                <span className={profileSectionIconWrap}>
                  <Camera className="h-5 w-5" />
                </span>
                <span>Profile Photo</span>
              </CardTitle>
              <CardDescription className={profileCardDescClass}>Upload or change your profile photo</CardDescription>
            </div>
            <div className={`${profileCardContentClass} pb-6 md:pb-8`}>
              <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-6">
                <div className="relative shrink-0">
                  {showProfileImage ? (
                    isProfileImageLoading && !profileImageBlobUrl ? (
                      <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-blue-100 bg-blue-50 shadow-none ring-1 ring-blue-200">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <img
                        key={profileImageBlobUrl}
                        src={profileImageBlobUrl}
                        alt="Profile"
                        className="h-28 w-28 rounded-full border-4 border-blue-100 object-cover shadow-none ring-1 ring-blue-200"
                      />
                    )
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-dashed border-blue-200 bg-blue-50 ring-1 ring-blue-100">
                      <User className="h-12 w-12 text-blue-400" />
                    </div>
                  )}
                </div>
                <div className="w-full min-w-0 text-center md:w-auto md:text-left">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-image-upload"
                  />
                  <Button
                    variant="outline"
                    disabled={isUploadingImage}
                    onClick={() => document.getElementById('profile-image-upload')?.click()}
                    className={cn(org.btnOutline, "mb-2 min-h-11 w-full touch-manipulation md:w-auto")}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />
                    ) : (
                      <Camera className="h-4 w-4 shrink-0 text-blue-600" />
                    )}
                    {isUploadingImage
                      ? "Uploading…"
                      : profile.profileimage === 0
                        ? "Upload Photo"
                        : "Change Photo"}
                  </Button>
                  <p className="text-xs text-stone-500 md:text-sm">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className={profileSectionDivider}>
              <div className={profileCardHeaderClass}>
                <CardTitle className={`flex items-center gap-3 ${profileCardTitleClass}`}>
                  <span className={profileSectionIconWrap}>
                    <User className="h-5 w-5" />
                  </span>
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription className={profileCardDescClass}>
                  Update your personal and organization details
                </CardDescription>
              </div>
              <div className={`${profileCardContentClass} space-y-4 pb-6 md:space-y-6 md:pb-8`}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                  <div className="min-w-0">
                    <Label htmlFor="name" className={org.label}>Name</Label>
                    <Input
                      id="name"
                      value={profile.name || ""}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Enter your name"
                      className={profileFieldInputClass}
                      autoComplete="name"
                    />
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="mobile" className={org.label}>Contact Number</Label>
                    <Input
                      id="mobile"
                      value={profile.mobile || ""}
                      onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                      placeholder="Enter your contact number"
                      type="tel"
                      inputMode="tel"
                      className={profileFieldInputClass}
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>
            </div>

            {!isStaff && (
              <div className={profileSectionDivider}>
                <div className={profileCardHeaderClass}>
                  <CardTitle className={`flex items-center gap-3 ${profileCardTitleClass}`}>
                    <span className={profileSectionIconWrap}>
                      <Gift className="h-5 w-5" />
                    </span>
                    <span>Referral code</span>
                  </CardTitle>
                  <CardDescription className={profileCardDescClass}>
                    Share your code with other businesses. When they sign up with it, you get{" "}
                    {referralInfo?.bonus_credits_per_referral ?? 50} free booking credits per
                    successful referral.
                  </CardDescription>
                </div>
                <div className={`${profileCardContentClass} space-y-6 pb-6 md:pb-8`}>
                  {isLoadingReferralStatus ? (
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      Loading referral code…
                    </div>
                  ) : referralInfo?.referral_code ? (
                    <div className="space-y-4">
                      <div>
                        <Label className={org.label}>Your referral code</Label>
                        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                          <Input
                            readOnly
                            value={referralInfo.referral_code}
                            className={cn(profileFieldInputClass, "font-mono")}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void copyReferralCode()}
                            className="min-h-11 shrink-0 touch-manipulation"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy code
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className={org.label}>Signup link</Label>
                        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                          <Input readOnly value={referralSignupUrl} className={profileFieldInputClass} />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void copyReferralLink()}
                            className="min-h-11 shrink-0 touch-manipulation"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy link
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-stone-500">
                        Successful referrals:{" "}
                        <span className="font-semibold text-appointza-navy">
                          {referralInfo.successful_referrals}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-stone-500">
                      Your referral code is not available yet. Save your profile or contact support if
                      this persists.
                    </p>
                  )}

                  <div className="border-t border-stone-200 pt-5">
                    <p className="mb-3 text-sm font-medium text-appointza-navy">
                      Have a code from another business?
                    </p>
                  {referralAlreadyApplied || !canApplyReferralCode ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
                      Referral code already applied for this organization.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1">
                        <Label htmlFor="referral-code" className={org.label}>
                          Referral code (one time)
                        </Label>
                        <Input
                          id="referral-code"
                          value={referralCodeInput}
                          onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                          placeholder="APZ-XXXXXXXX"
                          className={profileFieldInputClass}
                          autoComplete="off"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleApplyReferralCode}
                        disabled={isApplyingReferral || !referralCodeInput.trim()}
                        className={cn(org.btnPrimary, "min-h-11 shrink-0 touch-manipulation")}
                      >
                        {isApplyingReferral ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Applying…
                          </>
                        ) : (
                          "Apply code"
                        )}
                      </Button>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            )}

            {!isStaff && organizationId > 0 && (
              <IntegrationTokenPanel
                embedded
                headerClass={profileCardHeaderClass}
                contentClass={profileCardContentClass}
                titleClass={profileCardTitleClass}
                descClass={profileCardDescClass}
                iconWrapClass={profileSectionIconWrap}
              />
            )}

            {/* Location Information for Staff Users */}
            {isStaff && currentLocation && (
              <div className={profileSectionDivider}>
                <div className={profileCardHeaderClass}>
                  <CardTitle className={`flex items-center gap-3 ${profileCardTitleClass}`}>
                    <span className={profileSectionIconWrap}>
                      <MapPin className="h-5 w-5" />
                    </span>
                    <span>Your Location Details</span>
                  </CardTitle>
                  <CardDescription className={profileCardDescClass}>
                    Location information for staff access
                  </CardDescription>
                </div>
                <div className={`${profileCardContentClass} pb-6 md:pb-8`}>
                  <div className="space-y-4">
                    <div>
                      <Label className={org.label}>Location Name</Label>
                      <div className="mt-1.5 rounded-xl border border-stone-200 bg-white p-3">
                        <span className="font-medium text-appointza-navy">{currentLocation.name}</span>
                      </div>
                    </div>

                    <div>
                      <Label className={org.label}>Full Address</Label>
                      <div className="mt-1.5 rounded-xl border border-stone-200 bg-white p-3">
                        <span className="text-sm text-stone-700">{getFullAddress()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label className={org.label}>Phone</Label>
                        <div className="mt-1.5 rounded-xl border border-stone-200 bg-white p-3">
                          <span className="text-sm text-stone-700">
                            {currentLocation.phone || "Not provided"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className={org.label}>Email</Label>
                        <div className="mt-1.5 rounded-xl border border-stone-200 bg-white p-3">
                          <span className="text-sm text-stone-700">
                            {currentLocation.email || "Not provided"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="break-words text-sm font-medium text-emerald-800">
                          Staff Access: {getLocationDisplayName()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Available Locations */}
            <div className={profileSectionDivider}>
              <div className={profileCardHeaderClass}>
                <CardTitle className={`flex items-center gap-3 ${profileCardTitleClass}`}>
                  <span className={profileSectionIconWrap}>
                    <MapPin className="h-5 w-5" />
                  </span>
                  <span>Available Locations</span>
                </CardTitle>
                <CardDescription className={profileCardDescClass}>
                  {isStaff ? "Your assigned location" : "Location selected on the Dashboard"}
                </CardDescription>
              </div>
              <div className={`${profileCardContentClass} pb-6 md:pb-8`}>
                {isLocationListLoading ? (
                  <div className="flex h-16 items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-sm text-stone-600">Loading locations…</span>
                  </div>
                ) : availableLocations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-200 bg-appointza-cream/40 p-6 text-center text-sm text-stone-500">
                    No locations available
                  </div>
                ) : (
                  <div className={settingsEmbedded.list}>
                    {availableLocations.map((location) => (
                      <div
                        key={location.id}
                        className={cn(settingsEmbedded.row(true), "md:items-center md:justify-between")}
                      >
                        <div className="flex min-w-0 items-start gap-3 md:items-center">
                          <div className={profileSectionIconWrap}>
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-appointza-navy">{location.name}</h3>
                            <p className="break-words text-sm text-stone-600">
                              {location.city && location.state
                                ? `${location.city}, ${location.state}`
                                : location.address || "No address"}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 self-start md:self-auto">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                              location.isactive ?
                                "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                location.isactive ? "bg-emerald-500" : "bg-red-500"
                              )}
                            />
                            {location.isactive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className={cn(profileSettingsX, "border-t border-stone-200 bg-white py-4 md:py-5")}>
              <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end md:gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className={cn(org.btnOutline, "min-h-11 w-full touch-manipulation md:w-auto")}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className={cn(org.btnPrimary, "min-h-11 w-full touch-manipulation md:w-auto")}
                >
                  {isSaving ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Profile
                </Button>
              </div>
            </div>
              </div>
            </TabsContent>

            {hasBusinessHoursAccess && (
              <TabsContent value="business-hours" className={profileTabPanelClass}>
                {activeTab === "business-hours" ? <TimingScreen embedded /> : null}
              </TabsContent>
            )}

            {hasStaffManagementAccess && (
              <TabsContent value="staff" className={profileTabPanelClass}>
                {activeTab === "staff" ? <StaffManagement embedded /> : null}
              </TabsContent>
            )}

            {hasLocationManagementAccess && (
              <TabsContent value="organization" className={profileTabPanelClass}>
                {activeTab === "organization" ? (
                  <LocationsScreen embedded section="organization" />
                ) : null}
              </TabsContent>
            )}

            {hasLocationManagementAccess && (
              <TabsContent value="location" className={profileTabPanelClass}>
                {activeTab === "location" ? (
                  <LocationsScreen embedded section="locations" />
                ) : null}
              </TabsContent>
            )}

            {hasTemplatesAccess && (
              <TabsContent value="templates" className={profileTabPanelClass}>
                {activeTab === "templates" ? <OrganizationTemplates embedded /> : null}
              </TabsContent>
            )}

            {hasPaymentSettingsAccess && (
              <TabsContent value="payment" className={profileTabPanelClass}>
                {activeTab === "payment" ? <PaymentSettings embedded /> : null}
              </TabsContent>
            )}

            {!isStaff && (
              <TabsContent value="loyalty" className={profileTabPanelClass}>
                {activeTab === "loyalty" ? <OrganizationLoyalty embedded /> : null}
              </TabsContent>
            )}

            {!isStaff && (
              <TabsContent value="billing" className={profileTabPanelClass}>
                {activeTab === "billing" ? (
                  <OrganizationPageShell embedded>
                    <SettingsEmbeddedHeader
                      icon={Wallet}
                      title="Credit Wallet"
                      description="50 free booking credits on sign-in, plus Razorpay recharge packs."
                    />
                    <div className={settingsEmbedded.sectionBody}>
                      <CreditWalletBillingPanel organisationId={organizationId} />
                    </div>
                  </OrganizationPageShell>
                ) : null}
              </TabsContent>
            )}

            {!isStaff && (
              <TabsContent
                value="whatsapp"
                className={cn(profileTabPanelClass, "min-h-full data-[state=inactive]:hidden")}
              >
                {activeTab === "whatsapp" ? <WhatsAppIntegrationSettings embedded /> : null}
              </TabsContent>
            )}

            {!isStaff && (
              <TabsContent
                value="email"
                className={cn(profileTabPanelClass, "min-h-full data-[state=inactive]:hidden")}
              >
                {activeTab === "email" ? <EmailIntegrationSettings embedded /> : null}
              </TabsContent>
            )}

            {hasBusinessValuesAccess && (
              <TabsContent
                value="appointment-values"
                className={cn(profileTabPanelClass, "min-h-full data-[state=inactive]:hidden")}
              >
                {activeTab === "appointment-values" ? <ReferenceValuesPage embedded /> : null}
              </TabsContent>
            )}

            <TabsContent value="account" className={profileTabPanelClass}>
              <div>
                <SettingsEmbeddedHeader
                  icon={User}
                  title="Account"
                  description="Manage your account settings and logout"
                />
                <div className={cn(settingsEmbedded.sectionBody, "py-6 md:py-8")}>
                  <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
                    <p className="text-sm text-stone-500">
                      Sign out of your organization account on this device.
                    </p>
                    <Button
                      onClick={handleLogout}
                      className={cn(
                        org.btnPrimary,
                        "h-14 min-h-14 w-full touch-manipulation rounded-xl bg-none bg-blue-600 px-6 text-base font-semibold shadow-none hover:bg-blue-700",
                      )}
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      Log out
                    </Button>
                  </div>
                </div>

                <div className={profileSectionDivider}>
                  <div className={cn(profileCardContentClass, "py-4 md:py-5")}>
                    <p className="text-xs leading-relaxed text-stone-400">
                      Permanently delete this organization and all associated data. This cannot be undone.
                    </p>

                    <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteDialogOpenChange}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-8 px-2 text-xs font-normal text-stone-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete organization
                        </Button>
                      </AlertDialogTrigger>
                        <AlertDialogContent className="max-h-[min(90dvh,40rem)] w-[calc(100vw-1.5rem)] max-w-lg gap-3 overflow-y-auto p-4 md:p-6">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-600">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your organization and
                              remove all data from our servers. All services, appointments, staff, and customer
                              information will be lost forever.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="space-y-4 py-4">
                            <p className="text-sm text-stone-500">
                              {deleteOtpMobile
                                ? `We will send a verification code to ${deleteOtpMobile} to confirm this action.`
                                : "Add a mobile number to your profile before deleting the organization."}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={sendDeleteConfirmationOtp}
                              disabled={!deleteOtpMobile || isSendingDeleteOtp}
                              className="min-h-11 w-full touch-manipulation"
                            >
                              {isSendingDeleteOtp ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Sending OTP...
                                </>
                              ) : deleteOtpSent ? (
                                "Resend OTP"
                              ) : (
                                "Send OTP"
                              )}
                            </Button>
                            {deleteOtpSent && (
                              <div className="space-y-2">
                                <Label>Enter verification code</Label>
                                <OtpInput onChange={setOtp} onComplete={setOtp} />
                              </div>
                            )}
                          </div>
                          <AlertDialogFooter className="gap-2 md:gap-0">
                            <AlertDialogCancel className="min-h-11 w-full touch-manipulation md:w-auto">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteOrganization}
                              disabled={isDeleting || !deleteOtpSent || otp.length !== 6}
                              className="min-h-11 w-full touch-manipulation bg-red-600 hover:bg-red-700 md:w-auto"
                            >
                              {isDeleting ? (
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Delete Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                  </div>
                </div>
              </div>
            </TabsContent>
            </Card>
        </div>
    </Tabs>
  );
};

export default OrganizationProfile;