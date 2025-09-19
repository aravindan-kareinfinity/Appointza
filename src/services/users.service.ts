import {navigate} from '../appstack.navigation';
import {ActionReq} from '../models/actionreq.model';
import {ActionRes} from '../models/actionres.model';
import {pushnotification_utils} from '../utils/pushnotification';
import {
  Organisationdeletereq,
  Users,
  UsersAcceptConnectionRequestReq,
  UsersAddColourSetToCartReq,
  UsersConnectionRequestReq,
  UsersContext,
  UsersDeleteReq,
  UsersGetOtpReq,
  UsersGetOtpRes,
  UsersLoginReq,
  UsersMergeDesign,
  UsersRegisterReq,
  UsersRegisterRes,
  UsersSelectReq,
  UsersSupplierInviteScreenReq,
  UsersSupplierInviteScreenRes,
  UserUpdateOrderStatusReq,
} from '../models/users.model';
import {store} from '../redux/store.redux';
import {usercontextactions} from '../redux/usercontext.redux';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';
import axios from 'axios';

export class UsersService {
  baseurl: string;
  http: AxiosHelperUtils;
  private pushNotificationService: typeof pushnotification_utils;
  
  constructor() {
    this.baseurl = environment.baseurl + '/api/Users';
    this.http = new AxiosHelperUtils();
    this.pushNotificationService = pushnotification_utils;
  }
  async select(req: UsersSelectReq) {
    let postdata: ActionReq<UsersSelectReq> = new ActionReq<UsersSelectReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Array<Users>>>(
      this.baseurl + '/select',
      postdata,
    );
    return resp.item!;
  }
  async save(req: Users) {
    let postdata: ActionReq<Users> = new ActionReq<Users>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Users>>(
      this.baseurl + '/save',
      postdata,
    );

    return resp.item!;
  }
  async insert(req: Users) {
    let postdata: ActionReq<Users> = new ActionReq<Users>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Users>>(
      this.baseurl + '/insert',
      postdata,
    );

    return resp.item!;
  }
  async update(req: Users) {
    let postdata: ActionReq<Users> = new ActionReq<Users>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Users>>(
      this.baseurl + '/update',
      postdata,
    );

    return resp.item!;
  }
  async delete(req: UsersDeleteReq) {
    let postdata: ActionReq<UsersDeleteReq> = new ActionReq<UsersDeleteReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/delete',
      postdata,
    );

    return resp.item!;
  }
  async register(req: UsersRegisterReq) {
    let postdata: ActionReq<UsersRegisterReq> =
      new ActionReq<UsersRegisterReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<UsersContext>>(
      this.baseurl + '/register',
      postdata,
      true,
    );

    const userContext = resp.item!;
    


    return userContext;
  }
  async login(req: UsersLoginReq) {
    let postdata: ActionReq<UsersLoginReq> = new ActionReq<UsersLoginReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<UsersContext>>(
      this.baseurl + '/login',
      postdata,
      true,
    );

    const userContext = resp.item!;
    


    return userContext;
  }

  async SelectUser(req: UsersLoginReq) {
    let postdata: ActionReq<UsersLoginReq> = new ActionReq<UsersLoginReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<UsersContext>>(
      this.baseurl + '/SelectUser',
      postdata,
      true,
    );

    return resp.item!;
  }
  async GetOtp(req: UsersGetOtpReq) {
    let postdata: ActionReq<UsersGetOtpReq> = new ActionReq<UsersGetOtpReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<UsersGetOtpRes>>(
      this.baseurl + '/GetOtp',
      postdata,
      true,
    );

    return resp.item!;
  }

  async UpdatePushToken(userId: number, pushToken: string): Promise<boolean> {
    try {
      const response = await this.http.post<ActionRes<boolean>>(
        this.baseurl + '/UpdatePushToken',
        {
          UserId: userId,
          PushToken: pushToken,
        }
      );
      return response.item!;
    } catch (error) {
      console.error('Error updating push token:', error);
      return false;
    }
  }
  async MergeDesign(req: UsersMergeDesign) {
    let postdata: ActionReq<UsersMergeDesign> =
      new ActionReq<UsersMergeDesign>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<UsersMergeDesign>>(
      this.baseurl + '/MergeDesign',
      postdata,
    );

    return resp.item!;
  }
  async SupplierInviteScreen(req: UsersSupplierInviteScreenReq) {
    let postdata: ActionReq<UsersSupplierInviteScreenReq> =
      new ActionReq<UsersSupplierInviteScreenReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<UsersSupplierInviteScreenRes[]>>(
      this.baseurl + '/SupplierInviteScreen',
      postdata,
    );

    return resp.item!;
  }
  async connectionrequest(req: UsersConnectionRequestReq) {
    let postdata: ActionReq<UsersConnectionRequestReq> =
      new ActionReq<UsersConnectionRequestReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/ConnectionRequest',
      postdata,
    );

    return resp.item!;
  }
  async acceptconnectionrequest(req: UsersAcceptConnectionRequestReq) {
    let postdata: ActionReq<UsersAcceptConnectionRequestReq> =
      new ActionReq<UsersAcceptConnectionRequestReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/AcceptConnectionRequest',
      postdata,
    );

    return resp.item!;
  }
  async applogout() {
    store.dispatch(usercontextactions.clear());
    navigate('Login');
  }
  async addcoloursettocart(req: UsersAddColourSetToCartReq) {
    let postdata: ActionReq<UsersAddColourSetToCartReq> =
      new ActionReq<UsersAddColourSetToCartReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/addcoloursettocart',
      postdata,
    );

    return resp.item!;
  }
  async placeorder() {
    let resp = await this.http.get<ActionRes<boolean>>(
      this.baseurl + '/PlaceOrder',
    );
    return resp.item!;
  }
  async updateorderstatus(req: UserUpdateOrderStatusReq) {
    let postdata: ActionReq<UserUpdateOrderStatusReq> =
      new ActionReq<UserUpdateOrderStatusReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/updateorderstatus',
      postdata,
    );

    return resp.item!;
  }

  async DeleteOrganisationPermananet(req: Organisationdeletereq) {
    let postdata: ActionReq<Organisationdeletereq> = new ActionReq<Organisationdeletereq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/DeleteOrganisationPermananet',
      postdata,
    );

    return resp.item!;
  }
  async Deleteuserpermanent(req: Organisationdeletereq) {
    let postdata: ActionReq<Organisationdeletereq> = new ActionReq<Organisationdeletereq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/Deleteuserpermanent',
      postdata,
    );

    return resp.item!;
  }

  async sendOTP(mobileNumber: string): Promise<boolean> {
    try {
      const response = await axios.post('/api/users/send-otp', {
        mobileNumber,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async verifyOTP(mobileNumber: string, otp: string): Promise<boolean> {
    try {
      const response = await axios.post('/api/users/verify-otp', {
        mobileNumber,
        otp,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
