import { ActionReq } from '../models/actionreq.model';
import { ActionRes } from '../models/actionres.model';
import { UsersContext, UsersRegisterReq, UsersLoginReq, UsersGetOtpReq, UsersGetOtpRes } from '../models/users.model';
import { AxiosHelperUtils } from '../utils/axioshelper.utils';
import { environment } from '../utils/environment';

export class AuthService {
  http: AxiosHelperUtils;
  
  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + '/api/Auth';
  }

  /**
   * Register a new user or organization
   */
  async register(req: UsersRegisterReq) {
    // Convert UsersRegisterReq to RegisterRequest format expected by backend
    const registerRequest = {
      organisationimageid: req.organisationimageid || 0,
      organisationname: req.organisationname || '',
      organisationgstnumber: req.organisationgstnumber || '',
      organisationtype: req.organisationtype || 0,
      secondarytypecode: req.secondarytypecode || '',
      secondarytype: req.secondarytype || 0,
      primarytype: req.primarytype || 0,
      primarytypecode: req.primarytypecode || '',
      locationname: req.locationname || '',
      locationaddressline1: req.locationaddressline1 || '',
      locationaddressline2: req.locationaddressline2 || '',
      locationcity: req.locationcity || '',
      locationstate: req.locationstate || '',
      locationcountry: req.locationcountry || '',
      locationpincode: req.locationpincode || '',
      latitude: req.latitude || 0,
      longitude: req.longitude || 0,
      googlelocation: req.googlelocation || '',
      username: req.username || '',
      useremail: req.useremail || '',
      usermobile: req.usermobile || '',
      usermobilecountrycode: req.usermobilecountrycode || '',
      userdesignation: req.userdesignation || '',
      profileimage: req.profileimage || 0,
      plan_code: req.plan_code || '',
      referral_code: (req.referral_code || '').trim(),
      is_business_registration: !!req.is_business_registration,
    };

    let postdata: ActionReq<any> = new ActionReq<any>();
    postdata.item = registerRequest;
    
    let resp = await this.http.post<ActionRes<UsersContext>>(
      this.baseurl + '/Register',
      postdata,
      true,
    );
    const userContext = resp.item!;
    return userContext;
  }

  /**
   * Login with mobile and OTP
   */
  async login(req: UsersLoginReq) {
    const loginRequest = {
      mobile: req.mobile,
      otp: req.otp,
    };

    let postdata: ActionReq<any> = new ActionReq<any>();
    postdata.item = loginRequest;
    
    let resp = await this.http.post<ActionRes<UsersContext>>(
      this.baseurl + '/Login',
      postdata,
      true,
    );
    const userContext = resp.item!;
    return userContext;
  }

  /**
   * Get OTP for mobile number
   */
  async getOtp(req: UsersGetOtpReq) {
    // Persist/lookup uses 10-digit Indian mobile (strip +91 / non-digits).
    let digits = String(req.mobile || "").replace(/\D/g, "");
    if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(-10);
    else if (digits.length > 10) digits = digits.slice(-10);

    const getOtpRequest = {
      mobile: digits,
      organisationtype: 0,
    };

    let postdata: ActionReq<any> = new ActionReq<any>();
    postdata.item = getOtpRequest;

    let resp = await this.http.post<ActionRes<UsersGetOtpRes>>(
      this.baseurl + '/GetOtp',
      postdata,
    );
    return resp.item!;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(userId: number, refreshToken: string) {
    const refreshTokenRequest = {
      userid: userId,
      refreshtoken: refreshToken,
    };

    let postdata: ActionReq<any> = new ActionReq<any>();
    postdata.item = refreshTokenRequest;
    
    let resp = await this.http.post<ActionRes<UsersContext>>(
      this.baseurl + '/RefreshToken',
      postdata,
    );
    return resp.item!;
  }

  /**
   * Validate current token
   */
  async validateToken() {
    let resp = await this.http.get<ActionRes<UsersContext>>(
      this.baseurl + '/ValidateToken',
    );
    return resp.item!;
  }

  /**
   * Screen 2 — create organisation for an authenticated user with no org yet.
   */
  async completeBusinessOnboarding(req: {
    organisationname: string;
    organisationgstnumber?: string;
    primarytype: number;
    primarytypecode?: string;
    secondarytype?: number;
    secondarytypecode?: string;
    organisationlogo?: number;
    referral_code?: string;
    plan_code?: string;
    userdesignation?: string;
  }) {
    const postdata = new ActionReq<typeof req>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<UsersContext>>(
      this.baseurl + '/CompleteBusinessOnboarding',
      postdata,
    );
    if ((resp as any)?.error) {
      throw new Error((resp as any).error);
    }
    if (!resp.item) {
      throw new Error('Business profile could not be created.');
    }
    return resp.item;
  }

  /**
   * Login with Google OAuth.
   * Pass is_business_registration from business signup so users without an org
   * get a draft Organisation (same as mobile business register).
   */
  async googleLogin(
    idToken: string,
    email: string,
    name: string,
    picture?: string,
    options?: { is_business_registration?: boolean },
  ) {
    const googleLoginRequest = {
      idToken: idToken,
      email: email,
      name: name,
      picture: picture || '',
      is_business_registration: !!options?.is_business_registration,
    };

    let postdata: ActionReq<any> = new ActionReq<any>();
    postdata.item = googleLoginRequest;
    
    let resp = await this.http.post<ActionRes<UsersContext>>(
      this.baseurl + '/GoogleLogin',
      postdata,
      true,
    );
    if ((resp as any)?.error) {
      const err: any = new Error((resp as any).error || (resp as any).message || 'Google login failed');
      err.response = { data: resp };
      throw err;
    }
    if (!resp.item) {
      throw new Error('Google login failed');
    }
    return resp.item;
  }
}

