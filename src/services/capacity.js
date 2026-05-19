import apiClient from './api/axios';
import { JARVIS_CONFIG_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';

/**
 * Capacity Service
 * Handles all capacity-related API calls.
 *
 * Data shape in prompts.json settings:
 *   totalCapacity: 20
 *   otherBookingsByDate: { "2026-05-22": 4, "2026-05-23": 2 }
 */

export const capacityService = {
    /**
     * Get capacity settings: totalCapacity + full otherBookingsByDate map.
     */
    getCapacitySettings: async (restaurantId) => {
        try {
            const response = await apiClient.get(JARVIS_CONFIG_ENDPOINTS.GET_DETAILS(restaurantId));
            const settings = response.data.settings || {};
            return {
                totalCapacity: Number(settings.totalCapacity) || 0,
                otherBookingsByDate: settings.otherBookingsByDate || {},
            };
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch capacity settings');
            throw new Error(message);
        }
    },

    /**
     * Update total seating capacity.
     */
    updateTotalCapacity: async (restaurantId, capacity) => {
        try {
            const payload = {
                restaurantId: String(restaurantId),
                settings: { totalCapacity: Number(capacity) },
            };
            const response = await apiClient.post(JARVIS_CONFIG_ENDPOINTS.UPDATE, payload);
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to update total capacity');
            throw new Error(message);
        }
    },

    /**
     * Update other-source bookings for a specific date.
     * Saves as otherBookingsByDate["YYYY-MM-DD"] = count.
     *
     * @param {string} restaurantId
     * @param {string} dateStr   - e.g. "2026-05-22"
     * @param {number} count     - number of non-AI guests on that date
     */
    updateOtherBookingsForDate: async (restaurantId, dateStr, count) => {
        try {
            // We need to merge into the existing map, not overwrite the whole thing.
            // First fetch the current map, then patch only this date's key.
            const current = await capacityService.getCapacitySettings(restaurantId);
            const updatedMap = {
                ...current.otherBookingsByDate,
                [dateStr]: Number(count),
            };

            const payload = {
                restaurantId: String(restaurantId),
                settings: { otherBookingsByDate: updatedMap },
            };
            const response = await apiClient.post(JARVIS_CONFIG_ENDPOINTS.UPDATE, payload);
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to update other bookings for date');
            throw new Error(message);
        }
    },
};

