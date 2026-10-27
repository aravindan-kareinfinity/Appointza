import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { UsersService } from "@/services/users.service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import OtpInput from "@/components/auth/OtpInput";
import { UsersLoginReq } from "@/models/users.model";
import { completeAuthNavigation, getMainAppAuthUrl, getMainAppLoginUrl, resolveLoginReturnPath } from "@/utils/authNavigation.util";
import {
  BUSINESS_ONBOARDING_RETURN_PATH,
  isDraftOrganisationName,
  isOrganizationUserContext,
  markPendingBusinessOnboarding,
  resolveOrganizationAuthPath,
  isPendingBusinessOnboarding,
} from "@/utils/businessOnboarding.util";
import { ArrowLeft, Check, Loader2, ShieldCheck } from "lucide-react";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";

const otpSectionIconWrap =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600";
const otpSectionTitleClass = "text-lg font-semibold leading-snug text-appointza-navy md:text-xl";
const otpSectionDescClass = "text-sm text-stone-500";

const OtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { setUserType, refreshAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [mobile, setMobileState] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [isRegistration, setIsRegistration] = useState(false);

  // Captured once — see Login.tsx for why this can't be a plain const recomputed
  // on every render (OTP input / resend-timer re-renders would otherwise lose it).
  const [from] = useState(() => resolveLoginReturnPath(location));

  useEffect(() => {
    const stateMobile = location.state?.mobile;
    const isReg = location.state?.isRegistration || false;

    if (stateMobile) {
      setMobileState(stateMobile);
      setName(location.state?.name || "User");
      setIsRegistration(isReg);
    } else {
      window.location.replace(getMainAppLoginUrl());
    }
  }, [location.state]);

  const verifyOtp = async (otpValue?: string) => {
    const currentOtp = otpValue || otp;

    if (!currentOtp || currentOtp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const usersService = new UsersService();
      const loginreq = new UsersLoginReq();
      loginreq.mobile = mobile;
      loginreq.otp = currentOtp;
      const loginresp = await usersService.login(loginreq);

      if (!loginresp || !loginresp.userid || loginresp.userid <= 0) {
        throw new Error("Invalid login response from server");
      }

      // Organisation users are keyed by organisationid (draft orgs may have no location yet).
      const isOrgUser = isOrganizationUserContext(loginresp);
      const pendingBusiness = isPendingBusinessOnboarding();
      const isDraftOrg =
        isOrgUser &&
        (isDraftOrganisationName(loginresp.organisationname) || pendingBusiness);
      const userTypeValue: "user" | "organization" =
        isOrgUser || pendingBusiness || isDraftOrg ? "organization" : "user";

      // Registration must not open the app — verify OTP then require an explicit login.
      if (isRegistration) {
        if (isDraftOrg || pendingBusiness || (isOrgUser && pendingBusiness)) {
          markPendingBusinessOnboarding();
        }
        localStorage.removeItem("auth_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_context");
        localStorage.removeItem("user_type");
        refreshAuth();
        toast({
          title: "Account verified",
          description: "Please sign in to continue.",
        });
        navigate("/login", {
          replace: true,
          state: {
            justRegistered: true,
            mobile,
            isBusiness: isOrgUser || pendingBusiness,
          },
        });
        return;
      }

      localStorage.setItem("auth_token", loginresp.accesstoken || "");
      localStorage.setItem("refresh_token", loginresp.refreshtoken || "");
      localStorage.setItem("user_context", JSON.stringify(loginresp));

      if (isDraftOrg || pendingBusiness) {
        markPendingBusinessOnboarding();
      }

      localStorage.setItem("user_type", userTypeValue);
      setUserType(userTypeValue);

      try {
        const { pushNotificationService } = await import("@/services/pushnotification.service");
        if (loginresp?.userid) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          await pushNotificationService.updateTokenForUser(loginresp.userid);
        }
      } catch (error) {
        console.error("Push token update failed:", error);
      }

      refreshAuth();

      toast({
        title: "Login Successful",
        description: "Login successful! Welcome back!",
      });

      setTimeout(() => {
        const stillPending = isDraftOrg || isPendingBusinessOnboarding();
        const returnTo =
          isOrgUser || stillPending
            ? resolveOrganizationAuthPath(
                loginresp,
                stillPending ? BUSINESS_ONBOARDING_RETURN_PATH : from,
              )
            : from;
        completeAuthNavigation(navigate, userTypeValue, returnTo);
      }, 100);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const message = err?.response?.data?.message || err?.message || "OTP verification failed";
      toast({
        title: "Verification Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setResending(true);
    try {
      const usersService = new UsersService();
      await usersService.getotp({ mobile });
      toast({
        title: "OTP Resent",
        description: `We've sent a new verification code to ${mobile}`,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const message = err?.response?.data?.message || err?.message || "Failed to resend OTP";
      toast({
        title: "Resend Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const handleBack = () => {
    window.location.href = getMainAppAuthUrl(isRegistration ? "/register" : "/login");
  };

  const maskedMobile = useMemo(() => {
    if (!mobile || mobile.length < 4) return mobile;
    return `${mobile.slice(0, 2)}${"•".repeat(Math.max(0, mobile.length - 4))}${mobile.slice(-2)}`;
  }, [mobile]);

  const perks = useMemo(
    () => [
      "Secure one-time password verification",
      "Your number is never shared publicly",
      "Instant access after verification",
      "Trusted by thousands of businesses",
    ],
    [],
  );

  return (
    <div className="grid h-dvh overflow-hidden bg-white lg:grid-cols-2">
      {/* Left: form */}
      <div className="order-2 flex h-dvh flex-col overflow-y-auto bg-appointza-cream lg:order-1">
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-6 sm:px-8 sm:py-10 lg:px-10">
          <button
            type="button"
            onClick={handleBack}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4" />
            {isRegistration ? "Back to Registration" : "Change Mobile Number"}
          </button>

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
            <h1 className={org.title}>{isRegistration ? "Verify your account" : "Enter verification code"}</h1>
            <p className={org.description}>
              {isRegistration ? "One last step to complete your registration" : "Confirm it's you with the code we sent"}
            </p>
          </header>

          <Card className={cn(org.card, "overflow-hidden rounded-3xl border-stone-100")}>
            <CardHeader className="space-y-1.5 border-b border-blue-50 bg-gradient-to-br from-blue-50/80 via-white to-violet-50/50 p-5 md:p-6">
              <CardTitle className={cn("flex items-center gap-3", otpSectionTitleClass)}>
                <span className={otpSectionIconWrap}>
                  <ShieldCheck className="h-5 w-5" />
                </span>
                {isRegistration ? "Verify Your Account" : "Verify Login"}
              </CardTitle>
              <CardDescription className={otpSectionDescClass}>
                Enter the 6-digit code sent to your mobile
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 p-5 md:p-6">
              <div className="rounded-2xl border border-stone-100 bg-white px-4 py-3 text-center">
                <p className="text-sm text-stone-600">
                  Code sent to{" "}
                  <span className="font-semibold text-appointza-navy">{maskedMobile || mobile}</span>
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  {isRegistration ? "Complete your registration" : "Complete your login"}
                  {name && name !== "User" ? ` · ${name}` : ""}
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="otp" className={cn(org.label, "block text-center")}>
                  Verification Code
                </Label>
                <OtpInput
                  onChange={setOtp}
                  onComplete={(otpValue) => {
                    setOtp(otpValue);
                    verifyOtp(otpValue);
                  }}
                />
              </div>

              <Button
                onClick={() => verifyOtp()}
                disabled={loading || resending || otp.length !== 6}
                className={cn(org.btnPrimary, "min-h-11 w-full touch-manipulation")}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying…
                  </>
                ) : isRegistration ? (
                  "Complete Registration"
                ) : (
                  "Verify & Login"
                )}
              </Button>

              <div className="flex flex-col items-center justify-between gap-3 border-t border-stone-100 pt-4 text-sm sm:flex-row">
                <button
                  type="button"
                  onClick={handleBack}
                  className="font-medium text-slate-500 transition-colors hover:text-blue-600"
                >
                  {isRegistration ? "Back to Registration" : "Use a different number"}
                </button>
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={loading || resending}
                  className="font-medium text-blue-600 transition-colors hover:underline disabled:opacity-50"
                >
                  {resending ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    "Resend OTP"
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          <p className="mt-8 text-center text-sm text-stone-500">
            {isRegistration ? (
              <>
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                  Sign In
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <Link to="/register" className="font-semibold text-blue-600 hover:underline">
                  Sign Up
                </Link>
              </>
            )}
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
          <h2 className="text-4xl font-bold leading-tight">Secure verification in seconds.</h2>
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
              &ldquo;The OTP arrives instantly — I&apos;m logged in before my coffee gets cold.&rdquo;
            </p>
            <p className="mt-3 text-xs text-white/80">— Meera S., Salon Owner</p>
          </div>
        </div>
        <p className="relative text-xs text-white/70">© {new Date().getFullYear()} Appointza Technologies</p>
      </div>
    </div>
  );
};

export default OtpVerification;
