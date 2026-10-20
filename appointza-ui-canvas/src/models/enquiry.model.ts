export interface Enquiry {
  id: number;
  name: string;
  email: string;
  mobile: string;
  message: string;
  organisation_id: number;
  created_by: number;
  notes: string;
  status: string;
  source: string;
  is_active: boolean;
  ip_address: string;
  /** Omit or send ISO datetime — empty string fails ASP.NET DateTime binding. */
  created_at?: string;
  updated_at?: string;
  business_name?: string;
  owner_name?: string;
  category?: string;
  website?: string;
  google_maps_link?: string;
  address?: string;
  pin_code?: string;
  area?: string;
  city?: string;
  state?: string;
  lead_type?: string;
  tags?: string;
}

export interface EnquirySelectReq {
  id: number;
  organisation_id: number;
  status: string;
  source: string;
  is_active: boolean | null;
}

export interface EnquiryDeleteReq {
  id: number;
}

export function emptyEnquiry(organisationId: number): Enquiry {
  return {
    id: 0,
    name: "",
    email: "",
    mobile: "",
    message: "",
    organisation_id: organisationId,
    created_by: 0,
    notes: "",
    status: "new",
    source: "",
    is_active: true,
    ip_address: "",
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
    tags: "",
  };
}
