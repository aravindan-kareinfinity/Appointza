import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  Building2,
  CalendarDays,
  Loader2,
  MapPin,
  Package,
  BedDouble,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { OrganisationCrmCatalogueOverview } from "@/models/organisationCrmCatalogue.model";
import { OrganisationCrmService } from "@/services/organisationCrm.service";
import { resolveOrganisationId } from "@/utils/organisationContext.util";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

function formatMoney(value: number): string {
  if (!value && value !== 0) return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function formatEventWhen(item: {
  event_date?: string | null;
  from_date?: string | null;
  to_date?: string | null;
  start_time?: string;
  end_time?: string;
}): string {
  const parts: string[] = [];
  if (item.event_date) {
    try {
      parts.push(format(new Date(item.event_date), "dd MMM yyyy"));
    } catch {
      parts.push(item.event_date);
    }
  } else if (item.from_date || item.to_date) {
    const from = item.from_date
      ? (() => {
          try {
            return format(new Date(item.from_date!), "dd MMM yyyy");
          } catch {
            return item.from_date!;
          }
        })()
      : "";
    const to = item.to_date
      ? (() => {
          try {
            return format(new Date(item.to_date!), "dd MMM yyyy");
          } catch {
            return item.to_date!;
          }
        })()
      : "";
    parts.push([from, to].filter(Boolean).join(" – "));
  }
  if (item.start_time || item.end_time) {
    parts.push([item.start_time, item.end_time].filter(Boolean).join(" – "));
  }
  return parts.filter(Boolean).join(" · ") || "—";
}

export default function CrmCatalogue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const service = useMemo(() => new OrganisationCrmService(), []);
  const organisationId = resolveOrganisationId(user?.organisationid);

  const [data, setData] = useState<OrganisationCrmCatalogueOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (organisationId <= 0) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const overview = await service.getCatalogueOverview({
        organisation_id: organisationId,
      });
      setData(overview);
    } catch (err) {
      console.error(err);
      setData(null);
      toast({
        title: "Could not load catalogue",
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

  if (loading) {
    return (
      <div className="flex h-full min-h-[16rem] items-center justify-center gap-2 text-sm text-stone-500">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        Loading catalogue…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
        <Package className="h-10 w-10 text-stone-300" />
        <p className="font-medium text-appointza-navy">Catalogue unavailable</p>
        <Button type="button" variant="outline" className={org.btnOutline} onClick={() => void load()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const orgSummary = data.organisation;
  const locations = data.locations ?? [];
  const services = data.services ?? [];
  const events = data.events ?? [];
  const rooms = data.rooms ?? [];

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-appointza-navy md:text-xl">
              Business Profile
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Read-only overview. Manage services at{" "}
              <Link
                to="/organization/services?kind=services"
                className="font-medium text-blue-600 hover:underline"
              >
                Services
              </Link>
              .
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(org.btnOutline, "h-9")}
            onClick={() => void load()}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* Organisation */}
        <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-appointza-navy sm:text-lg">
                  {orgSummary?.name || "Organisation"}
                </h2>
                {orgSummary?.organisation_type ? (
                  <Badge variant="outline" className="capitalize">
                    {orgSummary.organisation_type}
                  </Badge>
                ) : null}
                {orgSummary?.isactive === false ? (
                  <Badge variant="outline" className="bg-stone-100 text-stone-600">
                    Inactive
                  </Badge>
                ) : null}
              </div>
              {orgSummary?.tagline ? (
                <p className="mt-1 text-sm text-stone-600">{orgSummary.tagline}</p>
              ) : null}
              <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {orgSummary?.gstnumber ? (
                  <div>
                    <dt className="text-stone-400">GST</dt>
                    <dd className="font-medium text-stone-800">{orgSummary.gstnumber}</dd>
                  </div>
                ) : null}
                {orgSummary?.notes ? (
                  <div className="sm:col-span-2">
                    <dt className="text-stone-400">Notes</dt>
                    <dd className="text-stone-700">{orgSummary.notes}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        </section>

        {/* Locations */}
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-3 sm:px-5">
            <MapPin className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-appointza-navy">Locations</h2>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs tabular-nums text-stone-600">
              {locations.length}
            </span>
          </div>
          {locations.length === 0 ? (
            <p className="px-4 py-6 text-sm text-stone-500 sm:px-5">No active locations.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {locations.map((loc) => (
                <li key={loc.id} className="px-4 py-3.5 sm:px-5">
                  <p className="font-medium text-appointza-navy">{loc.name || "—"}</p>
                  <p className="mt-0.5 text-sm text-stone-600">
                    {[loc.address, loc.city].filter(Boolean).join(", ") || "—"}
                  </p>
                  {(loc.mobile || loc.email) && (
                    <p className="mt-1 text-xs text-stone-500">
                      {[loc.mobile, loc.email].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Services */}
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-appointza-navy">Services</h2>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs tabular-nums text-stone-600">
                {services.length}
              </span>
            </div>
            <Link
              to="/organization/services?kind=services"
              className="text-[12px] font-medium text-blue-600 hover:underline"
            >
              Manage
            </Link>
          </div>
          {services.length === 0 ? (
            <p className="px-4 py-6 text-sm text-stone-500 sm:px-5">No active services.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-appointza-navy">
                        {s.name || "—"}
                      </TableCell>
                      <TableCell className="text-stone-600">
                        {s.duration_minutes > 0 ? `${s.duration_minutes} min` : "—"}
                      </TableCell>
                      <TableCell className="tabular-nums text-stone-700">
                        {s.show_price === false
                          ? "Hidden"
                          : s.weekday_price || s.weekend_price
                            ? `Wday ${formatMoney(s.weekday_price || s.price)} · Wend ${formatMoney(s.weekend_price || s.price)}`
                            : formatMoney(s.price)}
                      </TableCell>
                      <TableCell>
                        {s.is_combo ? (
                          <Badge variant="outline">Combo</Badge>
                        ) : (
                          <span className="text-stone-500">Service</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Events */}
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-3 sm:px-5">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-appointza-navy">Events</h2>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs tabular-nums text-stone-600">
              {events.length}
            </span>
          </div>
          {events.length === 0 ? (
            <p className="px-4 py-6 text-sm text-stone-500 sm:px-5">No active events.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Entry</TableHead>
                    <TableHead>Slots</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <p className="font-medium text-appointza-navy">{e.event_name || "—"}</p>
                        <p className="text-xs text-stone-500">
                          {[e.event_type, e.location].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-stone-600">{formatEventWhen(e)}</TableCell>
                      <TableCell className="tabular-nums text-stone-700">
                        {formatMoney(e.entry_amount)}
                      </TableCell>
                      <TableCell className="tabular-nums text-stone-600">
                        {e.remainingslot}/{e.slot_limit || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {e.status || "active"}
                          {!e.is_public ? " · private" : ""}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Rooms */}
        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-3 sm:px-5">
            <BedDouble className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-appointza-navy">Rooms</h2>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs tabular-nums text-stone-600">
              {rooms.length}
            </span>
          </div>
          {rooms.length === 0 ? (
            <p className="px-4 py-6 text-sm text-stone-500 sm:px-5">No active rooms.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[520px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-appointza-navy">
                        {[r.room_number, r.room_name].filter(Boolean).join(" · ") || "—"}
                      </TableCell>
                      <TableCell className="capitalize text-stone-600">
                        {r.room_type || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {r.status || "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
