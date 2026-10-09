import axios, { AxiosRequestHeaders } from 'axios';
import { isUnauthorizedApiError } from '@/utils/apiAuth.util';
import { getAuthToken } from '@/utils/authSession.util';

function notifySessionExpiredIfNeeded(error: unknown) {
  if (!isUnauthorizedApiError(error)) return;
  window.dispatchEvent(
    new CustomEvent<{ returnPath: string }>('appointza:session-expired', {
      detail: { returnPath: window.location.pathname + window.location.search },
    }),
  );
}

export class AxiosHelperUtils {
  constructor() {}

  createAuthorizationHeader(headers: any, skipAuthorization: boolean = false) {
    if (!skipAuthorization) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    headers['Accept'] = headers?.Accept || 'application/json';
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    // Do not set Access-Control-* on outbound requests — those are response headers from the server only.
    return headers;
  }

  async get<T>(
    url: string,
    skipAuthorization: boolean = false,
    headers: AxiosRequestHeaders = {},
  ) {
    headers = this.createAuthorizationHeader(headers, skipAuthorization);
    try {
      let response = await axios.get<T>(url, {
        headers: headers,
      });
      return response.data;
    } catch (error) {
      notifySessionExpiredIfNeeded(error);
      throw error;
    }
  }

  async delete<T>(
    url: string,
    skipAuthorization: boolean = false,
    headers: AxiosRequestHeaders = {},
  ) {
    headers = this.createAuthorizationHeader(headers, skipAuthorization);
    try {
      let response = await axios.delete<T>(url, {
        headers: headers,
      });
      return response.data;
    } catch (error) {
      notifySessionExpiredIfNeeded(error);
      throw error;
    }
  }

  async post<T>(
    url: string,
    data: any,
    skipAuthorization: boolean = false,
    headers: AxiosRequestHeaders = {},
  ) {
    // If data is FormData, don't set Content-Type - let axios set it automatically
    const isFormData = data instanceof FormData;
    if (isFormData) {
      headers = this.createAuthorizationHeader({}, skipAuthorization);
      // Remove Content-Type for FormData - axios will set it with boundary
      delete headers['Content-Type'];
    } else {
    headers = this.createAuthorizationHeader(headers, skipAuthorization);
    }
    try {
      let response = await axios.post<T>(url, data, {
        headers,
      });
      return response.data;
    } catch (error) {
      notifySessionExpiredIfNeeded(error);
      throw error;
    }
  }

  async put<T>(
    url: string,
    data: any,
    skipAuthorization: boolean = false,
    headers: AxiosRequestHeaders = {},
  ) {
    headers = this.createAuthorizationHeader(headers, skipAuthorization);
    try {
      let response = await axios.put<T>(url, data, {
        headers: headers,
      });
      return response.data;
    } catch (error) {
      notifySessionExpiredIfNeeded(error);
      throw error;
    }
  }
}