import apiClient from './api/axios';
import { ADDRESS_ENDPOINTS, AUTH_ENDPOINTS, JARVIS_CONFIG_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';

/**
 * Settings Service
 * Handles address (GET/PUT) and password change.
 * All address calls are scoped to the logged-in restaurantId.
 */

export const settingsService = {
    /**
     * Get restaurant address.
     * GET /restaurants/:restaurantId/address
     */
    getAddress: async (restaurantId) => {
        try {
            console.log('[Settings] Fetching address for restaurantId:', restaurantId);
            const response = await apiClient.get(ADDRESS_ENDPOINTS.GET(restaurantId));
            const data = response.data;
            console.log('[Settings] Address response:', data);

            return {
                streetLine1: data.street_address || '',
                city: data.city || '',
                province: data.province_state || '',
                postalCode: data.postal_code || '',
            };
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch address');
            throw new Error(message);
        }
    },

    /**
     * Update restaurant address.
     * PUT /restaurants/:restaurantId/address
     * Body: { street_address, city, province_state, postal_code }
     */
    updateAddress: async (restaurantId, addressData) => {
        try {
            const payload = {
                street_address: addressData.streetLine1,
                city: addressData.city,
                province_state: addressData.province,
                postal_code: addressData.postalCode,
            };
            console.log('[Settings] Updating address:', payload);
            const response = await apiClient.put(ADDRESS_ENDPOINTS.UPDATE(restaurantId), payload);
            console.log('[Settings] Address update response:', response.data);
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to update address');
            throw new Error(message);
        }
    },

    /**
     * Change password.
     */
    changePassword: async (currentPassword, newPassword) => {
        try {
            const payload = {
                current_password: currentPassword,
                new_password: newPassword,
            };
            const response = await apiClient.patch(AUTH_ENDPOINTS.UPDATE_PASSWORD, payload);
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to change password');
            throw new Error(message);
        }
    },

    /**
     * Get deposit amount from Jarvis config.
     */
    getDepositAmount: async (restaurantId) => {
        try {
            console.log('[Settings] Fetching Jarvis config for restaurantId:', restaurantId);
            const response = await apiClient.get(JARVIS_CONFIG_ENDPOINTS.GET_DETAILS(restaurantId));
            const data = response.data;
            console.log('[Settings] Jarvis config response:', data);

            // API returns: { name: "...", depositAmount: 500, currency: "rand" }
            return data.settings.depositAmount || '';
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch deposit amount');
            throw new Error(message);
        }
    },

    /**
     * Update deposit amount in Jarvis config.
     */
    updateDepositAmount: async (restaurantId, amount) => {
        try {
            // request body needs to be exactly this structure
            const payload = {
                restaurantId: String(restaurantId),
                settings: {
                    depositAmount: Number(amount)
                }
            };
            console.log('[Settings] Updating deposit amount:', payload);
            const response = await apiClient.post(JARVIS_CONFIG_ENDPOINTS.UPDATE, payload);
            console.log('[Settings] Deposit amount update response:', response.data);
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to update deposit amount');
            throw new Error(message);
        }
    },

    /**
     * Get Bot Configuration (question flow).
     * GET /api/restaurant/:restaurantId/details
     */
    getBotConfig: async (restaurantId) => {
        try {
            const response = await apiClient.get(JARVIS_CONFIG_ENDPOINTS.GET_DETAILS(restaurantId));
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch bot configuration');
            throw new Error(message);
        }
    },

    updateBotConfig: async (restaurantId, questionFlow) => {
        try {
            const payload = {
                restaurantId: String(restaurantId),
                questionFlow: questionFlow,
            };
            const response = await apiClient.post(JARVIS_CONFIG_ENDPOINTS.UPDATE, payload);
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to update bot configuration');
            throw new Error(message);
        }
    },

    /**
     * Add a new question to the bot configuration.
     * POST /api/question/add
     */
    addQuestion: async (restaurantId, questionData) => {
        try {
            const payload = {
                restaurantId: String(restaurantId),
                question: questionData
            };
            const response = await apiClient.post(JARVIS_CONFIG_ENDPOINTS.ADD_QUESTION, payload);
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to add question');
            throw new Error(message);
        }
    },

    /**
     * Delete a question from the bot configuration.
     * DELETE /api/question/delete
     */
    deleteQuestion: async (restaurantId, questionId) => {
        try {
            const payload = {
                restaurantId: String(restaurantId),
                questionId: questionId
            };
            const response = await apiClient.delete(JARVIS_CONFIG_ENDPOINTS.DELETE_QUESTION, { data: payload });
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to delete question');
            throw new Error(message);
        }
    },
};
