import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  CircleAlert,
  Loader2,
  MessageCircle,
  MoreVertical,
  PanelRightClose,
  PanelRightOpen,
  Phone,
  RefreshCw,
  Search,
  Send,
  Smile,
  UserRound,
  WifiOff,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStaff } from "@/hooks/useStaff";
import { useWhatsAppCrmRealtime } from "@/hooks/useWhatsAppCrmRealtime";
import type {
  WhatsAppConversationDto,
  WhatsAppInboxFilter,
  WhatsAppInboxListMode,
  WhatsAppMessageDto,
  WhatsAppMessagingContactDto,
} from "@/models/whatsappCrm.model";
import type { WhatsAppTemplateDto } from "@/models/whatsappTemplate.model";
import { WhatsAppCrmService } from "@/services/whatsappCrm.service";
import { WhatsAppTemplateService } from "@/services/whatsappTemplate.service";
import { OrganisationCommunicationIntegrationService } from "@/services/organisationCommunicationIntegration.service";
import { resolveOrganisationId } from "@/utils/organisationContext.util";
import { cn } from "@/lib/utils";
import {
  conversationDisplayName,
  deliveryLabel,
  formatChatDayLabel,
  formatMessageTime,
  formatWaId,
  isWithinCustomerServiceWindow,
  messageBody,
  messageDayKey,
  messagingContactLabel,
  upsertConversation,
  upsertMessage,
} from "@/utils/whatsappInbox.util";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 40;
const api = new WhatsAppCrmService();
const templateApi = new WhatsAppTemplateService();
const integrationsApi = new OrganisationCommunicationIntegrationService();
const WA_SETTINGS_HREF = "/organization/profile?tab=whatsapp";

function axiosErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string; error?: string } } })?.response
    ?.data;
  return data?.message || data?.error || (err instanceof Error ? err.message : fallback);
}

/** Classic WhatsApp chat wallpaper (subtle doodle tile). */
const WA_CHAT_BG = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260' viewBox='0 0 260 260'>
    <rect width='260' height='260' fill='#efeae2'/>
    <g fill='none' stroke='#d5cfc4' stroke-width='1.2' opacity='0.55'>
      <path d='M22 38c8-10 22-8 28 2'/><circle cx='58' cy='72' r='7'/>
      <path d='M96 46h18v12H96z'/><path d='M140 30c6 8 4 18-4 22'/>
      <path d='M188 52l10 8-6 10-10-8z'/><circle cx='230' cy='40' r='5'/>
      <path d='M34 118c12 0 16 14 6 20'/><path d='M78 108v22'/><circle cx='118' cy='124' r='8'/>
      <path d='M162 106c10 6 10 18 0 24'/><path d='M208 118h24'/><path d='M40 188c8-6 20-2 22 10'/>
      <circle cx='92' cy='196' r='6'/><path d='M132 176l14 14-8 8-14-14z'/>
      <path d='M186 188c0-12 16-16 22-6'/><path d='M228 176v28'/>
    </g>
  </svg>`,
)}")`;

const LIST_MODES: { id: WhatsAppInboxListMode; label: string }[] = [
  { id: "conversations", label: "Chats" },
  { id: "contacts", label: "Leads & customers" },
];

const FILTERS: { id: WhatsAppInboxFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "open", label: "Open" },
  { id: "pending", label: "Pending" },
  { id: "closed", label: "Closed" },
];

function StatusTicks({ status }: { status?: string }) {
  const s = (status || "").toLowerCase();
  if (s === "failed") {
    return <CircleAlert className="h-3.5 w-3.5 text-red-500" aria-label="Failed" />;
  }
  if (s === "read") {
    return <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" aria-label="Read" />;
  }
  if (s === "delivered") {
    return <CheckCheck className="h-3.5 w-3.5 text-[#8696a0]" aria-label="Delivered" />;
  }
  if (s === "sent" || s === "queued") {
    return <Check className="h-3.5 w-3.5 text-[#8696a0]" aria-label={deliveryLabel(s)} />;
  }
  return null;
}

function Avatar({
  name,
  className,
  tone = "teal",
}: {
  name: string;
  className?: string;
  tone?: "teal" | "grey";
}) {
  const letter = (name.trim()[0] || "?").toUpperCase();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white",
        tone === "teal" ? "bg-[#00a884]" : "bg-[#dfe5e7] text-[#54656f]",
        className,
      )}
      aria-hidden
    >
      {letter}
    </div>
  );
}

/**
 * WhatsApp Inbox — WhatsApp Web–style chat UI over CRM REST + SignalR.
 * Connection settings remain under Profile → WhatsApp.
 */
