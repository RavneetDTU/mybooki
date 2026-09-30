import apiClient from './api/axios';
import { AVAILABILITY_ENDPOINTS, SITTING_ENDPOINTS, SITTING_SCHEDULE_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';

/**
 * Sittings Service
 * Restaurant-defined sittings (what is offered) and one-off date schedules (when, on a specific date).
 * Weekly per-day sitting slots live on the operating-hours endpoint — see operatingHours.js.
 *
 * Sitting:  { id, restaurant_id, name, description, capacity, is_active }
 * Slot:     { sitting_id, sitting_name?, start_time: "HH:mm", end_time: "HH:mm" }   (end_time exclusive)
 */

// FastAPI returns { detail: "..." } for business errors and { detail: [{ msg }] } for 422 validation errors.
export function sittingApiErrorMessage(error, fallback) {
    const detail = error.response?.data?.detail;
    let message = null;
    if (typeof detail === 'string' && detail.trim()) {
        message = detail;
    } else if (Array.isArray(detail) && detail.length > 0) {
        message = detail
            .map((d) => String(d?.msg || '').replace(/^Value error,\s*/i, ''))
            .filter(Boolean)
            .join('; ');
    }
    if (message) {
        handleApiError(error, message);
        return message;
    }
    return handleApiError(error, fallback);
}

function toSittingPayload({ name, description, capacity, is_active }) {
    const trimmedDescription = String(description ?? '').trim();
    const cap = capacity === '' || capacity === null || capacity === undefined ? null : Number(capacity);
    return {
        name: String(name ?? '').trim(),
        description: trimmedDescription || null,
        capacity: cap,
        is_active: is_active !== false,
    };
}

function toSlotPayload(slots) {
    return (slots || []).map((s) => ({
        sitting_id: Number(s.sitting_id),
        start_time: s.start_time,
        end_time: s.end_time,
    }));
}

export const sittingService = {
    /**
     * GET /restaurants/:restaurantId/sittings
     * Returns a name-sorted array (deleted sittings are excluded by the API; inactive ones are included).
     */
    getSittings: async (restaurantId) => {
        try {
            const response = await apiClient.get(SITTING_ENDPOINTS.LIST(restaurantId));
            const list = Array.isArray(response.data) ? response.data : [];
            return [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)));
        } catch (error) {
            if (error.response?.status === 404) return [];
            const message = handleApiError(error, 'Failed to fetch sittings');
            throw new Error(message);
        }
    },

    /**
     * POST /restaurants/:restaurantId/sittings
     * Body: { name, description, capacity, is_active }
     */
    createSitting: async (restaurantId, sitting) => {
        try {
            const response = await apiClient.post(SITTING_ENDPOINTS.CREATE(restaurantId), toSittingPayload(sitting));
            return response.data;
        } catch (error) {
            throw new Error(sittingApiErrorMessage(error, 'Failed to create sitting'));
        }
    },

    /**
     * PUT /restaurants/:restaurantId/sittings/:sittingId
     * Full replace — always send name, description, capacity and is_active.
     */
    updateSitting: async (restaurantId, sittingId, sitting) => {
        try {
            const response = await apiClient.put(SITTING_ENDPOINTS.UPDATE(restaurantId, sittingId), toSittingPayload(sitting));
            return response.data;
        } catch (error) {
            throw new Error(sittingApiErrorMessage(error, 'Failed to update sitting'));
        }
    },

    /**
     * DELETE /restaurants/:restaurantId/sittings/:sittingId
     * Soft delete: hidden from lists and schedules; historical reservations keep the sitting name.
     */
    deleteSitting: async (restaurantId, sittingId) => {
        try {
            await apiClient.delete(SITTING_ENDPOINTS.DELETE(restaurantId, sittingId));
        } catch (error) {
            throw new Error(sittingApiErrorMessage(error, 'Failed to delete sitting'));
        }
    },

    /**
     * GET /restaurants/:restaurantId/sitting-schedules?from=YYYY-MM-DD&to=YYYY-MM-DD
     * Returns [{ date, slots[] }] — only dates that have a one-off override.
     */
    getDateSchedules: async (restaurantId, from, to) => {
        try {
            const response = await apiClient.get(SITTING_SCHEDULE_ENDPOINTS.LIST(restaurantId), {
                params: { from, to },
            });
            return Array.isArray(response.data?.dates) ? response.data.dates : [];
        } catch (error) {
            if (error.response?.status === 404) return [];
            throw new Error(sittingApiErrorMessage(error, 'Failed to fetch date schedules'));
        }
    },

    /**
     * PUT /restaurants/:restaurantId/sitting-schedules
     * Body: { dates: [{ date, slots: [{ sitting_id, start_time, end_time }] }] }
     * An empty slots array means no sittings (no bookings) on that date.
     */
    setDateSchedule: async (restaurantId, date, slots) => {
        try {
            const payload = { dates: [{ date, slots: toSlotPayload(slots) }] };
            const response = await apiClient.put(SITTING_SCHEDULE_ENDPOINTS.UPDATE(restaurantId), payload);
            return response.data;
        } catch (error) {
            throw new Error(sittingApiErrorMessage(error, 'Failed to save sittings for this date'));
        }
    },

    /**
     * DELETE /restaurants/:restaurantId/sitting-schedules?date=YYYY-MM-DD
     * Removes the override so the date falls back to the weekly schedule.
     */
    clearDateSchedule: async (restaurantId, date) => {
        try {
            await apiClient.delete(SITTING_SCHEDULE_ENDPOINTS.DELETE(restaurantId), { params: { date } });
        } catch (error) {
            throw new Error(sittingApiErrorMessage(error, 'Failed to reset this date'));
        }
    },

    /**
     * GET /restaurants/:restaurantId/availability?month=YYYY-MM
     * Returns one entry per date: { date, open_time, close_time, is_closed, slots[] }
     * with weekly schedule, one-off overrides and holidays already applied by the API.
     */
    getMonthAvailability: async (restaurantId, month) => {
        try {
            const response = await apiClient.get(AVAILABILITY_ENDPOINTS.GET_MONTH(restaurantId), {
                params: { month },
            });
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch availability');
            throw new Error(message);
        }
    },
};
