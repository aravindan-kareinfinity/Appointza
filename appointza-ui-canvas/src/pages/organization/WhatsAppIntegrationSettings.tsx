import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2, MessageCircle, Save, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OrganizationPageShell from "@/components/layout/OrganizationPageShell";
import SettingsEmbeddedHeader from "@/components/layout/SettingsEmbeddedHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { OrganisationCommunicationIntegrationService } from "@/services/organisationCommunicationIntegration.service";
import type { OrganisationIntegrationSafe } from "@/models/organisationCommunicationIntegration.model";
import type { WhatsAppWebhookSetupDto } from "@/models/whatsappCrm.model";
import { WhatsAppCrmService } from "@/services/whatsappCrm.service";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";
import { getWhatsAppWebhookCallbackUrl } from "@/utils/environment";

/** Shared Meta callback URL (all orgs). Paste into Meta App → WhatsApp → Configuration. */
function buildWhatsAppWebhookUrl(): string {
  return getWhatsAppWebhookCallbackUrl();
}

type Props = { embedded?: boolean };

function statusLabel(status?: string): string {
  switch ((status || "").toLowerCase()) {
    case "connected":
      return "Connected";
    case "expired":
      return "Expired";
    case "error":
      return "Error";
    case "disconnected":
    default:
      return "Not connected";
  }
}

