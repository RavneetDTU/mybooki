import apiClient from './api/axios';
import { GUEST_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';

/**
 * Guest Service
 * Handles all guest-related API calls.
 * Every method requires `restaurantId` to scope requests to the correct restaurant.
 */

export const guestService = {
    /**
     * Fetch all guests for a restaurant.
     * @param {string} restaurantId - Restaurant ID from auth store
     * @returns {Promise<Array>} - Array of guest objects
     *
     * API response shape (flat fields):
     * { id, restaurant_id, name, phone, email, last_visit,
     *   total_bookings, total_showups, total_no_shows, total_cancellations }
     */
    getGuests: async (restaurantId) => {
        try {
            const response = await apiClient.get(GUEST_ENDPOINTS.GET_ALL(restaurantId));
            const data = response.data;

            // Map flat API fields to frontend-friendly names
            const guests = data.map((guest) => ({
                id: guest.id,
                restaurantId: guest.restaurant_id,
                name: guest.name,
                phone: guest.phone,
                email: guest.email || '',
                lastVisit: guest.last_visit,
                totalBookings: guest.total_bookings ?? 0,
                totalShowups: guest.total_showups ?? 0,
                noShows: guest.total_no_shows ?? 0,
                cancellations: guest.total_cancellations ?? 0,
            }));

            return guests;
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch guests');
            throw new Error(message);
        }
    },

    /**
     * Update a guest's details.
     * @param {Object} guest        - Guest object with updated data (must include id)
     * @param {string} restaurantId - Restaurant ID from auth store
     */
    updateGuest: async (guest, restaurantId) => {
        try {
            const payload = {
                name: guest.name,
                phone: guest.phone,
                email: guest.email || null,
            };

            const response = await apiClient.patch(
                GUEST_ENDPOINTS.UPDATE(restaurantId, guest.id),
                payload
            );
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to update guest');
            throw new Error(message);
        }
    },
};
