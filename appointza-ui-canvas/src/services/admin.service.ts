import { ActionReq } from "@/models/actionreq.model";
import { ActionRes } from "@/models/actionres.model";
import { AxiosHelperUtils } from "@/utils/axioshelper.utils";
import { environment } from "@/utils/environment";

export type AdminContext = {
  adminid: number;
  adminname: string;
  adminemail: string;
  adminmobile?: string;
  accesstoken: string;
  refreshtoken?: string;
  role?: string;
};

export type AdminDashboardStats = {
  OrganizationStats?: {
    TotalOrganizations?: number;
    VerifiedOrganizations?: number;
    NotVerifiedOrganizations?: number;
  };
  AppointmentStats?: {
    TotalAppointments?: number;
  };
};

export type AdminOrganisation = {
  id: number;
  name?: string;
  gstnumber?: string;
  tagline?: string;
  primarytypecode?: string;
  secondarytypecode?: string;
  isactive?: boolean;
  issuspended?: boolean;
  isfactory?: boolean;
  notes?: string;
  booking_amount?: number;
  isserviceamount?: boolean;
  createdon?: string;
  modifiedon?: string;
  attributes_json?: string;
};

export type AdminOrganisationLocation = {
  id: number;
  name?: string;
  addressline1?: string;
  addressline2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  googlelocation?: string;
  createdon?: string;
  isactive?: boolean;
  isverified?: boolean;
  organisationid?: number;
  organisationname?: string;
  organisationgstnumber?: string;
  organisationprimarytypecode?: string;
  organisationsecondarytypecode?: string;
  organisationmobile?: string;
  usermobile?: string;
};

const ADMIN_TOKEN_KEY = "admin_auth_token";
const ADMIN_CONTEXT_KEY = "admin_context";

export function getAdminToken(): string {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

export function getAdminContext(): AdminContext | null {
  try {
    const raw = localStorage.getItem(ADMIN_CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as AdminContext) : null;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_CONTEXT_KEY);
}

export function storeAdminSession(ctx: AdminContext) {
  localStorage.setItem(ADMIN_TOKEN_KEY, ctx.accesstoken || "");
  localStorage.setItem(ADMIN_CONTEXT_KEY, JSON.stringify(ctx));
}

export class AdminService {
  http = new AxiosHelperUtils();

  get baseurl(): string {
    return environment.baseurl + "/api/Admin";
  }

  private adminHeaders(): Record<string, string> {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async login(email: string, password: string): Promise<AdminContext> {
    const body = new ActionReq<{ email: string; password: string }>();
    body.item = { email: email.trim(), password };
    const resp = await this.http.post<ActionRes<AdminContext> & { message?: string }>(
      `${this.baseurl}/Login`,
      body,
      true,
    );
    if (!resp?.item?.accesstoken) {
      throw new Error((resp as { message?: string })?.message || "Admin login failed");
    }
    storeAdminSession(resp.item);
    return resp.item;
  }

  async me(): Promise<AdminContext | null> {
    const resp = await this.http.get<ActionRes<AdminContext>>(
      `${this.baseurl}/Me`,
      true,
      this.adminHeaders() as never,
    );
    return resp.item ?? null;
  }

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const body = new ActionReq<Record<string, never>>();
    body.item = {};
    const resp = await this.http.post<ActionRes<AdminDashboardStats>>(
      `${this.baseurl}/GetDashboardStats`,
      body,
      true,
      this.adminHeaders() as never,
    );
    return resp.item ?? {};
  }

  async getAllOrganisations(search = ""): Promise<AdminOrganisation[]> {
    const body = new ActionReq<{
      PageNumber: number;
      PageSize: number;
      SearchTerm: string;
    }>();
    body.item = { PageNumber: 1, PageSize: 500, SearchTerm: search.trim() };
    const resp = await this.http.post<ActionRes<AdminOrganisation[]>>(
      `${this.baseurl}/GetAllOrganisations`,
      body,
      true,
      this.adminHeaders() as never,
    );
    return resp.item ?? [];
  }

  async getAllOrganisationLocations(): Promise<AdminOrganisationLocation[]> {
    const resp = await this.http.get<ActionRes<AdminOrganisationLocation[]>>(
      `${this.baseurl}/GetAllOrganisationLocations`,
      true,
      this.adminHeaders() as never,
    );
    return resp.item ?? [];
  }

  async suspendOrganisation(organisationId: number, reason = ""): Promise<boolean> {
    const body = new ActionReq<{ OrganisationId: number; Reason: string }>();
    body.item = { OrganisationId: organisationId, Reason: reason };
    const resp = await this.http.post<ActionRes<boolean>>(
      `${this.baseurl}/SuspendOrganisation`,
      body,
      true,
      this.adminHeaders() as never,
    );
    return !!resp.item;
  }

  async activateOrganisation(organisationId: number): Promise<boolean> {
    const body = new ActionReq<{ OrganisationId: number }>();
    body.item = { OrganisationId: organisationId };
    const resp = await this.http.post<ActionRes<boolean>>(
      `${this.baseurl}/ActivateOrganisation`,
      body,
      true,
      this.adminHeaders() as never,
    );
    return !!resp.item;
  }

  async changePassword(current_password: string, new_password: string): Promise<AdminContext> {
    const body = new ActionReq<{ current_password: string; new_password: string }>();
    body.item = { current_password, new_password };
    const resp = await this.http.post<ActionRes<AdminContext>>(
      `${this.baseurl}/ChangePassword`,
      body,
      true,
      this.adminHeaders() as never,
    );
    if (!resp?.item?.accesstoken) {
      throw new Error("Could not change password");
    }
    storeAdminSession(resp.item);
    return resp.item;
  }
}
