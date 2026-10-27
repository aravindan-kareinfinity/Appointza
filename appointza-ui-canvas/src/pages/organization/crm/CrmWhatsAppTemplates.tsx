import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Loader2,
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
import type {
  WhatsAppTemplateCreateReq,
  WhatsAppTemplateDto,
} from "@/models/whatsappTemplate.model";
import { TEMPLATE_VARIABLE_OPTIONS } from "@/models/whatsappTemplate.model";
import { WhatsAppTemplateService } from "@/services/whatsappTemplate.service";
import {
  applyPreviewValues,
  collectPlaceholderIndexes,
  formatSyncTime,
  statusLabel,
  statusTone,
  templatePreviewParts,
} from "@/utils/whatsappTemplate.util";

const api = new WhatsAppTemplateService();
const PAGE_SIZE = 40;

type DraftForm = {
  template_name: string;
  language_code: string;
  category: string;
  header_type: string;
  header_text: string;
  header_example: string;
  body_text: string;
  footer_text: string;
  body_examples: string[];
  submit: boolean;
};

const emptyDraft = (): DraftForm => ({
  template_name: "",
  language_code: "en_US",
  category: "UTILITY",
  header_type: "NONE",
  header_text: "",
  header_example: "",
  body_text: "",
  footer_text: "",
  body_examples: [],
  submit: true,
});

/**
 * CRM → WhatsApp → Templates (Phase 4).
 * Connection credentials stay under Profile → WhatsApp.
 */
