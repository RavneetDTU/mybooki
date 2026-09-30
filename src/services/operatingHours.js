import apiClient from './api/axios';
import { HOLIDAY_ENDPOINTS, OPERATING_HOURS_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';
import { sittingApiErrorMessage, sittingService } from './sittings';

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
    breakfast: { enabled: true, open_time: '08:00', close_time: '11:00' },
    lunch:     { enabled: true, open_time: '12:00', close_time: '15:30' },
    dinner:    { enabled: true, open_time: '18:00', close_time: '22:00' },
};

// Used when a restaurant has no sittings and no weekly schedule yet.
export const DEFAULT_SITTING_HOURS = [
    { name: 'Breakfast', start_time: DEFAULT_SHIFTS.breakfast.open_time, end_time: DEFAULT_SHIFTS.breakfast.close_time },
    { name: 'Lunch', start_time: DEFAULT_SHIFTS.lunch.open_time, end_time: DEFAULT_SHIFTS.lunch.close_time },
    { name: 'Dinner', start_time: DEFAULT_SHIFTS.dinner.open_time, end_time: DEFAULT_SHIFTS.dinner.close_time },
];

// All 7 days open, with Breakfast, Lunch and Dinner when those sittings exist.
export function buildDefaultWeeklySlots(sittings) {
    const slots = DEFAULT_SITTING_HOURS.map((def) => {
        const match = (sittings || []).find(
            (s) => s.is_active !== false && String(s.name).trim().toLowerCase() === def.name.toLowerCase()
        );
        if (!match) return null;
        return { sitting_id: match.id, start_time: def.start_time, end_time: def.end_time };
    }).filter(Boolean);

    const schedule = {};
    WEEK_DAYS.forEach((day) => {
        schedule[day] = { is_closed: false, slots: slots.map((s) => ({ ...s })) };
    });
    return schedule;
}

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

/*
 * Weekly sitting slots (dynamic sittings).
 * UI shape: { Monday: { is_closed, slots: [{ sitting_id, start_time, end_time }] }, ... }
 * Overlapping slots are allowed; each sitting has its own capacity.
 */

// Legacy days saved before sittings existed only carry breakfast/lunch/dinner keys.
// Map those onto sittings with the same name so nothing is lost on the next save.
function legacyShiftsToSlots(day, sittings) {
    const slots = [];
    SHIFTS.forEach((shift) => {
        const s = day[shift];
        if (!s?.enabled || !s.open_time || !s.close_time) return;
        const match = (sittings || []).find((x) => String(x.name).trim().toLowerCase() === shift);
        if (!match) return;
        slots.push({ sitting_id: match.id, start_time: s.open_time, end_time: s.close_time });
    });
    return slots;
}

function normalizeWeeklySlots(apiSchedule, sittings) {
    if (!apiSchedule || Object.keys(apiSchedule).length === 0) {
        return buildDefaultWeeklySlots(sittings);
    }
    const out = {};
    WEEK_DAYS.forEach((day) => {
        const d = apiSchedule?.[day];
        if (!d) {
            out[day] = { is_closed: false, slots: [] };
            return;
        }
        const slots = Array.isArray(d.slots) && d.slots.length > 0
            ? d.slots
                .filter((s) => s.sitting_id != null)
                .map((s) => ({ sitting_id: s.sitting_id, start_time: s.start_time, end_time: s.end_time }))
            : legacyShiftsToSlots(d, sittings);
        slots.sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
        out[day] = { is_closed: Boolean(d.is_closed), slots };
    });
    return out;
}

function toApiWeeklySlots(schedule) {
    const out = {};
    WEEK_DAYS.forEach((day) => {
        const d = schedule[day];
        out[day] = {
            is_closed: Boolean(d.is_closed),
            slots: d.is_closed
                ? []
                : d.slots.map((s) => ({
                    sitting_id: Number(s.sitting_id),
                    start_time: s.start_time,
                    end_time: s.end_time,
                })),
        };
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
     * GET /restaurants/:restaurantId/operating-hours — weekly sitting slots view.
     * `sittings` is used only to map legacy breakfast/lunch/dinner days that have no slots yet.
     * Returns { schedule, isSaved }.
     */
    getWeeklySittings: async (restaurantId, sittings = []) => {
        try {
            const response = await apiClient.get(OPERATING_HOURS_ENDPOINTS.GET(restaurantId));
            const apiSchedule = response.data?.schedule;
            const isSaved = Boolean(apiSchedule && Object.keys(apiSchedule).length > 0);
            return { schedule: normalizeWeeklySlots(apiSchedule, sittings), isSaved };
        } catch (error) {
            if (error.response?.status === 404) {
                return { schedule: normalizeWeeklySlots(null, sittings), isSaved: false };
            }
            const message = handleApiError(error, 'Failed to fetch operating hours');
            throw new Error(message);
        }
    },

    /**
     * PUT /restaurants/:restaurantId/operating-hours
     * Body: { schedule: { Monday: { is_closed, slots: [{ sitting_id, start_time, end_time }] }, ... } }
     * All 7 days are always sent — the API removes days missing from the payload.
     */
    updateWeeklySittings: async (restaurantId, schedule) => {
        try {
            const payload = { schedule: toApiWeeklySlots(schedule) };
            const response = await apiClient.put(OPERATING_HOURS_ENDPOINTS.UPDATE(restaurantId), payload);
            return response.data;
        } catch (error) {
            throw new Error(sittingApiErrorMessage(error, 'Failed to update operating hours'));
        }
    },

    /**
     * First visit with nothing configured: create Breakfast, Lunch and Dinner,
     * then save Monday–Sunday open with the default times.
     * A restaurant that already has sittings or a saved week is left as it is,
     * except an empty week is filled when Breakfast, Lunch or Dinner already exist.
     * Returns { sittings, seeded }.
     */
    ensureDefaultOpenWeek: async (restaurantId) => {
        let sittings = await sittingService.getSittings(restaurantId);
        if (sittings.length === 0) {
            for (const def of DEFAULT_SITTING_HOURS) {
                await sittingService.createSitting(restaurantId, {
                    name: def.name,
                    description: '',
                    capacity: '',
                    is_active: true,
                });
            }
            sittings = await sittingService.getSittings(restaurantId);
        }

        const { isSaved } = await operatingHoursService.getWeeklySittings(restaurantId, sittings);
        const schedule = buildDefaultWeeklySlots(sittings);
        if (!isSaved && schedule.Monday.slots.length > 0) {
            await operatingHoursService.updateWeeklySittings(restaurantId, schedule);
            return { sittings, seeded: true };
        }
        return { sittings, seeded: false };
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
