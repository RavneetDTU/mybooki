import { ChevronLeft, ChevronRight, Users, User, Plus } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { reservationService } from '../services/reservations';
import { formatTime12Hour, getNextNDaysRange, formatDateRangeLabel, parseAPIDate, formatDateLong as formatDateLongUtil } from '../utils/dateUtils';
import { DATE_PERIODS } from '../config/constants';
import { useAuthStore } from '../store/useAuthStore';
import ConversationModal from '../components/ConversationModal';
import CreateReservationModal from '../components/CreateReservationModal';
import DatePeriodFilter from '../components/DatePeriodFilter';

function ReservationTimeSlots({ reservations, onView }) {
    const groupedReservations = reservations.reduce((acc, reservation) => {
        if (!acc[reservation.time]) {
            acc[reservation.time] = [];
        }
        acc[reservation.time].push(reservation);
        return acc;
    }, {});

    const timeSlots = Array.from(new Set(reservations.map((r) => r.time))).sort();

    return (
        <div className="space-y-2">
            {timeSlots.map((time, index) => {
                const bookingsAtThisTime = groupedReservations[time];
                const hasBookings = bookingsAtThisTime.some((r) => r.bookerName);
                const bookingsWithNames = bookingsAtThisTime.filter((r) => r.bookerName);
                const hasSingleBooking = bookingsWithNames.length === 1;
                const hasMultipleBookings = bookingsWithNames.length > 1;

                return (
                    <div
                        key={time}
                        className={`border border-border rounded-lg overflow-hidden transition-all ${!hasBookings
                            ? index % 2 === 0
                                ? 'bg-gray-50/50 opacity-40'
                                : 'bg-white opacity-40'
                            : 'bg-white'
                            }`}
                    >
                        {hasSingleBooking && (
                            <div
                                onClick={() => onView(bookingsWithNames[0])}
                                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/10 cursor-pointer transition-all"
                            >
                                <div className="flex items-center gap-2 min-w-[80px]">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span className=" text-foreground">{formatTime12Hour(time)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground">
                                        {bookingsWithNames[0].bookerName}
                                    </p>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-md border ${
                                    bookingsWithNames[0].paymentStatus === 'Refund Completed'
                                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                                        : bookingsWithNames[0].paymentStatus === 'Payment Success'
                                            ? 'bg-blue-50 text-blue-700 border-blue-200/50'
                                            : 'bg-orange-50 text-orange-700 border-orange-200/50'
                                }`}>
                                    {bookingsWithNames[0].paymentStatus === 'Refund Completed' && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                    )}
                                    {bookingsWithNames[0].paymentStatus === 'Refund Completed'
                                        ? 'Refunded'
                                        : bookingsWithNames[0].paymentStatus === 'Payment Success'
                                            ? 'Payment Success'
                                            : 'Payment Pending'}
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-md">
                                    <User className="w-3.5 h-3.5 text-foreground" />
                                    <span className="text-foreground">
                                        {bookingsWithNames[0].guests}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {bookingsWithNames[0].tableNumber && (
                                        <span className="px-3 py-1 bg-foreground text-white text-xs font-medium rounded-md">
                                            Table {bookingsWithNames[0].tableNumber}
                                        </span>
                                    )}
                                    {!bookingsWithNames[0].tableNumber && bookingsWithNames[0].bookerName && (
                                        <span className="px-3 py-1 border border-border text-muted-foreground text-xs font-medium rounded-md">
                                            NO TABLE
                                        </span>
                                    )}
                                </div>
                                <button
                                    className="px-4 py-1.5 border border-border text-foreground rounded-md hover:bg-foreground hover:text-white transition-colors text-xs font-medium cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onView(bookingsWithNames[0]);
                                    }}
                                >
                                    View
                                </button>
                            </div>
                        )}

                        {hasMultipleBookings && (
                            <div className="divide-y divide-border bg-muted/10">
                                {bookingsWithNames.map((reservation) => (
                                    <div
                                        key={reservation.id}
                                        onClick={() => onView(reservation)}
                                        className="px-4 py-3 flex items-center bg-sidebar gap-4 hover:bg-muted/20 cursor-pointer transition-all"
                                    >
                                        <div className="flex items-center gap-2 min-w-[80px]">
                                            <Users className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-foreground">{formatTime12Hour(time)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground">
                                                {reservation.bookerName}
                                            </p>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-md border ${
                                            reservation.paymentStatus === 'Refund Completed'
                                                ? 'bg-teal-50 text-teal-700 border-teal-200'
                                                : reservation.paymentStatus === 'Payment Success'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200/50'
                                                    : 'bg-orange-50 text-orange-700 border-orange-200/50'
                                        }`}>
                                            {reservation.paymentStatus === 'Refund Completed' && (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                                            )}
                                            {reservation.paymentStatus === 'Refund Completed'
                                                ? 'Refunded'
                                                : reservation.paymentStatus === 'Payment Success'
                                                    ? 'Payment Success'
                                                    : 'Payment Pending'}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-md">
                                            <User className="w-3.5 h-3.5 text-foreground" />
                                            <span className="text-foreground">
                                                {reservation.guests}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {reservation.tableNumber && (
                                                <span className="px-3 py-1 bg-foreground text-white text-xs font-medium rounded-md">
                                                    Table {reservation.tableNumber}
                                                </span>
                                            )}
                                            {!reservation.tableNumber && reservation.bookerName && (
                                                <span className="px-3 py-1 border border-border text-muted-foreground text-xs font-medium rounded-md">
                                                    NO TABLE
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            className="px-4 py-1.5 border border-border text-foreground rounded-md hover:bg-foreground hover:text-white transition-colors text-xs font-medium cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onView(reservation);
                                            }}
                                        >
                                            View
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!hasBookings && (
                            <div className="flex items-center gap-2 px-4 py-3">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className=" text-foreground">{formatTime12Hour(time)}</span>
                                <span className="text-sm text-muted-foreground ml-auto">Available</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export function Reservations() {
    const { restaurantId } = useAuthStore();
    const [period, setPeriod] = useState(DATE_PERIODS.TODAY);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [showConversationModal, setShowConversationModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [reservations, setReservations] = useState([]);
    const [reservationData, setReservationData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const isTodayPeriod = period === DATE_PERIODS.TODAY;

    // Fetch reservations — silent=true skips the full loading spinner (used for background polls)
    const fetchReservations = useCallback(async (silent = false) => {
        if (!restaurantId) return;
        if (!silent) setIsLoading(true);
        try {
            let data;
            if (isTodayPeriod) {
                data = await reservationService.getReservations(selectedDate, restaurantId);
            } else {
                const range = getNextNDaysRange(period === DATE_PERIODS.NEXT_7 ? 7 : 30);
                data = await reservationService.getReservationsRange(range.from, range.to, restaurantId);
            }
            console.log('[Reservations] Response:', data);
            setReservationData(data);
            setReservations(data.reservations || []);
        } catch (error) {
            console.error('[Reservations] Fetch failed:', error);
            if (!silent) {
                setReservations([]);
                setReservationData(null);
            }
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [selectedDate, restaurantId, period, isTodayPeriod]);

    // Initial fetch + re-fetch when date or restaurantId changes
    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    // Poll every 30 seconds (silent background refresh)
    useEffect(() => {
        const POLL_INTERVAL_MS = 30_000;
        const timer = setInterval(() => {
            console.log('[Reservations] 30s poll — refreshing...');
            fetchReservations(true);
        }, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [fetchReservations]);


    // Use API-provided counts if available, otherwise calculate
    const bookingsCount = reservationData?.totalBookings ?? reservations.filter((r) => r.bookerName !== '').length;
    const totalGuests = reservationData?.totalGuests ?? reservations
        .filter((r) => r.bookerName !== '')
        .reduce((sum, r) => sum + r.guests, 0);


    const handlePeriodChange = (nextPeriod) => {
        setPeriod(nextPeriod);
        if (nextPeriod === DATE_PERIODS.TODAY) {
            setSelectedDate(new Date());
        }
    };

    const formatDateLong = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

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

    const handleViewConversation = (reservation) => {
        setSelectedReservation(reservation);
        setShowConversationModal(true);
    };

    const handleCloseModal = () => {
        setShowConversationModal(false);
        setSelectedReservation(null);
    };

    // Convert Date to yyyy-mm-dd format for input
    const dateToInputValue = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Convert input value to Date
    const inputValueToDate = (value) => {
        return new Date(value + 'T00:00:00');
    };

    // Handle manual reservation creation
    const handleCreateReservation = async (reservationData) => {
        try {
            await reservationService.createManualReservation(reservationData, restaurantId);
            alert('Reservation created successfully!');
            fetchReservations();
        } catch (error) {
            alert(error.message || 'Failed to create reservation');
            throw error;
        }
    };

    const rangeLabel = !isTodayPeriod && reservationData?.from && reservationData?.to
        ? formatDateRangeLabel(reservationData.from, reservationData.to)
        : !isTodayPeriod
            ? formatDateRangeLabel(
                getNextNDaysRange(period === DATE_PERIODS.NEXT_7 ? 7 : 30).from,
                getNextNDaysRange(period === DATE_PERIODS.NEXT_7 ? 7 : 30).to
            )
            : null;

    const reservationsByDate = reservations.reduce((acc, reservation) => {
        const key = reservation.date || 'unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(reservation);
        return acc;
    }, {});
    const reservationDates = Object.keys(reservationsByDate).sort();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-white">
                <div className="max-w-7xl mx-auto px-6 py-5">
                    <h1 className="font-heading font-semibold text-foreground">
                        Reservations
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage your restaurant bookings
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-5">
                {/* Top Section: Period + Date Navigation + Booking Stats */}
                <div className="flex items-start justify-between gap-6 mt-[0px] mr-[0px] mb-[10px] ml-[0px] flex-wrap">
                    <div className="flex flex-col gap-3">
                        <DatePeriodFilter value={period} onChange={handlePeriodChange} />

                        {isTodayPeriod ? (
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
                                    className="px-4 py-2 bg-white border-2 border-foreground rounded-lg text-sm font-heading  focus:outline-none focus:ring-2 focus:ring-foreground transition-all cursor-pointer"
                                />
                                <button
                                    onClick={goToNextDay}
                                    className="px-3 py-2 border border-border rounded-md hover:bg-muted/20 cursor-pointer hover:border-foreground transition-all"
                                    title="Next Day"
                                >
                                    <ChevronRight className=" w-5 h-5 text-foreground" />
                                </button>
                            </div>
                        ) : (
                            <div className="px-4 py-2 bg-white border-2 border-foreground rounded-lg text-sm font-heading w-fit">
                                {rangeLabel}
                            </div>
                        )}
                    </div>

                    {/* Right: Booking Stats Cards + Create Button */}
                    <div className="flex items-center gap-4">
                        {/* Total Bookings Card */}
                        <div className="bg-white border-2 border-foreground rounded-lg px-6 py-3 min-w-[140px]">
                            <p className="text-xs text-muted-foreground mb-1">
                                Total Bookings
                            </p>
                            <p className="text-2xl font-heading  text-foreground">
                                {bookingsCount}
                            </p>
                        </div>

                        {/* Total Guests Card */}
                        <div className="bg-white border border-border rounded-lg px-6 py-3 min-w-[140px]">
                            <p className="text-xs text-muted-foreground mb-1">
                                Total Guests
                            </p>
                            <p className="text-2xl font-heading text-foreground">
                                {totalGuests}
                            </p>
                        </div>

                        {/* Create Reservation Button */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-5 py-3 bg-foreground from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium text-sm flex items-center gap-2 cursor-pointer whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5" />
                            Add Booking
                        </button>
                    </div>
                </div>

                {/* Date Info Line */}
                <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                        Showing reservations for{' '}
                        <span className="font-medium text-foreground">
                            {isTodayPeriod ? formatDateLong(selectedDate) : rangeLabel}
                        </span>
                    </p>
                </div>

                {/* Reservations List */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                    </div>
                ) : isTodayPeriod ? (
                    <ReservationTimeSlots
                        reservations={reservations}
                        onView={handleViewConversation}
                    />
                ) : (
                    <div className="space-y-8">
                        {reservationDates.map((dateKey) => (
                            <section key={dateKey}>
                                <h2 className="text-sm font-heading font-semibold text-foreground mb-3 pb-2 border-b border-border">
                                    {dateKey === 'unknown'
                                        ? 'Unknown date'
                                        : formatDateLongUtil(parseAPIDate(dateKey))}
                                </h2>
                                <ReservationTimeSlots
                                    reservations={reservationsByDate[dateKey]}
                                    onView={handleViewConversation}
                                />
                            </section>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && bookingsCount === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                        <p className="text-muted-foreground">
                            {isTodayPeriod
                                ? 'No reservations for this date'
                                : 'No reservations in this period'}
                        </p>
                    </div>
                )}
            </div>

            {/* Conversation Modal */}
            <ConversationModal
                isOpen={showConversationModal}
                onClose={handleCloseModal}
                reservation={selectedReservation}
            />

            {/* Create Reservation Modal */}
            <CreateReservationModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleCreateReservation}
            />
        </div>
    );
}