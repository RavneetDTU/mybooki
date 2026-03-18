import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, PhoneOff, Calendar, Clock, Phone, MessageSquare, AlertTriangle } from 'lucide-react';
import { failedBookingsService } from '../services/failedBookings';
import { useAuthStore } from '../store/useAuthStore';

// Compact inline badge for missing fields
const MissingBadge = () => (
    <span className="inline-flex px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-medium rounded border border-orange-200">
        Not Provided
    </span>
);

// Count missing fields
const countMissing = (booking) => {
    const fields = [booking.guest_name, booking.phone, booking.date, booking.time, booking.party_size, booking.allergies, booking.notes];
    return fields.filter(f => f === 'Not Provided' || f === null || f === undefined || f === 0).length;
};

// Modal for showing full details
const FailedBookingModal = ({ isOpen, onClose, booking }) => {
    if (!isOpen || !booking) return null;

    const display = (val) => {
        if (val === 'Not Provided' || val === null || val === undefined || val === 0) {
            return <MissingBadge />;
        }
        return val;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg border border-border max-w-3xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="border-b border-border px-5 py-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="font-heading font-semibold text-foreground text-lg flex items-center gap-2">
                                <PhoneOff className="w-5 h-5 text-orange-500" />
                                Failed Booking Details
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Call on {booking.call_date} at {booking.call_time}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-muted/20 rounded transition-colors cursor-pointer"
                        >
                            <span className="text-foreground text-xl leading-none">&times;</span>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Booking Fields Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 bg-gray-50 p-4 rounded-lg border border-border">
                         <div>
                            <p className="text-xs text-muted-foreground mb-1">Guest Name</p>
                            <p className="text-sm font-medium">{display(booking.guest_name)}</p>
                         </div>
                         <div>
                            <p className="text-xs text-muted-foreground mb-1">Phone</p>
                            <p className="text-sm font-medium">{display(booking.phone)}</p>
                         </div>
                         <div>
                            <p className="text-xs text-muted-foreground mb-1">Party Size</p>
                            <p className="text-sm font-medium">{display(booking.party_size)}</p>
                         </div>
                         <div>
                            <p className="text-xs text-muted-foreground mb-1">Requested Date</p>
                            <p className="text-sm font-medium">{display(booking.date)}</p>
                         </div>
                         <div>
                            <p className="text-xs text-muted-foreground mb-1">Requested Time</p>
                            <p className="text-sm font-medium">{display(booking.time)}</p>
                         </div>
                    </div>

                    {/* Allergies & Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white border border-border rounded-lg p-4">
                            <p className="text-xs text-muted-foreground mb-1">Allergies</p>
                            <p className="text-sm font-medium">{display(booking.allergies)}</p>
                        </div>
                        <div className="bg-white border border-border rounded-lg p-4">
                            <p className="text-xs text-muted-foreground mb-1">Notes</p>
                            <p className="text-sm font-medium">{display(booking.notes)}</p>
                        </div>
                    </div>

                    {/* Transcription */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="w-4 h-4 text-foreground" />
                            <h4 className="text-sm font-semibold text-foreground">Call Transcription</h4>
                        </div>
                        <div className="bg-gray-50 border border-border rounded-lg p-4">
                            {booking.transcription ? (
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                    {booking.transcription}
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground">N/A</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border p-4">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function FailedBookings() {
    const { restaurantId } = useAuthStore();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [bookings, setBookings] = useState([]);
    const [totalFailed, setTotalFailed] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const fetchBookings = useCallback(async (silent = false) => {
        if (!restaurantId) return;
        if (!silent) setIsLoading(true);
        try {
            const data = await failedBookingsService.getFailedBookings(selectedDate, restaurantId);
            setBookings(data.failed_bookings || []);
            setTotalFailed(data.total_failed_bookings || 0);
        } catch (error) {
            console.error('Failed to fetch failed bookings:', error);
            if (!silent) {
                setBookings([]);
                setTotalFailed(0);
            }
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [selectedDate, restaurantId]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const formatDateLong = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const dateToInputValue = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const inputValueToDate = (value) => new Date(value + 'T00:00:00');

    const goToPreviousDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        setSelectedDate(newDate);
    };

    const goToNextDay = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        setSelectedDate(newDate);
    };

    const isMissing = (val) => val === 'Not Provided' || val === null || val === undefined || val === 0;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-white">
                <div className="max-w-7xl mx-auto px-6 py-5">
                    <h1 className="font-heading font-semibold text-foreground">
                        Failed Bookings
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Track incomplete calls that need follow-up
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-5">
                {/* Top Section: Date Nav + Stats */}
                <div className="flex items-start justify-between gap-6 mt-[0px] mr-[0px] mb-[10px] ml-[0px]">
                    {/* Left: Date Navigation */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={goToPreviousDay}
                            className="px-3 py-2 border border-border rounded-md hover:bg-muted/20 cursor-pointer hover:border-foreground transition-all"
                            title="Previous Day"
                        >
                            <ChevronLeft className="w-5 h-5 text-foreground" />
                        </button>
                        <input
                            type="date"
                            value={dateToInputValue(selectedDate)}
                            onChange={(e) => setSelectedDate(inputValueToDate(e.target.value))}
                            className="px-4 py-2 bg-white border-2 border-foreground rounded-lg text-sm font-heading focus:outline-none focus:ring-2 focus:ring-foreground transition-all cursor-pointer"
                        />
                        <button
                            onClick={goToNextDay}
                            className="px-3 py-2 border border-border rounded-md hover:bg-muted/20 cursor-pointer hover:border-foreground transition-all"
                            title="Next Day"
                        >
                            <ChevronRight className="w-5 h-5 text-foreground" />
                        </button>
                    </div>

                    {/* Right: Stats Card */}
                    <div className="flex items-center gap-4">
                        <div className="bg-white border-2 border-foreground rounded-lg px-6 py-3 min-w-[140px]">
                            <p className="text-xs text-muted-foreground mb-1">
                                Failed Bookings
                            </p>
                            <p className="text-2xl font-heading text-foreground">
                                {totalFailed}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Date Info */}
                <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                        Showing incomplete calls for{' '}
                        <span className="font-medium text-foreground">
                            {formatDateLong(selectedDate)}
                        </span>
                    </p>
                </div>

                {/* Booking List */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-12">
                        <PhoneOff className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                        <p className="text-muted-foreground">
                            No failed bookings for this date
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {bookings.map((booking) => {
                            const name = isMissing(booking.guest_name) ? 'Unknown Caller' : booking.guest_name;
                            const missing = countMissing(booking);

                            return (
                                <div
                                    key={booking.id}
                                    onClick={() => setSelectedBooking(booking)}
                                    className="border border-border rounded-lg overflow-hidden bg-white hover:bg-muted/10 cursor-pointer transition-all"
                                >
                                    <div className="flex items-center gap-4 px-4 py-3">
                                        {/* Call Time */}
                                        <div className="flex items-center gap-2 min-w-[80px]">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-foreground">{booking.call_time}</span>
                                        </div>

                                        {/* Name */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground truncate">
                                                {name}
                                            </p>
                                        </div>

                                        {/* Missing fields count badge */}
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 rounded-md border border-orange-200">
                                            <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                                            <span className="text-orange-600 text-xs font-medium">
                                                {missing} missing
                                            </span>
                                        </div>

                                        {/* Phone badge */}
                                        {!isMissing(booking.phone) ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-md">
                                                <Phone className="w-3.5 h-3.5 text-foreground" />
                                                <span className="text-foreground text-xs">{booking.phone}</span>
                                            </div>
                                        ) : (
                                            <span className="px-3 py-1 border border-orange-200 bg-orange-50 text-orange-600 text-xs font-medium rounded-md">
                                                No Phone
                                            </span>
                                        )}

                                        {/* View Button */}
                                        <button
                                            className="px-4 py-1.5 border border-border text-foreground rounded-md hover:bg-foreground hover:text-white transition-colors text-xs font-medium cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedBooking(booking);
                                            }}
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <FailedBookingModal
                isOpen={!!selectedBooking}
                onClose={() => setSelectedBooking(null)}
                booking={selectedBooking}
            />
        </div>
    );
}
