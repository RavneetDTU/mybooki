import apiClient from './api/axios';
import { FAILED_BOOKINGS_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';
import { formatDateForAPI } from '../utils/dateUtils';

export const failedBookingsService = {
    getFailedBookings: async (date, restaurantId) => {
        try {
            const dateString = formatDateForAPI(date);
            
            const response = await apiClient.get(FAILED_BOOKINGS_ENDPOINTS.GET_BY_DATE(restaurantId), {
                params: { date: dateString }
            });
            
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch failed bookings');
            throw new Error(message);
        }
    }
};
