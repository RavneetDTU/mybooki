import apiClient from './api/axios';
import { ADDRESS_ENDPOINTS, AUTH_ENDPOINTS } from './api/endpoints';
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
};
