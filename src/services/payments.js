import apiClient from './api/axios';
import { PAYMENT_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';

/**
 * Payment Service
 * Handles fetching payment data for a restaurant from the Payfast API.
 */

export const paymentService = {
    /**
     * Fetch all payments for a specific restaurant.
     * @param {string} restaurantId - Restaurant ID from auth store
     * @returns {Promise<Object>} - { payments[], total, totalAmount }
     */
    getPayments: async (restaurantId) => {
        try {
            console.log('[Payments] Fetching payments for restaurantId:', restaurantId);
            const response = await apiClient.get(PAYMENT_ENDPOINTS.GET_BY_RESTAURANT(restaurantId));
            const data = response.data;
            console.log('[Payments] Response:', data);

            if (!data.success) {
                throw new Error('Failed to fetch payments');
            }

            return {
                payments: data.payments || [],
                total: data.total || 0,
                totalAmount: data.totalAmount || 0,
            };
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch payments');
            throw new Error(message);
        }
    },
};
