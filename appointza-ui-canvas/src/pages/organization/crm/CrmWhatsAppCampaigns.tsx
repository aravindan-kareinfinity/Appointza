import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { resolveOrganisationId } from "@/utils/organisationContext.util";
import { OrganisationCommunicationIntegrationService } from "@/services/organisationCommunicationIntegration.service";
import { WhatsAppTemplateService } from "@/services/whatsappTemplate.service";
import { WhatsAppCampaignService } from "@/services/whatsappCampaign.service";
import type { WhatsAppTemplateDto } from "@/models/whatsappTemplate.model";
import type {
  WhatsAppCampaignAudienceConfig,
  WhatsAppCampaignAudiencePreviewResult,
  WhatsAppCampaignDto,
  WhatsAppCampaignPreviewResult,
  WhatsAppCampaignRecipientDto,
  WhatsAppCampaignReportDto,
  WhatsAppCampaignValidateResult,
  WhatsAppCampaignVariableMap,
} from "@/models/whatsappCampaign.model";
import { CAMPAIGN_FIELD_OPTIONS } from "@/models/whatsappCampaign.model";
import { collectPlaceholderIndexes } from "@/utils/whatsappTemplate.util";

const campaignsApi = new WhatsAppCampaignService();
const integrationsApi = new OrganisationCommunicationIntegrationService();
const templatesApi = new WhatsAppTemplateService();

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

