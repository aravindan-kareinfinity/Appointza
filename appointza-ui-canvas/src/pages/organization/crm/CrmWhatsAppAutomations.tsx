import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus, RefreshCw, Workflow, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { WhatsAppAutomationService } from "@/services/whatsappAutomation.service";
import type { WhatsAppTemplateDto } from "@/models/whatsappTemplate.model";
import type {
  WhatsAppAutomationExecutionDto,
  WhatsAppAutomationRuleDto,
} from "@/models/whatsappAutomation.model";
import { AUTOMATION_TRIGGERS } from "@/models/whatsappAutomation.model";
import { CAMPAIGN_FIELD_OPTIONS } from "@/models/whatsappCampaign.model";
import type { WhatsAppCampaignVariableMap } from "@/models/whatsappCampaign.model";
import { collectPlaceholderIndexes } from "@/utils/whatsappTemplate.util";

const api = new WhatsAppAutomationService();
const integrationsApi = new OrganisationCommunicationIntegrationService();
const templatesApi = new WhatsAppTemplateService();

function apiError(err: unknown, fallback: string): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (err instanceof Error ? err.message : fallback)
  );
}

function isReminder(trigger: string) {
  return trigger === "booking_reminder" || trigger === "event_reminder";
}

/**
 * CRM → WhatsApp → Automations (Phase 7).
 * Connection settings remain under Profile → WhatsApp.
 */
