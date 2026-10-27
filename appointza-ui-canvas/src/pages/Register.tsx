import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { CredentialResponse } from "@react-oauth/google";
import { ArrowLeft, Building, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/services/auth.service";
import { UsersService } from "@/services/users.service";
import { UsersRegisterReq } from "@/models/users.model";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { cn } from "@/lib/utils";
import {
  clearPendingBusinessOnboarding,
  isDraftOrganisationName,
  isOrganizationUserContext,
  isUsersNotFoundAuthError,
  markPendingBusinessOnboarding,
  stashRegisterPlanCode,
} from "@/utils/businessOnboarding.util";

const BLUE = "#528ff0";

const fieldClass =
  "h-12 min-h-12 rounded-md border-[#dbe4f0] bg-white text-[15px] shadow-none placeholder:text-[#98a2b3] focus-visible:border-[#528ff0] focus-visible:ring-[#528ff0]/20";

const continueBtnClass =
  "h-12 min-h-12 w-full touch-manipulation rounded-md border border-[#528ff0] bg-[#528ff0] text-[15px] font-semibold text-white shadow-none hover:bg-[#3d7ae8] disabled:opacity-50 disabled:hover:bg-[#528ff0]";

const tabTriggerClass =
  "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-[13px] font-semibold text-[#5b6572] shadow-none transition-colors hover:text-[#1a1a1a] data-[state=active]:bg-[#528ff0] data-[state=active]:text-white";

const VALID_PLAN_CODES = new Set(["free", "starter", "growth", "business", "enterprise", "premium"]);

const normalizePlanCode = (raw: string | null): string => {
  const code = (raw ?? "").trim().toLowerCase();
  return VALID_PLAN_CODES.has(code) ? code : "free";
};

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

type RegisterMode = "user" | "organization";

/**
 * Two registration paths:
 * - User: personal account only → OTP → explore (unchanged flow)
 * - Organization: Screen 1 account → OTP → Screen 2 business profile
 */
const Register = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const usersService = useMemo(() => new UsersService(), []);
  const authService = useMemo(() => new AuthService(), []);

  const [mode, setMode] = useState<RegisterMode>("user");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [googleVerified, setGoogleVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; mobile?: string }>({});

  useEffect(() => {
    clearPendingBusinessOnboarding();
    const plan = normalizePlanCode(searchParams.get("plan"));
    stashRegisterPlanCode(plan);
    // Paid / plan links open business signup; plain /register stays on user.
    if (plan !== "free" || searchParams.get("type") === "business" || searchParams.get("type") === "organization") {
      setMode("organization");
    }

    const state = location.state as
      | { fromGoogle?: boolean; googleName?: string; googleEmail?: string }
      | null;
    if (state?.fromGoogle || state?.googleEmail) {
      const googleEmail = String(state.googleEmail || "").trim();
      const googleName = String(state.googleName || "").trim();
      if (googleEmail) {
        setEmail(googleEmail);
        setGoogleVerified(true);
      }
      if (googleName) setFullName(googleName);
    }
  }, [searchParams, location.state]);

  const validate = (requireEmail: boolean): boolean => {
    const next: typeof errors = {};
    if (!fullName.trim()) next.name = "Full name is required";
    if (requireEmail || mode === "organization") {
      if (!email.trim()) next.email = "Email address is required";
      else if (!emailOk(email)) next.email = "Enter a valid email address";
    } else if (email.trim() && !emailOk(email)) {
      next.email = "Enter a valid email address";
    }
    const cleanMobile = mobile.replace(/\D/g, "");
    if (!cleanMobile) next.mobile = "Mobile number is required";
    else if (cleanMobile.length !== 10) next.mobile = "Enter a valid 10-digit mobile number";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const registerAccount = async () => {
    const isBusiness = mode === "organization";
    if (!validate(isBusiness)) return;
    setLoading(true);
    try {
      const req = new UsersRegisterReq();
      req.username = fullName.trim();
      req.useremail = email.trim();
      req.usermobile = mobile.replace(/\D/g, "").slice(0, 10);
      req.primarytype = 0;
      req.plan_code = isBusiness ? normalizePlanCode(searchParams.get("plan")) : "free";
      req.is_business_registration = isBusiness;

      await usersService.register(req);

      if (isBusiness) {
        markPendingBusinessOnboarding();
      } else {
        clearPendingBusinessOnboarding();
      }

      toast({
        title: "Account created",
        description: "Please sign in to continue.",
      });

      // Never auto-continue into the app — both user and organisation must login first.
      navigate("/login", {
        replace: true,
        state: {
          justRegistered: true,
          mobile: req.usermobile,
          isBusiness,
        },
      });
    } catch (error: any) {
      const data = error?.response?.data;
      const message =
        data?.error || data?.message || error?.message || "Registration failed. Please try again.";
      toast({
        title: "Registration Failed",
        description: message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const applyGooglePrefill = (name: string, googleEmail: string) => {
    setFullName(name);
    setEmail(googleEmail);
    setGoogleVerified(true);
    setErrors({});
    toast({
      title: "Google connected",
      description: "Enter your mobile number to finish creating your account.",
    });
  };

  /** Google matched/created an account on the register page — require an explicit login next. */
  const finishGoogleSignupWithLogin = (userContext: any, displayName: string) => {
    if (!userContext?.userid || userContext.userid <= 0) {
      throw new Error("Invalid login response from server");
    }

    // Do not persist tokens from the register screen.
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_context");
    localStorage.removeItem("user_type");

    const isOrgUser = isOrganizationUserContext(userContext);
    if (isOrgUser && (isDraftOrganisationName(userContext.organisationname) || mode === "organization")) {
      markPendingBusinessOnboarding();
    } else if (!isOrgUser) {
      clearPendingBusinessOnboarding();
    }

    toast({
      title: "Account ready",
      description: "Please sign in to continue.",
    });

    navigate("/login", {
      replace: true,
      state: {
        justRegistered: true,
        isBusiness: isOrgUser || mode === "organization",
        googleEmail: userContext.useremail || userContext.email || "",
        name: userContext.username || displayName,
      },
    });
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast({
        title: "Google Sign-Up Failed",
        description: "No credential received. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setGoogleLoading(true);
    try {
      const base64Url = credentialResponse.credential.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      );
      const userInfo = JSON.parse(jsonPayload) as {
        name?: string;
        given_name?: string;
        email?: string;
        picture?: string;
      };

      const name = (userInfo.name || userInfo.given_name || "").trim();
      const googleEmail = (userInfo.email || "").trim();
      if (!googleEmail) {
        throw new Error("Google did not return an email address.");
      }

      const isBusiness = mode === "organization";
      try {
        // Existing account → sign in and route to the right screen.
        // Business tab also attaches a draft org when the user has none yet.
        const userContext = await authService.googleLogin(
          credentialResponse.credential,
          googleEmail,
          name || googleEmail.split("@")[0],
          userInfo.picture,
          { is_business_registration: isBusiness },
        );
        finishGoogleSignupWithLogin(userContext, name || googleEmail);
        return;
      } catch (loginError) {
        if (!isUsersNotFoundAuthError(loginError)) {
          throw loginError;
        }
      }

      // New Google user → stay on signup and collect mobile / remaining fields.
      applyGooglePrefill(name, googleEmail);
    } catch (error: any) {
      toast({
        title: "Google Sign-Up Failed",
        description:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Unable to continue with Google.",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const onModeChange = (value: string) => {
    const next = value as RegisterMode;
    setMode(next);
    setErrors({});
    if (next === "user") {
      clearPendingBusinessOnboarding();
    }
  };

  const perks = useMemo(
    () =>
      mode === "organization"
        ? ["Free booking website", "WhatsApp & email reminders", "Powerful dashboard"]
        : ["Book appointments in seconds", "Reminders via WhatsApp & email", "Manage bookings in one place"],
    [mode],
  );

  return (
    <div className="grid h-dvh overflow-hidden bg-white lg:grid-cols-2">
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
            {mode === "organization"
              ? "Set up your business. Create your online presence. Grow with Appointza."
              : "Book services and events from businesses you trust."}
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

      <div className="relative order-2 flex h-dvh flex-col overflow-y-auto bg-white">
        {mode === "organization" && (
          <div
            className="absolute right-0 top-0 z-10 origin-top-right translate-x-[28%] translate-y-[35%] rotate-45 px-10 py-1.5 text-[11px] font-semibold tracking-wide text-white shadow-sm"
            style={{ backgroundColor: BLUE }}
          >
            Free Website
          </div>
        )}

        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-5 py-8 sm:px-8">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#667085] transition-colors hover:text-[#528ff0] lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="mb-5 flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-md text-[15px] font-bold text-white"
              style={{ backgroundColor: BLUE }}
            >
              A
            </span>
          </div>

          <h1 className="mb-2 text-[26px] font-semibold leading-snug tracking-tight text-[#1a1a1a]">
            Welcome to Appointza
          </h1>
          <p className="mb-6 text-[14px] leading-relaxed text-[#667085]">
            {mode === "organization"
              ? "Create your account, then set up your business profile."
              : "Create a personal account to book appointments."}
          </p>

          <Tabs value={mode} onValueChange={onModeChange} className="mb-6 w-full">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-md border border-[#dbe4f0] bg-[#f5f9ff] p-1 shadow-none">
              <TabsTrigger value="user" className={tabTriggerClass}>
                <User className="h-4 w-4" />
                Individual
              </TabsTrigger>
              <TabsTrigger value="organization" className={tabTriggerClass}>
                <Building className="h-4 w-4" />
                Business
              </TabsTrigger>
            </TabsList>

            <TabsContent value="user" className="mt-6 space-y-4 focus-visible:outline-none">
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                disabled={loading || googleLoading}
                loading={googleLoading}
                label="Continue with Google"
              />

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#e6eaf0]" />
                </div>
                <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-wide">
                  <span className="bg-white px-3 text-[#98a2b3]">Or continue with email</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-name" className="text-[12px] font-medium text-[#6b7280]">
                  Full name *
                </Label>
                <Input
                  id="user-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  className={cn(fieldClass, errors.name && "border-red-300")}
                />
                {errors.name && <p className="text-[12px] text-red-600">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-mobile" className="text-[12px] font-medium text-[#6b7280]">
                  Mobile number *
                </Label>
                <Input
                  id="user-mobile"
                  type="tel"
                  inputMode="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  autoComplete="tel"
                  className={cn(fieldClass, errors.mobile && "border-red-300")}
                />
                {errors.mobile ? (
                  <p className="text-[12px] text-red-600">{errors.mobile}</p>
                ) : (
                  <p className="text-[12px] text-[#98a2b3]">We&apos;ll send an OTP to verify your account.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-email" className="text-[12px] font-medium text-[#6b7280]">
                  Email (optional)
                </Label>
                <Input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                  className={cn(fieldClass, errors.email && "border-red-300")}
                />
                {errors.email && <p className="text-[12px] text-red-600">{errors.email}</p>}
              </div>

              <Button
                type="button"
                disabled={loading}
                onClick={() => void registerAccount()}
                className={continueBtnClass}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </TabsContent>

            <TabsContent value="organization" className="mt-6 space-y-4 focus-visible:outline-none">
              <GoogleSignInButton
                onSuccess={handleGoogleSuccess}
                disabled={loading || googleLoading}
                loading={googleLoading}
                label="Continue with Google"
              />

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#e6eaf0]" />
                </div>
                <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-wide">
                  <span className="bg-white px-3 text-[#98a2b3]">Or continue with email</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="biz-name" className="text-[12px] font-medium text-[#6b7280]">
                  Full name *
                </Label>
                <Input
                  id="biz-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  readOnly={googleVerified}
                  className={cn(fieldClass, googleVerified && "bg-[#f5f9ff]", errors.name && "border-red-300")}
                />
                {errors.name && <p className="text-[12px] text-red-600">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="biz-email" className="text-[12px] font-medium text-[#6b7280]">
                  Email address *
                </Label>
                <Input
                  id="biz-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  autoComplete="email"
                  readOnly={googleVerified}
                  className={cn(fieldClass, googleVerified && "bg-[#f5f9ff]", errors.email && "border-red-300")}
                />
                {errors.email && <p className="text-[12px] text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="biz-mobile" className="text-[12px] font-medium text-[#6b7280]">
                  Mobile number *
                </Label>
                <Input
                  id="biz-mobile"
                  type="tel"
                  inputMode="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  autoComplete="tel"
                  className={cn(fieldClass, errors.mobile && "border-red-300")}
                />
                {errors.mobile ? (
                  <p className="text-[12px] text-red-600">{errors.mobile}</p>
                ) : (
                  <p className="text-[12px] text-[#98a2b3]">
                    We&apos;ll use this number for account verification and important updates.
                  </p>
                )}
              </div>

              <Button
                type="button"
                disabled={loading || googleLoading}
                onClick={() => void registerAccount()}
                className={continueBtnClass}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </TabsContent>
          </Tabs>

          <p className="mt-2 text-center text-[12px] leading-relaxed text-[#667085]">
            By continuing, you agree to Appointza&apos;s{" "}
            <Link to="/terms" className="font-medium text-[#528ff0] hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="font-medium text-[#528ff0] hover:underline">
              Privacy Policy
            </Link>
            .
          </p>

          <p className="mt-4 text-center text-[13px] text-[#667085]">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-[#528ff0] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
