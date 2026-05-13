        import apiClient from './api/axios';
import { OTHER_MESSAGES_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';
import { formatDateForAPI } from '../utils/dateUtils';

export const otherMessagesService = {
    getOtherMessages: async (date, restaurantId) => {
        try {
            const dateString = formatDateForAPI(date);

            const response = await apiClient.get(OTHER_MESSAGES_ENDPOINTS.GET_BY_DATE(restaurantId), {
                params: { date: dateString }
            });

            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch other messages');
            throw new Error(message);
        }
    }
};
