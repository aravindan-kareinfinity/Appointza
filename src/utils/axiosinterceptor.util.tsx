import axios, {AxiosResponse} from 'axios';
import {UsersService} from '../services/users.service';
import {environment} from './environment';

// Set the base URL for all axios requests
axios.defaults.baseURL = environment.baseurl;

// Add request interceptor for logging
axios.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url, {
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ API Success:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error: any) => {
    console.error('❌ API Error Details:');
    console.error('Method:', error.config?.method?.toUpperCase());
    console.error('URL:', error.config?.url);
    console.error('Status:', error?.response?.status);
    console.error('Status Text:', error?.response?.statusText);
    console.error('Message:', error?.message);
    console.error('Response Data:', error?.response?.data);
    console.error('Full Error Object:', error);

    var originalrequest = error.config;

    let statuscode = error?.response?.status;
    if (statuscode == 401) {
      console.log('🔐 Unauthorized access, logging out user');
      originalrequest.retry = true;
      var usersservice = new UsersService();
      usersservice.applogout();
    }
    return Promise.reject(error);
  },
);
export {axios};
