import apiClient from './api/axios';
import { SETTINGS_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';

/**
 * Settings Service
 * Handles all restaurant settings-related API calls
 */

export const settingsService = {
    /**
     * Get restaurant settings (name, email, phone, etc.)
     * @returns {Promise<Object>} - Restaurant settings data
     */
    getRestaurantSettings: async () => {
        try {
            const response = await apiClient.get(SETTINGS_ENDPOINTS.GET_RESTAURANT);
            const data = response.data;

            return {
                name: data.name,
                email: data.email,
                phone: data.phone,
                totalCapacity: data.total_capacity,
                timezone: data.timezone,
                // Address will be added when available from API
                address: {
                    streetLine1: '',
                    city: '',
                    province: '',
                    postalCode: '',
                },
            };
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch restaurant settings');
            throw new Error(message);
        }
    },

    /**
     * Get Restaurant Settings (legacy method for backward compatibility)
     * @deprecated Use getRestaurantSettings instead
     */
    getSettings: async () => {
        return settingsService.getRestaurantSettings();
    },

    /**
     * Update restaurant address
     * @param {Object} addressData - Address data
     * @returns {Promise<Object>} - Update response
     */
    updateAddress: async (addressData) => {
        try {
            const response = await apiClient.put(SETTINGS_ENDPOINTS.UPDATE_ADDRESS, addressData);
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to update address');
            throw new Error(message);
        }
    },

    /**
     * Update restaurant email
     * @param {string} email - New email address
     * @returns {Promise<Object>} - Update response
     */
    updateEmail: async (email) => {
        try {
            // Use PATCH on restaurant endpoint
            const response = await apiClient.patch(SETTINGS_ENDPOINTS.UPDATE_RESTAURANT, { email });
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to update email');
            throw new Error(message);
        }
    },

    /**
     * Change password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} - Update response
     */
    changePassword: async (currentPassword, newPassword) => {
        try {
            const payload = {
                current_password: currentPassword,
                new_password: newPassword,
            };
            const response = await apiClient.patch(SETTINGS_ENDPOINTS.UPDATE_PASSWORD, payload);
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to change password');
            throw new Error(message);
        }
    },

    /**
     * Get phone number
     * @returns {Promise<Object>} - Phone number data
     */
    getPhoneNumber: async () => {
        try {
            const settings = await settingsService.getRestaurantSettings();
            return { phoneNumber: settings.phone };
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch phone number');
            throw new Error(message);
        }
    },

    /**
     * Update restaurant phone number
     * @param {string} phoneNumber - New phone number
     * @returns {Promise<Object>} - Update response
     */
    updatePhoneNumber: async (phoneNumber) => {
        try {
            const response = await apiClient.put(SETTINGS_ENDPOINTS.UPDATE_PHONE, { phone: phoneNumber });
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to update phone number');
            throw new Error(message);
        }
    },
};
