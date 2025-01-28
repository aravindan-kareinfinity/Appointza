import {Asset} from 'react-native-image-picker';
import {ActionReq} from '../models/actionreq.model';
import {ActionRes} from '../models/actionres.model';
import {Files, FilesDeleteReq, FilesSelectReq} from '../models/files.model';
import {AxiosHelperUtils} from '../utils/axioshelper.utils';
import {environment} from '../utils/environment';

export class FilesService {
  baseurl: string;
  http: AxiosHelperUtils;
  constructor() {
    this.baseurl = environment.baseurl + '/api/Files';
    this.http = new AxiosHelperUtils();
  }
  async select(req: FilesSelectReq) {
    let postdata: ActionReq<FilesSelectReq> = new ActionReq<FilesSelectReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Array<Files>>>(
      this.baseurl + '/select',
      postdata,
    );
    return resp.item!;
  }
  async save(req: Files) {
    let postdata: ActionReq<Files> = new ActionReq<Files>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Files>>(
      this.baseurl + '/save',
      postdata,
    );

    return resp.item!;
  }
  async insert(req: Files) {
    let postdata: ActionReq<Files> = new ActionReq<Files>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Files>>(
      this.baseurl + '/insert',
      postdata,
    );

    return resp.item!;
  }
  async update(req: Files) {
    let postdata: ActionReq<Files> = new ActionReq<Files>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<Files>>(
      this.baseurl + '/update',
      postdata,
    );

    return resp.item!;
  }
  async delete(req: FilesDeleteReq) {
    let postdata: ActionReq<FilesDeleteReq> = new ActionReq<FilesDeleteReq>();
    postdata.item = req;
    let resp = await this.http.post<ActionRes<boolean>>(
      this.baseurl + '/delete',
      postdata,
    );

    return resp.item!;
  }
  async upload(req: Asset[]) {
    const formdata = new FormData();

    for (let i = 0; i < req.length; i++) {
      formdata.append('files', {
        uri: req[i].uri,
        name: req[i].fileName,
        type: req[i].type,
      });
    }

    let resp = await this.http.post<ActionRes<number[]>>(
      this.baseurl + '/upload',
      formdata,
      true,
      {
        'Content-Type': 'multipart/form-data',
      },
    );

    return resp.item!;
  }
  get(id: number) {
    return this.baseurl + `/get?id=${id}`;
  }
}