export default function CrmUnifiedInbox() {
  const { user } = useAuth();
  const orgId = resolveOrganisationId(user?.organisationid);
  const { staff } = useStaff(orgId);

  const [listMode, setListMode] = useState<WhatsAppInboxListMode>("conversations");
  const [filter, setFilter] = useState<WhatsAppInboxFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<WhatsAppConversationDto[]>([]);
  const [contacts, setContacts] = useState<WhatsAppMessagingContactDto[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [openingContactKey, setOpeningContactKey] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  /** Kept explicitly so chat view opens even if the row is not yet in the chats list. */
  const [activeConversation, setActiveConversation] = useState<WhatsAppConversationDto | null>(
    null,
  );
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [messages, setMessages] = useState<WhatsAppMessageDto[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [approvedTemplates, setApprovedTemplates] = useState<WhatsAppTemplateDto[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [sendingTemplate, setSendingTemplate] = useState(false);
  const [waConnected, setWaConnected] = useState<boolean | null>(null);
  const [waBusinessPhone, setWaBusinessPhone] = useState("");

  const selectedIdRef = useRef<number | null>(null);
  selectedIdRef.current = selectedId;
  const listAbortRef = useRef<AbortController | null>(null);
  const messagesAbortRef = useRef<AbortController | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const markReadTimerRef = useRef<number | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const selected = useMemo(() => {
    if (selectedId == null) return null;
    const fromList = conversations.find((c) => Number(c.id) === Number(selectedId));
    if (fromList) return fromList;
    if (activeConversation && Number(activeConversation.id) === Number(selectedId)) {
      return activeConversation;
    }
    return null;
  }, [conversations, selectedId, activeConversation]);

  // Keep active conversation in sync with list updates (status, unread, preview).
  useEffect(() => {
    if (selectedId == null) return;
    const fromList = conversations.find((c) => Number(c.id) === Number(selectedId));
    if (fromList) setActiveConversation(fromList);
  }, [conversations, selectedId]);

  const withinServiceWindow = useMemo(
    () => isWithinCustomerServiceWindow(messages),
    [messages],
  );

  const staffNameByUserId = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of staff ?? []) {
      const uid = Number(s.userid || 0);
      if (uid > 0) map.set(uid, s.name || s.email || `User ${uid}`);
    }
    return map;
  }, [staff]);

  const threadedMessages = useMemo(() => {
    const rows: Array<
      | { kind: "day"; key: string; label: string }
      | { kind: "msg"; message: WhatsAppMessageDto }
    > = [];
    let lastDay = "";
    for (const m of messages) {
      const day = messageDayKey(m.provider_timestamp || m.created_at);
      if (day && day !== lastDay) {
        rows.push({
          kind: "day",
          key: day,
          label: formatChatDayLabel(m.provider_timestamp || m.created_at),
        });
        lastDay = day;
      }
      rows.push({ kind: "msg", message: m });
    }
    return rows;
  }, [messages]);

  const loadWhatsAppConnection = useCallback(async () => {
    if (orgId <= 0) {
      setWaConnected(false);
      setWaBusinessPhone("");
      return;
    }
    try {
      const items = await integrationsApi.select({
        organisation_id: orgId,
        provider: "whatsapp",
      });
      const item =
        items.find(
          (i) =>
            i.is_active !== false &&
            (i.status || "").toLowerCase() === "connected" &&
            !!i.has_access_token &&
            !!i.whatsapp?.id,
        ) ?? null;
      setWaConnected(!!item);
      setWaBusinessPhone(item?.whatsapp?.business_phone || "");
    } catch {
      setWaConnected(null);
    }
  }, [orgId]);

  useEffect(() => {
    void loadWhatsAppConnection();
  }, [loadWhatsAppConnection]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadConversations = useCallback(
    async (opts?: { append?: boolean; offset?: number }) => {
      const append = opts?.append === true;
      const offset = opts?.offset ?? 0;
      listAbortRef.current?.abort();
      const ac = new AbortController();
      listAbortRef.current = ac;

      if (append) setLoadingMore(true);
      else {
        setListLoading(true);
        setListError(null);
      }

      try {
        const status = filter === "all" || filter === "unread" ? undefined : filter;
        const items = await api.selectConversations({
          search: search || undefined,
          status,
          unread_only: filter === "unread",
          limit: PAGE_SIZE,
          offset,
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        setConversations((prev) => (append ? [...prev, ...items] : items));
        setHasMore(items.length >= PAGE_SIZE);
      } catch (err: unknown) {
        if (
          (err as { name?: string })?.name === "CanceledError" ||
          (err as { code?: string })?.code === "ERR_CANCELED"
        ) {
          return;
        }
        if (!append) {
          setListError(err instanceof Error ? err.message : "Failed to load conversations.");
          setConversations([]);
        }
      } finally {
        if (!ac.signal.aborted) {
          setListLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [filter, search],
  );

  const loadContacts = useCallback(
    async (opts?: { append?: boolean; offset?: number }) => {
      const append = opts?.append === true;
      const offset = opts?.offset ?? 0;
      listAbortRef.current?.abort();
      const ac = new AbortController();
      listAbortRef.current = ac;

      if (append) setLoadingMore(true);
      else {
        setListLoading(true);
        setListError(null);
      }

      try {
        const items = await api.selectMessagingContacts({
          search: search || undefined,
          limit: PAGE_SIZE,
          offset,
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        setContacts((prev) => (append ? [...prev, ...items] : items));
        setHasMore(items.length >= PAGE_SIZE);
      } catch (err: unknown) {
        if (
          (err as { name?: string })?.name === "CanceledError" ||
          (err as { code?: string })?.code === "ERR_CANCELED"
        ) {
          return;
        }
        if (!append) {
          const axiosMsg = (err as { response?: { data?: { message?: string; error?: string } } })
            ?.response?.data;
          setListError(
            axiosMsg?.message ||
              axiosMsg?.error ||
              (err instanceof Error ? err.message : "Failed to load contacts."),
          );
          setContacts([]);
        }
      } finally {
        if (!ac.signal.aborted) {
          setListLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [search],
  );

  useEffect(() => {
    if (listMode === "conversations") {
      void loadConversations({ offset: 0 });
    } else {
      void loadContacts({ offset: 0 });
    }
    return () => listAbortRef.current?.abort();
  }, [listMode, loadConversations, loadContacts]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    void (async () => {
      try {
        const items = await templateApi.select({
          status: "approved",
          limit: 100,
        });
        if (!cancelled) setApprovedTemplates(items);
      } catch {
        if (!cancelled) setApprovedTemplates([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const loadMessages = useCallback(async (conversationId: number) => {
    messagesAbortRef.current?.abort();
    const ac = new AbortController();
    messagesAbortRef.current = ac;
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const items = await api.selectMessages(conversationId, 200, ac.signal);
      if (ac.signal.aborted || selectedIdRef.current !== conversationId) return;
      setMessages(items);
    } catch (err: unknown) {
      if (
        (err as { name?: string })?.name === "CanceledError" ||
        (err as { code?: string })?.code === "ERR_CANCELED"
      ) {
        return;
      }
      if (selectedIdRef.current === conversationId) {
        setMessagesError(err instanceof Error ? err.message : "Failed to load messages.");
        setMessages([]);
      }
    } finally {
      if (!ac.signal.aborted && selectedIdRef.current === conversationId) {
        setMessagesLoading(false);
      }
    }
  }, []);

  const markRead = useCallback(async (conversationId: number) => {
    try {
      const updated = await api.patchConversation(conversationId, { mark_read: true });
      setConversations((prev) => upsertConversation(prev, updated));
    } catch {
      // non-blocking
    }
  }, []);

  const openChatView = useCallback(
    (conversation: WhatsAppConversationDto) => {
      const id = Number(conversation.id);
      if (!id) return;
      setActiveConversation(conversation);
      setSelectedId(id);
      setMobileView("chat");
      setComposer("");
      setSendError(null);
      setMessages([]);
      setMessagesError(null);
      setConversations((prev) => upsertConversation(prev, conversation));
      void loadMessages(id);
      window.setTimeout(() => composerRef.current?.focus(), 80);

      if (markReadTimerRef.current) window.clearTimeout(markReadTimerRef.current);
      markReadTimerRef.current = window.setTimeout(() => {
        if ((conversation.unread_count ?? 0) > 0) {
          void markRead(id);
        }
      }, 400);
    },
    [loadMessages, markRead],
  );

  const selectConversation = useCallback(
    (conversation: WhatsAppConversationDto | number) => {
      if (typeof conversation === "number") {
        const id = Number(conversation);
        const fromList = conversations.find((c) => Number(c.id) === id);
        if (fromList) {
          openChatView(fromList);
          return;
        }
        void (async () => {
          try {
            const fetched = await api.getConversation(id);
            if (fetched) openChatView(fetched);
            else setSendError("Could not open that chat.");
          } catch (err: unknown) {
            setSendError(err instanceof Error ? err.message : "Could not open that chat.");
          }
        })();
        return;
      }
      openChatView(conversation);
    },
    [conversations, openChatView],
  );

  const selectMessagingContact = useCallback(
    async (contact: WhatsAppMessagingContactDto) => {
      const key = `${contact.source_type}:${contact.source_id}:${contact.phone || contact.source_id}`;
      const phoneDigits = (contact.phone || "").replace(/\D/g, "");
      if (phoneDigits.length < 10) {
        setSendError(
          "This lead has no mobile number. Open Leads & Contacts, add a mobile, then start the chat here.",
        );
        return;
      }
      if (waConnected === false) {
        setSendError(
          "WhatsApp is not connected for this organisation. Open Connection settings, add WABA ID, Phone Number ID, and an access token, then save.",
        );
        void loadWhatsAppConnection();
        return;
      }
      setOpeningContactKey(key);
      setSendError(null);
      try {
        let opened: WhatsAppConversationDto | null = null;
        const existingId = Number(contact.conversation_id ?? 0);
        if (existingId > 0) {
          opened =
            conversations.find((c) => Number(c.id) === existingId) ??
            (await api.getConversation(existingId));
        }
        if (!opened) {
          opened = await api.ensureConversation({
            phone: contact.phone || undefined,
            customer_id: contact.customer_id ?? undefined,
            enquiry_id: contact.enquiry_id ?? undefined,
            display_name: contact.display_name || undefined,
          });
        }
        setContacts((prev) =>
          prev.map((c) =>
            c.source_type === contact.source_type && c.source_id === contact.source_id
              ? { ...c, conversation_id: opened!.id, phone: opened!.customer_wa_id || c.phone }
              : c,
          ),
        );
        openChatView(opened);
      } catch (err: unknown) {
        const msg = axiosErrorMessage(err, "Could not open chat for this contact.");
        setSendError(msg);
        if (/not connected/i.test(msg)) {
          setWaConnected(false);
        }
      } finally {
        setOpeningContactKey(null);
      }
    },
    [conversations, openChatView, waConnected, loadWhatsAppConnection],
  );

  useEffect(() => {
    return () => {
      messagesAbortRef.current?.abort();
      if (markReadTimerRef.current) window.clearTimeout(markReadTimerRef.current);
    };
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedId]);

  const { connectionState } = useWhatsAppCrmRealtime(!!orgId, {
    onConversationUpdated: (conversation) => {
      setConversations((prev) => upsertConversation(prev, conversation));
    },
    onMessageUpserted: ({ message, conversation }) => {
      if (conversation) {
        setConversations((prev) => upsertConversation(prev, conversation));
      }
      if (selectedIdRef.current === message.conversation_id) {
        setMessages((prev) => upsertMessage(prev, message));
        if (message.direction === "inbound") {
          void markRead(message.conversation_id);
        }
      }
    },
    onMessageStatusChanged: (message) => {
      if (selectedIdRef.current === message.conversation_id) {
        setMessages((prev) => upsertMessage(prev, message));
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === message.conversation_id
            ? {
                ...c,
                last_message_status:
                  c.last_message_direction === "outbound" || !c.last_message_direction
                    ? message.status
                    : c.last_message_status,
              }
            : c,
        ),
      );
    },
  });

  useEffect(() => {
    if (connectionState === "connected") return;
    const id = window.setInterval(() => {
      if (listMode === "contacts") {
        void loadContacts({ offset: 0 });
      } else {
        void loadConversations({ offset: 0 });
      }
      if (selectedIdRef.current) {
        void loadMessages(selectedIdRef.current);
      }
    }, 20000);
    return () => window.clearInterval(id);
  }, [connectionState, listMode, loadConversations, loadContacts, loadMessages]);

  const refreshList = () => {
    void loadWhatsAppConnection();
    if (listMode === "contacts") {
      void loadContacts({ offset: 0 });
    } else {
      void loadConversations({ offset: 0 });
    }
  };

  const onSendTemplate = async () => {
    if (!selectedId || sendingTemplate) return;
    const tid = Number(templateId);
    if (!tid) return;
    setSendingTemplate(true);
    setSendError(null);
    try {
      // Server aligns body/header params to the template's {{n}} count (Meta #132000).
      const name = selected ? conversationDisplayName(selected) : "";
      const saved = await api.sendTemplate(selectedId, {
        message_template_id: tid,
        body_parameters: name ? [name] : [],
      });
      setMessages((prev) => upsertMessage(prev, saved));
      setTemplateId("");
      if (selected) {
        setConversations((prev) =>
          upsertConversation(prev, {
            ...selected,
            last_message_at: saved.created_at,
            last_message_preview: saved.text_content || selected.last_message_preview,
            last_message_direction: "outbound",
            last_message_status: saved.status,
            updated_at: saved.updated_at,
          }),
        );
      }
      void loadMessages(selectedId);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Template send failed.");
      setSendError(msg);
      void loadMessages(selectedId);
    } finally {
      setSendingTemplate(false);
    }
  };

  const onSend = async () => {
    if (!selectedId || sending) return;
    const text = composer.trim();
    if (!text) return;
    setSending(true);
    setSendError(null);
    const tempId = -Date.now();
    const nowIso = new Date().toISOString();
    // Show the green bubble immediately; replace with server row when the API returns.
    setMessages((prev) =>
      upsertMessage(prev, {
        id: tempId,
        organisation_id: orgId,
        whatsapp_connection_id: selected?.whatsapp_connection_id ?? 0,
        conversation_id: selectedId,
        provider_message_id: "",
        direction: "outbound",
        message_type: "text",
        text_content: text,
        media_id: "",
        status: "queued",
        failure_reason: "",
        provider_timestamp: nowIso,
        created_at: nowIso,
        updated_at: nowIso,
      }),
    );
    setComposer("");
    try {
      const saved = await api.sendText(selectedId, text);
      setMessages((prev) =>
        upsertMessage(
          prev.filter((m) => m.id !== tempId),
          saved,
        ),
      );
      setConversations((prev) =>
        upsertConversation(prev, {
          ...(selected as WhatsAppConversationDto),
          last_message_at: saved.created_at,
          last_message_preview: text,
          last_message_direction: "outbound",
          last_message_status: saved.status,
          updated_at: saved.updated_at,
        }),
      );
      void loadMessages(selectedId);
      composerRef.current?.focus();
    } catch (err: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setComposer(text);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error
          ? err.message
          : "Send failed. Refresh before retrying to avoid duplicates.");
      setSendError(msg);
      void loadMessages(selectedId);
    } finally {
      setSending(false);
    }
  };

  const onComposerKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSend();
    }
  };

  const onStatusChange = async (status: string) => {
    if (!selectedId) return;
    try {
      const updated = await api.patchConversation(selectedId, { status });
      setConversations((prev) => upsertConversation(prev, updated));
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Failed to update status.");
    }
  };

  const onAssign = async (value: string) => {
    if (!selectedId) return;
    const assigned = value === "unassigned" ? undefined : Number(value);
    try {
      const updated = await api.patchConversation(selectedId, {
        assigned_user_id: assigned && assigned > 0 ? assigned : undefined,
      });
      setConversations((prev) => upsertConversation(prev, updated));
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Failed to assign conversation.");
    }
  };

  // Chat panel takes over on small screens after a row click; desktop keeps list + chat.
  const showChat = selected != null && mobileView === "chat";
  const canSendFreeform =
    !!selected && selected.status !== "closed" && withinServiceWindow && !sending;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#111b21]">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-none bg-[#efeae2] shadow-none lg:m-0">
        {/* Panel A — chat list */}
        <aside
          className={cn(
            "flex w-full min-w-0 flex-col border-r border-[#d1d7db] bg-white md:w-[360px] md:max-w-[400px] lg:w-[380px]",
            showChat ? "hidden md:flex" : "flex",
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 bg-[#00a884] px-4 py-3 text-white">
            <div className="min-w-0">
              <h2 className="truncate text-[16px] font-semibold tracking-tight">WhatsApp Inbox</h2>
              <p className="mt-0.5 truncate text-[11px] text-white/80">
                {waConnected === true
                  ? waBusinessPhone
                    ? `Connected · ${waBusinessPhone}`
                    : "Connected"
                  : waConnected === false
                    ? "Not connected"
                    : "Checking connection…"}{" "}
                ·{" "}
                <Link to={WA_SETTINGS_HREF} className="underline-offset-2 hover:underline">
                  Connection settings
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-1">
              {connectionState !== "connected" && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-black/15 px-2 py-1 text-[10px]"
                  title="Realtime connection unavailable — refreshing periodically"
                >
                  <WifiOff className="h-3 w-3" aria-hidden />
                  Offline
                </span>
              )}
              <button
                type="button"
                onClick={refreshList}
                className="rounded-full p-2 text-white/90 transition hover:bg-white/10"
                aria-label="Refresh list"
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className="hidden rounded-full p-2 text-white/90 transition hover:bg-white/10 lg:inline-flex"
                onClick={() => setDetailsOpen((v) => !v)}
                aria-label={detailsOpen ? "Hide details" : "Show details"}
              >
                {detailsOpen ? (
                  <PanelRightClose className="h-4 w-4" aria-hidden />
                ) : (
                  <PanelRightOpen className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <div className="shrink-0 space-y-2 border-b border-[#e9edef] bg-[#f0f2f5] p-2.5">
            {waConnected === false && (
              <div className="rounded-lg border border-[#f0c36d] bg-[#fff5c4] px-3 py-2 text-[12px] text-[#5c4b1f]">
                WhatsApp Cloud API is not connected for this organisation. Chats cannot start until
                you save WABA ID, Phone Number ID, and an access token under{" "}
                <Link to={WA_SETTINGS_HREF} className="font-semibold text-[#027eb5] hover:underline">
                  Profile → WhatsApp
                </Link>
                .
              </div>
            )}
            <div
              className="flex gap-1 rounded-lg bg-white/70 p-0.5"
              role="tablist"
              aria-label="Inbox list mode"
            >
              {LIST_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={listMode === m.id}
                  onClick={() => setListMode(m.id)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-[12px] font-medium transition",
                    listMode === m.id
                      ? "bg-white text-[#111b21] shadow-sm"
                      : "text-[#667781] hover:text-[#111b21]",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <label className="relative block">
              <span className="sr-only">
                {listMode === "contacts" ? "Search leads and customers" : "Search conversations"}
              </span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#54656f]" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={
                  listMode === "contacts" ? "Search lead or customer" : "Search or start a chat"
                }
                className="h-9 w-full rounded-lg border-0 bg-white pl-9 pr-3 text-[13px] text-[#111b21] outline-none ring-0 placeholder:text-[#8696a0] focus:ring-2 focus:ring-[#00a884]/40"
              />
            </label>
            {listMode === "conversations" && (
              <div className="flex flex-wrap gap-1" role="tablist" aria-label="Conversation filters">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={filter === f.id}
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-medium",
                      filter === f.id
                        ? "bg-[#00a884] text-white"
                        : "bg-white text-[#667781] hover:bg-[#e9edef]",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto bg-white"
            role="listbox"
            aria-label={listMode === "contacts" ? "Leads and customers" : "Conversations"}
          >
            {sendError && !showChat && (
              <p className="mx-3 mt-3 rounded-lg bg-[#ffebee] px-3 py-2 text-[12px] text-[#b71c1c]" role="alert">
                {sendError}{" "}
                {/not connected/i.test(sendError) ? (
                  <Link to={WA_SETTINGS_HREF} className="font-medium text-[#027eb5] hover:underline">
                    Open connection settings
                  </Link>
                ) : null}
              </p>
            )}
            {listLoading && (
              <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[#667781]">
                <Loader2 className="h-4 w-4 animate-spin text-[#00a884]" aria-hidden />
                {listMode === "contacts" ? "Loading contacts…" : "Loading chats…"}
              </div>
            )}
            {!listLoading && listError && (
              <div className="space-y-2 px-4 py-8 text-center">
                <p className="text-[13px] text-red-600">{listError}</p>
                <Button type="button" size="sm" variant="outline" onClick={refreshList}>
                  Try again
                </Button>
              </div>
            )}
            {!listLoading &&
              !listError &&
              listMode === "conversations" &&
              conversations.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                  <MessageCircle className="h-8 w-8 text-[#cfd6e0]" aria-hidden />
                  <p className="text-[13px] font-medium text-[#111b21]">
                    {search || filter !== "all" ? "No matching chats" : "No chats yet"}
                  </p>
                  <p className="text-[12px] text-[#667781]">
                    Inbound WhatsApp messages appear here after your number is connected, or start
                    from{" "}
                    <button
                      type="button"
                      className="text-[#00a884] hover:underline"
                      onClick={() => setListMode("contacts")}
                    >
                      Leads &amp; customers
                    </button>
                    .
                  </p>
                </div>
              )}
            {!listLoading && !listError && listMode === "contacts" && contacts.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <UserRound className="h-8 w-8 text-[#cfd6e0]" aria-hidden />
                <p className="text-[13px] font-medium text-[#111b21]">
                  {search ? "No matching contacts" : "No leads or customers yet"}
                </p>
                <p className="text-[12px] text-[#667781]">
                  Create a lead under{" "}
                  <Link
                    to="/organization/crm/contacts"
                    className="text-[#00a884] hover:underline"
                  >
                    Leads &amp; Contacts
                  </Link>{" "}
                  (include a mobile number to chat on WhatsApp).
                </p>
              </div>
            )}
            {listMode === "contacts" &&
              contacts.map((contact) => {
                const key = `${contact.source_type}:${contact.source_id}:${contact.phone || "nophone"}`;
                const title = messagingContactLabel(contact);
                const opening = openingContactKey === key;
                const hasChat = (contact.conversation_id ?? 0) > 0;
                const hasPhone = (contact.phone || "").replace(/\D/g, "").length >= 10;
                const active = selectedId != null && contact.conversation_id === selectedId;
                return (
                  <button
                    key={key}
                    type="button"
                    role="option"
                    aria-selected={active}
                    disabled={opening}
                    onClick={() => void selectMessagingContact(contact)}
                    className={cn(
                      "flex w-full gap-3 border-b border-[#f0f2f5] px-3 py-3 text-left transition-colors disabled:opacity-70",
                      active ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]",
                    )}
                  >
                    <Avatar name={title} className="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[15px] font-medium text-[#111b21]">{title}</p>
                        {opening ? (
                          <Loader2
                            className="h-3.5 w-3.5 shrink-0 animate-spin text-[#8696a0]"
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      <p className="truncate text-[12px] text-[#667781]">
                        {hasPhone ? formatWaId(contact.phone) : "No mobile number"}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-[#8696a0]">
                        {contact.source_type === "lead" ? "Lead" : "Customer"}
                        {hasChat
                          ? " · existing chat"
                          : hasPhone
                            ? " · start chat"
                            : " · add mobile to chat"}
                      </p>
                    </div>
                  </button>
                );
              })}
            {listMode === "conversations" &&
              conversations.map((c) => {
                const active = selectedId != null && Number(c.id) === Number(selectedId);
                const title = conversationDisplayName(c);
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => selectConversation(c)}
                    className={cn(
                      "flex w-full gap-3 border-b border-[#f0f2f5] px-3 py-3 text-left transition-colors",
                      active ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]",
                    )}
                  >
                    <Avatar name={title} className="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[15px] font-medium text-[#111b21]">{title}</p>
                        <span
                          className={cn(
                            "shrink-0 text-[11px]",
                            c.unread_count > 0 ? "font-medium text-[#00a884]" : "text-[#667781]",
                          )}
                        >
                          {formatMessageTime(c.last_message_at)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {c.last_message_direction === "outbound" && (
                          <StatusTicks status={c.last_message_status} />
                        )}
                        <p className="truncate text-[13px] text-[#667781]">
                          {c.last_message_preview || "—"}
                        </p>
                        {c.unread_count > 0 && (
                          <span className="ml-auto shrink-0 rounded-full bg-[#25d366] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {c.unread_count > 99 ? "99+" : c.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            {hasMore && !listLoading && (
              <div className="p-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-[#d1d7db]"
                  disabled={loadingMore}
                  onClick={() => {
                    if (listMode === "contacts") {
                      void loadContacts({ append: true, offset: contacts.length });
                    } else {
                      void loadConversations({ append: true, offset: conversations.length });
                    }
                  }}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Panel B — WhatsApp chat */}
        <section
          className={cn(
            "relative flex min-w-0 flex-1 flex-col",
            !showChat && "hidden md:flex",
          )}
        >
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#f0f2f5] px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#dfe5e7]">
                <MessageCircle className="h-10 w-10 text-[#00a884]" aria-hidden />
              </div>
              <p className="text-[22px] font-light text-[#41525d]">WhatsApp Inbox</p>
              <p className="max-w-md text-[13px] leading-relaxed text-[#667781]">
                Select a chat from the list to view messages and reply — same layout as WhatsApp
                Web.
              </p>
              <div className="mt-2 h-px w-64 max-w-full bg-[#d1d7db]" />
              <p className="text-[12px] text-[#8696a0]">
                End-to-end encryption with Meta · CRM tools stay in Details
              </p>
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b border-[#d1d7db] bg-[#f0f2f5] px-3 py-2 sm:px-4">
                <button
                  type="button"
                  className="rounded-full p-1.5 text-[#54656f] hover:bg-black/5 md:hidden"
                  onClick={() => setMobileView("list")}
                  aria-label="Back to chat list"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <Avatar name={conversationDisplayName(selected)} className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-[#111b21]">
                    {conversationDisplayName(selected)}
                  </p>
                  <p className="truncate text-[12px] text-[#667781]">
                    {formatWaId(selected.customer_wa_id)}
                    {selected.status ? ` · ${selected.status}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 text-[#54656f]">
                  <span className="hidden rounded-full p-2 sm:inline-flex" title="Voice calls via WhatsApp app">
                    <Phone className="h-5 w-5 opacity-40" aria-hidden />
                  </span>
                  <button
                    type="button"
                    className="hidden rounded-full p-2 hover:bg-black/5 lg:inline-flex"
                    onClick={() => setDetailsOpen((v) => !v)}
                    aria-label={detailsOpen ? "Hide details" : "Show details"}
                  >
                    <MoreVertical className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              </div>

              <div
                className="relative min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-8"
                style={{
                  backgroundColor: "#efeae2",
                  backgroundImage: WA_CHAT_BG,
                  backgroundSize: "360px 360px",
                }}
              >
                {messagesLoading && (
                  <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-[#667781]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#00a884]" aria-hidden />
                    Loading messages…
                  </div>
                )}
                {messagesError && (
                  <p className="mx-auto max-w-sm rounded-lg bg-[#ffebee] px-3 py-2 text-center text-[12px] text-[#b71c1c] shadow-sm">
                    {messagesError}
                  </p>
                )}
                {!messagesLoading && !messagesError && messages.length === 0 && (
                  <div className="mx-auto mt-6 max-w-sm rounded-lg bg-[#ffeecd] px-3 py-2 text-center text-[12px] text-[#54656f] shadow-sm">
                    No messages yet. Send a template or wait for the customer to message you.
                  </div>
                )}

                <div className="mx-auto flex max-w-3xl flex-col gap-1">
                  {threadedMessages.map((row) => {
                    if (row.kind === "day") {
                      return (
                        <div key={`day-${row.key}`} className="my-2 flex justify-center">
                          <span className="rounded-lg bg-[#ffffff99] px-3 py-1 text-[12px] font-medium text-[#54656f] shadow-sm backdrop-blur-sm">
                            {row.label}
                          </span>
                        </div>
                      );
                    }
                    const m = row.message;
                    const outbound = m.direction === "outbound";
                    return (
                      <div
                        key={`${m.id}-${m.provider_message_id || ""}`}
                        className={cn("flex", outbound ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "relative max-w-[min(88%,32rem)] px-2.5 pb-1.5 pt-1.5 text-[14.2px] leading-[1.35] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]",
                            outbound
                              ? "rounded-lg rounded-tr-none bg-[#d9fdd3] text-[#111b21]"
                              : "rounded-lg rounded-tl-none bg-white text-[#111b21]",
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0 h-0 w-0 border-y-[6px] border-y-transparent",
                              outbound
                                ? "-right-[6px] border-l-[6px] border-l-[#d9fdd3]"
                                : "-left-[6px] border-r-[6px] border-r-white",
                            )}
                            aria-hidden
                          />
                          <p className="whitespace-pre-wrap break-words pr-1">{messageBody(m)}</p>
                          <div className="mt-0.5 flex items-center justify-end gap-1 pl-8">
                            <time
                              className="text-[11px] text-[#667781]"
                              dateTime={m.provider_timestamp || m.created_at}
                            >
                              {formatMessageTime(m.provider_timestamp || m.created_at)}
                            </time>
                            {outbound && <StatusTicks status={m.status} />}
                          </div>
                          {m.status === "failed" && m.failure_reason && (
                            <p className="mt-1 text-[11px] text-red-600">{m.failure_reason}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={threadEndRef} />
                </div>
              </div>

              <div className="shrink-0 bg-[#f0f2f5] px-2 py-2 sm:px-3">
                {sendError && (
                  <p
                    className="mb-2 rounded-lg bg-[#ffebee] px-3 py-1.5 text-[12px] text-[#b71c1c]"
                    role="alert"
                  >
                    {sendError}
                  </p>
                )}
                {!messagesLoading && !withinServiceWindow && (
                  <div className="mb-2 rounded-lg border border-[#f0c36d] bg-[#fff5c4] px-3 py-2 text-[12px] text-[#5c4b1f]">
                    Free-form replies need a customer message within the last 24 hours. Send an{" "}
                    <Link
                      to="/organization/crm/whatsapp/templates"
                      className="font-medium text-[#027eb5] hover:underline"
                    >
                      approved template
                    </Link>{" "}
                    to reopen the chat.
                  </div>
                )}
                {!messagesLoading && !withinServiceWindow && approvedTemplates.length > 0 && (
                  <div className="mb-2 flex flex-wrap items-end gap-2 rounded-lg bg-white/70 p-2">
                    <div className="min-w-[12rem] flex-1">
                      <label
                        className="text-[11px] font-medium text-[#667781]"
                        htmlFor="wa-template-send"
                      >
                        Send template
                      </label>
                      <Select value={templateId || undefined} onValueChange={setTemplateId}>
                        <SelectTrigger id="wa-template-send" className="mt-1 h-9 border-[#d1d7db] bg-white">
                          <SelectValue placeholder="Choose approved template" />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedTemplates.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.template_name} ({t.language_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      className="h-9 shrink-0 bg-[#00a884] hover:bg-[#008f72]"
                      disabled={sendingTemplate || !templateId || selected.status === "closed"}
                      onClick={() => void onSendTemplate()}
                    >
                      {sendingTemplate ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        "Send template"
                      )}
                    </Button>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <span className="mb-1.5 hidden rounded-full p-2 text-[#54656f] sm:inline-flex">
                    <Smile className="h-5 w-5 opacity-50" aria-hidden />
                  </span>
                  <textarea
                    ref={composerRef}
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    onKeyDown={onComposerKeyDown}
                    placeholder={
                      withinServiceWindow
                        ? "Type a message"
                        : "Customer care window closed — use a template"
                    }
                    disabled={sending || selected.status === "closed" || !withinServiceWindow}
                    rows={1}
                    className="max-h-32 min-h-[42px] flex-1 resize-none rounded-lg border-0 bg-white px-3 py-2.5 text-[15px] text-[#111b21] outline-none placeholder:text-[#8696a0] focus:ring-2 focus:ring-[#00a884]/30 disabled:bg-[#f0f2f5] disabled:text-[#8696a0]"
                    aria-label="Message composer"
                  />
                  <button
                    type="button"
                    className={cn(
                      "mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition",
                      canSendFreeform && composer.trim()
                        ? "bg-[#00a884] hover:bg-[#008f72]"
                        : "cursor-not-allowed bg-[#cfd6d8]",
                    )}
                    disabled={!canSendFreeform || !composer.trim()}
                    onClick={() => void onSend()}
                    aria-label="Send message"
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    ) : (
                      <Send className="h-5 w-5 translate-x-px" aria-hidden />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Panel C — CRM details (collapsed by default for chat-first view) */}
        {selected && detailsOpen && (
          <aside className="hidden w-[280px] shrink-0 flex-col border-l border-[#d1d7db] bg-white lg:flex">
            <div className="border-b border-[#e9edef] bg-[#f0f2f5] px-4 py-3">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-[#667781]">
                Details
              </p>
            </div>
            <div className="space-y-4 overflow-y-auto p-4 text-[13px]">
              <div className="flex items-start gap-3">
                <Avatar name={conversationDisplayName(selected)} className="h-12 w-12" />
                <div className="min-w-0">
                  <p className="font-semibold text-[#111b21]">
                    {conversationDisplayName(selected)}
                  </p>
                  <p className="text-[12px] text-[#667781]">
                    {formatWaId(selected.customer_wa_id)}
                  </p>
                </div>
              </div>

              {selected.customer_id ? (
                <div>
                  <p className="text-[11px] font-medium text-[#8696a0]">Customer record</p>
                  <Link
                    to={`/organization/clients/${selected.customer_id}/book`}
                    className="mt-1 inline-block text-[#00a884] hover:underline"
                  >
                    Open client booking
                  </Link>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-[#d1d7db] bg-[#f8fafc] px-3 py-2">
                  <p className="font-medium text-[#111b21]">Customer not linked</p>
                  <p className="mt-0.5 text-[12px] text-[#667781]">
                    This WhatsApp number is not linked to an Appointza customer.
                  </p>
                </div>
              )}

              <div>
                <label className="text-[11px] font-medium text-[#8696a0]" htmlFor="wa-status">
                  Conversation status
                </label>
                <Select
                  value={selected.status || "open"}
                  onValueChange={(v) => void onStatusChange(v)}
                >
                  <SelectTrigger id="wa-status" className="mt-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#8696a0]" htmlFor="wa-assign">
                  Assigned staff
                </label>
                <Select
                  value={
                    selected.assigned_user_id && selected.assigned_user_id > 0
                      ? String(selected.assigned_user_id)
                      : "unassigned"
                  }
                  onValueChange={(v) => void onAssign(v)}
                >
                  <SelectTrigger id="wa-assign" className="mt-1 h-9">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {(staff ?? []).map((s) => {
                      const uid = Number(s.userid || 0);
                      if (!uid) return null;
                      return (
                        <SelectItem key={uid} value={String(uid)}>
                          {s.name || s.email || `User ${uid}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selected.assigned_user_id ? (
                  <p className="mt-1 text-[11px] text-[#8696a0]">
                    {staffNameByUserId.get(selected.assigned_user_id) ||
                      `User ${selected.assigned_user_id}`}
                  </p>
                ) : null}
              </div>

              <div>
                <p className="text-[11px] font-medium text-[#8696a0]">Unread</p>
                <p className="mt-0.5 text-[#111b21]">{selected.unread_count}</p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
