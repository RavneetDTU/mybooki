import { useEffect, useState } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import apiClient from '../services/api/axios';
import { TRANSCRIPTION_ENDPOINTS } from '../services/api/endpoints';
import { handleApiError } from '../utils/errorHandler';
import { formatTime12Hour } from '../utils/dateUtils';

/**
 * ConversationModal
 * Fetches transcription via /restaurants/:restaurantId/transcriptions/:bookingId
 * The bookingId comes from reservation.id (e.g. "BK-A0E78660").
 */
export default function ConversationModal({ isOpen, onClose, reservation }) {
    const { restaurantId } = useAuthStore();
    const [transcription, setTranscription] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // reservation.bookingId holds the booking ID like "BK-A0E78660" (from booking_id in API)
    const bookingId = reservation?.bookingId;

    useEffect(() => {
        if (isOpen && bookingId && restaurantId) {
            loadTranscription(bookingId);
        } else {
            setTranscription(null);
            setError(null);
        }
    }, [isOpen, bookingId, restaurantId]);

    const loadTranscription = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const url = TRANSCRIPTION_ENDPOINTS.GET_BY_BOOKING_ID(restaurantId, id);
            console.log('[ConversationModal] Fetching transcription:', url);
            const response = await apiClient.get(url);
            console.log('[ConversationModal] Transcription response:', response.data);
            setTranscription(response.data);
        } catch (err) {
            const message = handleApiError(err, 'Failed to load transcription');
            console.error('[ConversationModal] Error:', err);
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const display = (val) => (val !== null && val !== undefined && val !== '' ? val : 'N/A');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg border border-border max-w-3xl w-full max-h-[90vh] flex flex-col">

                {/* ── Header ── */}
                <div className="border-b border-border px-5 py-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h3 className="font-heading font-semibold text-foreground text-lg">
                                Reservation Details
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Booking ID: {display(bookingId)} &nbsp;|&nbsp;
                                Guest: {display(reservation?.bookerName)}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-muted/20 rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-foreground" />
                        </button>
                    </div>

                    {/* Meta badges */}
                    {reservation && (
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2.5 py-1 text-xs font-medium rounded capitalize
                                    ${reservation.status === 'confirmed' ? 'bg-green-100 text-green-700'
                                        : reservation.status === 'cancelled' ? 'bg-red-100 text-red-700'
                                            : reservation.status === 'no_show' ? 'bg-orange-100 text-orange-700'
                                                : 'bg-gray-100 text-gray-600'}`}
                                >
                                    {display(reservation.status)}
                                </span>
                                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded capitalize">
                                    {display(reservation.source)}
                                </span>
                                {reservation.tableNumber ? (
                                    <span className="px-2.5 py-1 bg-foreground text-white text-xs font-medium rounded">
                                        Table {reservation.tableNumber}
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-1 border border-border text-muted-foreground text-xs font-medium rounded">
                                        No Table
                                    </span>
                                )}
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                                <p className="font-medium text-foreground">
                                    {display(reservation.date)} &nbsp; {display(reservation.time ? formatTime12Hour(reservation.time) : null)}
                                </p>
                                <p>Party of {display(reservation.guests)}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500 px-6">
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : (
                        <div className="p-5 space-y-4">
                            {/* Transcription */}
                            <div className="flex items-center gap-2 mb-3">
                                <MessageSquare className="w-4 h-4 text-foreground" />
                                <h4 className="text-sm font-semibold text-foreground">Call Transcription</h4>
                            </div>

                            <div className="bg-gray-50 border border-border rounded-lg p-4">
                                {transcription?.transcription ? (
                                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                        {transcription.transcription}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">N/A</p>
                                )}
                            </div>

                            {/* Notes card */}
                            {reservation?.notes && (
                                <div className="bg-white border border-border rounded-lg p-4">
                                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                    <p className="text-sm font-medium text-foreground">{reservation.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="border-t border-border p-4">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
