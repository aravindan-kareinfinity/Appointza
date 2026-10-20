import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Save, Unplug } from "lucide-react";
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
import type {
  EmailProvider,
  OrganisationIntegrationSafe,
} from "@/models/organisationCommunicationIntegration.model";
import { settingsEmbedded } from "@/lib/settingsEmbedded";
import { org } from "@/lib/orgTheme";
import { cn } from "@/lib/utils";

type Props = { embedded?: boolean };

function statusLabel(status?: string): string {
  switch ((status || "").toLowerCase()) {
    case "connected":
      return "Connected";
    case "authorization_expired":
      return "Authorization expired";
    case "expired":
      return "Expired";
    case "error":
      return "Error";
    case "disconnected":
    default:
      return "Not connected";
  }
}

const EmailIntegrationSettings = ({ embedded = false }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const organisationId = user?.organisationid || 0;
  const service = useMemo(() => new OrganisationCommunicationIntegrationService(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integration, setIntegration] = useState<OrganisationIntegrationSafe | null>(null);
  const [form, setForm] = useState({
    connection_name: "",
    email_provider: "gmail" as EmailProvider,
    email_address: "",
    sender_name: "",
    reply_to: "",
    oauth_connection_id: "",
    smtp_host: "",
    smtp_port: 587,
    smtp_tls_mode: "starttls",
    smtp_username: "",
    notify_booking: true,
    notify_event: true,
    access_token: "",
    refresh_token: "",
    smtp_password: "",
  });

  const showSmtp = form.email_provider === "smtp";

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
        provider: "email",
      });
      const item = items.find((i) => i.is_active !== false) ?? items[0] ?? null;
      setIntegration(item);
      const e = item?.email;
      setForm({
        connection_name: item?.connection_name || "",
        email_provider: (e?.email_provider as EmailProvider) || "gmail",
        email_address: e?.email_address || "",
        sender_name: e?.sender_name || "",
        reply_to: e?.reply_to || "",
        oauth_connection_id: e?.oauth_connection_id || "",
        smtp_host: e?.smtp_host || "",
        smtp_port: e?.smtp_port || 587,
        smtp_tls_mode: e?.smtp_tls_mode || "starttls",
        smtp_username: e?.smtp_username || "",
        notify_booking: e?.notify_booking ?? true,
        notify_event: e?.notify_event ?? true,
        access_token: "",
        refresh_token: "",
        smtp_password: "",
      });
    } catch (err) {
      toast({
        title: "Could not load email settings",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [organisationId, service, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!form.email_address.trim()) {
      toast({ title: "Email address required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const saved = await service.upsertEmail({
        id: integration?.id && integration.id > 0 ? integration.id : undefined,
        organisation_id: organisationId,
        connection_name: form.connection_name.trim() || form.email_address.trim(),
        status: "connected",
        email_provider: form.email_provider,
        email_address: form.email_address.trim(),
        sender_name: form.sender_name.trim(),
        reply_to: form.reply_to.trim(),
        oauth_connection_id: form.oauth_connection_id.trim(),
        smtp_host: form.smtp_host.trim(),
        smtp_port: form.smtp_port,
        smtp_tls_mode: form.smtp_tls_mode,
        smtp_username: form.smtp_username.trim(),
        notify_booking: form.notify_booking,
        notify_event: form.notify_event,
        access_token: form.access_token.trim() || undefined,
        refresh_token: form.refresh_token.trim() || undefined,
        smtp_password: form.smtp_password.trim() || undefined,
      });
      setIntegration(saved);
      setForm((f) => ({ ...f, access_token: "", refresh_token: "", smtp_password: "" }));
      toast({ title: "Email connection saved" });
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
      toast({ title: "Email disconnected" });
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
        icon={Mail}
        title="Email Account"
        description="Connect Gmail, Google Workspace, Microsoft 365, or SMTP. Tokens and passwords are encrypted on the server and never returned to the browser."
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
              {integration?.email?.last_sync_at ? (
                <span className="text-xs text-stone-400">
                  Last sync {new Date(integration.email.last_sync_at).toLocaleString()}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="min-w-0">
                <Label>Provider</Label>
                <Select
                  value={form.email_provider}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, email_provider: v as EmailProvider }))
                  }
                >
                  <SelectTrigger className={cn(org.input, "mt-1.5")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="google_workspace">Google Workspace</SelectItem>
                    <SelectItem value="microsoft365">Microsoft 365</SelectItem>
                    <SelectItem value="smtp">SMTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <Label htmlFor="em-name">Connection name</Label>
                <Input
                  id="em-name"
                  className={cn(org.input, "mt-1.5")}
                  value={form.connection_name}
                  onChange={(e) => setForm((f) => ({ ...f, connection_name: e.target.value }))}
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="em-addr">Connected email address</Label>
                <Input
                  id="em-addr"
                  type="email"
                  className={cn(org.input, "mt-1.5")}
                  placeholder="bookings@business.com"
                  value={form.email_address}
                  onChange={(e) => setForm((f) => ({ ...f, email_address: e.target.value }))}
                />
              </div>
              <div className="min-w-0">
                <Label htmlFor="em-sender">Sender display name</Label>
                <Input
                  id="em-sender"
                  className={cn(org.input, "mt-1.5")}
                  placeholder="IB Makeover Studio"
                  value={form.sender_name}
                  onChange={(e) => setForm((f) => ({ ...f, sender_name: e.target.value }))}
                />
              </div>
              <div className="min-w-0 md:col-span-2">
                <Label htmlFor="em-reply">Reply-to address</Label>
                <Input
                  id="em-reply"
                  type="email"
                  className={cn(org.input, "mt-1.5")}
                  value={form.reply_to}
                  onChange={(e) => setForm((f) => ({ ...f, reply_to: e.target.value }))}
                />
              </div>

              {!showSmtp ? (
                <>
                  <div className="min-w-0 md:col-span-2">
                    <Label htmlFor="em-oauth">OAuth connection ID</Label>
                    <Input
                      id="em-oauth"
                      className={cn(org.input, "mt-1.5")}
                      value={form.oauth_connection_id}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, oauth_connection_id: e.target.value }))
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="em-access">
                      Access token
                      {integration?.has_access_token ? " (leave blank to keep existing)" : ""}
                    </Label>
                    <Input
                      id="em-access"
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
                    <Label htmlFor="em-refresh">
                      Refresh token
                      {integration?.has_refresh_token ? " (leave blank to keep existing)" : ""}
                    </Label>
                    <Input
                      id="em-refresh"
                      type="password"
                      autoComplete="new-password"
                      className={cn(org.input, "mt-1.5")}
                      placeholder={
                        integration?.has_refresh_token ? "•••••••• (stored encrypted)" : ""
                      }
                      value={form.refresh_token}
                      onChange={(e) => setForm((f) => ({ ...f, refresh_token: e.target.value }))}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="min-w-0 md:col-span-2">
                    <Label htmlFor="em-host">SMTP host</Label>
                    <Input
                      id="em-host"
                      className={cn(org.input, "mt-1.5")}
                      value={form.smtp_host}
                      onChange={(e) => setForm((f) => ({ ...f, smtp_host: e.target.value }))}
                    />
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="em-port">Port</Label>
                    <Input
                      id="em-port"
                      type="number"
                      className={cn(org.input, "mt-1.5")}
                      value={form.smtp_port}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          smtp_port: Number(e.target.value) || 587,
                        }))
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <Label>TLS mode</Label>
                    <Select
                      value={form.smtp_tls_mode}
                      onValueChange={(v) => setForm((f) => ({ ...f, smtp_tls_mode: v }))}
                    >
                      <SelectTrigger className={cn(org.input, "mt-1.5")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="starttls">STARTTLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="em-user">SMTP username</Label>
                    <Input
                      id="em-user"
                      className={cn(org.input, "mt-1.5")}
                      value={form.smtp_username}
                      onChange={(e) => setForm((f) => ({ ...f, smtp_username: e.target.value }))}
                    />
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="em-pass">
                      SMTP password
                      {integration?.has_smtp_password ? " (leave blank to keep existing)" : ""}
                    </Label>
                    <Input
                      id="em-pass"
                      type="password"
                      autoComplete="new-password"
                      className={cn(org.input, "mt-1.5")}
                      placeholder={
                        integration?.has_smtp_password ? "•••••••• (stored encrypted)" : ""
                      }
                      value={form.smtp_password}
                      onChange={(e) => setForm((f) => ({ ...f, smtp_password: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div className="space-y-3 rounded-xl border border-stone-200 p-4 md:col-span-2">
                <p className="text-sm font-medium text-appointza-navy">Notification preferences</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="em-n-book">Booking notifications</Label>
                    <Switch
                      id="em-n-book"
                      checked={form.notify_booking}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, notify_booking: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="em-n-evt">Event notifications</Label>
                    <Switch
                      id="em-n-evt"
                      checked={form.notify_event}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, notify_event: v }))}
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

export default EmailIntegrationSettings;