export default function CrmWhatsAppAutomations() {
  const { user } = useAuth();
  const orgId = resolveOrganisationId(user?.organisationid);
  const [list, setList] = useState<WhatsAppAutomationRuleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);

  const [connections, setConnections] = useState<Array<{ id: number; label: string }>>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplateDto[]>([]);

  const [editId, setEditId] = useState<number | null>(null);
  const [version, setVersion] = useState(1);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("booking_created");
  const [connectionId, setConnectionId] = useState(0);
  const [templateId, setTemplateId] = useState(0);
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [reminderOffset, setReminderOffset] = useState(1440);
  const [purpose, setPurpose] = useState("utility");
  const [mappings, setMappings] = useState<WhatsAppCampaignVariableMap[]>([]);

  const [execOpen, setExecOpen] = useState(false);
  const [execRule, setExecRule] = useState<WhatsAppAutomationRuleDto | null>(null);
  const [executions, setExecutions] = useState<WhatsAppAutomationExecutionDto[]>([]);
  const [execLoading, setExecLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setList(await api.select({ limit: 100 }));
    } catch (err) {
      setError(apiError(err, "Failed to load automations."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openEditor = async (rule?: WhatsAppAutomationRuleDto) => {
    setWizardError(null);
    setEditorOpen(true);
    try {
      if (!orgId) throw new Error("Organisation is required.");
      const [integrations, tmpls] = await Promise.all([
        integrationsApi.select({ organisation_id: orgId, provider: "whatsapp" }),
        templatesApi.select({ limit: 200 }),
      ]);
      setConnections(
        integrations
          .filter((i) => i.provider === "whatsapp" && i.status === "connected" && i.whatsapp?.id)
          .map((i) => ({
            id: i.whatsapp!.id,
            label: i.whatsapp!.business_phone || i.connection_name || `Connection ${i.whatsapp!.id}`,
          })),
      );
      setTemplates((tmpls ?? []).filter((t) => (t.status || "").toLowerCase() === "approved"));
    } catch (err) {
      setWizardError(apiError(err, "Failed to load connections/templates."));
    }

    if (rule) {
      setEditId(rule.id);
      setVersion(rule.version);
      setName(rule.name);
      setTrigger(rule.trigger_type);
      setConnectionId(rule.whatsapp_connection_id);
      setTemplateId(rule.message_template_id);
      setDelayMinutes(rule.delay_minutes || 0);
      setReminderOffset(rule.reminder_offset_minutes || 1440);
      setPurpose(rule.purpose || "utility");
      try {
        setMappings(JSON.parse(rule.variable_mapping || "[]"));
      } catch {
        setMappings([]);
      }
    } else {
      setEditId(null);
      setVersion(1);
      setName("");
      setTrigger("booking_created");
      setConnectionId(0);
      setTemplateId(0);
      setDelayMinutes(0);
      setReminderOffset(1440);
      setPurpose("utility");
      setMappings([]);
    }
  };

  useEffect(() => {
    const t = templates.find((x) => x.id === templateId);
    if (!t) return;
    const indexes = collectPlaceholderIndexes(t.components_json || "[]");
    setMappings((prev) =>
      indexes.map((i) => {
        const ph = `{{${i}}}`;
        const existing = prev.find((m) => m.placeholder === ph);
        return (
          existing ?? {
            placeholder: ph,
            source_type: "field",
            source_key: "customer_name",
            fixed_value: "",
            fallback_value: "",
            allow_empty: false,
          }
        );
      }),
    );
  }, [templateId, templates]);

  const save = async () => {
    if (!name.trim() || !connectionId || !templateId) {
      setWizardError("Name, connection, and approved template are required.");
      return;
    }
    setBusy(true);
    setWizardError(null);
    try {
      const body = {
        name: name.trim(),
        trigger_type: trigger,
        whatsapp_connection_id: connectionId,
        message_template_id: templateId,
        is_enabled: true,
        purpose,
        delay_minutes: delayMinutes,
        reminder_offset_minutes: isReminder(trigger) ? reminderOffset : null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        variable_mapping: mappings,
        expected_version: version,
      };
      if (editId) await api.update(editId, body);
      else await api.create(body);
      setEditorOpen(false);
      await load();
    } catch (err) {
      setWizardError(apiError(err, "Save failed."));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (rule: WhatsAppAutomationRuleDto) => {
    try {
      if (rule.is_enabled) await api.disable(rule.id, rule.version);
      else await api.enable(rule.id, rule.version);
      await load();
    } catch (err) {
      setError(apiError(err, "Failed to update rule."));
    }
  };

  const openExecutions = async (rule: WhatsAppAutomationRuleDto) => {
    setExecRule(rule);
    setExecOpen(true);
    setExecLoading(true);
    try {
      const { items } = await api.executions(rule.id, { limit: 50 });
      setExecutions(items);
    } catch (err) {
      setError(apiError(err, "Failed to load executions."));
      setExecOpen(false);
    } finally {
      setExecLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#e6eaf0] px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1a1a1a]">WhatsApp Automations</h2>
          <p className="mt-0.5 text-[12px] text-[#5b6572]">
            Trigger approved templates from bookings, payments, and events ·{" "}
            <Link to="/organization/profile?tab=whatsapp" className="text-[#2a5af5] hover:underline">
              Connection settings
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => void load()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 bg-[#2a5af5] hover:bg-[#214ad1]"
            onClick={() => void openEditor()}
          >
            <Plus className="h-3.5 w-3.5" />
            New rule
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-[#5b6572]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading automations…
          </div>
        )}
        {!loading && error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
        )}
        {!loading && !error && list.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Workflow className="h-9 w-9 text-[#cfd6e0]" />
            <p className="text-[13px] font-medium text-[#1a1a1a]">No automation rules yet</p>
            <p className="max-w-sm text-[12px] text-[#5b6572]">
              Connect WhatsApp under Profile, approve a template, then map a booking or event trigger.
            </p>
          </div>
        )}
        <div className="space-y-2">
          {list.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e6eaf0] px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold text-[#1a1a1a]">{r.name}</p>
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                      r.is_enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {r.is_enabled ? "enabled" : "disabled"}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-[#5b6572]">
                  {r.trigger_type} · {r.template_name || "Template"} · {r.business_phone || "Connection"}
                  {isReminder(r.trigger_type) ? ` · ${r.reminder_offset_minutes ?? 1440} min before` : ""}
                  {r.delay_minutes > 0 ? ` · delay ${r.delay_minutes}m` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => void openEditor(r)}>
                  Edit
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => void toggle(r)}>
                  {r.is_enabled ? "Disable" : "Enable"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => void openExecutions(r)}>
                  History
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-xl bg-white shadow-xl sm:rounded-xl">
            <div className="flex items-center justify-between border-b border-[#e6eaf0] px-4 py-3">
              <h3 className="text-[15px] font-semibold">{editId ? "Edit automation" : "New automation"}</h3>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditorOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {wizardError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{wizardError}</p>
              )}
              {connections.length === 0 && (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                  No WhatsApp connection.{" "}
                  <Link to="/organization/profile?tab=whatsapp" className="underline">
                    Connect under Profile → WhatsApp
                  </Link>
                </p>
              )}
              <div>
                <Label>Name</Label>
                <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Trigger</Label>
                <Select value={trigger} onValueChange={setTrigger}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTOMATION_TRIGGERS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>WhatsApp connection</Label>
                <Select value={String(connectionId || "")} onValueChange={(v) => setConnectionId(Number(v))}>
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
              <div>
                <Label>Approved template</Label>
                <Select value={String(templateId || "")} onValueChange={(v) => setTemplateId(Number(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates
                      .filter((t) => !connectionId || t.whatsapp_connection_id === connectionId)
                      .map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.template_name} ({t.language_code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Purpose</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utility">Utility / operational</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="marketing">Marketing (requires opt-in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isReminder(trigger) ? (
                <div>
                  <Label>Reminder lead time (minutes before)</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min={5}
                    value={reminderOffset}
                    onChange={(e) => setReminderOffset(Number(e.target.value) || 1440)}
                  />
                </div>
              ) : (
                <div>
                  <Label>Delay after event (minutes)</Label>
                  <Input
                    className="mt-1"
                    type="number"
                    min={0}
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(Number(e.target.value) || 0)}
                  />
                </div>
              )}
              {mappings.length > 0 && (
                <div className="space-y-2">
                  <Label>Variable mapping</Label>
                  {mappings.map((m, idx) => (
                    <div key={m.placeholder} className="grid grid-cols-2 gap-2">
                      <p className="col-span-2 text-[11px] text-[#8b95a5]">{m.placeholder}</p>
                      <Select
                        value={m.source_type}
                        onValueChange={(v) => {
                          const next = [...mappings];
                          next[idx] = { ...m, source_type: v };
                          setMappings(next);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="field">Field</SelectItem>
                          <SelectItem value="fixed">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                      {m.source_type === "fixed" ? (
                        <Input
                          value={m.fixed_value || ""}
                          onChange={(e) => {
                            const next = [...mappings];
                            next[idx] = { ...m, fixed_value: e.target.value };
                            setMappings(next);
                          }}
                        />
                      ) : (
                        <Select
                          value={m.source_key}
                          onValueChange={(v) => {
                            const next = [...mappings];
                            next[idx] = { ...m, source_key: v };
                            setMappings(next);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CAMPAIGN_FIELD_OPTIONS.map((f) => (
                              <SelectItem key={f.key} value={f.key}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e6eaf0] px-4 py-3">
              <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-[#2a5af5] hover:bg-[#214ad1]"
                disabled={busy}
                onClick={() => void save()}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save rule
              </Button>
            </div>
          </div>
        </div>
      )}

      {execOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-xl bg-white shadow-xl sm:rounded-xl">
            <div className="flex items-center justify-between border-b border-[#e6eaf0] px-4 py-3">
              <div>
                <h3 className="text-[15px] font-semibold">{execRule?.name || "Executions"}</h3>
                <p className="text-[12px] text-[#5b6572]">Accepted ≠ delivered. Statuses come from Meta webhooks.</p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setExecOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
              {execLoading && (
                <div className="flex items-center gap-2 py-10 text-[13px] text-[#5b6572]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              )}
              {!execLoading &&
                executions.map((e) => (
                  <div key={e.id} className="rounded-md border border-[#e6eaf0] px-3 py-2 text-[12px]">
                    <p className="font-medium text-[#1a1a1a]">
                      {e.recipient_display_name || "Recipient"} · {e.status}
                      {e.provider_status ? ` / ${e.provider_status}` : ""}
                    </p>
                    <p className="text-[#5b6572]">
                      {e.recipient_phone_normalized} · {e.business_entity_type} #{e.business_entity_id}
                      {e.scheduled_at ? ` · scheduled ${new Date(e.scheduled_at).toLocaleString()}` : ""}
                    </p>
                    {e.failure_reason && <p className="mt-0.5 text-red-600">{e.failure_reason}</p>}
                    {e.provider_message_id && (
                      <p className="mt-0.5 text-[11px] text-[#8b95a5]">wamid {e.provider_message_id}</p>
                    )}
                  </div>
                ))}
              {!execLoading && executions.length === 0 && (
                <p className="py-8 text-center text-[12px] text-[#8b95a5]">No executions yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
