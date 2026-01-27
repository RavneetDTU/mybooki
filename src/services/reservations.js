import apiClient from './api/axios';
import { RESERVATION_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';
import { formatDateForAPI } from '../utils/dateUtils';

/**
 * Reservation Service
 * Handles all reservation-related API calls
 */

export const reservationService = {
    /**
     * Fetch reservations for a specific date
     * @param {Date} date - JavaScript Date object
     * @returns {Promise<Object>} - Reservation data with list and metadata
     */
    getReservations: async (date) => {
        try {
            // Format date to API format (YYYY-MM-DD)
            const dateString = formatDateForAPI(date);

            // Make API request
            const response = await apiClient.get(RESERVATION_ENDPOINTS.GET_BY_DATE, {
                params: { date: dateString }
            });

            // Transform API response to match frontend expectations
            const data = response.data;

            // Map API response to frontend format
            const reservations = data.reservations.map(reservation => ({
                id: reservation.id,
                time: reservation.time,
                bookerName: reservation.guest_name,
                phone: reservation.guest?.phone || '',
                guests: reservation.party_size,
                tableNumber: reservation.table_number || null,
                status: reservation.status,
                source: reservation.source,
                callId: reservation.call_id,
                date: reservation.date,
                notes: reservation.notes,
                // Include full guest and call data for details
                guestData: reservation.guest,
                callData: reservation.call,
            }));

            return {
                date: data.date,
                totalBookings: data.total_bookings,
                totalGuests: data.total_guests,
                capacity: data.capacity,
                reservations,
            };
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch reservations');
            throw new Error(message);
        }
    },

    /**
     * Fetch detailed information for a single reservation
     * @param {string} id - Reservation ID
     * @returns {Promise<Object>} - Detailed reservation data
     */
    getReservationDetails: async (id) => {
        try {
            // Call the individual reservation endpoint
            const endpoint = RESERVATION_ENDPOINTS.GET_BY_ID.replace(':id', id);
            const response = await apiClient.get(endpoint);

            const data = response.data;

            // Format call duration from seconds to MM:SS
            const formatDuration = (seconds) => {
                if (!seconds) return '0:00';
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };

            // Format call date
            const formatCallDate = (dateString) => {
                if (!dateString) return new Date().toLocaleString();
                const date = new Date(dateString);
                return date.toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            };

            // Return formatted details for the modal
            return {
                id: data.id,
                conversationId: data.call_id || data.id,
                paymentId: null, // Add if available in future
                callDate: data.date ? formatCallDate(data.date) : new Date().toLocaleString(),
                callDuration: data.call?.duration_seconds ? formatDuration(data.call.duration_seconds) : '0:00',
                summary: data.call?.summary || 'No summary available',
                transcript: [], // Will be added when transcript endpoint is available
                // Include additional data for reference
                guestName: data.guest_name,
                partySize: data.party_size,
                time: data.time,
                status: data.status,
                guest: data.guest,
                call: data.call,
            };
        } catch (error) {
            const message = handleApiError(error, 'Failed to fetch reservation details');
            throw new Error(message);
        }
    },

    /**
     * Create a new reservation
     * @param {Object} reservationData - Reservation data
     * @returns {Promise<Object>} - Created reservation
     */
    createReservation: async (reservationData) => {
        try {
            const response = await apiClient.post(RESERVATION_ENDPOINTS.CREATE, reservationData);
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to create reservation');
            throw new Error(message);
        }
    },

    /**
     * Create a manual reservation
     * @param {Object} reservationData - Manual reservation data
     * @returns {Promise<Object>} - Created reservation
     */
    createManualReservation: async (reservationData) => {
        try {
            const response = await apiClient.post(RESERVATION_ENDPOINTS.CREATE_MANUAL, reservationData);
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to create manual reservation');
            throw new Error(message);
        }
    },

    /**
     * Update an existing reservation
     * @param {string} id - Reservation ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} - Updated reservation
     */
    updateReservation: async (id, updateData) => {
        try {
            const endpoint = RESERVATION_ENDPOINTS.UPDATE.replace(':id', id);
            const response = await apiClient.put(endpoint, updateData);
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to update reservation');
            throw new Error(message);
        }
    },

    /**
     * Delete a reservation
     * @param {string} id - Reservation ID
     * @returns {Promise<void>}
     */
    deleteReservation: async (id) => {
        try {
            const endpoint = RESERVATION_ENDPOINTS.DELETE.replace(':id', id);
            await apiClient.delete(endpoint);
        } catch (error) {
            const message = handleApiError(error, 'Failed to delete reservation');
            throw new Error(message);
        }
    },
};