function statusTone(status: string): string {
  switch ((status || "").toLowerCase()) {
    case "ready":
    case "completed":
      return "bg-emerald-50 text-emerald-700";
    case "scheduled":
    case "queued":
    case "dispatching":
      return "bg-blue-50 text-blue-700";
    case "paused":
    case "cancelling":
      return "bg-amber-50 text-amber-800";
    case "completed_with_errors":
      return "bg-orange-50 text-orange-800";
    case "cancelled":
    case "failed":
      return "bg-red-50 text-red-700";
    case "draft":
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function apiError(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (err instanceof Error ? err.message : fallback)
  );
}

/**
 * CRM → WhatsApp → Campaigns (Phases 5–6).
 * Builder + durable dispatch controls and recipient report.
 */
export default function CrmWhatsAppCampaigns() {
  const { user } = useAuth();
  const orgId = resolveOrganisationId(user?.organisationid);

  const [list, setList] = useState<WhatsAppCampaignDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>(1);
  const [busy, setBusy] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState<WhatsAppCampaignReportDto | null>(null);
  const [recipients, setRecipients] = useState<WhatsAppCampaignRecipientDto[]>([]);
  const [recipientTotal, setRecipientTotal] = useState(0);
  const [recipientStatus, setRecipientStatus] = useState("all");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const [connections, setConnections] = useState<
    Array<{ id: number; label: string }>
  >([]);
  const [templates, setTemplates] = useState<WhatsAppTemplateDto[]>([]);

  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [version, setVersion] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("marketing");
  const [connectionId, setConnectionId] = useState(0);
  const [templateId, setTemplateId] = useState(0);
  const [audience, setAudience] = useState<WhatsAppCampaignAudienceConfig>({
    sources: ["client", "lead"],
    search: "",
    limit: 5000,
  });
  const [mappings, setMappings] = useState<WhatsAppCampaignVariableMap[]>([]);
  const [audiencePreview, setAudiencePreview] =
    useState<WhatsAppCampaignAudiencePreviewResult | null>(null);
  const [validation, setValidation] = useState<WhatsAppCampaignValidateResult | null>(null);
  const [messagePreview, setMessagePreview] = useState<WhatsAppCampaignPreviewResult | null>(null);
  const [scheduleLocal, setScheduleLocal] = useState("");

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  );

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await campaignsApi.select({
        search: search || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 50,
      });
      setList(items);
    } catch (err) {
      setError(apiError(err, "Failed to load campaigns."));
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const loadConnectionsAndTemplates = async (connId?: number) => {
    if (!orgId) return;
    const integrations = await integrationsApi.select({
      organisation_id: orgId,
      provider: "whatsapp",
    });
    const conns = integrations
      .filter((i) => i.provider === "whatsapp" && i.status === "connected" && i.whatsapp?.id)
      .map((i) => ({
        id: i.whatsapp!.id,
        label: i.whatsapp!.business_phone || i.connection_name || `Connection ${i.whatsapp!.id}`,
      }));
    setConnections(conns);
    const activeConn = connId && connId > 0 ? connId : conns[0]?.id || 0;
    if (activeConn && !connectionId) setConnectionId(activeConn);

    const approved = await templatesApi.select({
      status: "approved",
      limit: 100,
    });
    setTemplates(
      approved.filter(
        (t) =>
          !activeConn ||
          !t.whatsapp_connection_id ||
          t.whatsapp_connection_id === activeConn,
      ),
    );
  };

  const openWizard = async (existing?: WhatsAppCampaignDto) => {
    setWizardError(null);
    setStep(1);
    setAudiencePreview(null);
    setValidation(null);
    setMessagePreview(null);
    setScheduleLocal("");
    if (existing) {
      setCampaignId(existing.id);
      setVersion(existing.version);
      setName(existing.name);
      setDescription(existing.description || "");
      setCategory(existing.category || "marketing");
      setConnectionId(existing.whatsapp_connection_id);
      setTemplateId(existing.message_template_id || 0);
      try {
        setAudience(JSON.parse(existing.audience_configuration || "{}"));
      } catch {
        setAudience({ sources: ["client", "lead"], limit: 5000 });
      }
      try {
        setMappings(JSON.parse(existing.variable_mapping || "[]"));
      } catch {
        setMappings([]);
      }
    } else {
      setCampaignId(null);
      setVersion(1);
      setName("");
      setDescription("");
      setCategory("marketing");
      setConnectionId(0);
      setTemplateId(0);
      setAudience({ sources: ["client", "lead"], search: "", limit: 5000 });
      setMappings([]);
    }
    setWizardOpen(true);
    try {
      await loadConnectionsAndTemplates(existing?.whatsapp_connection_id);
    } catch (err) {
      setWizardError(apiError(err, "Failed to load WhatsApp connections."));
    }
  };

  useEffect(() => {
    if (!selectedTemplate) return;
    const indexes = collectPlaceholderIndexes(selectedTemplate.content || "");
    // Also parse body from components
    let body = selectedTemplate.content || "";
    try {
      const comps = JSON.parse(selectedTemplate.components_json || "[]") as Array<{
        type?: string;
        text?: string;
      }>;
      const bodyComp = comps.find((c) => (c.type || "").toUpperCase() === "BODY");
      if (bodyComp?.text) body = bodyComp.text;
    } catch {
      /* ignore */
    }
    const ph = collectPlaceholderIndexes(body);
    setMappings((prev) =>
      ph.map((n) => {
        const placeholder = `{{${n}}}`;
        const existing = prev.find((m) => m.placeholder === placeholder);
        return (
          existing || {
            placeholder,
            source_type: "field",
            source_key: CAMPAIGN_FIELD_OPTIONS[Math.min(n - 1, CAMPAIGN_FIELD_OPTIONS.length - 1)].key,
            fixed_value: "",
            fallback_value: "",
            allow_empty: false,
          }
        );
      }),
    );
  }, [selectedTemplate?.id]);

  const saveDraft = async (): Promise<WhatsAppCampaignDto> => {
    const body = {
      whatsapp_connection_id: connectionId,
      message_template_id: templateId || null,
      name,
      description,
      category,
      audience,
      variable_mapping: mappings,
      expected_version: version,
    };
    if (campaignId) {
      const updated = await campaignsApi.update(campaignId, body);
      setCampaignId(updated.id);
      setVersion(updated.version);
      return updated;
    }
    const created = await campaignsApi.create(body);
    setCampaignId(created.id);
    setVersion(created.version);
    return created;
  };

  const runAudiencePreview = async () => {
    setBusy(true);
    setWizardError(null);
    try {
      const result = await campaignsApi.previewAudience({
        whatsapp_connection_id: connectionId,
        category,
        audience,
        sample_limit: 15,
      });
      setAudiencePreview(result);
    } catch (err) {
      setWizardError(apiError(err, "Audience preview failed."));
    } finally {
      setBusy(false);
    }
  };

  const runValidate = async () => {
    setBusy(true);
    setWizardError(null);
    try {
      const draft = await saveDraft();
      const result = await campaignsApi.validate(draft.id);
      setValidation(result);
      setVersion(result.campaign?.version || draft.version);
      setAudiencePreview(result.audience || null);
      if (!result.is_valid) {
        setWizardError(result.errors.join(" "));
      }
    } catch (err) {
      setWizardError(apiError(err, "Validation failed."));
    } finally {
      setBusy(false);
    }
  };

  const runMessagePreview = async () => {
    setBusy(true);
    setWizardError(null);
    try {
      const draft = await saveDraft();
      const result = await campaignsApi.preview(draft.id, 3);
      setMessagePreview(result);
    } catch (err) {
      setWizardError(apiError(err, "Preview failed. No message was sent."));
    } finally {
      setBusy(false);
    }
  };

  const runSchedule = async () => {
    if (!scheduleLocal) {
      setWizardError("Choose a future schedule time.");
      return;
    }
    setBusy(true);
    setWizardError(null);
    try {
      const draft = await saveDraft();
      const validated = await campaignsApi.validate(draft.id);
      if (!validated.is_valid || !validated.campaign) {
        setValidation(validated);
        setWizardError(validated.errors.join(" ") || "Campaign is not ready to schedule.");
        return;
      }
      const utc = new Date(scheduleLocal);
      if (Number.isNaN(utc.getTime()) || utc.getTime() <= Date.now()) {
        setWizardError("Scheduled time must be in the future.");
        return;
      }
      const scheduled = await campaignsApi.schedule(
        validated.campaign.id,
        utc.toISOString(),
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        validated.campaign.version,
      );
      setWizardOpen(false);
      await loadList();
      setList((prev) => {
        const others = prev.filter((c) => c.id !== scheduled.id);
        return [scheduled, ...others];
      });
    } catch (err) {
      setWizardError(apiError(err, "Schedule failed. Campaign was not sent."));
    } finally {
      setBusy(false);
    }
  };

  const runSendNow = async () => {
    setBusy(true);
    setWizardError(null);
    try {
      const draft = await saveDraft();
      const validated = await campaignsApi.validate(draft.id);
      if (!validated.is_valid || !validated.campaign) {
        setValidation(validated);
        setWizardError(validated.errors.join(" ") || "Campaign is not ready to send.");
        return;
      }
      const queued = await campaignsApi.send(validated.campaign.id, validated.campaign.version);
      setWizardOpen(false);
      await loadList();
      setList((prev) => {
        const others = prev.filter((c) => c.id !== queued.id);
        return [queued, ...others];
      });
    } catch (err) {
      setWizardError(apiError(err, "Queue for send failed. No messages were claimed as delivered."));
    } finally {
      setBusy(false);
    }
  };

  const cancelCampaign = async (c: WhatsAppCampaignDto) => {
    if (!window.confirm(`Cancel campaign "${c.name}"? Already accepted WhatsApp messages cannot be recalled.`)) return;
    try {
      await campaignsApi.cancel(c.id, c.version);
      await loadList();
    } catch (err) {
      setError(apiError(err, "Cancel failed."));
    }
  };

  const queueSend = async (c: WhatsAppCampaignDto) => {
    if (!window.confirm(`Queue "${c.name}" for durable dispatch now?`)) return;
    try {
      await campaignsApi.send(c.id, c.version);
      await loadList();
    } catch (err) {
      setError(apiError(err, "Could not queue campaign."));
    }
  };

  const pauseCampaign = async (c: WhatsAppCampaignDto) => {
    try {
      await campaignsApi.pause(c.id, c.version);
      await loadList();
    } catch (err) {
      setError(apiError(err, "Pause failed."));
    }
  };

  const resumeCampaign = async (c: WhatsAppCampaignDto) => {
    try {
      await campaignsApi.resume(c.id, c.version);
      await loadList();
    } catch (err) {
      setError(apiError(err, "Resume failed."));
    }
  };

  const openReport = async (c: WhatsAppCampaignDto) => {
    setReportOpen(true);
    setReportLoading(true);
    setRecipientStatus("all");
    setRecipientSearch("");
    try {
      const [r, rec] = await Promise.all([
        campaignsApi.report(c.id),
        campaignsApi.recipients(c.id, { limit: 50, offset: 0 }),
      ]);
      setReport(r);
      setRecipients(rec.items);
      setRecipientTotal(rec.total);
    } catch (err) {
      setError(apiError(err, "Failed to load report."));
      setReportOpen(false);
    } finally {
      setReportLoading(false);
    }
  };

  const reloadRecipients = async () => {
    if (!report?.campaign.id) return;
    setReportLoading(true);
    try {
      const rec = await campaignsApi.recipients(report.campaign.id, {
        processing_status: recipientStatus === "all" ? undefined : recipientStatus,
        search: recipientSearch || undefined,
        limit: 50,
        offset: 0,
      });
      setRecipients(rec.items);
      setRecipientTotal(rec.total);
    } catch (err) {
      setError(apiError(err, "Failed to load recipients."));
    } finally {
      setReportLoading(false);
    }
  };

  const retryRecipient = async (recipientId: number) => {
    if (!report?.campaign.id) return;
    try {
      await campaignsApi.retryRecipient(report.campaign.id, recipientId);
      const r = await campaignsApi.report(report.campaign.id);
      setReport(r);
      await reloadRecipients();
      await loadList();
    } catch (err) {
      setError(apiError(err, "Retry not allowed for this recipient."));
    }
  };

  const canNext = (): boolean => {
    if (step === 1) return !!name.trim() && connectionId > 0;
    if (step === 2) return (audience.sources?.length || 0) > 0;
    if (step === 4) return templateId > 0;
    if (step === 5) return mappings.every((m) => m.source_type === "fixed" ? !!m.fixed_value || m.allow_empty : !!m.source_key);
    return true;
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#e6eaf0] px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1a1a1a]">WhatsApp Campaigns</h2>
          <p className="mt-0.5 text-[12px] text-[#5b6572]">
            Build, queue, pause, and report durable template campaigns ·{" "}
            <Link to="/organization/profile?tab=whatsapp" className="text-[#2a5af5] hover:underline">
              Connection settings
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => void loadList()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 bg-[#2a5af5] hover:bg-[#214ad1]"
            onClick={() => void openWizard()}
          >
            <Plus className="h-3.5 w-3.5" />
            Create campaign
          </Button>
        </div>
      </header>

      <div className="space-y-2 border-b border-[#e6eaf0] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-[200px] flex-1">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9aa3b2]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns"
              className="h-9 w-full rounded-md border border-[#e6eaf0] bg-[#f8fafc] pl-8 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-[#2a5af5]"
            />
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[160px] text-[12px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="dispatching">Dispatching</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="completed_with_errors">Completed with errors</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-[#5b6572]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading campaigns…
          </div>
        )}
        {!loading && error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
        )}
        {!loading && !error && list.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Megaphone className="h-9 w-9 text-[#cfd6e0]" />
            <p className="text-[13px] font-medium text-[#1a1a1a]">No campaigns yet</p>
            <p className="max-w-sm text-[12px] text-[#5b6572]">
              Create a draft, select an eligible audience, pick an approved template, validate, then schedule
              or send now. Dispatch runs in a durable background worker.
            </p>
          </div>
        )}
        <div className="space-y-2">
          {list.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e6eaf0] bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold text-[#1a1a1a]">{c.name}</p>
                  <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", statusTone(c.status))}>
                    {c.status}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-[#5b6572]">
                  {c.template_name || "No template"} · {c.business_phone || "Connection"} · Eligible{" "}
                  {c.eligible_count}/{c.selected_count}
                  {c.scheduled_at ? ` · Scheduled ${new Date(c.scheduled_at).toLocaleString()}` : ""}
                  {(c.accepted_count ?? 0) > 0 || (c.failed_count ?? 0) > 0
                    ? ` · Accepted ${c.accepted_count ?? 0} · Delivered ${c.delivered_count ?? 0} · Failed ${c.failed_count ?? 0}`
                    : ""}
                </p>
                {c.validation_summary && (
                  <p className="mt-0.5 text-[11px] text-[#8b95a5]">{c.validation_summary}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(c.status === "draft" || c.status === "ready" || c.status === "failed") && (
                  <Button type="button" size="sm" variant="outline" onClick={() => void openWizard(c)}>
                    Edit
                  </Button>
                )}
                {(c.status === "ready" || c.status === "scheduled") && (
                  <Button type="button" size="sm" className="bg-[#2a5af5] hover:bg-[#214ad1]" onClick={() => void queueSend(c)}>
                    Send now
                  </Button>
                )}
                {(c.status === "queued" || c.status === "dispatching") && (
                  <Button type="button" size="sm" variant="outline" onClick={() => void pauseCampaign(c)}>
                    Pause
                  </Button>
                )}
                {c.status === "paused" && (
                  <Button type="button" size="sm" className="bg-[#2a5af5] hover:bg-[#214ad1]" onClick={() => void resumeCampaign(c)}>
                    Resume
                  </Button>
                )}
                {["scheduled", "queued", "dispatching", "paused", "ready"].includes(c.status) && (
                  <Button type="button" size="sm" variant="outline" onClick={() => void cancelCampaign(c)}>
                    Cancel
                  </Button>
                )}
                <Button type="button" size="sm" variant="outline" onClick={() => void openReport(c)}>
                  Report
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Campaign report"
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-xl bg-white shadow-xl sm:rounded-xl"
          >
            <div className="flex items-center justify-between border-b border-[#e6eaf0] px-4 py-3">
              <div>
                <h3 className="text-[15px] font-semibold text-[#1a1a1a]">
                  {report?.campaign.name || "Campaign report"}
                </h3>
                <p className="text-[12px] text-[#5b6572]">
                  Accepted means Meta accepted the send — not delivery. Delivery/read come from webhooks.
                </p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setReportOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              {reportLoading && !report && (
                <div className="flex items-center gap-2 py-10 text-[13px] text-[#5b6572]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading report…
                </div>
              )}
              {report && (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      ["Selected", report.campaign.selected_count],
                      ["Eligible", report.campaign.eligible_count],
                      ["Accepted", report.campaign.accepted_count ?? 0],
                      ["Delivered", report.campaign.delivered_count ?? 0],
                      ["Read", report.campaign.read_count ?? 0],
                      ["Failed", report.campaign.failed_count ?? 0],
                      ["Cancelled", report.campaign.cancelled_count ?? 0],
                      ["Unknown", report.campaign.unknown_count ?? 0],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="rounded-md border border-[#e6eaf0] px-3 py-2">
                        <p className="text-[11px] text-[#8b95a5]">{label}</p>
                        <p className="text-[16px] font-semibold text-[#1a1a1a]">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={recipientStatus} onValueChange={setRecipientStatus}>
                      <SelectTrigger className="h-9 w-[180px] text-[12px]">
                        <SelectValue placeholder="Processing status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All processing</SelectItem>
                        <SelectItem value="queued">Queued</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="skipped">Skipped</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      placeholder="Search recipient"
                      className="h-9 max-w-[220px] text-[13px]"
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => void reloadRecipients()}>
                      Filter
                    </Button>
                  </div>
                  <p className="text-[12px] text-[#8b95a5]">{recipientTotal} recipients</p>
                  <div className="space-y-2">
                    {recipients.map((r) => (
                      <div key={r.id} className="rounded-md border border-[#e6eaf0] px-3 py-2 text-[12px]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-[#1a1a1a]">{r.display_name || "Recipient"}</p>
                            <p className="text-[#5b6572]">
                              {r.phone_normalized} · {r.processing_status}
                              {r.provider_status ? ` / ${r.provider_status}` : ""}
                              {r.attempt_count ? ` · attempts ${r.attempt_count}` : ""}
                            </p>
                            {r.error_message && (
                              <p className="mt-0.5 text-red-600">{r.error_message}</p>
                            )}
                            {r.provider_message_id && (
                              <p className="mt-0.5 text-[11px] text-[#8b95a5]">wamid {r.provider_message_id}</p>
                            )}
                          </div>
                          {(r.processing_status === "failed" || r.processing_status === "unknown") &&
                            !r.provider_message_id &&
                            (r.error_category === "transient" ||
                              r.error_category === "rate_limit" ||
                              r.error_category === "unknown" ||
                              !r.error_category) && (
                              <Button type="button" size="sm" variant="outline" onClick={() => void retryRecipient(r.id)}>
                                Retry
                              </Button>
                            )}
                        </div>
                      </div>
                    ))}
                    {recipients.length === 0 && !reportLoading && (
                      <p className="py-6 text-center text-[12px] text-[#8b95a5]">No recipients match.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Campaign wizard"
            className="flex max-h-[94dvh] w-full max-w-2xl flex-col rounded-t-xl bg-white shadow-xl sm:rounded-xl"
          >
            <div className="flex items-center justify-between border-b border-[#e6eaf0] px-4 py-3">
              <div>
                <h3 className="text-[15px] font-semibold">
                  {campaignId ? "Edit campaign" : "Create campaign"}
                </h3>
                <p className="text-[11px] text-[#8b95a5]">Step {step} of 7</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setWizardOpen(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {wizardError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700" role="alert">
                  {wizardError}
                </p>
              )}

              {connections.length === 0 && (
                <p className="rounded-md border border-dashed border-[#e6eaf0] bg-[#f8fafc] px-3 py-2 text-[12px] text-[#5b6572]">
                  No connected WhatsApp account.{" "}
                  <Link to="/organization/profile?tab=whatsapp" className="text-[#2a5af5] hover:underline">
                    Connect under Profile → WhatsApp
                  </Link>
                  .
                </p>
              )}

              {step === 1 && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="camp-name">Campaign name</Label>
                    <Input id="camp-name" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="camp-desc">Description (optional)</Label>
                    <Textarea
                      id="camp-desc"
                      className="mt-1"
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Purpose / category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marketing">Marketing (requires opt-in)</SelectItem>
                        <SelectItem value="utility">Utility</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>WhatsApp connection</Label>
                    <Select
                      value={connectionId ? String(connectionId) : ""}
                      onValueChange={(v) => {
                        const id = Number(v);
                        setConnectionId(id);
                        void loadConnectionsAndTemplates(id);
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select connection" />
                      </SelectTrigger>
                      <SelectContent>
                        {connections.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-[12px] text-[#5b6572]">
                    Select audience sources. Recipients are filtered server-side — nothing is loaded wholesale into the browser.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "client", label: "Clients (bookings)" },
                      { id: "lead", label: "CRM leads" },
                      { id: "conversation", label: "WhatsApp conversations" },
                      { id: "booking", label: "Booking activity" },
                      { id: "event", label: "Event participants" },
                    ].map((s) => {
                      const on = audience.sources?.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() =>
                            setAudience((a) => ({
                              ...a,
                              sources: on
                                ? a.sources.filter((x) => x !== s.id)
                                : [...(a.sources || []), s.id],
                            }))
                          }
                          className={cn(
                            "rounded-md px-2.5 py-1.5 text-[12px] font-medium",
                            on ? "bg-[#2a5af5] text-white" : "bg-[#f4f6f9] text-[#5b6572]",
                          )}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <Label htmlFor="aud-search">Search name / phone</Label>
                    <Input
                      id="aud-search"
                      className="mt-1"
                      value={audience.search || ""}
                      onChange={(e) => setAudience((a) => ({ ...a, search: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="book-from">Booking from</Label>
                      <Input
                        id="book-from"
                        type="date"
                        className="mt-1"
                        value={audience.booking_from?.slice(0, 10) || ""}
                        onChange={(e) =>
                          setAudience((a) => ({
                            ...a,
                            booking_from: e.target.value ? `${e.target.value}T00:00:00Z` : null,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="book-to">Booking to</Label>
                      <Input
                        id="book-to"
                        type="date"
                        className="mt-1"
                        value={audience.booking_to?.slice(0, 10) || ""}
                        onChange={(e) =>
                          setAudience((a) => ({
                            ...a,
                            booking_to: e.target.value ? `${e.target.value}T23:59:59Z` : null,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lead-tag">Lead tag contains</Label>
                    <Input
                      id="lead-tag"
                      className="mt-1"
                      value={audience.lead_tag || ""}
                      onChange={(e) => setAudience((a) => ({ ...a, lead_tag: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="event-id">Event ID (for event participants)</Label>
                    <Input
                      id="event-id"
                      type="number"
                      className="mt-1"
                      value={audience.event_id || ""}
                      onChange={(e) =>
                        setAudience((a) => ({
                          ...a,
                          event_id: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-[12px] text-[#5b6572]">
                    Eligibility excludes invalid phones, duplicates, opt-outs, and (for marketing) missing explicit consent.
                    Phone numbers alone are not treated as consent.
                  </p>
                  <Button type="button" size="sm" disabled={busy} onClick={() => void runAudiencePreview()}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Estimate recipients
                  </Button>
                  {audiencePreview && (
                    <div className="rounded-lg border border-[#e6eaf0] bg-[#f8fafc] p-3 text-[13px]">
                      <p>
                        Selected <strong>{audiencePreview.selected_count}</strong> · Eligible{" "}
                        <strong>{audiencePreview.eligible_count}</strong> · Excluded{" "}
                        <strong>{audiencePreview.excluded_count}</strong>
                      </p>
                      {Object.keys(audiencePreview.exclusion_reasons || {}).length > 0 && (
                        <ul className="mt-2 space-y-1 text-[12px] text-[#5b6572]">
                          {Object.entries(audiencePreview.exclusion_reasons).map(([k, v]) => (
                            <li key={k}>
                              {k}: {v}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-3 space-y-1">
                        {audiencePreview.samples.map((s, i) => (
                          <p key={i} className="text-[12px] text-[#5b6572]">
                            {s.display_name || "—"} · {s.phone_normalized} · {s.eligibility_status}
                            {s.exclusion_reason ? ` (${s.exclusion_reason})` : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <p className="text-[12px] text-[#5b6572]">
                    Only Meta-approved templates for the selected connection are listed.
                  </p>
                  {templates.length === 0 ? (
                    <p className="text-[12px] text-[#5b6572]">
                      No approved templates.{" "}
                      <Link to="/organization/crm/templates" className="text-[#2a5af5] hover:underline">
                        Sync or submit templates
                      </Link>
                      .
                    </p>
                  ) : (
                    <div className="max-h-72 space-y-1 overflow-y-auto">
                      {templates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTemplateId(t.id)}
                          className={cn(
                            "w-full rounded-md border px-3 py-2 text-left text-[13px]",
                            templateId === t.id
                              ? "border-[#2a5af5] bg-[#eef2f7]"
                              : "border-[#e6eaf0] hover:bg-[#f8fafc]",
                          )}
                        >
                          <p className="font-medium text-[#1a1a1a]">{t.template_name}</p>
                          <p className="text-[11px] text-[#8b95a5]">
                            {t.language_code} · {t.category} · {t.status}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-3">
                  <p className="text-[12px] text-[#5b6572]">
                    Map template placeholders to allowed fields or fixed values. Empty required values block validation.
                  </p>
                  {mappings.length === 0 && (
                    <p className="text-[12px] text-[#8b95a5]">This template has no body variables.</p>
                  )}
                  {mappings.map((m, idx) => (
                    <div key={m.placeholder} className="rounded-md border border-[#e6eaf0] p-3">
                      <p className="text-[12px] font-medium text-[#1a1a1a]">{m.placeholder}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Select
                          value={m.source_type}
                          onValueChange={(v) =>
                            setMappings((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, source_type: v } : x)),
                            )
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="field">Field</SelectItem>
                            <SelectItem value="fixed">Fixed value</SelectItem>
                          </SelectContent>
                        </Select>
                        {m.source_type === "fixed" ? (
                          <Input
                            className="h-9"
                            value={m.fixed_value || ""}
                            onChange={(e) =>
                              setMappings((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, fixed_value: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="Fixed text"
                          />
                        ) : (
                          <Select
                            value={m.source_key}
                            onValueChange={(v) =>
                              setMappings((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, source_key: v } : x)),
                              )
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CAMPAIGN_FIELD_OPTIONS.map((o) => (
                                <SelectItem key={o.key} value={o.key}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === 6 && (
                <div className="space-y-3">
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                    Sample preview only — no WhatsApp message is sent.
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" disabled={busy} onClick={() => void runValidate()}>
                      Validate campaign
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void runMessagePreview()}>
                      Preview samples
                    </Button>
                  </div>
                  {validation && (
                    <div className="rounded-md border border-[#e6eaf0] p-3 text-[12px]">
                      <p className={validation.is_valid ? "text-emerald-700" : "text-red-700"}>
                        {validation.is_valid ? "Validation passed — Ready" : "Validation failed"}
                      </p>
                      {validation.errors?.map((e, i) => (
                        <p key={i} className="text-red-600">
                          {e}
                        </p>
                      ))}
                      {validation.audience && (
                        <p className="mt-1 text-[#5b6572]">
                          Eligible {validation.audience.eligible_count} / selected{" "}
                          {validation.audience.selected_count}
                        </p>
                      )}
                    </div>
                  )}
                  {messagePreview?.samples.map((s, i) => (
                    <div key={i} className="rounded-lg bg-[#e5ddd5] p-3">
                      <p className="mb-1 text-[11px] text-[#5b6572]">
                        Sample: {s.display_name} · {s.phone_normalized}
                      </p>
                      <div className="rounded-md bg-white p-3 text-[13px]">
                        {s.header && <p className="mb-1 font-semibold">{s.header}</p>}
                        <p className="whitespace-pre-wrap">{s.body}</p>
                        {s.footer && <p className="mt-2 text-[11px] text-[#6b7280]">{s.footer}</p>}
                        {s.unresolved_required.length > 0 && (
                          <p className="mt-2 text-[11px] text-red-600">
                            Unresolved: {s.unresolved_required.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === 7 && (
                <div className="space-y-3">
                  <p className="text-[12px] text-[#5b6572]">
                    Save as draft, or schedule for a future UTC time. Scheduling does <strong>not</strong> send
                    messages — Phase 6 will dispatch.
                  </p>
                  <div>
                    <Label htmlFor="sched">Schedule (local time)</Label>
                    <Input
                      id="sched"
                      type="datetime-local"
                      className="mt-1"
                      value={scheduleLocal}
                      onChange={(e) => setScheduleLocal(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await saveDraft();
                          setWizardOpen(false);
                          await loadList();
                        } catch (err) {
                          setWizardError(apiError(err, "Save failed."));
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Save draft
                    </Button>
                    <Button type="button" variant="outline" disabled={busy} onClick={() => void runSchedule()}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Validate & schedule
                    </Button>
                    <Button
                      type="button"
                      className="bg-[#2a5af5] hover:bg-[#214ad1]"
                      disabled={busy}
                      onClick={() => void runSendNow()}
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Validate & send now
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[#e6eaf0] px-4 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={step === 1 || busy}
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s))}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
              {step < 7 ? (
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#2a5af5] hover:bg-[#214ad1]"
                  disabled={!canNext() || busy}
                  onClick={() => {
                    if (step === 3 && !audiencePreview) void runAudiencePreview();
                    setStep((s) => (s < 7 ? ((s + 1) as WizardStep) : s));
                  }}
                >
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <span className="text-[11px] text-[#8b95a5]">Use actions above to save or schedule</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
