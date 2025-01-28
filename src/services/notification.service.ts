import {ActionReq} from '../models/actionreq.model';
import {ActionRes} from '../models/actionres.model';
import {
  Notification,
  NotificationDeleteReq,
  NotificationNotificationScreenReq,
  NotificationSelectReq,
} from '../models/notification.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class NotificationService {
  baseurl: string;
  http: AxiosHelperUtils;
  constructor() {
    this.baseurl = environment.baseurl + '/api/Notification';
    this.http = new AxiosHelperUtils();
  }
  async select(req: NotificationSelectReq) {
    let postdata: ActionReq<NotificationSelectReq> =
      new ActionReq<NotificationSelectReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Array<Notification>>>(
      this.baseurl + '/select',
      postdata,
    );
    return resp.item!;
  }
  async save(req: Notification) {
    let postdata: ActionReq<Notification> = new ActionReq<Notification>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Notification>>(
      this.baseurl + '/save',
      postdata,
    );

    return resp.item!;
  }
  async insert(req: Notification) {
    let postdata: ActionReq<Notification> = new ActionReq<Notification>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Notification>>(
      this.baseurl + '/insert',
      postdata,
    );

    return resp.item!;
  }
  async update(req: Notification) {
    let postdata: ActionReq<Notification> = new ActionReq<Notification>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Notification>>(
      this.baseurl + '/update',
      postdata,
    );

    return resp.item!;
  }
  async delete(req: NotificationDeleteReq) {
    let postdata: ActionReq<NotificationDeleteReq> =
      new ActionReq<NotificationDeleteReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/delete',
      postdata,
    );

    return resp.item!;
  }
  async notificationscreen(req: NotificationNotificationScreenReq) {
    let postdata: ActionReq<NotificationNotificationScreenReq> =
      new ActionReq<NotificationNotificationScreenReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Array<Notification>>>(
      this.baseurl + '/notificationscreen',
      postdata,
    );
    return resp.item!;
  }
}
