
import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, MapPin, Building, User, Check, Camera, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { UsersRegisterReq } from "@/models/users.model";
import { UsersService } from "@/services/users.service";
import { AuthService } from "@/services/auth.service";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { LocationPicker } from "@/components/organization/LocationPicker";
import { resolvePostLoginPath, USER_POST_LOGIN_PATH } from "@/utils/postAuthNavigation";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";

const registerTabTriggerClass =
  "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-600 shadow-none transition-colors hover:text-stone-800 data-[state=active]:bg-gradient-coral data-[state=active]:text-white data-[state=active]:shadow-sm";

const registerFieldInputClass = cn(org.input, "h-11 min-h-11 md:h-10 md:min-h-10");

const registerSectionIconWrap =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600";

const registerSectionTitleClass = "text-lg font-semibold leading-snug text-appointza-navy";
const registerSectionDescClass = "text-sm text-stone-500";
const VALID_PLAN_CODES = new Set(["free", "starter", "growth", "business", "enterprise", "premium"]);

const normalizePlanCode = (raw: string | null): string => {
  const code = (raw ?? "").trim().toLowerCase();
  return VALID_PLAN_CODES.has(code) ? code : "free";
};

/** Location name: letters and numbers only, no spaces. */
const sanitizeLocationName = (value: string) => value.replace(/[^a-zA-Z0-9]/g, "");

