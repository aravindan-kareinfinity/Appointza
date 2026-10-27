import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WhatsAppCampaignService } from "@/services/whatsappCampaign.service";
import type { WhatsAppCampaignDto } from "@/models/whatsappCampaign.model";

const campaignsApi = new WhatsAppCampaignService();

function statusTone(status: string): string {
  switch ((status || "").toLowerCase()) {
    case "completed":
      return "bg-emerald-50 text-emerald-700";
    case "dispatching":
    case "queued":
      return "bg-blue-50 text-blue-700";
    case "completed_with_errors":
    case "paused":
      return "bg-amber-50 text-amber-800";
    case "failed":
    case "cancelled":
      return "bg-red-50 text-red-700";
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
 * CRM → Reports — WhatsApp campaign performance summary (Phase 6).
 * Detailed recipient drill-down lives on WhatsApp Campaigns → Report.
 */
export default function CrmWhatsAppCampaignReports() {
  const [list, setList] = useState<WhatsAppCampaignDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await campaignsApi.select({ limit: 100 });
      setList(items);
    } catch (err) {
      setError(apiError(err, "Failed to load campaign reports."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#e6eaf0] px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-[15px] font-semibold text-[#1a1a1a]">Campaign Reports</h2>
          <p className="mt-0.5 text-[12px] text-[#5b6572]">
            Accepted ≠ delivered. Delivery and read come from Meta webhooks. Open a campaign for recipient detail.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => void load()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-[#5b6572]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading reports…
          </div>
        )}
        {!loading && error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
        )}
        {!loading && !error && list.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <BarChart3 className="h-9 w-9 text-[#cfd6e0]" />
            <p className="text-[13px] font-medium text-[#1a1a1a]">No campaigns yet</p>
            <Link to="/organization/crm/whatsapp-campaigns" className="text-[12px] text-[#2a5af5] hover:underline">
              Create a WhatsApp campaign
            </Link>
          </div>
        )}
        <div className="space-y-2">
          {list.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e6eaf0] px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold text-[#1a1a1a]">{c.name}</p>
                  <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", statusTone(c.status))}>
                    {c.status}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-[#5b6572]">
                  Eligible {c.eligible_count}/{c.selected_count}
                  {c.started_at ? ` · Started ${new Date(c.started_at).toLocaleString()}` : ""}
                  {c.scheduled_at ? ` · Scheduled ${new Date(c.scheduled_at).toLocaleString()}` : ""}
                </p>
                <p className="mt-1 text-[12px] text-[#1a1a1a]">
                  Accepted {c.accepted_count ?? 0} · Delivered {c.delivered_count ?? 0} · Read{" "}
                  {c.read_count ?? 0} · Failed {c.failed_count ?? 0} · Cancelled {c.cancelled_count ?? 0}
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" asChild>
                <Link to="/organization/crm/whatsapp-campaigns">Open campaigns</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
