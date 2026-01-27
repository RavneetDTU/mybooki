import apiClient from './api/axios';
import { GUEST_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';

/**
 * Guest Service
 * Handles all guest-related API calls
 */

export const guestService = {
    /**
     * Fetch all guests
     * @returns {Promise<Array>} - Array of guest objects
     */
    getGuests: async () => {
        try {
            const response = await apiClient.get(GUEST_ENDPOINTS.GET_ALL);
            const data = response.data;

            // Transform API response to frontend format
            const guests = data.map(guest => ({
                id: guest.id,
                name: guest.name,
                phone: guest.phone,
                email: guest.email || '',
                totalBookings: guest.bookings?.total || 0,
                cancellations: guest.bookings?.cancellations || 0,
                noShows: guest.bookings?.no_shows || 0,
                lastVisit: guest.last_visit,
            }));

            return guests;
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch guests');
            throw new Error(message);
        }
    },

    /**
     * Update a guest's details
     * @param {Object} guest - Guest object with updated data
     * @returns {Promise<Object>} - Updated guest data
     */
    updateGuest: async (guest) => {
        try {
            const endpoint = GUEST_ENDPOINTS.UPDATE.replace(':id', guest.id);

            // Transform frontend format to API format
            const payload = {
                name: guest.name,
                phone: guest.phone,
                email: guest.email || null,
            };

            const response = await apiClient.patch(endpoint, payload);
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to update guest');
            throw new Error(message);
        }
    },
};
