import { ChevronLeft, ChevronRight, Phone, Users, Calendar, X, Clock, Plus } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { reservationService } from '../services/reservations';
import { useAuthStore } from '../store/useAuthStore';
import ConversationModal from '../components/ConversationModal';
import CreateReservationModal from '../components/CreateReservationModal';

export function Reservations() {
    const { restaurantId } = useAuthStore();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [showConversationModal, setShowConversationModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [reservations, setReservations] = useState([]);
    const [reservationData, setReservationData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);


    // Fetch reservations — silent=true skips the full loading spinner (used for background polls)
    const fetchReservations = useCallback(async (silent = false) => {
        if (!restaurantId) return;
        if (!silent) setIsLoading(true);
        try {
            console.log('[Reservations] Fetching for restaurantId:', restaurantId, '| date:', selectedDate);
            const data = await reservationService.getReservations(selectedDate, restaurantId);
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
    }, [selectedDate, restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const bookingsCount = reservationData?.total_bookings || reservations.filter((r) => r.bookerName !== '').length;
    const totalGuests = reservationData?.total_guests || reservations
        .filter((r) => r.bookerName !== '')
        .reduce((sum, r) => sum + r.guests, 0);


    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
        });
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

    // Group reservations by time slot
    const groupedReservations = reservations.reduce((acc, reservation) => {
        if (!acc[reservation.time]) {
            acc[reservation.time] = [];
        }
        acc[reservation.time].push(reservation);
        return acc;
    }, {});

    // Get all unique time slots in order
    const timeSlots = Array.from(new Set(reservations.map((r) => r.time))).sort();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-white">
                <div className="max-w-7xl mx-auto px-6 py-5">
                    <h1 className="font-heading font-semibold text-foreground">
                        Reservations
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage your daily restaurant bookings
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-5">
                {/* Top Section: Date Navigation + Booking Stats */}
                <div className="flex items-start justify-between gap-6 mt-[0px] mr-[0px] mb-[10px] ml-[0px]">
                    {/* Left: Date Navigation */}
                    <div className="flex items-center gap-3">
                        {/* Previous Day Button */}
                        <button
                            onClick={goToPreviousDay}
                            className="px-3 py-2 border border-border rounded-md hover:bg-muted/20 cursor-pointer hover:border-foreground transition-all"
                            title="Previous Day"
                        >
                            <ChevronLeft className="w-5 h-5 text-foreground" />
                        </button>

                        {/* Date Display with Native Date Picker */}
                        <input
                            type="date"
                            value={dateToInputValue(selectedDate)}
                            onChange={(e) => setSelectedDate(inputValueToDate(e.target.value))}
                            className="px-4 py-2 bg-white border-2 border-foreground rounded-lg text-sm font-heading  focus:outline-none focus:ring-2 focus:ring-foreground transition-all cursor-pointer"
                        />

                        {/* Next Day Button */}
                        <button
                            onClick={goToNextDay}
                            className="px-3 py-2 border border-border rounded-md hover:bg-muted/20 cursor-pointer hover:border-foreground transition-all"
                            title="Next Day"
                        >
                            <ChevronRight className=" w-5 h-5 text-foreground" />
                        </button>
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
                            {formatDateLong(selectedDate)}
                        </span>
                    </p>
                </div>

                {/* Reservations List */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
                    </div>
                ) : (
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
                                    {/* For single booking - show inline */}
                                    {hasSingleBooking && (
                                        <div
                                            onClick={() => handleViewConversation(bookingsWithNames[0])}
                                            className="flex items-center gap-4 px-4 py-3 hover:bg-muted/10 cursor-pointer transition-all"
                                        >
                                            {/* Time with icon */}
                                            <div className="flex items-center gap-2 min-w-[80px]">
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                <span className=" text-foreground">{time}</span>
                                            </div>

                                            {/* Name */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground">
                                                    {bookingsWithNames[0].bookerName}
                                                </p>
                                            </div>

                                            {/* Guest Count */}
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-md">
                                                <Phone className="w-3.5 h-3.5 text-foreground" />
                                                <span className="text-foreground">
                                                    {bookingsWithNames[0].guests}
                                                </span>
                                            </div>

                                            {/* Status Badges */}
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

                                            {/* Action Button */}
                                            <button
                                                className="px-4 py-1.5 border border-border text-foreground rounded-md hover:bg-foreground hover:text-white transition-colors text-xs font-medium cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewConversation(bookingsWithNames[0]);
                                                }}
                                            >
                                                View
                                            </button>
                                        </div>
                                    )}

                                    {/* For multiple bookings - show stacked vertically */}
                                    {hasMultipleBookings && (
                                        <div className="divide-y divide-border bg-muted/10">
                                            {bookingsWithNames.map((reservation, idx) => (
                                                <div
                                                    key={reservation.id}
                                                    onClick={() => handleViewConversation(reservation)}
                                                    className="px-4 py-3 flex items-center bg-sidebar gap-4 hover:bg-muted/20 cursor-pointer transition-all"
                                                >
                                                    {/* Time with icon (shown on each row) */}
                                                    <div className="flex items-center gap-2 min-w-[80px]">
                                                        <Users className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-foreground">{time}</span>
                                                    </div>

                                                    {/* Name */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-foreground">
                                                            {reservation.bookerName}
                                                        </p>
                                                    </div>

                                                    {/* Guest Count */}
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-md">
                                                        <Phone className="w-3.5 h-3.5 text-foreground" />
                                                        <span className="text-foreground">
                                                            {reservation.guests}
                                                        </span>
                                                    </div>

                                                    {/* Status Badges */}
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

                                                    {/* Action Button */}
                                                    <button
                                                        className="px-4 py-1.5 border border-border text-foreground rounded-md hover:bg-foreground hover:text-white transition-colors text-xs font-medium cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewConversation(reservation);
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* For empty slots */}
                                    {!hasBookings && (
                                        <div className="flex items-center gap-2 px-4 py-3">
                                            <Users className="w-4 h-4 text-muted-foreground" />
                                            <span className=" text-foreground">{time}</span>
                                            <span className="text-sm text-muted-foreground ml-auto">Available</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && bookingsCount === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                        <p className="text-muted-foreground">
                            No reservations for this date
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