import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  BUSINESS_CREATE_PATH,
  clearRegisterCreateReturn,
  isRegisterCreateFlow,
  readRegisterCreateReturn,
} from "@/utils/businessOnboarding.util";

/**
 * Shown only when create pages still use ?onboarding=1 (e.g. template builder).
 * Screen 5 services/events use clean production URLs — no banner.
 */
export function OnboardingReturnBar() {
  const { search, pathname } = useLocation();
  const params = new URLSearchParams(search);
  const fromQuery = params.get("onboarding") === "1";
  // Prefer clean org catalog URLs during register create — no orange setup bar.
  const onCleanCatalog =
    pathname.startsWith("/organization/services") ||
    pathname.startsWith("/organization/hospitality") ||
    (pathname.startsWith("/organization/profile") && params.get("tab") === "location");
  if (onCleanCatalog && isRegisterCreateFlow() && !fromQuery) return null;
  if (!fromQuery && !isRegisterCreateFlow()) return null;
  if (!fromQuery) return null;

  const returnTo = params.get("return") || readRegisterCreateReturn();
  const backHref =
    returnTo && returnTo.startsWith("/") ? returnTo : BUSINESS_CREATE_PATH;

  return (
    <div className="mx-4 mb-3 flex shrink-0 items-center justify-between gap-3 rounded-md border border-[#E85D4C]/30 bg-[#FFF5F3] px-3 py-2 text-[13px]">
      <span className="font-medium text-[#E85D4C]">
        Setting up your business — save your item, then return to continue.
      </span>
      <Link
        to={backHref}
        onClick={() => clearRegisterCreateReturn()}
        className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#E85D4C] hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to setup
      </Link>
    </div>
  );
}