const WhatsAppIntegrationSettings = ({ embedded = false }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const organisationId = user?.organisationid || 0;
  const service = useMemo(() => new OrganisationCommunicationIntegrationService(), []);
  const crmService = useMemo(() => new WhatsAppCrmService(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedVerifyToken, setCopiedVerifyToken] = useState(false);
  const [webhookSetup, setWebhookSetup] = useState<WhatsAppWebhookSetupDto | null>(null);
  const [integration, setIntegration] = useState<OrganisationIntegrationSafe | null>(null);
  const webhookUrl = useMemo(() => buildWhatsAppWebhookUrl(), []);
  const verifyToken = useMemo(() => {
    const fromSelect = (integration?.webhook_verify_token || "").trim();
    if (fromSelect) return fromSelect;
    return (webhookSetup?.verify_token || "").trim();
  }, [integration?.webhook_verify_token, webhookSetup?.verify_token]);
  const appSecretConfigured =
    integration?.webhook_app_secret_configured === true ||
    webhookSetup?.app_secret_configured === true;
  const [form, setForm] = useState({
    connection_name: "",
    waba_id: "",
    phone_number_id: "",
    business_phone: "",
    meta_business_id: "",
    webhook_status: "not_subscribed",
    default_template_booking: "",
    default_template_reminder: "",
    notify_booking_confirmation: true,
    notify_booking_reminder: true,
    notify_event_registration: true,
    access_token: "",
  });

  const load = useCallback(async () => {
    if (organisationId <= 0) {
      setIntegration(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const items = await service.select({
        organisation_id: organisationId,
        provider: "whatsapp",
      });
      const item = items.find((i) => i.is_active !== false) ?? items[0] ?? null;
      setIntegration(item);
      // Optional secondary source; Select already carries webhook_verify_token.
      void crmService
        .getWebhookSetup()
        .then(setWebhookSetup)
        .catch(() => setWebhookSetup(null));
      const w = item?.whatsapp;
      setForm({
        connection_name: item?.connection_name || "",
        waba_id: w?.waba_id || "",
        phone_number_id: w?.phone_number_id || "",
        business_phone: w?.business_phone || "",
        meta_business_id: w?.meta_business_id || "",
        webhook_status: w?.webhook_status || "not_subscribed",
        default_template_booking: w?.default_template_booking || "",
        default_template_reminder: w?.default_template_reminder || "",
        notify_booking_confirmation: w?.notify_booking_confirmation ?? true,
        notify_booking_reminder: w?.notify_booking_reminder ?? true,
        notify_event_registration: w?.notify_event_registration ?? true,
        access_token: "",
      });
    } catch (err) {
      toast({
        title: "Could not load WhatsApp settings",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [organisationId, service, crmService, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedWebhook(true);
      toast({ title: "Webhook URL copied" });
      window.setTimeout(() => setCopiedWebhook(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Select the URL and copy it manually.",
        variant: "destructive",
      });
    }
  };

  const copyVerifyToken = async () => {
    if (!verifyToken) {
      toast({
        title: "Verify token not configured",
        description:
          "Set ApplicationSettings:whatsapp:verify_token to appointza_wa_verify_2026 in appsettings.json and restart the API.",
        variant: "destructive",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(verifyToken);
      setCopiedVerifyToken(true);
      toast({ title: "Webhook password (verify token) copied" });
      window.setTimeout(() => setCopiedVerifyToken(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Select the token and copy it manually.",
        variant: "destructive",
      });
    }
  };

  const save = async () => {
    if (!form.waba_id.trim() || !form.phone_number_id.trim()) {
      toast({
        title: "Missing required fields",
        description: "WABA ID and Phone Number ID are required.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const saved = await service.upsertWhatsApp({
        id: integration?.id && integration.id > 0 ? integration.id : undefined,
        organisation_id: organisationId,
        connection_name: form.connection_name.trim() || "WhatsApp Business",
        status: "connected",
        waba_id: form.waba_id.trim(),
        phone_number_id: form.phone_number_id.trim(),
        business_phone: form.business_phone.trim(),
        meta_business_id: form.meta_business_id.trim(),
        webhook_status: form.webhook_status,
        default_template_booking: form.default_template_booking,
        default_template_reminder: form.default_template_reminder,
        notify_booking_confirmation: form.notify_booking_confirmation,
        notify_booking_reminder: form.notify_booking_reminder,
        notify_event_registration: form.notify_event_registration,
        access_token: form.access_token.trim() || undefined,
      });
      setIntegration(saved);
      setForm((f) => ({ ...f, access_token: "" }));
      toast({ title: "WhatsApp connection saved" });
      await load();
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    if (!integration?.id) return;
    setSaving(true);
    try {
      await service.disconnect({ id: integration.id, organisation_id: organisationId });
      toast({ title: "WhatsApp disconnected" });
      await load();
    } catch (err) {
      toast({
        title: "Disconnect failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const body = (
    <div className="flex min-h-full flex-col">
      <SettingsEmbeddedHeader
        icon={MessageCircle}
        title="WhatsApp Business"
        description="Connect your business number for booking messages and notifications. Access tokens are encrypted on the server and never shown after save."
      />
      <div className={cn(settingsEmbedded.sectionBody, "flex flex-1 flex-col pb-8")}>
        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 py-10 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-stone-500">Status</span>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-medium",
                  integration?.status === "connected"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-stone-100 text-stone-600",
                )}
              >
                {statusLabel(integration?.status)}
              </span>
              {integration?.has_access_token ? (
                <span className="text-xs text-stone-400">Access token on file (encrypted)</span>
              ) : null}
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
              <Label htmlFor="wa-webhook-url">Meta webhook callback URL</Label>
              <p className="mt-1 text-xs text-stone-500">
                Paste into Meta Developer → WhatsApp → Configuration → Callback URL. Verify token must
                match <code className="rounded bg-white px-1">whatsapp.verify_token</code> in API
                appsettings. Subscribe to <strong>messages</strong>. The API must be reachable on
                public HTTPS.
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  id="wa-webhook-url"
                  readOnly
                  value={webhookUrl}
                  className={cn(org.input, "font-mono text-[13px]")}
                  onFocus={(e) => e.target.select()}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0"
                  onClick={() => void copyWebhookUrl()}
                >
                  {copiedWebhook ? (
                    <Check className="mr-2 h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copiedWebhook ? "Copied" : "Copy"}
                </Button>
              </div>
              {!webhookUrl.startsWith("https://") && (
                <p className="mt-2 text-xs text-amber-700">
                  Meta requires a public HTTPS callback. Point this at your deployed API over HTTPS.
                </p>
              )}

              <div className="mt-4 border-t border-stone-200 pt-4">
                <Label htmlFor="wa-verify-token">Webhook password (Verify token)</Label>
                <p className="mt-1 text-xs text-stone-500">
                  Paste this into Meta → WhatsApp → Configuration → Verify token. It must match the
                  server <code className="rounded bg-white px-1">whatsapp.verify_token</code>.
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    id="wa-verify-token"
                    readOnly
                    value={
                      verifyToken ||
                      "(empty — set ApplicationSettings:whatsapp:verify_token in appsettings.json and restart API)"
                    }
                    className={cn(org.input, "font-mono text-[13px]")}
                    onFocus={(e) => e.target.select()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0"
                    onClick={() => void copyVerifyToken()}
                    disabled={!verifyToken}
                  >
                    {copiedVerifyToken ? (
                      <Check className="mr-2 h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copiedVerifyToken ? "Copied" : "Copy password"}
                  </Button>
                </div>
                {!appSecretConfigured && (
                  <p className="mt-2 text-xs text-amber-700">
                    App secret is not set on the API yet. Inbound message signature checks need{" "}
                    <code className="rounded bg-white px-1">whatsapp.app_secret</code> from Meta App
                    → Settings → Basic.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <Label htmlFor="wa-name">Connection name</Label>
                <Input
                  id="wa-name"
                  className={cn(org.input, "mt-1.5")}
                  placeholder="Appointza Salon WhatsApp"
                  value={form.connection_name}
                  onChange={(e) => setForm((f) => ({ ...f, connection_name: e.target.value }))}
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="wa-phone">Business phone number</Label>
                <Input
                  id="wa-phone"
                  className={cn(org.input, "mt-1.5")}
                  placeholder="+91 XXXXXXXXXX"
                  value={form.business_phone}
                  onChange={(e) => setForm((f) => ({ ...f, business_phone: e.target.value }))}
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="wa-waba">WhatsApp Business Account ID (WABA ID)</Label>
                <Input
                  id="wa-waba"
                  className={cn(org.input, "mt-1.5")}
                  value={form.waba_id}
                  onChange={(e) => setForm((f) => ({ ...f, waba_id: e.target.value }))}
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="wa-phone-id">Phone Number ID</Label>
                <Input
                  id="wa-phone-id"
                  className={cn(org.input, "mt-1.5")}
                  value={form.phone_number_id}
                  onChange={(e) => setForm((f) => ({ ...f, phone_number_id: e.target.value }))}
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="wa-meta">Meta Business ID</Label>
                <Input
                  id="wa-meta"
                  className={cn(org.input, "mt-1.5")}
                  value={form.meta_business_id}
                  onChange={(e) => setForm((f) => ({ ...f, meta_business_id: e.target.value }))}
                />
              </div>
              <div className="min-w-0">
                <Label>Webhook status</Label>
                <Select
                  value={form.webhook_status}
                  onValueChange={(v) => setForm((f) => ({ ...f, webhook_status: v }))}
                >
                  <SelectTrigger className={cn(org.input, "mt-1.5")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscribed">Subscribed</SelectItem>
                    <SelectItem value="not_subscribed">Not subscribed</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 md:col-span-2">
                <Label htmlFor="wa-token">
                  Access token
                  {integration?.has_access_token ? " (leave blank to keep existing)" : ""}
                </Label>
                <Input
                  id="wa-token"
                  type="password"
                  autoComplete="new-password"
                  className={cn(org.input, "mt-1.5")}
                  placeholder={
                    integration?.has_access_token ? "•••••••• (stored encrypted)" : ""
                  }
                  value={form.access_token}
                  onChange={(e) => setForm((f) => ({ ...f, access_token: e.target.value }))}
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="wa-tpl-book">Default booking template</Label>
                <Input
                  id="wa-tpl-book"
                  className={cn(org.input, "mt-1.5")}
                  value={form.default_template_booking}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, default_template_booking: e.target.value }))
                  }
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="wa-tpl-rem">Default reminder template</Label>
                <Input
                  id="wa-tpl-rem"
                  className={cn(org.input, "mt-1.5")}
                  value={form.default_template_reminder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, default_template_reminder: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-3 rounded-xl border border-stone-200 p-4 md:col-span-2">
                <p className="text-sm font-medium text-appointza-navy">Notification preferences</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="wa-n-book">Booking confirmation</Label>
                    <Switch
                      id="wa-n-book"
                      checked={form.notify_booking_confirmation}
                      onCheckedChange={(v) =>
                        setForm((f) => ({ ...f, notify_booking_confirmation: v }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="wa-n-rem">Booking reminder</Label>
                    <Switch
                      id="wa-n-rem"
                      checked={form.notify_booking_reminder}
                      onCheckedChange={(v) =>
                        setForm((f) => ({ ...f, notify_booking_reminder: v }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="wa-n-evt">Event registration</Label>
                    <Switch
                      id="wa-n-evt"
                      checked={form.notify_event_registration}
                      onCheckedChange={(v) =>
                        setForm((f) => ({ ...f, notify_event_registration: v }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              <Button
                type="button"
                className={cn(org.btnPrimary, "h-11 min-w-[8rem]")}
                disabled={saving || organisationId <= 0}
                onClick={() => void save()}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
              {integration?.id && integration.status === "connected" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  disabled={saving}
                  onClick={() => void disconnect()}
                >
                  <Unplug className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <OrganizationPageShell embedded className="flex min-h-full flex-col">
        {body}
      </OrganizationPageShell>
    );
  }

  return <OrganizationPageShell className="flex min-h-full flex-col">{body}</OrganizationPageShell>;
};

export default WhatsAppIntegrationSettings;
