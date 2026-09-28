import apiClient from './api/axios';
import { HOLIDAY_ENDPOINTS, OPERATING_HOURS_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';

/**
 * Operating Hours & Holidays Service
 * Weekly shift timings (breakfast / lunch / dinner) and restaurant-specific holidays.
 * Both are managed independently and scoped to the logged-in restaurantId.
 *
 * Schedule shape:
 *   {
 *     Monday: {
 *       is_closed: false,
 *       breakfast: { enabled, open_time: "HH:mm" | null, close_time: "HH:mm" | null },
 *       lunch:     { ... },
 *       dinner:    { ... },
 *     },
 *     ...
 *   }
 */

export const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const SHIFTS = ['breakfast', 'lunch', 'dinner'];

const DEFAULT_SHIFTS = {
    breakfast: { enabled: false, open_time: '08:00', close_time: '11:00' },
    lunch:     { enabled: true,  open_time: '12:00', close_time: '15:30' },
    dinner:    { enabled: true,  open_time: '18:00', close_time: '22:00' },
};

export function buildDefaultSchedule() {
    const schedule = {};
    WEEK_DAYS.forEach((day) => {
        schedule[day] = {
            is_closed: false,
            breakfast: { ...DEFAULT_SHIFTS.breakfast },
            lunch: { ...DEFAULT_SHIFTS.lunch },
            dinner: { ...DEFAULT_SHIFTS.dinner },
        };
    });
    return schedule;
}

// Fills any missing day/shift so the UI always has a complete 7-day grid.
function normalizeSchedule(apiSchedule) {
    const base = buildDefaultSchedule();
    if (!apiSchedule || typeof apiSchedule !== 'object') return base;

    WEEK_DAYS.forEach((day) => {
        const d = apiSchedule[day];
        if (!d) return;
        base[day].is_closed = Boolean(d.is_closed);
        SHIFTS.forEach((shift) => {
            const s = d[shift] || d.shifts?.[shift];
            if (!s) return;
            base[day][shift] = {
                enabled: Boolean(s.enabled),
                open_time: s.open_time || base[day][shift].open_time,
                close_time: s.close_time || base[day][shift].close_time,
            };
        });
    });
    return base;
}

// Disabled shifts are sent with null times so the backend stores a clean record.
function toApiSchedule(schedule) {
    const out = {};
    WEEK_DAYS.forEach((day) => {
        const d = schedule[day];
        out[day] = { is_closed: Boolean(d.is_closed) };
        SHIFTS.forEach((shift) => {
            const s = d[shift];
            const active = !d.is_closed && s.enabled;
            out[day][shift] = {
                enabled: active,
                open_time: active ? s.open_time : null,
                close_time: active ? s.close_time : null,
            };
        });
    });
    return out;
}

// The Mybooki API (FastAPI) returns validation errors as { detail: "..." }.
function apiErrorMessage(error, fallback) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) {
        handleApiError(error, detail);
        return detail;
    }
    return handleApiError(error, fallback);
}

export const operatingHoursService = {
    /**
     * GET /restaurants/:restaurantId/operating-hours
     * Returns { schedule, isSaved }. isSaved=false means nothing saved yet → defaults.
     * The API returns 200 with { schedule: {} } for a restaurant that has not saved hours.
     */
    getOperatingHours: async (restaurantId) => {
        try {
            const response = await apiClient.get(OPERATING_HOURS_ENDPOINTS.GET(restaurantId));
            const apiSchedule = response.data?.schedule;
            const isSaved = Boolean(apiSchedule && Object.keys(apiSchedule).length > 0);
            return { schedule: normalizeSchedule(apiSchedule), isSaved };
        } catch (error) {
            if (error.response?.status === 404) {
                return { schedule: buildDefaultSchedule(), isSaved: false };
            }
            const message = handleApiError(error, 'Failed to fetch operating hours');
            throw new Error(message);
        }
    },

    /**
     * PUT /restaurants/:restaurantId/operating-hours
     * Body: { schedule }
     */
    updateOperatingHours: async (restaurantId, schedule) => {
        try {
            const payload = { schedule: toApiSchedule(schedule) };
            const response = await apiClient.put(OPERATING_HOURS_ENDPOINTS.UPDATE(restaurantId), payload);
            return response.data;
        } catch (error) {
            const message = apiErrorMessage(error, 'Failed to update operating hours');
            throw new Error(message);
        }
    },

    /**
     * GET /restaurants/:restaurantId/holidays
     * Returns a date-sorted array of { id, name, date, is_closed }.
     */
    getHolidays: async (restaurantId) => {
        try {
            const response = await apiClient.get(HOLIDAY_ENDPOINTS.LIST(restaurantId));
            const list = Array.isArray(response.data?.holidays)
                ? response.data.holidays
                : Array.isArray(response.data) ? response.data : [];
            return [...list].sort((a, b) => String(a.date).localeCompare(String(b.date)));
        } catch (error) {
            if (error.response?.status === 404) return [];
            const message = handleApiError(error, 'Failed to fetch holidays');
            throw new Error(message);
        }
    },

    /**
     * POST /restaurants/:restaurantId/holidays
     * Body: { name, date: "YYYY-MM-DD", is_closed: true }
     */
    addHoliday: async (restaurantId, { name, date }) => {
        try {
            const payload = { name: String(name ?? '').trim(), date, is_closed: true };
            const response = await apiClient.post(HOLIDAY_ENDPOINTS.CREATE(restaurantId), payload);
            return response.data;
        } catch (error) {
            const message = apiErrorMessage(error, 'Failed to add holiday');
            throw new Error(message);
        }
    },

    /**
     * DELETE /restaurants/:restaurantId/holidays/:holidayId
     */
    deleteHoliday: async (restaurantId, holidayId) => {
        try {
            const response = await apiClient.delete(HOLIDAY_ENDPOINTS.DELETE(restaurantId, holidayId));
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to delete holiday');
            throw new Error(message);
        }
    },
};
