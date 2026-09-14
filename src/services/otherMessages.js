import apiClient from './api/axios';
import { OTHER_MESSAGES_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';
import { toDateQueryParams } from '../utils/dateUtils';

export const otherMessagesService = {
    /**
     * @param {Date|{from: string, to: string}} dateOrRange
     * @param {string} restaurantId
     */
    getOtherMessages: async (dateOrRange, restaurantId) => {
        try {
            const response = await apiClient.get(OTHER_MESSAGES_ENDPOINTS.GET_BY_DATE(restaurantId), {
                params: toDateQueryParams(dateOrRange)
            });

            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch other messages');
            throw new Error(message);
        }
    }
};
