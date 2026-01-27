import { useEffect, useState } from 'react';
import { X, Clock } from 'lucide-react';
import { reservationService } from '../services/reservations';

export default function ConversationModal({ isOpen, onClose, reservationId }) {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && reservationId) {
            loadDetails(reservationId);
        } else {
            setDetails(null);
        }
    }, [isOpen, reservationId]);

    const loadDetails = async (id) => {
        setLoading(true);
        setError(null);
        try {
            const data = await reservationService.getReservationDetails(id);
            setDetails(data);
        } catch (err) {
            console.error("Failed to load details", err);
            setError("Failed to load conversation details.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg border border-border max-w-3xl w-full max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="border-b border-border p-[20px] px-[20px] py-[10px]">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h3 className="font-heading font-semibold text-foreground text-lg">
                                Restaurant table booking
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                ID: {details?.conversationId || 'Loading...'} | Payment ID: {details?.paymentId || 'N/A'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-muted/20 rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-foreground" />
                        </button>
                    </div>

                    {/* Badges and Date/Duration */}
                    {details && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                    done
                                </span>
                                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                    SMS Sent
                                </span>
                                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                    success
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-foreground font-medium">
                                    {details.callDate || 'N/A'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Duration: {details.callDuration || 'N/A'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-500">
                            {error}
                        </div>
                    ) : details ? (
                        <>
                            {/* Summary Section */}
                            {details.summary && (
                                <div className="border-b border-border p-5 px-[20px] py-[10px]">
                                    <h4 className="text-sm font-semibold text-blue-600 mb-2">Summary</h4>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-900 leading-relaxed">
                                            {details.summary}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Transcript Section */}
                            <div className="p-5">
                                {details.transcript && details.transcript.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground mb-3">Transcript</h4>
                                        <div className="space-y-4">
                                            {details.transcript.map((message, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex ${message.speaker === 'customer' ? 'justify-end' : 'justify-start'
                                                        }`}
                                                >
                                                    <div
                                                        className={`max-w-[75%] ${message.speaker === 'customer'
                                                                ? 'bg-[#2B7FFF] text-white'
                                                                : 'bg-gray-100 text-gray-900'
                                                            } rounded-lg p-3`}
                                                    >
                                                        <div className="flex items-center justify-between gap-3 mb-1">
                                                            <span className="text-xs font-semibold opacity-70">
                                                                {message.speaker === 'customer' ? 'Customer' : 'Agent'}
                                                            </span>
                                                            <span className="text-xs opacity-60">
                                                                {message.timestamp}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm leading-relaxed">
                                                            {message.text}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {(!details.summary && (!details.transcript || details.transcript.length === 0)) && (
                                    <div className="text-center py-12">
                                        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                                        <p className="text-muted-foreground">
                                            No conversation data available for this reservation
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Modal Footer */}
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
