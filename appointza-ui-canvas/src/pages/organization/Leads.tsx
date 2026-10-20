import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Target,
} from "lucide-react";
import OrganizationPageShell from "@/components/layout/OrganizationPageShell";
import { ResponsiveEditSheet } from "@/components/organization/ResponsiveEditSheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";
import type { Enquiry } from "@/models/enquiry.model";
import { emptyEnquiry } from "@/models/enquiry.model";
import type { ReferenceValue } from "@/models/referencevalue.model";
import { EnquiryService } from "@/services/enquiry.service";
import { ReferenceTypeService } from "@/services/referencetype.service";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { resolveOrganisationId } from "@/utils/organisationContext.util";
import {
  ensureLeadReferenceTypes,
  LEAD_REFERENCE_TYPE_IDS,
  loadLeadReferenceValues,
} from "@/utils/leadReferenceTypes.util";

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "new", label: "New", badge: "bg-[#fff4e5] text-[#b54708]" },
  { id: "contacted", label: "Contacted", badge: "bg-[#eef4ff] text-[#3538cd]" },
  { id: "converted", label: "Converted", badge: "bg-[#ecfdf3] text-[#067647]" },
  { id: "closed", label: "Closed", badge: "bg-[#f2f4f7] text-[#344054]" },
] as const;

const statusPillClasses: Record<string, string> = {
  new: "bg-[#eef4ff] text-[#3538cd]",
  contacted: "bg-[#eef4ff] text-[#3538cd]",
  in_progress: "bg-[#fff4e5] text-[#b54708]",
  converted: "bg-[#ecfdf3] text-[#067647]",
  won: "bg-[#ecfdf3] text-[#067647]",
  closed: "bg-[#fef3f2] text-[#b42318]",
  lost: "bg-[#fef3f2] text-[#b42318]",
};

type SearchField = "all" | "email" | "mobile" | "name" | "business";

type LeadFormState = {
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  owner_name: string;
  category: string;
  website: string;
  google_maps_link: string;
  address: string;
  pin_code: string;
  area: string;
  city: string;
  state: string;
  lead_type: string;
  source: string;
  tags: string;
};

const emptyLeadForm = (): LeadFormState => ({
  name: "",
  mobile: "",
  email: "",
  business_name: "",
  owner_name: "",
  category: "",
  website: "",
  google_maps_link: "",
  address: "",
  pin_code: "",
  area: "",
  city: "",
  state: "",
  lead_type: "",
  source: "",
  tags: "",
});

function normalizeStatus(status?: string) {
  const s = (status || "new").toLowerCase();
  if (s === "won") return "converted";
  if (s === "lost") return "closed";
  if (s === "in_progress") return "contacted";
  return s;
}

