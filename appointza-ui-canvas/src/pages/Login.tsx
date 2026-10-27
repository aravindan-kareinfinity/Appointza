import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { UsersService } from "@/services/users.service";
import { AuthService } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UsersGetOtpReq } from "@/models/users.model";
import type { CredentialResponse } from "@react-oauth/google";
import { completeAuthNavigation, resolveLoginReturnPath } from "@/utils/authNavigation.util";
import { Capacitor } from "@capacitor/core";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  BUSINESS_ONBOARDING_RETURN_PATH,
  isDraftOrganisationName,
  isOrganizationUserContext,
  isPendingBusinessOnboarding,
  isUsersNotFoundAuthError,
  markPendingBusinessOnboarding,
  resolveOrganizationAuthPath,
} from "@/utils/businessOnboarding.util";

const BLUE = "#528ff0";

const loginFieldInputClass =
  "h-12 min-h-12 rounded-md border-[#dbe4f0] bg-white text-[15px] shadow-none placeholder:text-[#98a2b3] focus-visible:border-[#528ff0] focus-visible:ring-[#528ff0]/20";

const loginContinueBtnClass =
  "h-12 min-h-12 w-full touch-manipulation rounded-md border border-[#528ff0] bg-[#528ff0] text-[15px] font-semibold text-white shadow-none hover:bg-[#3d7ae8] disabled:opacity-50 disabled:hover:bg-[#528ff0]";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { setMobile, setUserType, refreshAuth } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const registerState = (location.state || {}) as {
    justRegistered?: boolean;
    mobile?: string;
    isBusiness?: boolean;
    googleEmail?: string;
    name?: string;
  };
  const [mobile, setMobileState] = useState(() =>
    (registerState.mobile || "").replace(/\D/g, "").slice(0, 10),
  );
  const [mobileError, setMobileError] = useState('');
  const [showRegisteredBanner] = useState(() => !!registerState.justRegistered);
  
  // Return path after login (cookie / window.name / sessionStorage — not the ugly ?from= URL).
  // Captured once via lazy state — resolveLoginReturnPath consumes stashed values on read.
  const [from] = useState(() => resolveLoginReturnPath(location));

  // Drop legacy ?from= clutter from the address bar once return path is captured.
  useEffect(() => {
    if (!location.search.includes("from=")) return;
    const next = new URLSearchParams(location.search);
    next.delete("from");
    const qs = next.toString();
    window.history.replaceState(
      null,
      "",
      `${location.pathname}${qs ? `?${qs}` : ""}${location.hash || ""}`,
    );
  }, [location.hash, location.pathname, location.search]);

  // After register: clear navigation state so refresh doesn't re-show the banner forever.
  useEffect(() => {
    if (!registerState.justRegistered) return;
    toast({
      title: "Account created",
      description: registerState.isBusiness
        ? "Sign in to continue setting up your business."
        : "Sign in with your mobile number to continue.",
    });
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot after register handoff
  }, []);

  // Check if user is already authenticated on page load
  useEffect(() => {
    const checkExistingAuth = () => {
      const token = localStorage.getItem('auth_token');
      const userContextStr = localStorage.getItem('user_context');
      const storedUserType = localStorage.getItem('user_type');
      
      if (token && userContextStr) {
        console.log('Login: User already authenticated, redirecting...');
        try {
          const userContext = JSON.parse(userContextStr);
          
          const isOrg = isOrganizationUserContext(userContext);
          const userType: "user" | "organization" = isOrg ? "organization" : "user";
          const finalUserType =
            storedUserType === "organization" || storedUserType === "user"
              ? storedUserType
              : userType;
          const landing = isOrg
            ? resolveOrganizationAuthPath(userContext, from)
            : from;

          completeAuthNavigation(navigate, finalUserType, landing);
        } catch (error) {
          console.error('Login: Error parsing stored user context:', error);
          // Clear invalid data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_type');
          localStorage.removeItem('user_context');
        }
      }
    };
    
    checkExistingAuth();
  }, [navigate, from]);

  const normalizeMobile = (value: string): string => {
    let digits = value.replace(/\D/g, "");
    if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(-10);
    else if (digits.length > 10) digits = digits.slice(-10);
    return digits;
  };

  // Mobile validation function
  const validateMobile = (mobileNumber: string): boolean => {
    const cleanMobile = normalizeMobile(mobileNumber);
    if (cleanMobile.length !== 10) {
      setMobileError("Enter a valid 10-digit mobile number");
      return false;
    }
    setMobileError("");
    return true;
  };

  // Get OTP function - matches mobile exactly
  const getOtp = async () => {
    // Clear any previous errors
    setMobileError("");

    const cleanMobile = normalizeMobile(mobile);

    // Validate mobile number
    if (!validateMobile(cleanMobile)) {
      return;
    }

    setLoading(true);

    try {
      const usersService = new UsersService();
      let getotpreq = new UsersGetOtpReq();
      getotpreq.mobile = cleanMobile;
      console.log("🚀 Getting OTP for mobile:", cleanMobile);

      let getotpresp = await usersService.getotp(getotpreq);
      console.log("✅ OTP response received:", getotpresp);

      if (getotpresp) {
        setMobile(cleanMobile);
        console.log("✅ OTP sent successfully, redirecting to OTP page");

        toast({
          title: "OTP Sent",
          description: `We've sent a verification code to ${cleanMobile}`,
        });

        // Navigate to OTP verification page
        navigate("/otp", {
          state: {
            mobile: cleanMobile,
            name: getotpresp.name || "User",
            isRegistration: false,
            from: from
          } 
        });
      } else {
        console.log("⚠️ No response received from OTP API");
        toast({
          title: "Failed to send OTP",
          description: "Please try again.",
          variant: "destructive"
        });
      }
      
    } catch (error: any) {
      console.error("❌ OTP Error:", error);

      const data = error?.response?.data;
      const message =
        data?.error || data?.message || error?.message || "Failed to send OTP";

      if (message && (message.includes("duplicate") || message.includes("already exists"))) {
        setMobileError("This mobile number is already registered");
      } else if (String(message).includes("500") || String(message).includes("Internal Server Error")) {
        toast({
          title: "Server Error",
          description: "Server is temporarily unavailable. Please try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "OTP Error",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const processGoogleLogin = async (userContext: any, userInfo: any) => {
    if (!userContext || !userContext.userid || userContext.userid <= 0) {
      throw new Error('Invalid login response from server');
    }

    // Store all auth data in localStorage (same pattern as OTP login)
    console.log('💾 Storing GoogleLogin response in localStorage:', {
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

    // Organisation users are keyed by organisationid (draft orgs may have no location yet).
    const isOrgUser = isOrganizationUserContext(userContext);
    const pendingBusiness = isPendingBusinessOnboarding();
    if (isOrgUser && (isDraftOrganisationName(userContext.organisationname) || pendingBusiness)) {
      markPendingBusinessOnboarding();
    }
    const userTypeValue: "user" | "organization" =
      isOrgUser || pendingBusiness ? "organization" : "user";

    console.log('User type determined:', userTypeValue, 'organisationid:', userContext.organisationid);

    localStorage.setItem('user_type', userTypeValue);
    setUserType(userTypeValue);

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
      console.log('📱 Platform info:', {
        userAgent: window.navigator.userAgent,
        platform: (window as any).Capacitor?.getPlatform?.() || 'web'
      });

      // Use updateTokenForUser which handles initialization and saving
      if (userContext?.userid) {
        console.log('👤 User ID from login response:', userContext.userid);

        // Add a small delay to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 500));

        const success = await pushNotificationService.updateTokenForUser(userContext.userid);

        if (success) {
          console.log('✅ Push token updated successfully for user:', userContext.userid);
        } else {
          console.error('❌ Push token update failed for user:', userContext.userid);
          console.warn('⚠️ Login will continue, but push notifications may not work');
        }
      } else {
        console.error('❌ User ID missing from login response, cannot save push token');
      }
    } catch (error) {
      console.error('❌ Exception during push token update:', error);
      // Don't block login if push token save fails
    }

    // Refresh auth state to update the context
    refreshAuth();

    toast({
      title: "Login Successful",
      description: `Welcome back, ${userContext.username || userInfo.name}!`,
    });

    // Small delay to ensure auth state is updated
    setTimeout(() => {
      const landing =
        isOrgUser || pendingBusiness
          ? resolveOrganizationAuthPath(
              userContext,
              pendingBusiness || isDraftOrganisationName(userContext.organisationname)
                ? BUSINESS_ONBOARDING_RETURN_PATH
                : from,
            )
          : from;
      completeAuthNavigation(navigate, userTypeValue, landing);
    }, 100);
  };

  const redirectNewGoogleUserToRegister = (userInfo: any) => {
    toast({
      title: "Create your account",
      description: "No account found for this Google email. Finish signup to continue.",
    });
    navigate("/register", {
      replace: true,
      state: {
        fromGoogle: true,
        googleName: userInfo?.name || userInfo?.given_name || "",
        googleEmail: userInfo?.email || "",
        from,
      },
    });
  };

  const googleLoginWithToken = async (idToken: string, userInfo: any) => {
    const authService = new AuthService();
    try {
      const userContext = await authService.googleLogin(
        idToken,
        userInfo.email,
        userInfo.name || userInfo.given_name || userInfo.email.split("@")[0],
        userInfo.picture,
      );
      await processGoogleLogin(userContext, userInfo);
    } catch (error) {
      if (isUsersNotFoundAuthError(error)) {
        redirectNewGoogleUserToRegister(userInfo);
        return;
      }
      throw error;
    }
  };

  /** GIS / FedCM in Android WebView is unreliable; use native Google Sign-In on Capacitor. */
  const handleCapacitorGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
      await GoogleAuth.initialize({
        scopes: ["openid", "profile", "email"],
      });
      const user = await GoogleAuth.signIn();
      const idToken = user.authentication?.idToken;
      if (!idToken) {
        throw new Error("Google did not return an ID token. Check Android OAuth client (SHA-1) and server_client_id.");
      }
      const userInfo = {
        email: user.email,
        name: user.name,
        given_name: user.givenName,
        picture: user.imageUrl,
      };
      await googleLoginWithToken(idToken, userInfo);
    } catch (error: any) {
      console.error("Native Google Sign-In:", error);
      toast({
        title: "Google Sign-In Failed",
        description:
          error?.message ||
          "Could not complete Google sign-in. On Android, ensure your release/debug SHA-1 is added to the Google Cloud OAuth Android client.",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Handle Google Sign-In (web)
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setGoogleLoading(true);
    try {
      // Decode the JWT token to get user info (simplified - in production, verify on backend)
      const base64Url = credentialResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const userInfo = JSON.parse(jsonPayload);

      console.log('✅ Google Sign-In successful:', userInfo);
      await googleLoginWithToken(credentialResponse.credential, userInfo);
    } catch (error: any) {
      console.error('❌ Google Sign-In Error:', error);
      console.error('❌ Error Response Data:', error?.response?.data);
      console.error('❌ Error Response Status:', error?.response?.status);
      console.error('❌ Full Error Object:', {
        message: error?.message,
        response: error?.response,
        data: error?.response?.data
      });

      // Extract error message from various possible locations
      let errorMessage = 'Google sign-in failed';

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
        title: "Google Sign-In Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000, // Show for 5 seconds so user can read it
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const perks = useMemo(
    () => ["Free booking website", "WhatsApp & email reminders", "Powerful dashboard"],
    [],
  );

  return (
    <div className="grid h-dvh overflow-hidden bg-white lg:grid-cols-2">
      {/* Left: brand / marketing (Razorpay-style) */}
      <div
        className="relative order-1 hidden h-dvh flex-col justify-between overflow-hidden p-10 xl:p-14 lg:flex"
        style={{
          background:
            "linear-gradient(135deg, #f0f7ff 0%, #e0efff 35%, #f5f9ff 55%, #f8fbff 75%, #ffffff 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-28deg, transparent, transparent 48px, rgba(82,143,240,0.06) 48px, rgba(82,143,240,0.06) 96px)",
          }}
        />
        <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-[#528ff0]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-1/3 h-64 w-64 rounded-full bg-[#93c5fd]/30 blur-3xl" />

        <Link to="/" className="relative z-10 flex items-center gap-2.5">
          <img
            src="/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png"
            alt="Appointza"
            className="h-9 w-9 object-contain"
          />
          <span className="text-[17px] font-semibold tracking-tight text-[#1a1a1a]">Appointza</span>
        </Link>

        <div className="relative z-10 max-w-md space-y-5 pb-4">
          <h2 className="text-[28px] font-semibold leading-snug tracking-tight text-[#1e3a5f] xl:text-[32px]">
            Get a free website for your business — book appointments online in minutes
          </h2>
          <ul className="space-y-2.5">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2 text-[15px] font-medium text-[#1e3a5f]">
                <span className="text-[#528ff0]">+</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right: form */}
      <div className="relative order-2 flex h-dvh flex-col overflow-y-auto bg-white lg:order-2">
        <div
          className="absolute right-0 top-0 z-10 origin-top-right translate-x-[28%] translate-y-[35%] rotate-45 px-10 py-1.5 text-[11px] font-semibold tracking-wide text-white shadow-sm"
          style={{ backgroundColor: BLUE }}
        >
          Free Website
        </div>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center px-5 py-8 sm:px-8">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#667085] transition-colors hover:text-[#528ff0] lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="mb-6 flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-md text-[15px] font-bold text-white"
              style={{ backgroundColor: BLUE }}
            >
              A
            </span>
            <div className="lg:hidden">
              <span className="text-[15px] font-semibold text-[#1a1a1a]">Appointza</span>
            </div>
          </div>

          <p className="mb-1 text-[13px] text-[#667085]">Welcome to Appointza</p>
          <h1 className="mb-6 text-[22px] font-semibold leading-snug tracking-tight text-[#1a1a1a] sm:text-[26px]">
            {showRegisteredBanner ? "Sign in to continue" : "Get started with your phone number"}
          </h1>

          {showRegisteredBanner ? (
            <div className="mb-6 rounded-md border border-[#c7dbf8] bg-[#f0f7ff] px-3 py-2.5 text-[13px] text-[#1e3a5f]">
              Your account was created. Sign in with your mobile number to continue
              {registerState.isBusiness ? " business setup" : ""}.
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Input
                id="mobile"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={mobile}
                onChange={(e) => {
                  setMobileState(e.target.value.replace(/\D/g, "").slice(0, 15));
                  setMobileError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const cleanMobile = mobile.replace(/[\s\-\(\)]/g, "");
                    if (cleanMobile.length === 10 && /^[0-9]{10}$/.test(cleanMobile)) {
                      e.preventDefault();
                      getOtp();
                    }
                  }
                }}
                placeholder="Enter your phone number"
                className={cn(loginFieldInputClass, mobileError && "border-red-300 focus-visible:ring-red-200")}
                required
              />
              {mobileError && <p className="text-[13px] text-red-600">{mobileError}</p>}
            </div>

            <Button
              onClick={getOtp}
              disabled={loading || googleLoading}
              className={loginContinueBtnClass}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP…
                </>
              ) : (
                "Continue"
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#e6eaf0]" />
              </div>
              <div className="relative flex justify-center text-[13px]">
                <span className="bg-white px-3 text-[#98a2b3]">or</span>
              </div>
            </div>

            <div className="w-full">
              {isNative ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={googleLoading}
                  onClick={handleCapacitorGoogleSignIn}
                  className="h-12 min-h-12 w-full touch-manipulation rounded-md border-[#e6eaf0] bg-white text-[15px] font-medium text-[#1a1a1a] shadow-none hover:bg-[#fafafa]"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    "Continue with Google"
                  )}
                </Button>
              ) : (
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  disabled={loading || googleLoading}
                  loading={googleLoading}
                  label="Continue with Google"
                />
              )}
            </div>
          </div>

          <p className="mt-8 text-center text-[12px] leading-relaxed text-[#667085]">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="font-medium text-[#528ff0] hover:underline">
              Terms of Use
            </Link>{" "}
            &{" "}
            <Link to="/privacy" className="font-medium text-[#528ff0] hover:underline">
              Privacy Policy
            </Link>
          </p>

          <p className="mt-4 text-center text-[13px] text-[#667085]">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-[#528ff0] hover:underline">
              Sign Up
            </Link>
          </p>

          <div className="mt-8 rounded-md border border-[#dbe4f0] bg-[#f5f9ff] px-4 py-3 text-center text-[12px] text-[#5b6572]">
            Growing your business online?{" "}
            <Link to="/register" className="font-semibold text-[#528ff0] hover:underline">
              Get your free website →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