export default function CrmWhatsAppTemplates() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [templates, setTemplates] = useState<WhatsAppTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState<DraftForm>(emptyDraft);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? null,
    [templates, selectedId],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const indexes = collectPlaceholderIndexes(draft.body_text);
    setDraft((prev) => {
      const next = [...prev.body_examples];
      while (next.length < indexes.length) next.push("");
      return { ...prev, body_examples: next.slice(0, Math.max(indexes.length, next.length)) };
    });
  }, [draft.body_text]);

  const load = useCallback(
    async (opts?: { append?: boolean; offset?: number }) => {
      const append = opts?.append === true;
      const offset = opts?.offset ?? 0;
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError(null);
      }

      try {
        const items = await api.select({
          search: search || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          category: categoryFilter === "all" ? undefined : categoryFilter,
          limit: PAGE_SIZE,
          offset,
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        setTemplates((prev) => (append ? [...prev, ...items] : items));
        setHasMore(items.length >= PAGE_SIZE);
        if (!append && items.length > 0) {
          setSelectedId((curr) => (curr && items.some((i) => i.id === curr) ? curr : items[0].id));
        }
      } catch (err: unknown) {
        if ((err as { code?: string })?.code === "ERR_CANCELED") return;
        if (!append) {
          setError(err instanceof Error ? err.message : "Failed to load templates.");
          setTemplates([]);
        }
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [search, statusFilter, categoryFilter],
  );

  useEffect(() => {
    void load({ offset: 0 });
    return () => abortRef.current?.abort();
  }, [load]);

  useEffect(() => {
    if (!selected) {
      setPreviewValues({});
      return;
    }
    const parts = templatePreviewParts(selected);
    const indexes = collectPlaceholderIndexes(parts.body?.text || selected.content || "");
    const next: Record<string, string> = {};
    for (const i of indexes) next[String(i)] = previewValues[String(i)] || `Sample ${i}`;
    setPreviewValues(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset samples when template changes
  }, [selected?.id]);

  const onSync = async () => {
    setSyncing(true);
    setActionError(null);
    try {
      const result = await api.sync();
      setTemplates(result.templates?.length ? result.templates : await api.select({ limit: PAGE_SIZE }));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Synchronization failed.");
      setActionError(msg);
    } finally {
      setSyncing(false);
    }
  };

  const onRefreshStatus = async () => {
    if (!selectedId) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const updated = await api.refreshStatus(selectedId);
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Status refresh failed. Last known status kept.");
      setActionError(msg);
    } finally {
      setActionBusy(false);
    }
  };

  const onSubmitDraft = async () => {
    if (!selectedId) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const updated = await api.submit(selectedId);
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Submit failed.");
      setActionError(msg);
    } finally {
      setActionBusy(false);
    }
  };

  const onCreate = async () => {
    setCreating(true);
    setCreateError(null);
    const indexes = collectPlaceholderIndexes(draft.body_text);
    const mappings = indexes.map((index) => ({
      index,
      placeholder: `{{${index}}}`,
      mapping_key: TEMPLATE_VARIABLE_OPTIONS[Math.min(index - 1, TEMPLATE_VARIABLE_OPTIONS.length - 1)]?.key || "customer_name",
      label: TEMPLATE_VARIABLE_OPTIONS[Math.min(index - 1, TEMPLATE_VARIABLE_OPTIONS.length - 1)]?.label || `Variable ${index}`,
    }));

    const body: WhatsAppTemplateCreateReq = {
      template_name: draft.template_name.trim().toLowerCase(),
      language_code: draft.language_code.trim(),
      category: draft.category,
      header_type: draft.header_type,
      header_text: draft.header_text,
      header_example: draft.header_example,
      body_text: draft.body_text,
      footer_text: draft.footer_text,
      body_examples: draft.body_examples.slice(0, indexes.length),
      variable_mappings: mappings,
      submit: draft.submit,
    };

    try {
      const created = await api.create(body);
      setTemplates((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
      setSelectedId(created.id);
      setShowCreate(false);
      setDraft(emptyDraft());
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Create failed.");
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  const preview = selected ? templatePreviewParts(selected) : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#e6eaf0] px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[#1a1a1a]">WhatsApp Templates</h2>
          <p className="mt-0.5 text-[12px] text-[#5b6572]">
            Sync and submit templates for your connected WABA ·{" "}
            <Link to="/organization/profile?tab=whatsapp" className="text-[#2a5af5] hover:underline">
              Connection settings
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            disabled={syncing}
            onClick={() => void onSync()}
          >
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Synchronize
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 bg-[#2a5af5] hover:bg-[#214ad1]"
            onClick={() => {
              setShowCreate(true);
              setCreateError(null);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Create template
          </Button>
        </div>
      </header>

      {actionError && (
        <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-[12px] text-red-700" role="alert">
          {actionError}
        </p>
      )}

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-full min-w-0 flex-col border-r border-[#e6eaf0] md:w-[360px]">
          <div className="space-y-2 border-b border-[#e6eaf0] p-3">
            <label className="relative block">
              <span className="sr-only">Search templates</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9aa3b2]" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name"
                className="h-9 w-full rounded-md border border-[#e6eaf0] bg-[#f8fafc] pl-8 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-[#2a5af5]"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-[12px]" aria-label="Filter by status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 text-[12px]" aria-label="Filter by category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[#5b6572]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading templates…
              </div>
            )}
            {!loading && error && (
              <div className="space-y-2 px-4 py-8 text-center">
                <p className="text-[13px] text-red-600">{error}</p>
                <Button type="button" size="sm" variant="outline" onClick={() => void load()}>
                  Try again
                </Button>
              </div>
            )}
            {!loading && !error && templates.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <FileText className="h-8 w-8 text-[#cfd6e0]" />
                <p className="text-[13px] font-medium text-[#1a1a1a]">No templates yet</p>
                <p className="text-[12px] text-[#5b6572]">
                  Synchronize from Meta or create a template. Connect WhatsApp under Profile if this fails.
                </p>
              </div>
            )}
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  "w-full border-b border-[#f0f3f7] px-3 py-3 text-left",
                  selectedId === t.id ? "bg-[#eef2f7]" : "hover:bg-[#f8fafc]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-[13px] font-semibold text-[#1a1a1a]">{t.template_name}</p>
                  <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium", statusTone(t.status))}>
                    {statusLabel(t.status)}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#8b95a5]">
                  {t.language_code || "—"} · {t.category || "—"} · {t.header_type || "no header"}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-[#5b6572]">{t.content || "No body preview"}</p>
              </button>
            ))}
            {hasMore && !loading && (
              <div className="p-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={loadingMore}
                  onClick={() => void load({ append: true, offset: templates.length })}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </div>
        </aside>

        <section className="hidden min-w-0 flex-1 flex-col bg-[#f5f7f9] md:flex">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
              <FileText className="h-9 w-9 text-[#cfd6e0]" />
              <p className="text-[13px] font-medium text-[#1a1a1a]">Select a template</p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  <div className="rounded-lg border border-[#e6eaf0] bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-[16px] font-semibold text-[#1a1a1a]">{selected.template_name}</h3>
                        <p className="mt-1 text-[12px] text-[#5b6572]">
                          {selected.language_code} · {selected.category || "—"} · Meta id:{" "}
                          {selected.provider_template_id || "—"}
                        </p>
                      </div>
                      <span className={cn("rounded-md px-2 py-1 text-[11px] font-medium", statusTone(selected.status))}>
                        {statusLabel(selected.status)}
                        {selected.provider_status ? ` (${selected.provider_status})` : ""}
                      </span>
                    </div>
                    {selected.rejection_reason && (
                      <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
                        Rejection: {selected.rejection_reason}
                      </p>
                    )}
                    <dl className="mt-3 grid gap-2 text-[12px] text-[#5b6572] sm:grid-cols-2">
                      <div>
                        <dt className="text-[#9aa3b2]">Last synced</dt>
                        <dd>{formatSyncTime(selected.last_synced_at)}</dd>
                      </div>
                      <div>
                        <dt className="text-[#9aa3b2]">Updated</dt>
                        <dd>{formatSyncTime(selected.updated_at)}</dd>
                      </div>
                      <div>
                        <dt className="text-[#9aa3b2]">Connection</dt>
                        <dd>
                          {selected.business_phone || "—"}
                          {selected.waba_id ? ` · WABA ${selected.waba_id}` : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#9aa3b2]">Header</dt>
                        <dd>{selected.header_type || "NONE"}</dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selected.status === "draft" && (
                        <Button
                          type="button"
                          size="sm"
                          disabled={actionBusy}
                          onClick={() => void onSubmitDraft()}
                        >
                          Submit to Meta
                        </Button>
                      )}
                      {!!selected.provider_template_id && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={actionBusy}
                          onClick={() => void onRefreshStatus()}
                        >
                          Refresh status
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#e6eaf0] bg-white p-4">
                    <h4 className="text-[13px] font-semibold text-[#1a1a1a]">Preview</h4>
                    <p className="mt-1 text-[11px] text-[#8b95a5]">
                      Sample values are for preview only and do not change the provider template.
                    </p>
                    <div className="mt-3 space-y-2">
                      {Object.keys(previewValues).map((key) => (
                        <div key={key} className="flex items-center gap-2">
                          <Label className="w-16 text-[11px] text-[#8b95a5]">{`{{${key}}}`}</Label>
                          <Input
                            value={previewValues[key] || ""}
                            onChange={(e) =>
                              setPreviewValues((prev) => ({ ...prev, [key]: e.target.value }))
                            }
                            className="h-8 text-[12px]"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 mx-auto max-w-sm rounded-2xl bg-[#e5ddd5] p-3">
                      <div className="rounded-lg bg-white p-3 text-[13px] shadow-sm">
                        {preview?.header && (
                          <p className="mb-1 font-semibold text-[#1a1a1a]">
                            {preview.header.format && preview.header.format !== "TEXT"
                              ? `[${preview.header.format} header]`
                              : applyPreviewValues(preview.header.text || "", previewValues)}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap text-[#1a1a1a]">
                          {applyPreviewValues(preview?.body?.text || selected.content || "", previewValues)}
                        </p>
                        {preview?.footer?.text && (
                          <p className="mt-2 text-[11px] text-[#6b7280]">{preview.footer.text}</p>
                        )}
                        {preview?.buttons?.buttons?.length ? (
                          <div className="mt-3 space-y-1 border-t border-[#eef2f7] pt-2">
                            {preview.buttons.buttons.map((b, i) => (
                              <p key={i} className="text-center text-[12px] font-medium text-[#2a5af5]">
                                {b.text || b.type}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#e6eaf0] bg-white p-4">
                  <h4 className="text-[13px] font-semibold text-[#1a1a1a]">Campaign variable map</h4>
                  <p className="mt-1 text-[11px] text-[#8b95a5]">
                    Prepared for later campaigns. Not used for sending in this phase.
                  </p>
                  <ul className="mt-3 space-y-2 text-[12px] text-[#5b6572]">
                    {TEMPLATE_VARIABLE_OPTIONS.map((opt) => (
                      <li key={opt.key} className="rounded-md bg-[#f8fafc] px-2 py-1.5">
                        <span className="font-medium text-[#1a1a1a]">{opt.label}</span>
                        <span className="ml-2 text-[#9aa3b2]">{opt.key}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Create WhatsApp template"
            className="flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-xl bg-white shadow-xl sm:rounded-xl"
          >
            <div className="flex items-center justify-between border-b border-[#e6eaf0] px-4 py-3">
              <h3 className="text-[15px] font-semibold">Create template</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {createError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{createError}</p>
              )}
              <div>
                <Label htmlFor="tpl-name">Name (lowercase, underscores)</Label>
                <Input
                  id="tpl-name"
                  value={draft.template_name}
                  onChange={(e) => setDraft((d) => ({ ...d, template_name: e.target.value }))}
                  className="mt-1"
                  placeholder="appointment_reminder"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="tpl-lang">Language</Label>
                  <Input
                    id="tpl-lang"
                    value={draft.language_code}
                    onChange={(e) => setDraft((d) => ({ ...d, language_code: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={draft.category}
                    onValueChange={(v) => setDraft((d) => ({ ...d, category: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTILITY">UTILITY</SelectItem>
                      <SelectItem value="MARKETING">MARKETING</SelectItem>
                      <SelectItem value="AUTHENTICATION">AUTHENTICATION</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Header</Label>
                <Select
                  value={draft.header_type}
                  onValueChange={(v) => setDraft((d) => ({ ...d, header_type: v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    <SelectItem value="TEXT">Text</SelectItem>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {draft.header_type === "TEXT" && (
                <>
                  <div>
                    <Label htmlFor="tpl-header">Header text</Label>
                    <Input
                      id="tpl-header"
                      value={draft.header_text}
                      onChange={(e) => setDraft((d) => ({ ...d, header_text: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tpl-header-ex">Header example</Label>
                    <Input
                      id="tpl-header-ex"
                      value={draft.header_example}
                      onChange={(e) => setDraft((d) => ({ ...d, header_example: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="tpl-body">Body (use {"{{1}}"}, {"{{2}}"}…)</Label>
                <Textarea
                  id="tpl-body"
                  value={draft.body_text}
                  onChange={(e) => setDraft((d) => ({ ...d, body_text: e.target.value }))}
                  className="mt-1"
                  rows={4}
                />
              </div>
              {collectPlaceholderIndexes(draft.body_text).map((idx, i) => (
                <div key={idx}>
                  <Label htmlFor={`ex-${idx}`}>Sample for {`{{${idx}}}`}</Label>
                  <Input
                    id={`ex-${idx}`}
                    value={draft.body_examples[i] || ""}
                    onChange={(e) =>
                      setDraft((d) => {
                        const next = [...d.body_examples];
                        next[i] = e.target.value;
                        return { ...d, body_examples: next };
                      })
                    }
                    className="mt-1"
                  />
                </div>
              ))}
              <div>
                <Label htmlFor="tpl-footer">Footer (optional)</Label>
                <Input
                  id="tpl-footer"
                  value={draft.footer_text}
                  onChange={(e) => setDraft((d) => ({ ...d, footer_text: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <label className="flex items-center gap-2 text-[13px] text-[#1a1a1a]">
                <input
                  type="checkbox"
                  checked={draft.submit}
                  onChange={(e) => setDraft((d) => ({ ...d, submit: e.target.checked }))}
                />
                Submit to Meta for approval (otherwise save as local draft)
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e6eaf0] px-4 py-3">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-[#2a5af5] hover:bg-[#214ad1]"
                disabled={creating}
                onClick={() => void onCreate()}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {draft.submit ? "Create & submit" : "Save draft"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
