import axios, {AxiosResponse} from 'axios';
import {UsersService} from '../services/users.service';

axios.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: any) => {
    var originalrequest = error.config;

    let statuscode = error?.response?.status;
    if (statuscode == 401) {
      originalrequest.retry = true;
      var usersservice = new UsersService();
      usersservice.applogout();
    }
    return Promise.reject(error);
  },
);
export {axios};
