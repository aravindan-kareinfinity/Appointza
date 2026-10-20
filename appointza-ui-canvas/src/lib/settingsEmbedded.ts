import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

/** Horizontal padding shared by all profile-settings tabs. */
export const profileSettingsX = "px-4 md:px-6 lg:px-8";

/** Shared profile-settings card sections (embedded tabs under /organization/profile). */
export const settingsEmbedded = {
  shell: cn(org.card, "w-full overflow-hidden rounded-xl shadow-none"),
  /** Tab content title — no bottom border; tabs row already divides the page. */
  sectionHeader: cn(profileSettingsX, "w-full space-y-1 bg-[#f5f7f9] pb-3 pt-4 md:pb-4 md:pt-5"),
  sectionHeaderPlain: cn(profileSettingsX, "w-full space-y-1 bg-[#f5f7f9] pb-3 pt-4 md:pb-4 md:pt-5"),
  sectionBody: cn(profileSettingsX, "w-full min-w-0 pb-5 pt-4 md:pb-6 md:pt-5"),
  title: "flex w-full items-center gap-2.5 text-[18px] font-semibold leading-snug text-[#1a1a1a] sm:text-[20px]",
  description: "text-[13px] text-[#6b7280]",
  iconWrap:
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#eef2ff] text-[#2a5af5]",
  list: "w-full space-y-3",
  /** Single grouped list — one border, dividers between rows (no stacked cards). */
  listGroup: "w-full overflow-hidden rounded-xl border border-stone-200 bg-white divide-y divide-stone-200",
  listRow:
    "flex w-full flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5",
  /** Standalone row card (non-embedded pages). */
  row: (embedded?: boolean, className?: string) =>
    cn(
      embedded
        ? settingsEmbedded.listRow
        : "rounded-xl border border-stone-200 bg-white p-4 hover:bg-blue-50/30",
      className,
    ),
  card: (embedded?: boolean, className?: string) =>
    cn(
      embedded
        ? "w-full rounded-xl border border-stone-200 bg-white shadow-none"
        : cn(org.card, "w-full shadow-none"),
      className,
    ),
} as const;
