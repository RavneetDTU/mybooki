/**
 * Application Constants
 * Central location for all app-wide constants
 */

// LocalStorage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'authToken',
    USER: 'user',
    IS_AUTHENTICATED: 'isAuthenticated',
};

// Date Formats
export const DATE_FORMATS = {
    API: 'YYYY-MM-DD',           // Format for API requests (2026-01-22)
    DISPLAY_SHORT: 'MM/DD/YYYY', // Format for display (01/22/2026)
    DISPLAY_LONG: 'dddd, MMMM DD, YYYY', // Thursday, January 22, 2026
};

// Reservation Status
export const RESERVATION_STATUS = {
    CONFIRMED: 'confirmed',
    PENDING: 'pending',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
    NO_SHOW: 'no_show',
};

// Reservation Source
export const RESERVATION_SOURCE = {
    AI_CALL: 'ai_call',
    MANUAL: 'manual',
    ONLINE: 'online',
};
