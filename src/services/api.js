import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5213';

/**
 * Centralized Axios HTTP Client
 * Automatically handles JWT Bearer tokens and standardizes backend response envelopes
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Injects Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('urbancab_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardizes backend envelope & handles auth expirations
api.interceptors.response.use(
  (response) => {
    // Return the response data containing { success, message, data, meta }
    return response.data;
  },
  (error) => {
    const errorResponse = error.response?.data;
    const errorCode = errorResponse?.error?.code || errorResponse?.code;
    const errorMessage =
      errorResponse?.error?.message ||
      errorResponse?.message ||
      error.message ||
      'An unexpected server error occurred.';

    // Broadcast unauthorized event if token is invalid/expired
    if (
      error.response?.status === 401 ||
      errorCode === 'UNAUTHORIZED_ACCESS' ||
      errorCode === 'TOKEN_EXPIRED'
    ) {
      window.dispatchEvent(
        new CustomEvent('urbancab:unauthorized', {
          detail: { code: errorCode, message: errorMessage },
        })
      );
    }

    // Attach structured error details
    const enhancedError = new Error(errorMessage);
    enhancedError.code = errorCode;
    enhancedError.status = error.response?.status;
    enhancedError.details = errorResponse?.error?.details || [];
    enhancedError.raw = errorResponse;

    return Promise.reject(enhancedError);
  }
);

export default api;
