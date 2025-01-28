import {navigate} from '../appstack.navigation';
import {ActionReq} from '../models/actionreq.model';
import {ActionRes} from '../models/actionres.model';
import {
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

export class UsersService {
  baseurl: string;
  http: AxiosHelperUtils;
  constructor() {
    this.baseurl = environment.baseurl + '/api/Users';
    this.http = new AxiosHelperUtils();
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
    let resp = await this.http.post<ActionRes<UsersRegisterRes>>(
      this.baseurl + '/register',
      postdata,
      true,
    );

    return resp.item!;
  }
  async login(req: UsersLoginReq) {
    let postdata: ActionReq<UsersLoginReq> = new ActionReq<UsersLoginReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<UsersContext>>(
      this.baseurl + '/login',
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
}
