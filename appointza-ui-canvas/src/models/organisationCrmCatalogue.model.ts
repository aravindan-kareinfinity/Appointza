export interface OrganisationCrmOrgSummary {
  id: number;
  name: string;
  tagline: string;
  organisation_type: string;
  gstnumber: string;
  notes: string;
  isactive: boolean;
  organisationlogo: number;
  imageid: number;
}

export interface OrganisationCrmLocationItem {
  id: number;
  name: string;
  address: string;
  city: string;
  mobile: string;
  email: string;
  isactive: boolean;
}

export interface OrganisationCrmServiceItem {
  id: number;
  name: string;
  price: number;
  weekday_price: number;
  weekend_price: number;
  duration_minutes: number;
  is_combo: boolean;
  show_price: boolean;
  isactive: boolean;
  rating?: number | null;
  organisationlocationid: number;
}

export interface OrganisationCrmEventItem {
  id: number;
  event_name: string;
  event_type: string;
  event_date?: string | null;
  from_date?: string | null;
  to_date?: string | null;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  entry_amount: number;
  slot_limit: number;
  remainingslot: number;
  is_public: boolean;
  isactive: boolean;
}

export interface OrganisationCrmRoomItem {
  id: number;
  room_number: string;
  room_name: string;
  room_type: string;
  status: string;
  organisation_location_id: number;
  isactive: boolean;
}

export interface OrganisationCrmCatalogueOverview {
  organisation: OrganisationCrmOrgSummary;
  locations: OrganisationCrmLocationItem[];
  services: OrganisationCrmServiceItem[];
  events: OrganisationCrmEventItem[];
  rooms: OrganisationCrmRoomItem[];
}

export interface OrganisationCrmCatalogueSelectReq {
  organisation_id?: number;
}
