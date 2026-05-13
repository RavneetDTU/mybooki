import { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeft, ChevronRight, PhoneOff, Clock, Phone,
    MessageSquare, AlertTriangle, User, MessageCircle
} from 'lucide-react';
import { failedBookingsService } from '../services/failedBookings';
import { otherMessagesService } from '../services/otherMessages';
import { useAuthStore } from '../store/useAuthStore';
import { formatTime12Hour } from '../utils/dateUtils';

// ─── helpers ────────────────────────────────────────────────────────────────

const MissingBadge = () => (
    <span className="inline-flex px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-medium rounded border border-orange-200">
        Not Provided
    </span>
);

const isMissing = (val) =>
    val === 'Not Provided' || val === null || val === undefined || val === 0;

const display = (val) => (isMissing(val) ? <MissingBadge /> : val);

const countMissing = (booking) => {
    const fields = [
        booking.guest_name, booking.phone, booking.date,
        booking.time, booking.party_size, booking.allergies, booking.notes,
    ];
    return fields.filter(isMissing).length;
};

// ─── Failed Booking Detail Modal ─────────────────────────────────────────────

const FailedBookingModal = ({ isOpen, onClose, booking }) => {
    if (!isOpen || !booking) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-border max-w-3xl w-full max-h-[90vh] flex flex-col shadow-xl">
                {/* Header */}
                <div className="border-b border-border px-5 py-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="font-heading font-semibold text-foreground text-lg flex items-center gap-2">
                                <PhoneOff className="w-5 h-5 text-red-400" />
                                Failed Booking Details
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Call on {booking.call_date} at {formatTime12Hour(booking.call_time)}
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
                            <p className="text-sm font-medium">{display(formatTime12Hour(booking.time))}</p>
                        </div>
                    </div>

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

// ─── Failed Booking Card (light red tint) ────────────────────────────────────

const FailedBookingCard = ({ booking, onView }) => {
    const name = isMissing(booking.guest_name) ? 'Unknown Caller' : booking.guest_name;
    const missing = countMissing(booking);

    return (
        <div
            onClick={() => onView(booking)}
            className="cursor-pointer rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-50 transition-all shadow-sm hover:shadow-md group"
        >
            {/* Top strip */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-red-100">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <PhoneOff className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <span className="text-sm font-semibold text-foreground font-heading">{name}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 rounded-full border border-red-200">
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                    <span className="text-xs font-medium text-red-500">{missing} missing</span>
                </div>
            </div>

            {/* Details row */}
            <div className="flex items-center gap-5 px-4 py-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs">{formatTime12Hour(booking.call_time)}</span>
                </div>

                {!isMissing(booking.phone) ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-xs">{booking.phone}</span>
                    </div>
                ) : (
                    <span className="text-xs text-red-400 font-medium">No Phone</span>
                )}

                <div className="ml-auto">
                    <button
                        onClick={(e) => { e.stopPropagation(); onView(booking); }}
                        className="px-3 py-1 text-xs font-medium border border-red-200 text-red-500 rounded-md hover:bg-red-100 transition-colors cursor-pointer"
                    >
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Manager Message Card (neutral / standard) ───────────────────────────────

const MessageCard = ({ message }) => {
    const isLong = message.message && message.message.length > 160;
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="rounded-xl border border-green-200 bg-green-50/60 hover:bg-green-50 transition-all shadow-sm hover:shadow-md">
            {/* Top strip */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-green-100">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-green-500" />
                    </div>
                    <span className="text-sm font-semibold text-foreground font-heading">
                        {message.name || 'Unknown'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 rounded-full border border-green-200">
                    <MessageCircle className="w-3 h-3 text-green-500" />
                    <span className="text-xs font-medium text-green-600">Manager Message</span>
                </div>
            </div>

            {/* Meta + Message */}
            <div className="px-4 py-3 space-y-2.5">
                <div className="flex items-center gap-5 flex-wrap">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">{formatTime12Hour(message.call_time)}</span>
                    </div>
                    {message.phonenumber && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                            <span className="text-xs">{message.phonenumber}</span>
                        </div>
                    )}
                </div>

                {/* Message body */}
                {message.message && (
                    <div className="bg-green-50 rounded-lg px-3 py-2.5 border border-green-100">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Message</p>
                        <p className="text-sm text-foreground leading-relaxed">
                            {isLong && !expanded
                                ? message.message.slice(0, 160) + '…'
                                : message.message}
                        </p>
                        {isLong && (
                            <button
                                onClick={() => setExpanded((v) => !v)}
                                className="mt-1.5 text-xs text-foreground font-medium hover:underline cursor-pointer"
                            >
                                {expanded ? 'Show less' : 'Read more'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title, count, color }) => (
    <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <h2 className="text-sm font-semibold text-foreground font-heading">{title}</h2>
        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
            color === 'text-red-400'
                ? 'bg-red-50 text-red-500 border-red-200'
                : color === 'text-green-500'
                    ? 'bg-green-50 text-green-600 border-green-200'
                    : 'bg-muted text-muted-foreground border-border'
        }`}>
            {count}
        </span>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FailedBookings() {
    const { restaurantId } = useAuthStore();
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [bookings, setBookings] = useState([]);
    const [totalFailed, setTotalFailed] = useState(0);
    const [messages, setMessages] = useState([]);
    const [totalMessages, setTotalMessages] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);

    // ── fetch both lists ──────────────────────────────────────────────────────
    const fetchAll = useCallback(async (silent = false) => {
        if (!restaurantId) return;
        if (!silent) setIsLoading(true);
        try {
            const [failedData, msgData] = await Promise.all([
                failedBookingsService.getFailedBookings(selectedDate, restaurantId),
                otherMessagesService.getOtherMessages(selectedDate, restaurantId),
            ]);
            setBookings(failedData.failed_bookings || []);
            setTotalFailed(failedData.total_failed_bookings || 0);
            setMessages(msgData.other_messages || []);
            setTotalMessages(msgData.total_other_messages || 0);
        } catch (error) {
            console.error('Failed to fetch other bookings data:', error);
            if (!silent) {
                setBookings([]);
                setTotalFailed(0);
                setMessages([]);
                setTotalMessages(0);
            }
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [selectedDate, restaurantId]);

    useEffect(() => { 
        fetchAll(); 
        
        // Polling every 30 seconds
        const intervalId = setInterval(() => {
            fetchAll(true); // silent fetch to prevent loading spinner flicker
        }, 30000);

        return () => clearInterval(intervalId);
    }, [fetchAll]);

    // ── date helpers ──────────────────────────────────────────────────────────
    const formatDateLong = (date) =>
        date.toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        });

    const dateToInputValue = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const inputValueToDate = (val) => new Date(val + 'T00:00:00');

    const goToPreviousDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        setSelectedDate(d);
    };

    const goToNextDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        setSelectedDate(d);
    };

    const isEmpty = bookings.length === 0 && messages.length === 0;

    return (
        <div className="min-h-screen bg-background">
            {/* Page Header */}
            <div className="border-b border-border bg-white">
                <div className="max-w-7xl mx-auto px-6 py-5">
                    <h1 className="font-heading font-semibold text-foreground">
                        Other Calls
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Review failed calls and manager messages for the selected date
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-5">
                {/* Top bar: date nav + stat pills */}
                <div className="flex items-start justify-between gap-6 mb-5">
                    {/* Date Navigation */}
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

                    {/* Stat pills */}
                    <div className="flex items-center gap-3">
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg px-5 py-2.5 min-w-[130px]">
                            <p className="text-xs text-red-400 mb-0.5">Failed Calls</p>
                            <p className="text-2xl font-heading text-red-500">{totalFailed}</p>
                        </div>
                        <div className="bg-white border-2 border-foreground rounded-lg px-5 py-2.5 min-w-[130px]">
                            <p className="text-xs text-muted-foreground mb-0.5">Manager Messages</p>
                            <p className="text-2xl font-heading text-foreground">{totalMessages}</p>
                        </div>
                    </div>
                </div>

                {/* Date label */}
                <p className="text-sm text-muted-foreground mb-5">
                    Showing results for{' '}
                    <span className="font-medium text-foreground">{formatDateLong(selectedDate)}</span>
                </p>

                {/* Loading */}
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
                    </div>
                ) : isEmpty ? (
                    <div className="text-center py-16">
                        <PhoneOff className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                        <p className="text-muted-foreground text-sm">No records found for this date</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* ── Failed Calls ── */}
                        {bookings.length > 0 && (
                            <section>
                                <SectionHeader
                                    icon={PhoneOff}
                                    title="Failed Calls"
                                    count={bookings.length}
                                    color="text-red-400"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {bookings.map((booking) => (
                                        <FailedBookingCard
                                            key={booking.id}
                                            booking={booking}
                                            onView={setSelectedBooking}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ── Manager Messages ── */}
                        {messages.length > 0 && (
                            <section>
                                <SectionHeader
                                    icon={MessageCircle}
                                    title="Manager Messages"
                                    count={messages.length}
                                    color="text-green-500"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {messages.map((msg) => (
                                        <MessageCard key={msg.id} message={msg} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>

            {/* Detail Modal – failed bookings only */}
            <FailedBookingModal
                isOpen={!!selectedBooking}
                onClose={() => setSelectedBooking(null)}
                booking={selectedBooking}
            />
        </div>
    );
}
