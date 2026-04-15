import apiClient from './api/axios';
import { RESERVATION_ENDPOINTS } from './api/endpoints';
import { handleApiError } from '../utils/errorHandler';
import { formatDateForAPI } from '../utils/dateUtils';

/**
 * Reservation Service
 * Handles all reservation-related API calls.
 * Every method requires `restaurantId` to scope requests to the correct restaurant.
 */

export const reservationService = {
    /**
     * Fetch reservations for a specific date and restaurant.
     * @param {Date}   date         - JavaScript Date object
     * @param {string} restaurantId - Restaurant ID from auth store
     * @returns {Promise<Object>}   - { date, totalBookings, totalGuests, capacity, reservations[] }
     */
    getReservations: async (date, restaurantId) => {
        try {
            const dateString = formatDateForAPI(date);

            const response = await apiClient.get(RESERVATION_ENDPOINTS.GET_BY_DATE(restaurantId), {
                params: { date: dateString },
            });

            const data = response.data;

            const reservations = data.reservations.map((reservation) => ({
                id: reservation.id,
                bookingId: reservation.booking_id,   // e.g. "BK-A0E78660" — used for transcription API
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
                guestData: reservation.guest,
                callData: reservation.call,
                paymentStatus: reservation.payment_status,
                paymentMethod: reservation.payment_method,
                paymentAmount: reservation.payment_amount,
                paymentCurrency: reservation.payment_currency,
                paymentDate: reservation.payment_date,
                paymentTime: reservation.payment_time,
                paymentId: reservation.payment_id,
                paymentNotes: reservation.payment_notes,
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
     * Fetch detailed information for a single reservation.
     * @param {string} id           - Reservation ID
     * @param {string} restaurantId - Restaurant ID from auth store
     */
    getReservationDetails: async (id, restaurantId) => {
        try {
            const response = await apiClient.get(RESERVATION_ENDPOINTS.GET_BY_ID(restaurantId, id));
            const data = response.data;

            const formatDuration = (seconds) => {
                if (!seconds) return '0:00';
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };

            const formatCallDate = (dateString) => {
                if (!dateString) return new Date().toLocaleString();
                return new Date(dateString).toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });
            };

            return {
                id: data.id,
                conversationId: data.call_id || data.id,
                paymentId: null,
                callDate: data.date ? formatCallDate(data.date) : new Date().toLocaleString(),
                callDuration: data.call?.duration_seconds
                    ? formatDuration(data.call.duration_seconds)
                    : '0:00',
                summary: data.call?.summary || 'No summary available',
                transcript: [],
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
     * Create a new reservation.
     * @param {Object} reservationData
     * @param {string} restaurantId
     */
    createReservation: async (reservationData, restaurantId) => {
        try {
            const response = await apiClient.post(
                RESERVATION_ENDPOINTS.CREATE(restaurantId),
                reservationData
            );
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to create reservation');
            throw new Error(message);
        }
    },

    /**
     * Create a manual reservation (also triggers notification externally).
     * @param {Object} reservationData - Payload for manual booking
     * @param {string} restaurantId - Restaurant ID
     */
    createManualReservation: async (reservationData, restaurantId) => {
        try {
            const API_URL = import.meta.env.VITE_VERIFICATION_API_URL || 'http://localhost:9000';
            const endpoint = `${API_URL}/api/booking/manual/${restaurantId}`;
            const response = await apiClient.post(endpoint, reservationData);
            return response.data; 
        } catch (error) {
            const message = handleApiError(error, 'Failed to create manual reservation');
            throw new Error(message);
        }
    },

    /**
     * Update an existing reservation.
     * @param {string} id
     * @param {Object} updateData
     * @param {string} restaurantId
     */
    updateReservation: async (id, updateData, restaurantId) => {
        try {
            const response = await apiClient.put(
                RESERVATION_ENDPOINTS.UPDATE(restaurantId, id),
                updateData
            );
            return response.data;
        } catch (error) {
            const message = handleApiError(error, 'Failed to update reservation');
            throw new Error(message);
        }
    },

    /**
     * Delete a reservation.
     * @param {string} id
     * @param {string} restaurantId
     */
    deleteReservation: async (id, restaurantId) => {
        try {
            await apiClient.delete(RESERVATION_ENDPOINTS.DELETE(restaurantId, id));
        } catch (error) {
            const message = handleApiError(error, 'Failed to delete reservation');
            throw new Error(message);
        }
    },
};
