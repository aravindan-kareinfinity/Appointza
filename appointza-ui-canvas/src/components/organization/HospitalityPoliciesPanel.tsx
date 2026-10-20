import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveEditSheet } from "@/components/organization/ResponsiveEditSheet";
import {
  HospitalityProfileSettingsReq,
  OrganisationHospitalityProfile,
} from "@/models/hospitality.model";
import { hospitalityService } from "@/services/hospitality.service";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

type HospitalityPoliciesPanelProps = {
  organisationId: number;
  profile: OrganisationHospitalityProfile | null;
  loading: boolean;
  onSaved: (profile: OrganisationHospitalityProfile) => void;
};

function bookingTypeLabel(value: string): string {
  return value === "hourly" ? "Hourly (per hour)" : "Overnight (per night)";
}

export function HospitalityPoliciesPanel({
  organisationId,
  profile,
  loading,
  onSaved,
}: HospitalityPoliciesPanelProps) {
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(() => new HospitalityProfileSettingsReq());

  useEffect(() => {
    if (!profile) return;
    const next = new HospitalityProfileSettingsReq();
    next.organisation_id = organisationId;
    next.organisation_type = profile.organisation_type;
    next.property_type = profile.property_type;
    next.booking_type = profile.booking_type || "overnight";
    next.minimum_hours = profile.minimum_hours || 2;
    next.checkin_time = profile.checkin_time || "14:00";
    next.checkout_time = profile.checkout_time || "11:00";
    next.overnight_time_mode = profile.overnight_time_mode || "fixed";
    next.cancellation_policy = profile.cancellation_policy || "";
    next.payment_policy = profile.payment_policy || "";
    setDraft(next);
  }, [organisationId, profile]);

  const savePolicies = async () => {
    if (organisationId <= 0) return;
    setSaving(true);
    try {
      const payload = { ...draft, organisation_id: organisationId };
      if (payload.booking_type !== "hourly") payload.minimum_hours = 0;
      const updated = await hospitalityService.saveSettings(payload);
      onSaved(updated);
      setEditorOpen(false);
      toast({ title: "Saved", description: "Policies updated." });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-[13px] text-[#667085]">
        <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
        Loading policies…
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-[#e6eaf0] bg-white shadow-none">
        <div className="flex flex-col gap-3 border-b border-[#e6eaf0] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-[#1a1a1a]">Check-in & policies</h3>
            <p className="mt-0.5 text-[13px] text-[#667085]">
              Booking type and guest rules for your place.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setEditorOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#528ff0] px-3 text-[13px] font-semibold text-white hover:bg-[#3d7ae8]"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
        <div className="grid gap-4 px-4 py-4 text-[13px] sm:grid-cols-2 sm:px-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa3b2]">
              Booking type
            </p>
            <p className="mt-1 font-medium text-[#1a1a1a]">
              {bookingTypeLabel(profile?.booking_type || "overnight")}
            </p>
          </div>
          {profile?.booking_type === "hourly" ?
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa3b2]">
                Minimum hours
              </p>
              <p className="mt-1 font-medium text-[#1a1a1a]">{profile.minimum_hours}</p>
            </div>
          : null}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa3b2]">
              Check-in
            </p>
            <p className="mt-1 font-medium text-[#1a1a1a]">{profile?.checkin_time || "14:00"}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa3b2]">
              Check-out
            </p>
            <p className="mt-1 font-medium text-[#1a1a1a]">{profile?.checkout_time || "11:00"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa3b2]">
              Cancellation policy
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[#344054]">
              {profile?.cancellation_policy || "—"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9aa3b2]">
              Payment policy
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[#344054]">
              {profile?.payment_policy || "—"}
            </p>
          </div>
        </div>
      </div>

      <ResponsiveEditSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title="Edit — Check-in & policies"
        subtitle="Booking type, times, and guest policies for your organisation."
        isEdit
        saving={saving}
        onCancel={() => setEditorOpen(false)}
        onSave={() => void savePolicies()}
        saveLabel="Save policies"
      >
        <div className="space-y-4 rounded-xl border border-[#e6eaf0] bg-white p-4">
          <div className="space-y-1.5">
            <Label className={org.label}>Booking type</Label>
            <Select
              value={draft.booking_type}
              onValueChange={(value) =>
                setDraft({
                  ...draft,
                  booking_type: value,
                  minimum_hours: value === "hourly" ? draft.minimum_hours || 2 : 0,
                })
              }
            >
              <SelectTrigger className={cn(org.selectTrigger, "h-9")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overnight">Overnight (per night)</SelectItem>
                <SelectItem value="hourly">Hourly (per hour / slots)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {draft.booking_type === "hourly" ?
            <div className="space-y-1.5">
              <Label className={org.label}>Minimum hours</Label>
              <Input
                type="number"
                min={1}
                className={cn(org.input, "h-9")}
                value={draft.minimum_hours || ""}
                onChange={(e) =>
                  setDraft({ ...draft, minimum_hours: Number(e.target.value) || 2 })
                }
              />
            </div>
          : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className={org.label}>Check-in time</Label>
              <Input
                type="time"
                className={cn(org.input, "h-9")}
                value={draft.checkin_time}
                onChange={(e) => setDraft({ ...draft, checkin_time: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={org.label}>Check-out time</Label>
              <Input
                type="time"
                className={cn(org.input, "h-9")}
                value={draft.checkout_time}
                onChange={(e) => setDraft({ ...draft, checkout_time: e.target.value })}
              />
            </div>
          </div>
          {draft.booking_type === "overnight" ?
            <div className="space-y-1.5">
              <Label className={org.label}>Overnight times on booking form</Label>
              <Select
                value={draft.overnight_time_mode}
                onValueChange={(value) => setDraft({ ...draft, overnight_time_mode: value })}
              >
                <SelectTrigger className={cn(org.selectTrigger, "h-9")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed — guests use property times only</SelectItem>
                  <SelectItem value="dynamic">Dynamic — guests can change times</SelectItem>
                </SelectContent>
              </Select>
            </div>
          : null}
          <div className="space-y-1.5">
            <Label className={org.label}>Cancellation policy</Label>
            <Textarea
              className={cn(org.input, "min-h-[4.5rem]")}
              value={draft.cancellation_policy}
              onChange={(e) => setDraft({ ...draft, cancellation_policy: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label className={org.label}>Payment policy</Label>
            <Textarea
              className={cn(org.input, "min-h-[4.5rem]")}
              value={draft.payment_policy}
              onChange={(e) => setDraft({ ...draft, payment_policy: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      </ResponsiveEditSheet>
    </>
  );
}
