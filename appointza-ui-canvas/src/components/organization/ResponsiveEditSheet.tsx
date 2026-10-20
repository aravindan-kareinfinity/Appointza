import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import { useIsMobile } from "@/hooks/use-mobile";

/** Desktop side panel: 40% viewport width, shared by all hospitality edit sheets. */
const DESKTOP_PANEL_CLASS =
  "z-[100] flex h-full w-[40%] min-w-[480px] max-w-none flex-col gap-0 overflow-hidden border-l border-[#e6eaf0] bg-white p-0 shadow-none sm:max-w-none [&>button]:hidden";

const MOBILE_SHEET_CLASS =
  "z-[100] flex h-[92vh] max-h-[92vh] w-full flex-col gap-0 overflow-hidden rounded-t-2xl border-t border-[#e6eaf0] bg-white p-0 [&>button]:hidden";

const saveBtnClass =
  "inline-flex h-8 items-center justify-center gap-2 rounded-[6px] bg-[#528ff0] px-4 text-[13px] font-semibold text-white hover:bg-[#3d7ae8] disabled:opacity-50";

type ResponsiveEditSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  errorMessage?: string;
  isEdit?: boolean;
  saving?: boolean;
  deleting?: boolean;
  onCancel: () => void;
  onDelete?: () => void;
  onSave: () => void;
  saveLabel?: string;
  children: React.ReactNode;
};

function EditSheetHeader({
  title,
  subtitle,
  isEdit,
  saving,
  deleting,
  onCancel,
  onDelete,
  onSave,
  saveLabel,
}: Omit<ResponsiveEditSheetProps, "open" | "onOpenChange" | "children">) {
  const busy = saving || deleting;

  return (
    <div className="shrink-0 border-b border-[#e6eaf0] bg-white px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold leading-snug text-[#1a1a1a]">{title}</h2>
          {subtitle ?
            <p className="mt-1 text-[13px] leading-relaxed text-[#667085]">{subtitle}</p>
          : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={busy} className={org.btnOutline}>
            Cancel
          </Button>
          {isEdit && onDelete ?
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(org.btnOutline, "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700")}
              onClick={onDelete}
              disabled={busy}
            >
              {deleting ?
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              : null}
              Delete
            </Button>
          : null}
          <Button type="button" size="sm" onClick={onSave} disabled={busy} className={cn(saveBtnClass, "ml-auto sm:ml-0")}>
            {saving ?
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : null}
            {saveLabel ?? "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditSheetBody({
  children,
  headerProps,
  errorMessage,
}: {
  children: React.ReactNode;
  errorMessage?: string;
  headerProps: Omit<ResponsiveEditSheetProps, "open" | "onOpenChange" | "children">;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <EditSheetHeader {...headerProps} />
      {errorMessage ? (
        <div
          className="mx-4 mt-3 shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-800 sm:mx-5"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#fafbfc] px-4 py-4 sm:px-5">{children}</div>
    </div>
  );
}

export function ResponsiveEditSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  errorMessage,
  isEdit = false,
  saving = false,
  deleting = false,
  onCancel,
  onDelete,
  onSave,
  saveLabel,
  children,
}: ResponsiveEditSheetProps) {
  const isMobile = useIsMobile();

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    onCancel();
  };

  const headerProps = {
    title,
    subtitle,
    isEdit,
    saving,
    deleting,
    onCancel,
    onDelete,
    onSave,
    saveLabel,
  };

  const srTitle = (
    <>
      <span className="sr-only">{title}</span>
      {subtitle ?
        <span className="sr-only">{subtitle}</span>
      : null}
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange} shouldScaleBackground={false}>
        <DrawerContent className={MOBILE_SHEET_CLASS} onOpenAutoFocus={(event) => event.preventDefault()}>
          <DrawerHeader className="sr-only">
            <DrawerTitle>{title}</DrawerTitle>
            {subtitle ?
              <DrawerDescription>{subtitle}</DrawerDescription>
            : null}
          </DrawerHeader>
          {srTitle}
          <EditSheetBody headerProps={headerProps} errorMessage={errorMessage}>
            {children}
          </EditSheetBody>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className={cn(DESKTOP_PANEL_CLASS)}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
          {subtitle ?
            <SheetDescription>{subtitle}</SheetDescription>
          : null}
        </SheetHeader>
        {srTitle}
        <EditSheetBody headerProps={headerProps} errorMessage={errorMessage}>
          {children}
        </EditSheetBody>
      </SheetContent>
    </Sheet>
  );
}
