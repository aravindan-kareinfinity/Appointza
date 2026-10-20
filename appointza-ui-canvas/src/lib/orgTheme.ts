/**
 * Shared organization dashboard theme — Razorpay-like density & type scale.
 * Prefer these tokens over per-page one-offs.
 */
export const org = {
  page: "org-page",
  pageHeader: "org-page-header",
  pageSection: "org-page-section",
  title: "org-title",
  description: "org-description",
  card: "org-card",
  panel: "org-panel",
  panelSection: "org-panel-section",
  empty: "org-empty",
  loading: "org-loading",
  btnOutline:
    "inline-flex h-8 items-center justify-center gap-2 rounded-md border border-[#e6eaf0] bg-white px-3 text-[13px] font-medium text-[#1a1a1a] shadow-none hover:border-[#cfd6e0] hover:bg-[#f8fafc] sm:px-3.5",
  btnPrimary:
    "inline-flex h-8 items-center justify-center gap-2 rounded-md border border-[#2a5af5] bg-[#2a5af5] px-4 text-[13px] font-medium text-white shadow-none hover:bg-[#204de0]",
  btnDark:
    "inline-flex h-8 items-center justify-center gap-2 rounded-md border border-[#2a5af5] bg-[#2a5af5] px-4 text-[13px] font-medium text-white shadow-none hover:bg-[#204de0]",
  tabTrigger:
    "min-h-9 min-w-0 flex-1 rounded-md border border-[#e6eaf0] bg-white px-2 py-1.5 text-[12px] font-medium text-[#5b6572] shadow-none transition-colors data-[state=active]:border-transparent data-[state=active]:bg-[#eef2ff] data-[state=active]:text-[#2a5af5] sm:min-h-9 sm:px-3 sm:text-[13px]",
  segmentActive: "bg-[#2a5af5] text-white",
  segmentInactive: "bg-white text-[#5b6572] hover:bg-[#f4f6f9]",
  segmentGroup: "flex overflow-hidden rounded-md border border-[#e6eaf0]",
  selectTrigger:
    "h-9 w-full rounded-md border-[#e6eaf0] bg-white text-[13px] focus:ring-[#2a5af5]/20",
  input:
    "rounded-md border-[#e6eaf0] bg-white text-[13px] shadow-none focus-visible:border-[#2a5af5] focus-visible:ring-[#2a5af5]/15",
  label: "text-[12px] font-medium text-[#6b7280]",
  tabsUnderline: "org-tabs-underline",
  /** Sticky bottom-right save bar for settings forms. */
  saveBar:
    "sticky bottom-0 z-10 flex justify-end border-t border-[#e6eaf0] bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-5",
  saveBtn:
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] bg-[#528ff0] px-5 text-[13px] font-semibold text-white hover:bg-[#3d7ae8] disabled:opacity-50",
} as const;
