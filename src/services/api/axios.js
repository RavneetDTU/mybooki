import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT, DEFAULT_HEADERS } from '../../config/api';
import { STORAGE_KEYS } from '../../config/constants';

/**
 * Axios Instance Configuration
 * Centralized axios instance with interceptors for all API calls
 */

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: DEFAULT_HEADERS,
});

/**
 * Request Interceptor
 * Attach auth token to requests (when available)
 */
apiClient.interceptors.request.use(
    (config) => {
        // Get token from localStorage (for future use when auth is implemented)
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (import.meta.env.MODE === 'development') {
            console.log('🚀 API Request:', {
                method: config.method?.toUpperCase(),
                url: config.url,
                params: config.params,
                data: config.data,
            });
        }

        return config;
    },
    (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor
 * Handle responses and errors globally
 */
apiClient.interceptors.response.use(
    (response) => {
        // Log response in development
        if (import.meta.env.MODE === 'development') {
            console.log('✅ API Response:', {
                url: response.config.url,
                status: response.status,
                data: response.data,
            });
        }

        return response;
    },
    (error) => {
        // Handle different error scenarios
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            console.error('❌ API Error:', {
                status,
                url: error.config?.url,
                message: data?.message || error.message,
                data,
            });

            // Handle specific status codes
            switch (status) {
                case 401:
                    // Unauthorized - clear auth and redirect to login (future)
                    console.warn('Unauthorized access - token may be invalid');
                    // localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
                    // window.location.href = '/login';
                    break;
                case 403:
                    console.warn('Forbidden - insufficient permissions');
                    break;
                case 404:
                    console.warn('Resource not found');
                    break;
                case 500:
                    console.error('Server error - please try again later');
                    break;
                default:
                    console.error('API error:', data?.message || error.message);
            }
        } else if (error.request) {
            // Request made but no response received
            console.error('❌ Network Error:', 'No response from server');
        } else {
            // Something else happened
            console.error('❌ Error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default apiClient;
