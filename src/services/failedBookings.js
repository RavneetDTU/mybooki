import apiClient from './api/axios';
import { FAILED_BOOKINGS_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';
import { toDateQueryParams } from '../utils/dateUtils';

export const failedBookingsService = {
    /**
     * @param {Date|{from: string, to: string}} dateOrRange
     * @param {string} restaurantId
     */
    getFailedBookings: async (dateOrRange, restaurantId) => {
        try {
            const response = await apiClient.get(FAILED_BOOKINGS_ENDPOINTS.GET_BY_DATE(restaurantId), {
                params: toDateQueryParams(dateOrRange)
            });
            
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch failed bookings');
            throw new Error(message);
        }
    }
};
