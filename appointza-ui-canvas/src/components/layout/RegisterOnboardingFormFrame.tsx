import { Capacitor } from "@capacitor/core";
import { cn } from "@/lib/utils";

type RegisterOnboardingFormFrameProps = {
  children: React.ReactNode;
  className?: string;
  /** Inner content max width */
  maxWidthClassName?: string;
};

/**
 * Content frame for /register/* steps.
 * Web: panel inside org shell (top bar + Setup sidebar).
 * Native app: standalone full-page form (no org chrome).
 */
export function RegisterOnboardingFormFrame({
  children,
  className,
  maxWidthClassName = "max-w-xl",
}: RegisterOnboardingFormFrameProps) {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    return (
      <div className={cn("min-h-dvh bg-white safe-area-top safe-area-bottom", className)}>
        <div
          className={cn(
            "mx-auto flex w-full flex-1 flex-col px-5 py-8 sm:px-8",
            maxWidthClassName,
          )}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("org-page w-full", className)}>
      <div className="org-page-section px-4 pb-6 pt-2 sm:px-6 lg:px-8">
        <div
          className={cn(
            "mx-auto w-full rounded-xl border border-[#e6eaf0] bg-white p-5 shadow-none sm:p-8",
            maxWidthClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
