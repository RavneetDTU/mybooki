/**
 * API Endpoints
 * Centralized definition of all API endpoints used in this app.
 * Restaurant-scoped endpoints use factory functions accepting restaurantId.
 */

// Reservation Endpoints
export const RESERVATION_ENDPOINTS = {
    GET_BY_DATE: (restaurantId) => `/restaurants/${restaurantId}/reservations`,
    GET_BY_ID: (restaurantId, id) => `/restaurants/${restaurantId}/reservations/${id}`,
    CREATE: (restaurantId) => `/restaurants/${restaurantId}/reservations`,
    UPDATE: (restaurantId, id) => `/restaurants/${restaurantId}/reservations/${id}`,
    DELETE: (restaurantId, id) => `/restaurants/${restaurantId}/reservations/${id}`,
};

// Failed Bookings Endpoints
export const FAILED_BOOKINGS_ENDPOINTS = {
    GET_BY_DATE: (restaurantId) => `/restaurants/${restaurantId}/failed-bookings`,
};

// Guest Endpoints
export const GUEST_ENDPOINTS = {
    GET_ALL: (restaurantId) => `/restaurants/${restaurantId}/guests`,
    UPDATE: (restaurantId, id) => `/restaurants/${restaurantId}/guests/${id}`,
};

// Availability Endpoints
export const AVAILABILITY_ENDPOINTS = {
    SET: (restaurantId) => `/restaurants/${restaurantId}/availability`,
};

// Address Endpoints
export const ADDRESS_ENDPOINTS = {
    GET: (restaurantId) => `/restaurants/${restaurantId}/address`,
    UPDATE: (restaurantId) => `/restaurants/${restaurantId}/address`,
};

// Transcription Endpoints
export const TRANSCRIPTION_ENDPOINTS = {
    GET_BY_BOOKING_ID: (restaurantId, bookingId) =>
        `/restaurants/${restaurantId}/transcriptions/${bookingId}`,
};

// Password Endpoint
export const AUTH_ENDPOINTS = {
    UPDATE_PASSWORD: '/settings/password',
};

// Jarvis Base URL configuration: Automatically switches between localhost for development and live for production
const JARVIS_BASE_URL = import.meta.env.MODE === 'development' 
    ? 'http://localhost:9000' 
    : 'https://phone.jarviscalling.ai';

// Payment Endpoints
export const PAYMENT_ENDPOINTS = {
    GET_BY_RESTAURANT: (restaurantId) => `${JARVIS_BASE_URL}/api/payfast/payments/${restaurantId}`,
};

// Jarvis Config Endpoints
export const JARVIS_CONFIG_ENDPOINTS = {
    GET_DETAILS: (restaurantId) => `${JARVIS_BASE_URL}/api/restaurant/${restaurantId}/details`,
    UPDATE: `${JARVIS_BASE_URL}/api/update-config`,
    ADD_QUESTION: `${JARVIS_BASE_URL}/api/question/add`,
    DELETE_QUESTION: `${JARVIS_BASE_URL}/api/question/delete`,
};
