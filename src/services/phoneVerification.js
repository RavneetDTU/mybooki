import axios from 'axios';

const VERIFICATION_API_URL = import.meta.env.VITE_VERIFICATION_API_URL || 'http://localhost:9000';

/**
 * Phone Verification Service
 * Uses Twilio Lookup API v2 to verify phone numbers
 */
export const phoneVerificationService = {
    /**
     * Verify a phone number
     * @param {string} phoneNumber - Phone number to verify (E.164 format recommended)
     * @returns {Promise<Object>} Verification result
     */
    verifyPhoneNumber: async (phoneNumber) => {
        try {
            const response = await axios.post(`${VERIFICATION_API_URL}/api/verify/phone`, {
                phoneNumber
            });

            return {
                success: true,
                valid: response.data.valid,
                phoneNumber: response.data.phoneNumber,
                nationalFormat: response.data.nationalFormat,
                countryCode: response.data.countryCode,
                lineTypeIntelligence: response.data.lineTypeIntelligence
            };
        } catch (error) {
            // Handle API errors
            if (error.response) {
                return {
                    success: false,
                    valid: false,
                    error: error.response.data.error || 'Verification failed'
                };
            }

            // Network or other errors
            return {
                success: false,
                valid: false,
                error: 'Unable to connect to verification service'
            };
        }
    }
};
