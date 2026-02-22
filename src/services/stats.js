import apiClient from './api/axios';
// import { STATS_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';

/**
 * Stats Service
 * Handles all statistics-related API calls
 */

export const statsService = {
    /**
     * Fetch restaurant statistics overview
     * @returns {Promise<Object>} - Statistics data
     */
    getOverview: async () => {
        try {
            const response = await apiClient.get(STATS_ENDPOINTS.GET_OVERVIEW);
            const data = response.data;

            // Return formatted stats
            return {
                avgMonthlyBookings: data.avg_monthly_bookings,
                avgMonthlyCovers: data.avg_monthly_covers,
                avgCoversPerBooking: data.avg_covers_per_booking,
                avgMonthlyCancellations: data.avg_cancellations,
                avgMonthlyNoShows: data.avg_no_shows,
            };
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch statistics');
            throw new Error(message);
        }
    },
};
