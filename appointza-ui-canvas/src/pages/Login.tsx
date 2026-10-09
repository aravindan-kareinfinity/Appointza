import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { UsersService } from "@/services/users.service";
import { AuthService } from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UsersGetOtpReq } from "@/models/users.model";
import type { CredentialResponse } from "@react-oauth/google";
import { completeAuthNavigation, resolveLoginReturnPath } from "@/utils/authNavigation.util";
import { Capacitor } from "@capacitor/core";
import { ArrowLeft, Check, Loader2, Phone } from "lucide-react";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const loginFieldInputClass = cn(org.input, "h-11 min-h-11 md:h-10 md:min-h-10");
const loginSectionIconWrap =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600";
const loginSectionTitleClass = "text-lg font-semibold leading-snug text-appointza-navy md:text-xl";
const loginSectionDescClass = "text-sm text-stone-500";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { setMobile, setUserType, refreshAuth } = useAuth();
  const isNative = Capacitor.isNativePlatform();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mobile, setMobileState] = useState('');
  const [mobileError, setMobileError] = useState('');
  
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
          
          // Determine user type
          let userType: 'user' | 'organization' = 'user';
          if (userContext.organisationid && userContext.organisationid > 0) {
            userType = 'organization';
          }
          
          // Use stored type if available
          const finalUserType = storedUserType || userType;
          
          completeAuthNavigation(navigate, finalUserType, from);
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

  // Mobile validation function
  const validateMobile = (mobileNumber: string): boolean => {
    // Remove any spaces, dashes, or other characters
    const cleanMobile = mobileNumber.replace(/[\s\-\(\)]/g, '');
    
    // Check if mobile number is valid (10-15 digits, allowing country codes)
    const mobileRegex = /^[0-9]{10,15}$/;
    if (!mobileRegex.test(cleanMobile)) {
      setMobileError('Please enter a valid mobile number (10-15 digits)');
      return false;
    }
    
    // Check if it's too short
    if (cleanMobile.length < 10) {
      setMobileError('Mobile number must be at least 10 digits');
      return false;
    }
    
    // Clear any existing error
    setMobileError('');
    return true;
  };

  // Get OTP function - matches mobile exactly
  const getOtp = async () => {
    // Clear any previous errors
    setMobileError('');
    
    // Clean the mobile number
    const cleanMobile = mobile.replace(/[\s\-\(\)]/g, '');
    
    // Validate mobile number
    if (!validateMobile(cleanMobile)) {
      return;
    }
    
    setLoading(true);
    
    try {
      const usersService = new UsersService();
      let getotpreq = new UsersGetOtpReq();
      getotpreq.mobile = cleanMobile; // Use cleaned mobile number
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
        navigate('/otp', { 
          state: { 
            mobile: cleanMobile,
            name: getotpresp.name || 'User',
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
      
      var message = error?.response?.data?.message || error?.message || 'Failed to send OTP';
      
      if (message && (message.includes('duplicate') || message.includes('already exists'))) {
        setMobileError('This mobile number is already registered');
      } else if (message.includes('500') || message.includes('Internal Server Error')) {
        toast({
          title: "Server Error",
          description: "Server is temporarily unavailable. Please try again later.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "OTP Error",
          description: message,
          variant: "destructive"
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

    // Determine user type: User is a business if they have an organisation; otherwise a customer
    const iscustomer = userContext.organisationlocationid == 0 || userContext.organisationlocationid == null;
    const userTypeValue = iscustomer ? 'user' : 'organization';

    console.log('User type determined:', userTypeValue, 'iscustomer:', iscustomer);

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
      completeAuthNavigation(navigate, userTypeValue, from);
    }, 100);
  };

  const googleLoginWithToken = async (idToken: string, userInfo: any) => {
    const authService = new AuthService();
    const userContext = await authService.googleLogin(
      idToken,
      userInfo.email,
      userInfo.name || userInfo.given_name || userInfo.email.split('@')[0],
      userInfo.picture
    );
    await processGoogleLogin(userContext, userInfo);
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
    () => [
      "Book appointments in seconds",
      "Manage all your bookings in one place",
      "Get reminders via WhatsApp & email",
      "Trusted by businesses across India",
    ],
    [],
  );

  return (
    <div className="grid h-dvh overflow-hidden bg-white lg:grid-cols-2">
      {/* Left: form */}
      <div className="order-2 flex h-dvh flex-col overflow-y-auto bg-appointza-cream lg:order-1">
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-6 sm:px-8 sm:py-10 lg:px-10">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="mb-6 lg:hidden">
            <div className="flex items-center gap-2">
              <img
                src="/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png"
                alt="Appointza"
                className="h-9 w-9 object-contain"
              />
              <span className="text-lg font-bold text-appointza-navy">Appointza</span>
            </div>
          </div>

          <header className="mb-6">
            <h1 className={org.title}>Welcome back</h1>
            <p className={org.description}>Sign in with your mobile number or Google</p>
          </header>

          <Card className={cn(org.card, "overflow-hidden rounded-3xl border-blue-50")}>
            <CardHeader className="space-y-1.5 border-b border-blue-50 bg-gradient-to-br from-blue-50/80 via-white to-violet-50/50 p-5 md:p-6">
              <CardTitle className={cn("flex items-center gap-3", loginSectionTitleClass)}>
                <span className={loginSectionIconWrap}>
                  <Phone className="h-5 w-5" />
                </span>
                Login to Appointza
              </CardTitle>
              <CardDescription className={loginSectionDescClass}>
                Enter your mobile number to receive a one-time password
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 p-5 md:p-6">
              <div className="space-y-2">
                <Label htmlFor="mobile" className={org.label}>
                  Mobile Number
                </Label>
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
                  placeholder="Enter 10-digit mobile number"
                  className={cn(loginFieldInputClass, mobileError && "border-red-300 focus-visible:ring-red-200")}
                  required
                />
                {mobileError && <p className="text-sm text-red-600">{mobileError}</p>}
              </div>

              <Button
                onClick={getOtp}
                disabled={loading || googleLoading}
                className={cn(org.btnPrimary, "min-h-11 w-full touch-manipulation")}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP…
                  </>
                ) : (
                  "Get OTP"
                )}
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-stone-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wide">
                  <span className="bg-white px-3 text-stone-400">Or continue with</span>
                </div>
              </div>

              <div className="w-full">
                {isNative ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={googleLoading}
                    onClick={handleCapacitorGoogleSignIn}
                    className={cn(org.btnOutline, "min-h-11 w-full touch-manipulation")}
                  >
                    {googleLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      "Sign in with Google"
                    )}
                  </Button>
                ) : (
                  <GoogleSignInButton
                    onSuccess={handleGoogleSuccess}
                    disabled={loading || googleLoading}
                    loading={googleLoading}
                    label="Sign in with Google"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-sm text-stone-500">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-blue-600 hover:underline">
              Sign Up
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
            className="h-10 w-10 rounded-lg bg-white/10 p-1 object-contain backdrop-blur"
          />
          <span className="text-xl font-bold">Appointza</span>
        </Link>
        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold leading-tight">Pick up right where you left off.</h2>
          <ul className="space-y-3">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3 text-white/90">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm italic">
              &ldquo;Logging in takes seconds — my team is always one tap away from the day&apos;s schedule.&rdquo;
            </p>
            <p className="mt-3 text-xs text-white/80">— Rahul K., Clinic Manager</p>
          </div>
        </div>
        <p className="relative text-xs text-white/70">© {new Date().getFullYear()} Appointza Technologies</p>
      </div>
    </div>
  );
};

export default Login;
