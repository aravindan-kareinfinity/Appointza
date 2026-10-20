import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";

import { Input } from "@/components/ui/input";

import { Loader2, MapPin, Search } from "lucide-react";

import { OrganisationService } from "@/services/organisation.service";

import { ReferenceValueService } from "@/services/referencevalue.service";

import { FilesService } from "@/services/files.service";

import { OrganisationDetail, OrganisationSelectReq } from "@/models/organisation.model";

import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";

import { REFERENCETYPE } from "@/models/users.model";

import { PublicBrowseShell } from "@/components/layout/PublicBrowseShell";

import { organisationPublicUrls } from "@/utils/publicBrowse.util";

import { OrgBrowseCardAvatar } from "@/components/public/OrgBrowseCardAvatar";

import { useToast } from "@/hooks/use-toast";



/** Verified org locations — same directory & business-type filters as Explore / `/services`. */

const PublicBrowseOrganisationsPage: React.FC = () => {

  const { toast } = useToast();

  const organisationService = useMemo(() => new OrganisationService(), []);

  const filesService = useMemo(() => new FilesService(), []);

  const referenceValueService = useMemo(() => new ReferenceValueService(), []);



  const [orgs, setOrgs] = useState<OrganisationDetail[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");



  const [selectedPrimaryType, setSelectedPrimaryType] = useState<number | null>(null);

  const [selectedSecondaryType, setSelectedSecondaryType] = useState<number | null>(null);

  const [primaryBusinessTypes, setPrimaryBusinessTypes] = useState<ReferenceValue[]>([]);

  const [secondaryBusinessTypes, setSecondaryBusinessTypes] = useState<ReferenceValue[]>([]);



  const loadReferenceTypes = useCallback(async () => {

    try {

      const req = new ReferenceValueSelectReq();

      req.referencetypeid = REFERENCETYPE.ORGANISATIONPRIMARYTYPE;

      req.organisationid = 0;

      const response = await referenceValueService.select(req);

      if (response) setPrimaryBusinessTypes(response);

    } catch {

      toast({

        title: "Error",

        description: "Failed to load business types",

        variant: "destructive",

      });

    }

  }, [referenceValueService, toast]);



  const loadSecondaryTypes = useCallback(

    async (primaryId: number) => {

      try {

        const req = new ReferenceValueSelectReq();

        req.parentid = primaryId;

        req.referencetypeid = REFERENCETYPE.ORGANISATIONSECONDARYTYPE;

        req.organisationid = 0;

        const response = await referenceValueService.select(req);

        if (response) setSecondaryBusinessTypes(response);

      } catch {

        toast({

          title: "Error",

          description: "Failed to load secondary business types",

          variant: "destructive",

        });

      }

    },

    [referenceValueService, toast]

  );



  const handlePrimaryTypeSelect = (typeId: number) => {

    setSelectedPrimaryType(typeId);

    setSelectedSecondaryType(null);

    loadSecondaryTypes(typeId);

  };



  const handleSecondaryTypeSelect = (typeId: number) => {

    setSelectedSecondaryType(typeId);

  };



  const clearFilters = () => {

    setSelectedPrimaryType(null);

    setSelectedSecondaryType(null);

    setSearchTerm("");

    setSecondaryBusinessTypes([]);

  };



  useEffect(() => {

    loadReferenceTypes();

  }, [loadReferenceTypes]);



  useEffect(() => {

    let cancelled = false;

    (async () => {

      try {

        setLoading(true);

        const req = new OrganisationSelectReq();

        const response = await organisationService.selectOrganisationDetail(req);

        if (cancelled) return;

        const list = Array.isArray(response) ? response.filter((o) => o.organisationlocationid > 0) : [];

        setOrgs(list);

      } catch {

        if (!cancelled) {

          setOrgs([]);

          toast({

            title: "Could not load organisations",

            description: "Try again shortly.",

            variant: "destructive",

          });

        }

      } finally {

        if (!cancelled) setLoading(false);

      }

    })();

    return () => {

      cancelled = true;

    };

  }, [organisationService, toast]);



  const filtered = useMemo(() => {

    let list = [...orgs];

    const q = searchTerm.trim().toLowerCase();

    if (q) {

      list = list.filter(

        (o) =>

          o.organisationname.toLowerCase().includes(q) ||

          o.organisationlocationcity.toLowerCase().includes(q) ||

          o.organisationlocationstate.toLowerCase().includes(q) ||

          o.organisationlocationname.toLowerCase().includes(q) ||

          (o.organisationprimarytypecode && o.organisationprimarytypecode.toLowerCase().includes(q)) ||

          (o.organisationsecondarytypecode && o.organisationsecondarytypecode.toLowerCase().includes(q))

      );

    }

    if (selectedPrimaryType) {

      list = list.filter((o) => o.organisationprimarytype === selectedPrimaryType);

    }

    if (selectedSecondaryType) {

      list = list.filter((o) => o.organisationsecondarytype === selectedSecondaryType);

    }

    return list;

  }, [orgs, searchTerm, selectedPrimaryType, selectedSecondaryType]);



  const hasActiveFilters = !!(searchTerm.trim() || selectedPrimaryType || selectedSecondaryType);



  return (

    <PublicBrowseShell

      title="Organisations on Appointza"

      metaDescription="Discover verified businesses and book on Appointza."

      heading="Organisations"

      description={

        <>

          Browse businesses that list services and events on Appointza. Open their booking site or book here — same directory as

          Explore, organisations-only layout.

        </>

      }

      footnote={

        <>

          Need a service or event?{" "}

          <Link to="/services" className="text-orange-600 font-medium hover:underline">

            Services

          </Link>

          {" · "}

          <Link to="/events" className="text-orange-600 font-medium hover:underline">

            Events

          </Link>

          .

        </>

      }

    >

      {loading ? (

        <div className="flex items-center justify-center h-64 rounded-xl border border-zinc-200 bg-white">

          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />

          <span className="ml-3 text-zinc-600">Loading organisations…</span>

        </div>

      ) : (

        <>

          <div className="space-y-4 md:space-y-6">

            <section className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-6 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all">

              <h2 className="text-xl font-semibold text-zinc-900 mb-1">Filter by Business Type</h2>

              <p className="text-sm text-zinc-600 mb-6">

                Select primary and secondary business types, then use search below to narrow results (same as Explore and Services).

              </p>



              <div className="space-y-5">

                <div>

                  <label className="text-sm font-medium text-orange-600 mb-3 block">Primary business type</label>

                  <div className="flex flex-wrap gap-2">

                    {primaryBusinessTypes.map((type) => {

                      const on = selectedPrimaryType === type.id;

                      return (

                        <Button

                          key={type.id}

                          type="button"

                          variant="outline"

                          size="sm"

                          onClick={() => handlePrimaryTypeSelect(type.id)}

                          className={

                            on

                              ? "text-xs rounded-2xl border-orange-600 bg-orange-600 text-white hover:bg-orange-700 hover:text-white"

                              : "text-xs rounded-2xl border-zinc-300 bg-white text-zinc-900 hover:border-orange-400 hover:bg-orange-50/50"

                          }

                        >

                          {type.displaytext}

                        </Button>

                      );

                    })}

                  </div>

                </div>



                {selectedPrimaryType != null && secondaryBusinessTypes.length > 0 ? (

                  <div>

                    <label className="text-sm font-medium text-orange-600 mb-3 block">Secondary business type</label>

                    <div className="flex flex-wrap gap-2">

                      {secondaryBusinessTypes.map((type) => {

                        const on = selectedSecondaryType === type.id;

                        return (

                          <Button

                            key={type.id}

                            type="button"

                            variant="outline"

                            size="sm"

                            onClick={() => handleSecondaryTypeSelect(type.id)}

                            className={

                              on

                                ? "text-xs rounded-2xl border-orange-600 bg-orange-600 text-white hover:bg-orange-700 hover:text-white"

                                : "text-xs rounded-2xl border-zinc-300 bg-white text-zinc-900 hover:border-orange-400 hover:bg-orange-50/50"

                            }

                          >

                            {type.displaytext}

                          </Button>

                        );

                      })}

                    </div>

                  </div>

                ) : null}



                {hasActiveFilters ? (

                  <Button type="button" onClick={clearFilters} variant="ghost" size="sm" className="text-red-600 hover:text-red-700 px-0">

                    Clear all filters

                  </Button>

                ) : null}

              </div>

            </section>



            <section className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-6 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all max-w-xl">

              <Label htmlFor="orgs-browse-search" className="text-xl font-semibold text-zinc-900 mb-1 block">

                Search

              </Label>

              <p className="text-sm text-zinc-600 mb-4">Find by business name, area, city, sector, or type label.</p>

              <div className="relative">

                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" aria-hidden />

                <Input

                  id="orgs-browse-search"

                  placeholder="Name, area, city, sector…"

                  value={searchTerm}

                  onChange={(e) => setSearchTerm(e.target.value)}

                  className="pl-9 rounded-2xl border-zinc-300 bg-white h-11 focus-visible:ring-orange-500/25 focus-visible:border-orange-400"

                />

              </div>

            </section>

          </div>



          <div className="mt-8 space-y-4">

            {!filtered.length ? (

              <div className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-10 shadow-sm text-center space-y-4">

                <p className="text-zinc-600">

                  {!orgs.length

                    ? "No organisations listed yet."

                    : "No organisations match your search or filters."}

                </p>

                {hasActiveFilters ? (

                  <Button

                    type="button"

                    onClick={clearFilters}

                    variant="outline"

                    className="rounded-2xl bg-white border border-zinc-300 text-zinc-900 hover:border-orange-400 hover:bg-orange-50/50"

                  >

                    Clear filters

                  </Button>

                ) : (

                  <Button variant="outline" asChild className="rounded-2xl bg-white border border-zinc-300 text-zinc-900 hover:border-orange-400 hover:bg-orange-50/50">

                    <Link to="/explore">Open Explore</Link>

                  </Button>

                )}

              </div>

            ) : (

              <>

                <p className="text-sm text-zinc-500">

                  {filtered.length} organisation{filtered.length === 1 ? "" : "s"}

                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

                  {filtered.map((org) => {

                    const urls = organisationPublicUrls(org);

                    return (

                      <article

                        key={org.organisationlocationid}

                        className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-lg shadow-zinc-200/50 hover:border-zinc-300 transition-colors flex gap-5"

                      >

                        <OrgBrowseCardAvatar
                          key={`${org.organisationlocationid}-${org.organisationimageid}`}
                          org={org}
                          filesService={filesService}
                        />

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2 mb-1">

                            <h3 className="text-lg font-semibold text-zinc-900 truncate">{org.organisationname}</h3>

                            <span className="text-xs shrink-0 text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">

                              Listed

                            </span>

                          </div>

                          <p className="text-sm text-orange-600 font-medium mb-1">

                            {org.organisationprimarytypecode || "Business"}

                          </p>

                          <p className="text-sm text-zinc-500 mb-3 flex items-start gap-1">

                            <MapPin className="size-3.5 mt-0.5 text-zinc-400 shrink-0" aria-hidden />

                            <span>

                              {org.organisationlocationname || org.organisationlocationcity}, {org.organisationlocationcity}

                              {org.organisationlocationstate ? ` • ${org.organisationlocationstate}` : ""}

                            </span>

                          </p>

                          {urls.fullUrl ? (
                            <>
                              <a
                                href={urls.fullUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-zinc-500 hover:text-orange-600 truncate block mb-3"
                              >
                                {urls.displayUrl}
                              </a>
                              <a
                                href={urls.fullUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                              >
                                View profile &amp; book →
                              </a>
                            </>
                          ) : (
                            <p className="text-sm text-zinc-400">{urls.displayUrl}</p>
                          )}

                        </div>

                      </article>

                    );

                  })}

                </div>

              </>

            )}

          </div>

        </>

      )}

    </PublicBrowseShell>

  );

};



export default PublicBrowseOrganisationsPage;