export default function OrganizationLeads() {
  const { user } = useAuth();
  const { toast } = useToast();
  const enquiryService = useMemo(() => new EnquiryService(), []);
  const referenceTypeService = useMemo(() => new ReferenceTypeService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const organisationId = resolveOrganisationId(user?.organisationid);

  const [leads, setLeads] = useState<Enquiry[]>([]);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("all");
  const [statusTab, setStatusTab] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<LeadFormState>(emptyLeadForm);
  const [leadTypes, setLeadTypes] = useState<ReferenceValue[]>([]);
  const [leadSources, setLeadSources] = useState<ReferenceValue[]>([]);
  const [leadCategories, setLeadCategories] = useState<ReferenceValue[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  const loadLeads = useCallback(async () => {
    if (organisationId <= 0) {
      setLeads([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await enquiryService.selectByOrganisation(organisationId);
      setLeads(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Failed to load organization leads", error);
      setLeads([]);
      toast({
        title: "Could not load leads",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [enquiryService, organisationId, toast]);

  const loadLookups = useCallback(async () => {
    if (organisationId <= 0) return;
    setLoadingLookups(true);
    try {
      const types = await ensureLeadReferenceTypes(
        referenceTypeService,
        referenceValueService,
        organisationId,
      );
      const byId = Object.fromEntries(types.map((t) => [t.identifier, t.id]));

      const [typeVals, sourceVals, categoryVals] = await Promise.all([
        loadLeadReferenceValues(
          referenceValueService,
          organisationId,
          byId[LEAD_REFERENCE_TYPE_IDS.TYPE] || 0,
        ),
        loadLeadReferenceValues(
          referenceValueService,
          organisationId,
          byId[LEAD_REFERENCE_TYPE_IDS.SOURCE] || 0,
        ),
        loadLeadReferenceValues(
          referenceValueService,
          organisationId,
          byId[LEAD_REFERENCE_TYPE_IDS.CATEGORY] || 0,
        ),
      ]);

      setLeadTypes(typeVals);
      setLeadSources(sourceVals);
      setLeadCategories(categoryVals);
    } catch (error) {
      console.error("Failed to load lead lookups", error);
    } finally {
      setLoadingLookups(false);
    }
  }, [organisationId, referenceTypeService, referenceValueService]);

  useEffect(() => {
    void loadLeads();
    void loadLookups();
  }, [loadLeads, loadLookups]);

  const openCreate = async () => {
    setForm(emptyLeadForm());
    setShowCreate(true);
    await loadLookups();
  };

  useEffect(() => {
    if (!showCreate || loadingLookups) return;
    setForm((prev) => ({
      ...prev,
      lead_type: prev.lead_type || leadTypes[0]?.displaytext || "",
      source: prev.source || leadSources[0]?.displaytext || "",
      category: prev.category || leadCategories[0]?.displaytext || "",
    }));
  }, [showCreate, loadingLookups, leadTypes, leadSources, leadCategories]);

  const closeCreate = () => {
    setShowCreate(false);
    setForm(emptyLeadForm());
  };

  const handleSaveLead = async () => {
    if (!form.name.trim()) {
      toast({
        title: "Name required",
        description: "Enter the lead contact name.",
        variant: "destructive",
      });
      return;
    }
    if (organisationId <= 0) return;

    setSaving(true);
    try {
      const payload = emptyEnquiry(organisationId);
      payload.name = form.name.trim();
      payload.mobile = form.mobile.trim();
      payload.email = form.email.trim();
      payload.business_name = form.business_name.trim();
      payload.owner_name = form.owner_name.trim();
      payload.category = form.category.trim();
      payload.website = form.website.trim();
      payload.google_maps_link = form.google_maps_link.trim();
      payload.address = form.address.trim();
      payload.pin_code = form.pin_code.trim();
      payload.area = form.area.trim();
      payload.city = form.city.trim();
      payload.state = form.state.trim();
      payload.lead_type = form.lead_type.trim();
      payload.source = form.source.trim() || "Manual entry";
      payload.tags = form.tags.trim();
      payload.status = "new";
      payload.message = [
        form.business_name && `Business: ${form.business_name}`,
        form.owner_name && `Owner: ${form.owner_name}`,
        form.address && `Address: ${form.address}`,
      ]
        .filter(Boolean)
        .join(" · ");

      await enquiryService.insert(payload);
      toast({ title: "Lead created" });
      closeCreate();
      await loadLeads();
    } catch (error) {
      console.error("Failed to create lead", error);
      toast({
        title: "Could not create lead",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    for (const tab of STATUS_TABS) {
      if (tab.id === "all") continue;
      counts[tab.id] = leads.filter((l) => normalizeStatus(l.status) === tab.id).length;
    }
    return counts;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      const status = normalizeStatus(lead.status);
      if (statusTab !== "all" && status !== statusTab) return false;
      if (filterType !== "all" && (lead.lead_type || "") !== filterType) return false;
      if (filterSource !== "all" && (lead.source || "") !== filterSource) return false;
      if (filterCategory !== "all" && (lead.category || "") !== filterCategory) return false;

      if (!query) return true;
      const haystacks: Record<SearchField, string> = {
        all: [
          lead.name,
          lead.email,
          lead.mobile,
          lead.business_name,
          lead.owner_name,
          lead.city,
          lead.tags,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
        email: (lead.email || "").toLowerCase(),
        mobile: (lead.mobile || "").toLowerCase(),
        name: (lead.name || "").toLowerCase(),
        business: (lead.business_name || "").toLowerCase(),
      };
      return haystacks[searchField].includes(query);
    });
  }, [leads, search, searchField, statusTab, filterType, filterSource, filterCategory]);

  useEffect(() => {
    setPage(1);
  }, [search, searchField, statusTab, filterType, filterSource, filterCategory, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const pagedLeads = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, page, pageSize]);

  const copyText = async (label: string, value: string) => {
    if (!value) {
      toast({ title: `No ${label} to copy`, variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copied` });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const setField =
    (key: keyof LeadFormState) => (value: string) =>
      setForm((prev) => ({ ...prev, [key]: value }));

  const filterBtnClass =
    "inline-flex h-8 items-center gap-1.5 rounded-md border border-[#e6eaf0] bg-white px-2.5 text-[13px] font-medium text-[#344054] shadow-none hover:bg-[#f8fafc]";

  return (
    <OrganizationPageShell className="box-border h-full min-h-0 overflow-hidden bg-[#f5f7f9] p-3 md:p-4 lg:p-5">
      <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#e6eaf0] bg-white shadow-none">
        {/* Tabs + search */}
        <div className="flex shrink-0 flex-col gap-3 border-b border-[#eef1f5] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {STATUS_TABS.map((tab) => {
              const active = statusTab === tab.id;
              const count = statusCounts[tab.id] ?? 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusTab(tab.id)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-[#f2f4f7] text-[#1a1a1a]"
                      : "text-[#667085] hover:bg-[#f8fafc] hover:text-[#1a1a1a]",
                  )}
                >
                  {tab.label}
                  {tab.id !== "all" ? (
                    <span
                      className={cn(
                        "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                        tab.badge,
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-8 min-w-[220px] flex-1 items-center overflow-hidden rounded-md border border-[#e6eaf0] bg-white sm:min-w-[280px] sm:flex-none">
              <Search className="ml-2.5 h-3.5 w-3.5 shrink-0 text-[#98a2b3]" aria-hidden />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="h-8 flex-1 border-0 bg-transparent px-2 text-[13px] shadow-none focus-visible:ring-0"
              />
              <Select
                value={searchField}
                onValueChange={(v) => setSearchField(v as SearchField)}
              >
                <SelectTrigger className="h-8 w-auto min-w-[7.5rem] shrink-0 rounded-none border-0 border-l border-[#e6eaf0] bg-transparent px-2 text-[12px] text-[#667085] shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">in All fields</SelectItem>
                  <SelectItem value="email">in Email ID</SelectItem>
                  <SelectItem value="mobile">in Mobile</SelectItem>
                  <SelectItem value="name">in Name</SelectItem>
                  <SelectItem value="business">in Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              className={cn(org.btnPrimary, "h-8 shrink-0")}
              onClick={() => void openCreate()}
              disabled={organisationId <= 0}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add lead
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#eef1f5] px-4 py-2.5">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className={cn(filterBtnClass, "w-auto gap-1.5 [&>svg]:opacity-70")}>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Type: All</SelectItem>
              {leadTypes.map((v) => (
                <SelectItem key={v.id} value={v.displaytext || v.identifier}>
                  {v.displaytext || v.identifier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className={cn(filterBtnClass, "w-auto gap-1.5 [&>svg]:opacity-70")}>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Source: All</SelectItem>
              {leadSources.map((v) => (
                <SelectItem key={v.id} value={v.displaytext || v.identifier}>
                  {v.displaytext || v.identifier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className={cn(filterBtnClass, "w-auto gap-1.5 [&>svg]:opacity-70")}>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Category: All</SelectItem>
              {leadCategories.map((v) => (
                <SelectItem key={v.id} value={v.displaytext || v.identifier}>
                  {v.displaytext || v.identifier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="shrink-0 px-4 py-2 text-[12px] text-[#667085]">
          Showing{" "}
          <span className="font-medium text-[#344054]">
            {isLoading ? "…" : filteredLeads.length}
          </span>{" "}
          results
        </p>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-[13px] text-[#667085]">
            <Loader2 className="h-4 w-4 animate-spin text-[#2a5af5]" />
            Loading leads…
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            <Target className="mx-auto h-9 w-9 text-[#d0d5dd]" />
            <p className="mt-3 text-[14px] font-medium text-[#1a1a1a]">
              {search || statusTab !== "all" ? "No matching leads" : "No leads yet"}
            </p>
            <p className="mt-1 text-[13px] text-[#667085]">
              {search || statusTab !== "all"
                ? "Try a different filter or search."
                : "Add a lead manually, or wait for contact-form enquiries."}
            </p>
            {!search && statusTab === "all" ? (
              <Button
                type="button"
                className={cn(org.btnPrimary, "mt-4")}
                onClick={() => void openCreate()}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add lead
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              <Table className="min-w-[980px]">
                <TableHeader className="sticky top-0 z-10 bg-white">
                  <TableRow className="border-[#eef1f5] hover:bg-transparent">
                    <TableHead className="h-9 px-4 text-[12px] font-medium text-[#667085]">
                      Contact
                    </TableHead>
                    <TableHead className="h-9 px-4 text-[12px] font-medium text-[#667085]">
                      Business
                    </TableHead>
                    <TableHead className="h-9 px-4 text-[12px] font-medium text-[#667085]">
                      Location
                    </TableHead>
                    <TableHead className="h-9 px-4 text-[12px] font-medium text-[#667085]">
                      Type
                    </TableHead>
                    <TableHead className="h-9 px-4 text-[12px] font-medium text-[#667085]">
                      Status
                    </TableHead>
                    <TableHead className="h-9 px-4 text-[12px] font-medium text-[#667085]">
                      Created
                    </TableHead>
                    <TableHead className="h-9 w-20 px-3 text-[12px] font-medium text-[#667085]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedLeads.map((lead) => {
                    const status = normalizeStatus(lead.status);
                    const createdDate = lead.created_at ? new Date(lead.created_at) : null;
                    const createdLabel =
                      createdDate && !Number.isNaN(createdDate.getTime())
                        ? format(createdDate, "MMM d, yyyy")
                        : "—";
                    const locationLine = [lead.area, lead.city].filter(Boolean).join(", ");
                    const primaryContact =
                      lead.email?.trim() || lead.name?.trim() || "No customer details";
                    const secondaryContact =
                      lead.email?.trim() && lead.name?.trim()
                        ? lead.mobile?.trim() || lead.name.trim()
                        : lead.mobile?.trim() ||
                          (lead.email?.trim() ? lead.name?.trim() : "") ||
                          "";

                    return (
                      <TableRow
                        key={lead.id}
                        className="border-[#eef1f5] hover:bg-[#fafbfc]"
                      >
                        <TableCell className="px-4 py-3 align-top">
                          <p className="text-[13px] font-medium text-[#1a1a1a]">
                            {primaryContact}
                          </p>
                          {secondaryContact ? (
                            <p className="mt-0.5 text-[12px] text-[#667085]">{secondaryContact}</p>
                          ) : null}
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          <p className="text-[13px] font-medium text-[#1a1a1a]">
                            {lead.business_name?.trim() || "—"}
                          </p>
                          <p className="mt-0.5 text-[12px] text-[#667085]">
                            {lead.category?.trim() || lead.source?.trim() || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          <p className="text-[13px] text-[#1a1a1a]">
                            {locationLine || lead.address?.trim() || "—"}
                          </p>
                          {lead.pin_code ? (
                            <p className="mt-0.5 text-[12px] text-[#667085]">{lead.pin_code}</p>
                          ) : null}
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top text-[13px] text-[#1a1a1a]">
                          {lead.lead_type || "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3 align-top">
                          <span
                            className={cn(
                              "inline-flex rounded px-2 py-0.5 text-[12px] font-medium capitalize",
                              statusPillClasses[status] ?? "bg-[#f2f4f7] text-[#344054]",
                            )}
                          >
                            {lead.status || "new"}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-4 py-3 align-top text-[13px] text-[#1a1a1a]">
                          {createdLabel}
                        </TableCell>
                        <TableCell className="px-2 py-2 align-middle">
                          <div className="flex items-center justify-end gap-0.5">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="flex h-7 w-7 items-center justify-center rounded-md text-[#667085] hover:bg-[#f2f4f7] hover:text-[#1a1a1a]"
                                  aria-label="More actions"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem
                                  onClick={() => void copyText("Email", lead.email || "")}
                                >
                                  <Copy className="mr-2 h-3.5 w-3.5" />
                                  Copy email
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => void copyText("Mobile", lead.mobile || "")}
                                >
                                  <Copy className="mr-2 h-3.5 w-3.5" />
                                  Copy mobile
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => void copyText("Lead ID", String(lead.id))}
                                >
                                  <Copy className="mr-2 h-3.5 w-3.5" />
                                  Copy lead ID
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-[#b42318] focus:text-[#b42318]"
                                  onClick={() =>
                                    toast({
                                      title: "Coming soon",
                                      description: "Lead close / archive will be available next.",
                                    })
                                  }
                                >
                                  Close lead
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <button
                              type="button"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-[#667085] hover:bg-[#f2f4f7] hover:text-[#1a1a1a]"
                              aria-label="Open lead"
                              onClick={() =>
                                toast({
                                  title: lead.name || "Lead",
                                  description: [
                                    lead.business_name,
                                    lead.email,
                                    lead.mobile,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ") || "No extra details",
                                })
                              }
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#eef1f5] px-4 py-2.5">
              <div className="flex items-center gap-2 text-[13px] text-[#667085]">
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(Number(v))}
                >
                  <SelectTrigger className="h-8 w-[4.5rem] rounded-md border-[#e6eaf0] text-[13px] shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>rows / page</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e6eaf0] text-[#667085] disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e6eaf0] text-[#667085] disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <ResponsiveEditSheet
        open={showCreate}
        onOpenChange={(open) => {
          if (!open) closeCreate();
          else setShowCreate(true);
        }}
        title="Add lead"
        subtitle="Contact, business, location, and CRM details. Manage Type / Source / Category under Settings → Reference Values."
        saving={saving}
        onCancel={closeCreate}
        onSave={() => void handleSaveLead()}
        saveLabel="Create lead"
      >
        <div className="space-y-6">
          {loadingLookups ? (
            <p className="flex items-center gap-2 text-[13px] text-[#667085]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading type &amp; source options…
            </p>
          ) : null}

          <section className="space-y-3">
            <h3 className="text-[13px] font-semibold text-[#1a1a1a]">Contact</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="lead-name">Name</Label>
                <Input
                  id="lead-name"
                  className={cn(org.input, "mt-1.5")}
                  value={form.name}
                  onChange={(e) => setField("name")(e.target.value)}
                  placeholder="gokul"
                />
              </div>
              <div>
                <Label htmlFor="lead-mobile">Mobile number</Label>
                <Input
                  id="lead-mobile"
                  className={cn(org.input, "mt-1.5")}
                  value={form.mobile}
                  onChange={(e) => setField("mobile")(e.target.value)}
                  placeholder="8072769573"
                />
              </div>
              <div>
                <Label htmlFor="lead-email">Email</Label>
                <Input
                  id="lead-email"
                  type="email"
                  className={cn(org.input, "mt-1.5")}
                  value={form.email}
                  onChange={(e) => setField("email")(e.target.value)}
                  placeholder="gokul@gmail.com"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[13px] font-semibold text-[#1a1a1a]">Business</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="lead-biz">Business name</Label>
                <Input
                  id="lead-biz"
                  className={cn(org.input, "mt-1.5")}
                  value={form.business_name}
                  onChange={(e) => setField("business_name")(e.target.value)}
                  placeholder="Green Turf Arena"
                />
              </div>
              <div>
                <Label htmlFor="lead-owner">Owner name</Label>
                <Input
                  id="lead-owner"
                  className={cn(org.input, "mt-1.5")}
                  value={form.owner_name}
                  onChange={(e) => setField("owner_name")(e.target.value)}
                  placeholder="Suresh"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category || undefined}
                  onValueChange={setField("category")}
                >
                  <SelectTrigger className={cn(org.input, "mt-1.5")}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadCategories.map((v) => (
                      <SelectItem key={v.id} value={v.displaytext || v.identifier}>
                        {v.displaytext || v.identifier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lead-web">Website</Label>
                <Input
                  id="lead-web"
                  className={cn(org.input, "mt-1.5")}
                  value={form.website}
                  onChange={(e) => setField("website")(e.target.value)}
                  placeholder="www.example.com"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="lead-maps">Google Maps link</Label>
                <Input
                  id="lead-maps"
                  className={cn(org.input, "mt-1.5")}
                  value={form.google_maps_link}
                  onChange={(e) => setField("google_maps_link")(e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[13px] font-semibold text-[#1a1a1a]">Location</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="lead-address">Address</Label>
                <Input
                  id="lead-address"
                  className={cn(org.input, "mt-1.5")}
                  value={form.address}
                  onChange={(e) => setField("address")(e.target.value)}
                  placeholder="Velachery, Chennai"
                />
              </div>
              <div>
                <Label htmlFor="lead-pin">PIN code</Label>
                <Input
                  id="lead-pin"
                  className={cn(org.input, "mt-1.5")}
                  value={form.pin_code}
                  onChange={(e) => setField("pin_code")(e.target.value)}
                  placeholder="600042"
                />
              </div>
              <div>
                <Label htmlFor="lead-area">Area</Label>
                <Input
                  id="lead-area"
                  className={cn(org.input, "mt-1.5")}
                  value={form.area}
                  onChange={(e) => setField("area")(e.target.value)}
                  placeholder="Velachery"
                />
              </div>
              <div>
                <Label htmlFor="lead-city">City</Label>
                <Input
                  id="lead-city"
                  className={cn(org.input, "mt-1.5")}
                  value={form.city}
                  onChange={(e) => setField("city")(e.target.value)}
                  placeholder="Chennai"
                />
              </div>
              <div>
                <Label htmlFor="lead-state">State</Label>
                <Input
                  id="lead-state"
                  className={cn(org.input, "mt-1.5")}
                  value={form.state}
                  onChange={(e) => setField("state")(e.target.value)}
                  placeholder="Tamil Nadu"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[13px] font-semibold text-[#1a1a1a]">CRM</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Type</Label>
                <Select
                  value={form.lead_type || undefined}
                  onValueChange={setField("lead_type")}
                >
                  <SelectTrigger className={cn(org.input, "mt-1.5")}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadTypes.map((v) => (
                      <SelectItem key={v.id} value={v.displaytext || v.identifier}>
                        {v.displaytext || v.identifier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lead source</Label>
                <Select
                  value={form.source || undefined}
                  onValueChange={setField("source")}
                >
                  <SelectTrigger className={cn(org.input, "mt-1.5")}>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.map((v) => (
                      <SelectItem key={v.id} value={v.displaytext || v.identifier}>
                        {v.displaytext || v.identifier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="lead-tags">Tags (comma separated)</Label>
                <Input
                  id="lead-tags"
                  className={cn(org.input, "mt-1.5")}
                  value={form.tags}
                  onChange={(e) => setField("tags")(e.target.value)}
                  placeholder="vip, trial"
                />
              </div>
            </div>
          </section>
        </div>
      </ResponsiveEditSheet>
    </OrganizationPageShell>
  );
}