const Register = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUserType: setAuthUserType, refreshAuth } = useAuth();
  const [userType, setUserType] = useState<"user" | "organization">("user");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Form state
  const [signUpModel, setSignUpModel] = useState(new UsersRegisterReq());
  
  // Image upload states
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [orgLogo, setOrgLogo] = useState<File | null>(null);
  const [orgLogoPreview, setOrgLogoPreview] = useState<string | null>(null);
  
  // Business types
  const [primaryBusinessTypes, setPrimaryBusinessTypes] = useState<Array<{id: number, displaytext: string, identifier: string}>>([]);
  const [secondaryBusinessTypes, setSecondaryBusinessTypes] = useState<Array<{id: number, displaytext: string, identifier: string}>>([]);
  const [isLoadingBusinessTypes, setIsLoadingBusinessTypes] = useState(false);
  
  // Pincode lookup state
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const [pincodeTimeout, setPincodeTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Location picker state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  // Services
  const usersService = useMemo(() => new UsersService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);

  // Load business types on component mount
  useEffect(() => {
    fetchReferenceTypes();
  }, []);

  useEffect(() => {
    const planFromUrl = normalizePlanCode(searchParams.get("plan"));
    const referralFromUrl =
      searchParams.get("ref")?.trim() ||
      searchParams.get("referral")?.trim() ||
      "";
    setSignUpModel((prev) => ({
      ...prev,
      plan_code: planFromUrl,
      referral_code: referralFromUrl || prev.referral_code,
    }));
    if (planFromUrl !== "free") {
      setUserType("organization");
    }
  }, [searchParams]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pincodeTimeout) {
        clearTimeout(pincodeTimeout);
      }
    };
  }, [pincodeTimeout]);

  const fetchReferenceTypes = async () => {
    setIsLoadingBusinessTypes(true);
    try {
      // Fetch primary business types from API using ORGANISATIONPRIMARYTYPE = 1
      const selectReq = new ReferenceValueSelectReq();
      selectReq.referencetypeid = 1; // ORGANISATIONPRIMARYTYPE = 1
      
      const businessTypes = await referenceValueService.select(selectReq);
      
      if (businessTypes && businessTypes.length > 0) {
        const formattedTypes = businessTypes.map(type => ({
          id: type.id,
          displaytext: type.displaytext,
          identifier: type.identifier
        }));
        setPrimaryBusinessTypes(formattedTypes);
      } else {
        toast({
          title: "No Data Available",
          description: "No business types found. Please contact support.",
          variant: "destructive",
        });
        setPrimaryBusinessTypes([]);
      }
    } catch (error) {
      console.error("Error fetching business types:", error);
      toast({
        title: "Error",
        description: "Failed to load business types. Please try again later.",
        variant: "destructive",
      });
      setPrimaryBusinessTypes([]);
    } finally {
      setIsLoadingBusinessTypes(false);
    }
  };

  const fetchReferenceValues = async (id: number) => {
    try {
      // Fetch secondary business types from API using ORGANISATIONSECONDARYTYPE = 2
      const selectReq = new ReferenceValueSelectReq();
      selectReq.referencetypeid = 2; // ORGANISATIONSECONDARYTYPE = 2
      selectReq.parentid = id; // Use the selected primary type ID as parent
      
      const businessDetails = await referenceValueService.select(selectReq);
      
      if (businessDetails && businessDetails.length > 0) {
        const formattedDetails = businessDetails.map(detail => ({
          id: detail.id,
          displaytext: detail.displaytext,
          identifier: detail.identifier
        }));
        setSecondaryBusinessTypes(formattedDetails);
      } else {
        toast({
          title: "No Data Available",
          description: "No business details found for selected type. Please contact support.",
          variant: "destructive",
        });
        setSecondaryBusinessTypes([]);
      }
    } catch (error) {
      console.error("Error fetching business details:", error);
      toast({
        title: "Error",
        description: "Failed to load business details. Please try again later.",
        variant: "destructive",
      });
      setSecondaryBusinessTypes([]);
    }
  };

  const lookupPincode = async (pincode: string) => {
    if (!pincode || pincode.length !== 6) return;
    
    setIsLookingUpPincode(true);
    try {
      // Using a free pincode API
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        
        setSignUpModel(prev => ({
          ...prev,
          locationcity: postOffice.District || '',
          locationstate: postOffice.State || '',
          locationcountry: postOffice.Country || 'India',
          locationpincode: pincode
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


  // Handle location selection from LocationPicker — coordinates + city/state only; name/address lines are manual
  const handleLocationSelect = (locationData: {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  }) => {
    setSignUpModel(prev => ({
      ...prev,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      googlelocation: locationData.address,
      locationcity: locationData.city || prev.locationcity,
      locationstate: locationData.state || prev.locationstate,
      locationcountry: locationData.country || prev.locationcountry || 'India',
      locationpincode: locationData.pincode || prev.locationpincode,
    }));

    const areaLabel = [locationData.city, locationData.state].filter(Boolean).join(", ");
    toast({
      title: "Location Selected",
      description: areaLabel
        ? `Map pin set. Enter location name and address below (${areaLabel}).`
        : "Map pin set. Enter your location name and address below.",
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'org') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (type === 'profile') {
        setProfileImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfileImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setOrgLogo(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setOrgLogoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (type: 'profile' | 'org') => {
    if (type === 'profile') {
      setProfileImage(null);
      setProfileImagePreview(null);
    } else {
      setOrgLogo(null);
      setOrgLogoPreview(null);
    }
  };

  const validateForm = (): boolean => {
    if (!signUpModel.username) {
      toast({
        title: "Missing Information",
        description: "Please enter your name",
        variant: "destructive",
      });
      return false;
    }
    if (!signUpModel.usermobile) {
      toast({
        title: "Missing Information",
        description: "Please enter mobile number",
        variant: "destructive",
      });
      return false;
    }
    if (signUpModel.usermobile.length !== 10) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return false;
    }
    if (userType === "organization") {
      if (!signUpModel.organisationname) {
        toast({
          title: "Missing Information",
          description: "Please enter organization name",
          variant: "destructive",
        });
        return false;
      }
      if (!signUpModel.primarytype || signUpModel.primarytype === 0) {
        toast({
          title: "Missing Information",
          description: "Please select a business type",
          variant: "destructive",
        });
        return false;
      }
      if (!signUpModel.secondarytype || signUpModel.secondarytype === 0) {
        toast({
          title: "Missing Information",
          description: "Please select business details",
          variant: "destructive",
        });
        return false;
      }
      // Validate location name and address (user-entered; not auto-filled from map)
      if (!signUpModel.locationname) {
        toast({
          title: "Missing Information",
          description: "Please enter a location name (letters and numbers only)",
          variant: "destructive",
        });
        return false;
      }
      if (!signUpModel.locationaddressline1?.trim()) {
        toast({
          title: "Missing Information",
          description: "Please enter address line 1",
          variant: "destructive",
        });
        return false;
      }
      if (!signUpModel.locationcity || !signUpModel.locationstate || !signUpModel.locationpincode) {
        toast({
          title: "Missing Information",
          description: "Please fill in city, state, and pincode",
          variant: "destructive",
        });
        return false;
      }
      // Validate that latitude and longitude are provided
      if (!signUpModel.latitude || !signUpModel.longitude || signUpModel.latitude === 0 || signUpModel.longitude === 0) {
        toast({
          title: "Missing Location",
          description: "Please select a location using the map picker",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // Ensure googlelocation is set
      const registrationData = {
        ...signUpModel,
        googlelocation: signUpModel.googlelocation || `${signUpModel.locationcity}, ${signUpModel.locationstate}, ${signUpModel.locationcountry}`
      };
      
      const response = await usersService.register(registrationData);
      
      if (response) {
        toast({
          title: "Registration Successful",
          description: "Please check your phone for OTP verification",
        });
        
        // Navigate to OTP verification page with registration context
        navigate('/otp', { 
          state: { 
            mobile: signUpModel.usermobile,
            name: signUpModel.username,
            isRegistration: true,
            from: userType === 'organization' ? '/organization/dashboard' : USER_POST_LOGIN_PATH
          } 
        });
      }
    } catch (error: any) {
      console.error('❌ Registration Error:', error);
      console.error('❌ Error Response Data:', error?.response?.data);
      console.error('❌ Error Response Status:', error?.response?.status);
      console.error('❌ Full Error Object:', {
        message: error?.message,
        response: error?.response,
        data: error?.response?.data
      });
      
      // Extract error message from various possible locations
      let errorMessage = 'Registration failed';
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        
        // Try different possible error message locations
        // Check 'error' field first (contains detailed message)
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.key) {
          errorMessage = errorData.key;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          // If it's an object, try to stringify it
          errorMessage = JSON.stringify(errorData);
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show the exact error message to the user
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000, // Show for 5 seconds so user can read it
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign-In for registration
  const handleGoogleSignUp = async (credentialResponse: any) => {
    setGoogleLoading(true);
    try {
      const authService = new AuthService();
      
      // Decode the JWT token to get user info
      const base64Url = credentialResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const userInfo = JSON.parse(jsonPayload);
      
      console.log('✅ Google Sign-Up successful:', userInfo);
      
      // For organization registration, we need additional info
      if (userType === 'organization') {
        // Check if user wants to complete organization setup now or later
        // For now, we'll create a basic account and redirect to organization setup
        toast({
          title: "Google Sign-Up",
          description: "Please complete your organization details after signing in.",
        });
      }
      
      // Call backend Google login API: POST /api/Auth/GoogleLogin (it will create account if doesn't exist)
      const userContext = await authService.googleLogin(
        credentialResponse.credential,
        userInfo.email,
        userInfo.name || userInfo.given_name || userInfo.email.split('@')[0],
        userInfo.picture
      );
      
      if (!userContext || !userContext.userid || userContext.userid <= 0) {
        throw new Error('Invalid login response from server');
      }
      
      // Store all auth data in localStorage (same pattern as OTP login)
      console.log('💾 Storing GoogleSignUp response in localStorage:', {
        userid: userContext.userid,
        hasAccessToken: !!userContext.accesstoken,
        hasRefreshToken: !!userContext.refreshtoken,
        organisationid: userContext.organisationid
      });
      
      // Store tokens
      localStorage.setItem('auth_token', userContext.accesstoken || '');
      localStorage.setItem('refresh_token', userContext.refreshtoken || '');
      
      // Store complete user context (all user data)
      localStorage.setItem('user_context', JSON.stringify(userContext));
      
      // Determine user type: User is a business if they have an organisation; otherwise a customer
      const iscustomer = userContext.organisationlocationid == 0 || userContext.organisationlocationid == null;
      const userTypeValue = iscustomer ? 'user' : 'organization';
      
      console.log('User type determined:', userTypeValue, 'iscustomer:', iscustomer);
      
      localStorage.setItem('user_type', userTypeValue);
      setAuthUserType(userTypeValue);
      
      // Verify storage
      const storedToken = localStorage.getItem('auth_token');
      const storedRefreshToken = localStorage.getItem('refresh_token');
      const storedContext = localStorage.getItem('user_context');
      console.log('✅ Storage verification:', {
        tokenStored: !!storedToken,
        refreshTokenStored: !!storedRefreshToken,
        contextStored: !!storedContext,
        userType: userTypeValue
      });
      
      // Get and save push notification token for all platforms (web, iOS, Android)
      try {
        const { pushNotificationService } = await import('@/services/pushnotification.service');
        console.log('🚀 Starting push notification token save process...');
        
        if (userContext?.userid) {
          console.log('👤 User ID from login response:', userContext.userid);
          
          // Add a small delay to ensure everything is ready
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const success = await pushNotificationService.updateTokenForUser(userContext.userid);
          
          if (success) {
            console.log('✅ Push token updated successfully for user:', userContext.userid);
          } else {
            console.warn('⚠️ Push token update failed, login will continue');
          }
        }
      } catch (error) {
        console.error('❌ Exception during push token update:', error);
        // Don't block registration if push token save fails
      }
      
      // Refresh auth state to update the context
      refreshAuth();
      
      toast({
        title: "Registration Successful",
        description: `Welcome to Appointza, ${userContext.username || userInfo.name}!`,
      });
      
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        // Redirect based on user type and registration type
        if (userType === 'organization' && !userContext.organisationid) {
          navigate('/organization/dashboard', { replace: true });
        } else {
          navigate(resolvePostLoginPath(userTypeValue === 'user' ? 'user' : 'organization'), {
            replace: true,
          });
        }
      }, 100);
    } catch (error: any) {
      console.error('❌ Google Sign-Up Error:', error);
      console.error('❌ Error Response Data:', error?.response?.data);
      console.error('❌ Error Response Status:', error?.response?.status);
      console.error('❌ Full Error Object:', {
        message: error?.message,
        response: error?.response,
        data: error?.response?.data
      });
      
      // Extract error message from various possible locations
      let errorMessage = 'Google sign-up failed';
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        
        // Try different possible error message locations
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.key) {
          errorMessage = errorData.key; // e.g., "UsersNotFound"
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          // If it's an object, try to stringify it
          errorMessage = JSON.stringify(errorData);
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show the exact error message to the user
      toast({
        title: "Google Sign-Up Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000, // Show for 5 seconds so user can read it
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = (error?: any) => {
    console.error('❌ Google Sign-Up Error:', error);
    
    let errorMessage = "Unable to sign up with Google. Please try again.";
    
    // Check for specific OAuth errors
    if (error?.type === 'popup_closed_by_user') {
      errorMessage = "Sign-up popup was closed. Please try again.";
    } else if (error?.type === 'popup_failed_to_open') {
      errorMessage = "Unable to open Google sign-up popup. Please check your browser settings.";
    } else if (error?.error === 'popup_closed_by_user') {
      errorMessage = "Sign-up popup was closed. Please try again.";
    } else if (error?.error) {
      // Check for OAuth configuration errors
      const errorStr = String(error.error).toLowerCase();
      if (errorStr.includes('redirect_uri_mismatch') || errorStr.includes('origin_mismatch')) {
        errorMessage = "OAuth configuration error: Please contact support. The domain may not be authorized in Google Cloud Console.";
      } else if (errorStr.includes('invalid_client')) {
        errorMessage = "OAuth client configuration error. Please contact support.";
      }
    }
    
    toast({
      title: "Google Sign-Up Failed",
      description: errorMessage,
      variant: "destructive",
      duration: 5000,
    });
  };

  const perks = useMemo(
    () => [
      "Branded booking website in minutes",
      "WhatsApp & email automation included",
      "Accept online payments out of the box",
      "Free forever for up to 50 bookings/mo",
    ],
    [],
  );

  return (
    <div className="grid h-dvh overflow-hidden bg-white lg:grid-cols-2">
      {/* Left: form */}
      <div className="order-2 flex h-dvh flex-col overflow-y-auto bg-appointza-cream lg:order-1">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-10 lg:px-10">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex items-center gap-2">
              <img
                src="/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png"
                alt="Appointza"
                className="h-9 w-9 object-contain"
              />
              <span className="text-lg font-bold text-appointza-navy">Appointza</span>
            </div>
          </div>

          <header className="mb-8">
            <h1 className={org.title}>Create your workspace</h1>
            <p className={org.description}>14-day Pro trial. No credit card required.</p>
          </header>

          <Tabs
            value={userType}
            onValueChange={(value) => setUserType(value as "user" | "organization")}
            className="w-full"
          >
            <TabsList
              className={cn(
                org.segmentGroup,
                "mb-6 grid h-auto w-full grid-cols-2 gap-1 bg-white p-1 shadow-sm",
              )}
            >
              <TabsTrigger value="user" className={registerTabTriggerClass}>
                <User className="h-4 w-4" />
                User Account
              </TabsTrigger>
              <TabsTrigger value="organization" className={registerTabTriggerClass}>
                <Building className="h-4 w-4" />
                Organization
              </TabsTrigger>
            </TabsList>
          
          <TabsContent value="user" className="mt-0 focus-visible:outline-none">
            <Card className={cn(org.card, "overflow-hidden rounded-3xl border-blue-50")}>
              <CardHeader className="space-y-1.5 border-b border-blue-50 bg-gradient-to-br from-blue-50/80 via-white to-violet-50/50 p-5 md:p-6">
                <CardTitle className={cn("flex items-center gap-3", registerSectionTitleClass)}>
                  <span className={registerSectionIconWrap}>
                    <User className="h-5 w-5" />
                  </span>
                  User Registration
                </CardTitle>
                <CardDescription className={registerSectionDescClass}>
                  Create your personal account to book appointments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-5 md:p-6">
                <div className="space-y-3">
                  <Label htmlFor="profile-image" className={org.label}>
                    Profile Picture (optional)
                  </Label>
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                    {profileImagePreview ? (
                      <div className="relative shrink-0">
                        <img
                          src={profileImagePreview}
                          alt="Profile preview"
                          className="h-28 w-28 rounded-full border-4 border-blue-100 object-cover shadow-md ring-2 ring-blue-500/25"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage("profile")}
                          className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-dashed border-blue-200 bg-blue-50 ring-2 ring-blue-500/15">
                        <User className="h-12 w-12 text-blue-600/50" />
                      </div>
                    )}
                    <div className="text-center sm:text-left">
                      <input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "profile")}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(org.btnOutline, "min-h-11 w-full sm:w-auto")}
                        onClick={() => document.getElementById("profile-image")?.click()}
                      >
                        <Camera className="mr-2 h-4 w-4 text-blue-600" />
                        Upload Photo
                      </Button>
                      <p className="mt-2 text-xs text-stone-500">JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                  <div className="space-y-2">
                    <Label className={org.label}>Full Name *</Label>
                    <Input
                      placeholder="Enter your full name"
                      value={signUpModel.username}
                      onChange={(e) => setSignUpModel((prev) => ({ ...prev, username: e.target.value }))}
                      className={registerFieldInputClass}
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={org.label}>Mobile Number *</Label>
                    <Input
                      placeholder="Enter 10-digit mobile number"
                      value={signUpModel.usermobile}
                      onChange={(e) =>
                        setSignUpModel((prev) => ({ ...prev, usermobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))
                      }
                      className={registerFieldInputClass}
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={org.label}>Email</Label>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={signUpModel.useremail}
                    onChange={(e) => setSignUpModel((prev) => ({ ...prev, useremail: e.target.value }))}
                    className={registerFieldInputClass}
                    autoComplete="email"
                  />
                </div>

                <div className="border-t border-stone-100 bg-gradient-to-r from-blue-50/80 to-white pt-6">
                  <Button
                    onClick={handleSignUp}
                    disabled={isLoading || googleLoading}
                    className={cn(org.btnPrimary, "min-h-11 w-full touch-manipulation")}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account…
                      </>
                    ) : (
                      "Create User Account"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="organization" className="mt-0 focus-visible:outline-none">
            <Card className={cn(org.card, "overflow-hidden rounded-3xl border-blue-50")}>
              <CardHeader className="space-y-1.5 border-b border-blue-50 bg-gradient-to-br from-blue-50/80 via-white to-violet-50/50 p-5 md:p-6">
                <CardTitle className={cn("flex items-center gap-3", registerSectionTitleClass)}>
                  <span className={registerSectionIconWrap}>
                    <Building className="h-5 w-5" />
                  </span>
                  Organization Registration
                </CardTitle>
                <CardDescription className={registerSectionDescClass}>
                  Create your business account to manage appointments and services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 p-5 md:p-6">
                <div className="space-y-3">
                  <Label htmlFor="org-logo" className={org.label}>
                    Organization Logo (optional)
                  </Label>
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                    {orgLogoPreview ? (
                      <div className="relative shrink-0">
                        <img
                          src={orgLogoPreview}
                          alt="Logo preview"
                          className="h-28 w-28 rounded-full border-4 border-blue-100 object-cover shadow-md ring-2 ring-blue-500/25"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage("org")}
                          className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-dashed border-blue-200 bg-blue-50 ring-2 ring-blue-500/15">
                        <Building className="h-12 w-12 text-blue-600/50" />
                      </div>
                    )}
                    <div className="text-center sm:text-left">
                      <input
                        id="org-logo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "org")}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(org.btnOutline, "min-h-11 w-full sm:w-auto")}
                        onClick={() => document.getElementById("org-logo")?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4 text-blue-600" />
                        Upload Logo
                      </Button>
                      <p className="mt-2 text-xs text-stone-500">JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                  <div className="space-y-2">
                    <Label className={org.label}>Business Type *</Label>
                    <Select
                      disabled={isLoadingBusinessTypes || primaryBusinessTypes.length === 0}
                      onValueChange={(value) => {
                        const selectedType = primaryBusinessTypes.find((t) => t.id.toString() === value);
                        if (selectedType) {
                          setSecondaryBusinessTypes([]);
                          setSignUpModel((prev) => ({
                            ...prev,
                            primarytype: selectedType.id,
                            primarytypecode: selectedType.identifier,
                            secondarytype: 0,
                            secondarytypecode: "",
                          }));
                          fetchReferenceValues(selectedType.id);
                        }
                      }}
                    >
                      <SelectTrigger className={cn(org.selectTrigger, "h-11")}>
                        <SelectValue
                          placeholder={
                            isLoadingBusinessTypes
                              ? "Loading business types…"
                              : primaryBusinessTypes.length === 0
                                ? "No business types available"
                                : "Select business type"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {primaryBusinessTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.displaytext}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {primaryBusinessTypes.length === 0 && !isLoadingBusinessTypes && (
                      <p className="text-sm text-red-600">No business types available. Please contact support.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className={org.label}>Business Details *</Label>
                    <Select
                      disabled={!signUpModel.primarytype || secondaryBusinessTypes.length === 0}
                      onValueChange={(value) => {
                        const selectedDetail = secondaryBusinessTypes.find((d) => d.id.toString() === value);
                        if (selectedDetail) {
                          setSignUpModel((prev) => ({
                            ...prev,
                            secondarytype: selectedDetail.id,
                            secondarytypecode: selectedDetail.identifier,
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className={cn(org.selectTrigger, "h-11")}>
                        <SelectValue
                          placeholder={
                            !signUpModel.primarytype
                              ? "Select business type first"
                              : secondaryBusinessTypes.length === 0
                                ? "No business details available"
                                : "Select business details"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {secondaryBusinessTypes.map((detail) => (
                          <SelectItem key={detail.id} value={detail.id.toString()}>
                            {detail.displaytext}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {signUpModel.primarytype > 0 && secondaryBusinessTypes.length === 0 && (
                      <p className="text-sm text-red-600">
                        No business details available for selected type. Please contact support.
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 border-t border-stone-100 pt-6">
                  <div className="flex items-center gap-3">
                    <span className={registerSectionIconWrap}>
                      <Building className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className={registerSectionTitleClass}>Organization Information</h3>
                      <p className={registerSectionDescClass}>Basic details about your business</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label className={org.label}>Organization Name *</Label>
                      <Input
                        placeholder="Enter organization name"
                        value={signUpModel.organisationname}
                        onChange={(e) => setSignUpModel((prev) => ({ ...prev, organisationname: e.target.value }))}
                        className={registerFieldInputClass}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className={org.label}>GST Number</Label>
                      <Input
                        placeholder="Enter GST number (optional)"
                        value={signUpModel.organisationgstnumber}
                        onChange={(e) =>
                          setSignUpModel((prev) => ({ ...prev, organisationgstnumber: e.target.value }))
                        }
                        className={registerFieldInputClass}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className={org.label}>Referral code (optional)</Label>
                      <Input
                        placeholder="Enter a referral code if you have one"
                        value={signUpModel.referral_code}
                        onChange={(e) =>
                          setSignUpModel((prev) => ({
                            ...prev,
                            referral_code: e.target.value.toUpperCase(),
                          }))
                        }
                        className={registerFieldInputClass}
                      />
                      <p className="text-xs text-stone-500">
                        Have a code from another business? Enter it here — they get 50 free booking
                        credits when you sign up.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-stone-100 pt-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className={registerSectionIconWrap}>
                        <MapPin className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className={registerSectionTitleClass}>Location Information</h3>
                        <p className={registerSectionDescClass}>Pin your business on the map and enter address details</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowLocationPicker(true)}
                      className={cn(org.btnOutline, "min-h-11 shrink-0 touch-manipulation")}
                    >
                      <MapPin className="mr-2 h-4 w-4 text-blue-600" />
                      {signUpModel.latitude !== 0 && signUpModel.longitude !== 0
                        ? "Change Location"
                        : "Pick Location"}
                    </Button>
                  </div>

                  {signUpModel.latitude !== 0 && signUpModel.longitude !== 0 && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-appointza-navy">Map location pinned</p>
                          <p className="mt-1 text-xs text-stone-600">
                            {[signUpModel.locationcity, signUpModel.locationstate, signUpModel.locationpincode]
                              .filter(Boolean)
                              .join(", ") || "Coordinates saved"}
                          </p>
                          {signUpModel.googlelocation && (
                            <p className="mt-1 line-clamp-2 text-xs text-stone-500">{signUpModel.googlelocation}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className={org.label}>Location Name *</Label>
                    <Input
                      placeholder="e.g. MainOffice or HeadBranch"
                      value={signUpModel.locationname}
                      onChange={(e) =>
                        setSignUpModel((prev) => ({
                          ...prev,
                          locationname: sanitizeLocationName(e.target.value),
                        }))
                      }
                      className={registerFieldInputClass}
                    />
                    <p className="text-xs text-stone-500">
                      Letters and numbers only — no spaces or special characters
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                    <div className="space-y-2">
                      <Label className={org.label}>Address Line 1 *</Label>
                      <Input
                        placeholder="Building number and name"
                        value={signUpModel.locationaddressline1}
                        onChange={(e) =>
                          setSignUpModel((prev) => ({ ...prev, locationaddressline1: e.target.value }))
                        }
                        className={registerFieldInputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={org.label}>Address Line 2</Label>
                      <Input
                        placeholder="Road name and area (optional)"
                        value={signUpModel.locationaddressline2}
                        onChange={(e) =>
                          setSignUpModel((prev) => ({ ...prev, locationaddressline2: e.target.value }))
                        }
                        className={registerFieldInputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                    <div className="space-y-2">
                      <Label className={org.label}>City *</Label>
                      <Input
                        placeholder="Enter city"
                        value={signUpModel.locationcity}
                        onChange={(e) =>
                          setSignUpModel((prev) => ({ ...prev, locationcity: e.target.value.trim() }))
                        }
                        className={cn(
                          registerFieldInputClass,
                          signUpModel.locationcity && "border-emerald-300 bg-emerald-50/50",
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={org.label}>State *</Label>
                      <Input
                        placeholder="Enter state"
                        value={signUpModel.locationstate}
                        onChange={(e) =>
                          setSignUpModel((prev) => ({ ...prev, locationstate: e.target.value.trim() }))
                        }
                        className={cn(
                          registerFieldInputClass,
                          signUpModel.locationstate && "border-emerald-300 bg-emerald-50/50",
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={org.label}>Pincode *</Label>
                      <div className="relative">
                        <Input
                          placeholder="6-digit pincode"
                          value={signUpModel.locationpincode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                            setSignUpModel((prev) => ({ ...prev, locationpincode: value }));
                            handlePincodeChange(value);
                          }}
                          onBlur={(e) => {
                            if (e.target.value.length === 6) {
                              lookupPincode(e.target.value);
                            }
                          }}
                          maxLength={6}
                          className={registerFieldInputClass}
                          inputMode="numeric"
                        />
                        {isLookingUpPincode && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-stone-500">Enter pincode to auto-fill city, state, and country</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className={org.label}>Country *</Label>
                    <Input
                      placeholder="Enter country"
                      value={signUpModel.locationcountry}
                      onChange={(e) => setSignUpModel((prev) => ({ ...prev, locationcountry: e.target.value }))}
                      className={cn(
                        registerFieldInputClass,
                        signUpModel.locationcountry && "border-emerald-300 bg-emerald-50/50",
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t border-stone-100 pt-6">
                  <div className="flex items-center gap-3">
                    <span className={registerSectionIconWrap}>
                      <User className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className={registerSectionTitleClass}>Your Information</h3>
                      <p className={registerSectionDescClass}>Account owner contact details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                    <div className="space-y-2">
                      <Label className={org.label}>Your Name *</Label>
                      <Input
                        placeholder="Enter your name"
                        value={signUpModel.username}
                        onChange={(e) => setSignUpModel((prev) => ({ ...prev, username: e.target.value }))}
                        className={registerFieldInputClass}
                        autoComplete="name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={org.label}>Mobile Number *</Label>
                      <Input
                        placeholder="Enter 10-digit mobile number"
                        value={signUpModel.usermobile}
                        onChange={(e) =>
                          setSignUpModel((prev) => ({
                            ...prev,
                            usermobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                          }))
                        }
                        className={registerFieldInputClass}
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={org.label}>Email</Label>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={signUpModel.useremail}
                        onChange={(e) => setSignUpModel((prev) => ({ ...prev, useremail: e.target.value }))}
                        className={registerFieldInputClass}
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={org.label}>Designation</Label>
                      <Input
                        placeholder="Enter your designation"
                        value={signUpModel.userdesignation}
                        onChange={(e) => setSignUpModel((prev) => ({ ...prev, userdesignation: e.target.value }))}
                        className={registerFieldInputClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-stone-100 bg-gradient-to-r from-blue-50/80 to-white pt-6">
                  <Button
                    onClick={handleSignUp}
                    disabled={isLoading || googleLoading}
                    className={cn(org.btnPrimary, "min-h-11 w-full touch-manipulation")}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Organization…
                      </>
                    ) : (
                      "Create Organization Account"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="mt-8 text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>
        </div>
      </div>

      {/* Right: brand panel */}
      <div className="relative order-1 hidden h-dvh flex-col justify-between overflow-hidden bg-gradient-coral p-12 text-white lg:order-2 lg:flex">
        <div className="pointer-events-none absolute -left-32 -top-32 hidden h-96 w-96 rounded-full bg-white/10 blur-3xl md:block" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 hidden h-96 w-96 rounded-full bg-white/10 blur-3xl md:block" />
        <Link to="/" className="relative flex items-center gap-3">
          <img
            src="/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png"
            alt="Appointza"
            className="h-10 w-10 rounded-lg bg-white/10 p-1 backdrop-blur object-contain"
          />
          <span className="text-xl font-bold">Appointza</span>
        </Link>
        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold leading-tight">One platform. Every part of your business.</h2>
          <ul className="space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3 text-white/90">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm italic">
              "Appointza replaced 4 tools we were paying for. Our team finally has one source of truth."
            </p>
            <p className="mt-3 text-xs text-white/80">— Priya M., Owner, Bloom Wellness</p>
          </div>
        </div>
        <p className="relative text-xs text-white/70">© {new Date().getFullYear()} Appointza Technologies</p>
      </div>
      
      {/* Location Picker Dialog */}
      {userType === "organization" && (
        <LocationPicker
          open={showLocationPicker}
          onOpenChange={setShowLocationPicker}
          onLocationSelect={handleLocationSelect}
        />
      )}
    </div>
  );
};

export default Register;
