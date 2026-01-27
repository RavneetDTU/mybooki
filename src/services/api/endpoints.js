/**
 * API Endpoints
 * Centralized definition of all API endpoints
 */

// Authentication Endpoints (for future use)
export const AUTH_ENDPOINTS = {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
};

// Reservation Endpoints
export const RESERVATION_ENDPOINTS = {
    GET_BY_DATE: '/reservations', // GET /reservations?date=YYYY-MM-DD
    GET_BY_ID: '/reservations/:id', // GET /reservations/:id
    CREATE: '/reservations', // POST /reservations
    CREATE_MANUAL: '/reservations/manual', // POST /reservations/manual
    UPDATE: '/reservations/:id', // PUT /reservations/:id
    DELETE: '/reservations/:id', // DELETE /reservations/:id
};

// Guest Endpoints
export const GUEST_ENDPOINTS = {
    GET_ALL: '/guests', // GET /guests
    GET_BY_ID: '/guests/:id', // GET /guests/:id
    CREATE: '/guests', // POST /guests
    UPDATE: '/guests/:id', // PUT /guests/:id
    DELETE: '/guests/:id', // DELETE /guests/:id
};

// Settings Endpoints
export const SETTINGS_ENDPOINTS = {
    GET_RESTAURANT: '/settings/restaurant', // GET /settings/restaurant
    UPDATE_RESTAURANT: '/settings/restaurant', // PATCH /settings/restaurant
    UPDATE_PASSWORD: '/settings/password', // PATCH /settings/password
    GET: '/settings', // GET /settings
    UPDATE: '/settings', // PUT /settings
    UPDATE_ADDRESS: '/settings/address', // PUT /settings/address
    UPDATE_EMAIL: '/settings/email', // PUT /settings/email (deprecated)
    UPDATE_PHONE: '/settings/phone', // PUT /settings/phone
};

// Call/Conversation Endpoints (if needed separately)
export const CALL_ENDPOINTS = {
    GET_BY_ID: '/calls/:id', // GET /calls/:id
    GET_TRANSCRIPT: '/calls/:id/transcript', // GET /calls/:id/transcript
};

// Stats Endpoints
export const STATS_ENDPOINTS = {
    GET_OVERVIEW: '/stats/overview', // GET /stats/overview
};

/**
 * Helper function to replace URL parameters
 * Example: replaceParams('/reservations/:id', { id: '123' }) => '/reservations/123'
 */
export const replaceParams = (endpoint, params) => {
    let url = endpoint;
    Object.keys(params).forEach((key) => {
        url = url.replace(`:${key}`, params[key]);
    });
    return url;
};
