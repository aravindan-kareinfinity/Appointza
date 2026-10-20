import { useState } from "react";
import { Inbox, Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type InboxChannel = "all" | "email" | "whatsapp";

/**
 * Unified Inbox shell — conversations live here; WhatsApp/Email connection
 * settings stay under Settings → Account → Integrations.
 */
export default function CrmUnifiedInbox() {
  const [channel, setChannel] = useState<InboxChannel>("all");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-stone-200 px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-appointza-navy">Unified Inbox</h2>
            <p className="mt-1 text-sm text-stone-500">
              Email and WhatsApp conversations together. Connect accounts in Settings → Account →
              Integrations.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-1 overflow-x-auto">
          {(
            [
              { id: "all" as const, label: "All", icon: Inbox },
              { id: "email" as const, label: "Email", icon: Mail },
              { id: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = channel === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setChannel(tab.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-800",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <Inbox className="h-10 w-10 text-stone-300" />
        <p className="font-medium text-appointza-navy">No conversations yet</p>
        <p className="max-w-sm text-sm text-stone-500">
          {channel === "email"
            ? "Email threads will appear here once an email account is connected and messages sync."
            : channel === "whatsapp"
              ? "WhatsApp chats will appear here once WhatsApp Business is connected."
              : "Connected Email and WhatsApp messages will show in this inbox."}
        </p>
      </div>
    </div>
  );
}
