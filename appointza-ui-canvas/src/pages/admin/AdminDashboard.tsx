import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AdminService,
  clearAdminSession,
  getAdminContext,
  type AdminDashboardStats,
  type AdminOrganisation,
  type AdminOrganisationLocation,
} from "@/services/admin.service";

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function addressLine(loc: AdminOrganisationLocation) {
  return [loc.addressline1, loc.addressline2, loc.city, loc.state, loc.pincode, loc.country]
    .map((p) => (p || "").trim())
    .filter(Boolean)
    .join(", ");
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const service = useMemo(() => new AdminService(), []);
  const [ctx] = useState(() => getAdminContext());
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [orgs, setOrgs] = useState<AdminOrganisation[]>([]);
  const [locations, setLocations] = useState<AdminOrganisationLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const load = async (searchTerm = query, opts?: { soft?: boolean }) => {
    if (!opts?.soft) setLoading(true);
    else setRefreshing(true);
    try {
      const [statsData, orgData, locData] = await Promise.all([
        service.getDashboardStats(),
        service.getAllOrganisations(searchTerm),
        service.getAllOrganisationLocations(),
      ]);
      setStats(statsData);
      setOrgs(orgData);
      setLocations(locData);
      if (orgData.length > 0) {
        setSelectedId((prev) =>
          prev && orgData.some((o) => o.id === prev) ? prev : orgData[0].id,
        );
      } else {
        setSelectedId(null);
      }
    } catch (err) {
      toast({
        title: "Could not load admin console",
        description: err instanceof Error ? err.message : "Session may have expired",
        variant: "destructive",
      });
      clearAdminSession();
      navigate("/admin/login", { replace: true });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!ctx?.accesstoken) {
      navigate("/admin/login", { replace: true });
      return;
    }
    void load("");
  }, []);

  const locationsByOrg = useMemo(() => {
    const map = new Map<number, AdminOrganisationLocation[]>();
    for (const loc of locations) {
      const oid = loc.organisationid || 0;
      if (!map.has(oid)) map.set(oid, []);
      map.get(oid)!.push(loc);
    }
    return map;
  }, [locations]);

  const selected = orgs.find((o) => o.id === selectedId) || null;
  const selectedLocations = selected ? locationsByOrg.get(selected.id) || [] : [];

  const logout = () => {
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search);
    void load(search, { soft: true });
  };

  const onToggleSuspend = async (org: AdminOrganisation) => {
    setBusyId(org.id);
    try {
      if (org.isactive === false || org.issuspended) {
        await service.activateOrganisation(org.id);
        toast({ title: "Organisation activated" });
      } else {
        await service.suspendOrganisation(org.id, "Suspended by superadmin");
        toast({ title: "Organisation suspended" });
      }
      await load(query, { soft: true });
    } catch (err) {
      toast({
        title: "Status update failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await service.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      toast({ title: "Password updated" });
    } catch (err) {
      toast({
        title: "Password change failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#7dd3fc]" />
      </div>
    );
  }

  const orgStats = stats?.OrganizationStats;
  const appt = stats?.AppointmentStats;

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b1220]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#7dd3fc]">Superadmin</p>
            <h1 className="text-lg font-semibold">{ctx?.adminname || ctx?.adminemail}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              disabled={refreshing}
              onClick={() => void load(query, { soft: true })}
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#121a2b] p-4">
            <p className="text-sm text-slate-400">Organisations</p>
            <p className="mt-1 text-3xl font-semibold">{orgStats?.TotalOrganizations ?? orgs.length}</p>
            <p className="mt-1 text-xs text-slate-500">
              Verified {orgStats?.VerifiedOrganizations ?? 0} · Unverified {orgStats?.NotVerifiedOrganizations ?? 0}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#121a2b] p-4">
            <p className="text-sm text-slate-400">Appointments</p>
            <p className="mt-1 text-3xl font-semibold">{appt?.TotalAppointments ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#121a2b] p-4">
            <p className="text-sm text-slate-400">Locations loaded</p>
            <p className="mt-1 text-3xl font-semibold">{locations.length}</p>
            <p className="mt-1 text-xs text-slate-500">{ctx?.adminemail}</p>
          </div>
        </section>

        <form onSubmit={onSearch} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organisations by name or GST…"
              className="h-11 border-white/10 bg-[#121a2b] pl-9 text-white"
            />
          </div>
          <Button type="submit" className="h-11 bg-[#38bdf8] text-[#0b1220] hover:bg-[#7dd3fc]">
            Search
          </Button>
        </form>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#121a2b]">
            <div className="border-b border-white/10 px-4 py-3">
              <h2 className="text-sm font-medium text-slate-200">All organisations ({orgs.length})</h2>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {orgs.length === 0 ? (
                <p className="px-4 py-8 text-sm text-slate-500">No organisations found.</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {orgs.map((org) => {
                    const locs = locationsByOrg.get(org.id)?.length ?? 0;
                    const active = selectedId === org.id;
                    return (
                      <li key={org.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(org.id)}
                          className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                            active ? "bg-[#1a2438]" : "hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-white">{org.name || `Org #${org.id}`}</span>
                            <span className="shrink-0 text-xs text-slate-500">#{org.id}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className={org.isactive ? "text-emerald-400" : "text-rose-400"}>
                              {org.isactive ? "Active" : "Inactive"}
                            </span>
                            <span className={org.issuspended ? "text-amber-400" : "text-sky-400"}>
                              {org.issuspended ? "Suspended" : "OK"}
                            </span>
                            <span className="text-slate-500">{locs} location{locs === 1 ? "" : "s"}</span>
                          </div>
                          <p className="truncate text-xs text-slate-500">
                            {[org.primarytypecode, org.gstnumber].filter(Boolean).join(" · ") || "—"}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#121a2b]">
            {!selected ? (
              <p className="px-4 py-10 text-sm text-slate-500">Select an organisation to view details.</p>
            ) : (
              <div className="space-y-5 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500">Organisation detail</p>
                    <h2 className="mt-1 text-xl font-semibold">{selected.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">{selected.tagline || "No tagline"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyId === selected.id}
                      className="border-white/20 bg-transparent text-white hover:bg-white/10"
                      onClick={() => void onToggleSuspend(selected)}
                    >
                      {busyId === selected.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : selected.isactive === false || selected.issuspended ? (
                        "Activate"
                      ) : (
                        "Suspend"
                      )}
                    </Button>
                  </div>
                </div>

                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate-500">ID</dt>
                    <dd className="text-sm">{selected.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">GST</dt>
                    <dd className="text-sm">{selected.gstnumber || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Primary type</dt>
                    <dd className="text-sm">{selected.primarytypecode || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Secondary type</dt>
                    <dd className="text-sm">{selected.secondarytypecode || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Created</dt>
                    <dd className="text-sm">{formatDate(selected.createdon)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Modified</dt>
                    <dd className="text-sm">{formatDate(selected.modifiedon)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Booking amount</dt>
                    <dd className="text-sm">{selected.booking_amount ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Service amount</dt>
                    <dd className="text-sm">{selected.isserviceamount ? "Yes" : "No"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-500">Notes</dt>
                    <dd className="text-sm text-slate-300">{selected.notes || "—"}</dd>
                  </div>
                </dl>

                <div>
                  <h3 className="mb-3 text-sm font-medium text-slate-200">
                    Locations ({selectedLocations.length})
                  </h3>
                  {selectedLocations.length === 0 ? (
                    <p className="text-sm text-slate-500">No locations for this organisation.</p>
                  ) : (
                    <ul className="space-y-3">
                      {selectedLocations.map((loc) => (
                        <li
                          key={loc.id}
                          className="rounded-lg border border-white/10 bg-[#0b1220] px-3 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium">{loc.name || `Location #${loc.id}`}</p>
                            <div className="flex gap-2 text-xs">
                              <span className={loc.isactive ? "text-emerald-400" : "text-rose-400"}>
                                {loc.isactive ? "Active" : "Inactive"}
                              </span>
                              <span className={loc.isverified ? "text-sky-400" : "text-amber-400"}>
                                {loc.isverified ? "Verified" : "Unverified"}
                              </span>
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-slate-400">{addressLine(loc) || "No address"}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Mobile: {loc.organisationmobile || loc.usermobile || "—"}
                            {loc.googlelocation ? ` · ${loc.googlelocation}` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#121a2b]">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-slate-300"
            onClick={() => setShowPassword((v) => !v)}
          >
            Change password
            <span className="text-xs text-slate-500">{showPassword ? "Hide" : "Show"}</span>
          </button>
          {showPassword && (
            <form onSubmit={(e) => void onChangePassword(e)} className="border-t border-white/10 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-slate-300">Current password</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1.5 border-white/10 bg-[#0b1220] text-white"
                    required
                  />
                </div>
                <div>
                  <Label className="text-slate-300">New password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1.5 border-white/10 bg-[#0b1220] text-white"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={savingPassword}
                className="mt-4 bg-[#38bdf8] text-[#0b1220] hover:bg-[#7dd3fc]"
              >
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
