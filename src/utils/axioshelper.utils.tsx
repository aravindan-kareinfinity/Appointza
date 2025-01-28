import {RawAxiosRequestHeaders, AxiosHeaders} from 'axios';
import {useAppSelector} from '../redux/hooks.redux';
import {selectusercontext} from '../redux/usercontext.redux';
import {store} from '../redux/store.redux';
import {axios} from './axiosinterceptor.util';
export class AxiosHelperUtils {
  constructor() {}
  createAuthorizationHeader(headers: any, skipAuthorization: boolean = false) {
    if (!skipAuthorization) {
      var root_state = store.getState().usercontext;
      var token = root_state.value.accesstoken;
      headers['Authorization'] = token;
    }
    headers['Accept'] = headers?.Accept || 'application/json';
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE';
    return headers;
  }
  async get<T>(
    url: string,
    skipAuthorization: boolean = false,
    headers: RawAxiosRequestHeaders | AxiosHeaders = {},
  ) {
    headers = this.createAuthorizationHeader(headers, skipAuthorization);
    let response = await axios.get<T>(url, {
      headers: headers,
    });
    return response.data;
  }
  async delete<T>(
    url: string,
    skipAuthorization: boolean = false,
    headers: RawAxiosRequestHeaders | AxiosHeaders = {},
  ) {
    headers = this.createAuthorizationHeader(headers, skipAuthorization);
    let response = await axios.delete<T>(url, {
      headers: headers,
    });
    return response.data;
  }
  async post<T>(
    url: string,
    data: any,
    skipAuthorization: boolean = false,
    headers: RawAxiosRequestHeaders | AxiosHeaders = {},
  ) {
    headers = this.createAuthorizationHeader(headers, skipAuthorization);
    let response = await axios.post<T>(url, data, {
      headers,
    });
    return response.data;
  }

  async put<T>(
    url: string,
    data: any,
    skipAuthorization: boolean = false,
    headers: RawAxiosRequestHeaders | AxiosHeaders = {},
  ) {
    headers = this.createAuthorizationHeader(headers, skipAuthorization);
    let response = await axios.post<T>(url, data, {
      headers: headers,
    });
    return response.data;
  }
}
