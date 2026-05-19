import { Users2, Save, Loader, RefreshCw, Bot, Phone, Calendar } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { capacityService } from '../services/capacity';
import { reservationService } from '../services/reservations';
import { useAuthStore } from '../store/useAuthStore';

/**
 * CapacitySection
 * Matches platform settings UI — consistent with Address / Email / Deposit cards.
 */
export function CapacitySection() {
    const { restaurantId } = useAuthStore();

    const todayISO = new Date().toISOString().slice(0, 10);

    const [selectedDate, setSelectedDate] = useState(todayISO);

    const [totalCapacity, setTotalCapacity] = useState('');
    const [otherBookingsByDate, setOtherBookingsByDate] = useState({});
    const [otherBookingsInput, setOtherBookingsInput] = useState('');
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [otherBookingsSaving, setOtherBookingsSaving] = useState(false);

    const [aiBooked, setAiBooked] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // ── Loaders ────────────────────────────────────────────────────────────

    const loadSettings = useCallback(async () => {
        if (!restaurantId) return;
        setSettingsLoading(true);
        try {
            const data = await capacityService.getCapacitySettings(restaurantId);
            setTotalCapacity(data.totalCapacity);
            setOtherBookingsByDate(data.otherBookingsByDate);
        } catch (err) {
            console.error('[CapacitySection] Failed to load settings:', err);
        } finally {
            setSettingsLoading(false);
        }
    }, [restaurantId]);

    const loadStatsForDate = useCallback(async (dateStr) => {
        if (!restaurantId) return;
        setStatsLoading(true);
        try {
            const dateObj = new Date(dateStr + 'T00:00:00');
            const data = await reservationService.getReservations(dateObj, restaurantId);
            setAiBooked(data.totalGuests ?? 0);
        } catch (err) {
            console.error('[CapacitySection] Failed to load stats for date:', err);
            setAiBooked(null);
        } finally {
            setStatsLoading(false);
        }
    }, [restaurantId]);

    useEffect(() => { loadSettings(); }, [loadSettings]);
    useEffect(() => { loadStatsForDate(selectedDate); }, [loadStatsForDate, selectedDate]);
    useEffect(() => {
        setOtherBookingsInput(otherBookingsByDate[selectedDate] ?? '');
    }, [selectedDate, otherBookingsByDate]);

    // ── Derived values ─────────────────────────────────────────────────────

    const total   = Number(totalCapacity) || 0;
    const other   = Number(otherBookingsByDate[selectedDate]) || 0;
    const ai      = aiBooked ?? 0;
    const booked  = ai + other;
    const available = Math.max(0, total - booked);
    const percent   = total > 0 ? Math.min(100, Math.round((booked / total) * 100)) : 0;

    // ── Handlers ──────────────────────────────────────────────────────────

    const handleSaveOtherBookings = async () => {
        setOtherBookingsSaving(true);
        try {
            await capacityService.updateOtherBookingsForDate(restaurantId, selectedDate, otherBookingsInput);
            setOtherBookingsByDate(prev => ({ ...prev, [selectedDate]: Number(otherBookingsInput) }));
            alert(`Other bookings for ${selectedDate} updated!`);
        } catch (err) {
            console.error('[CapacitySection] Save other bookings failed:', err);
            alert('Failed to save. Please try again.');
        } finally {
            setOtherBookingsSaving(false);
        }
    };

    const isLoading = settingsLoading || statsLoading;

    // ── UI ────────────────────────────────────────────────────────────────

    return (
        <div className="bg-white border border-border rounded-lg overflow-hidden">

            {/* Section header — identical pattern to Address / Email / Deposit */}
            <div className="bg-muted/30 border-b border-border px-5 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users2 className="w-4 h-4 text-foreground" />
                        <h2 className="font-heading font-semibold text-foreground">
                            Capacity Management
                        </h2>
                    </div>
                    <button
                        onClick={() => { loadSettings(); loadStatsForDate(selectedDate); }}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Set your restaurant's seating capacity and log walk-in / phone bookings per date.
                </p>
            </div>

            <div className="p-5 space-y-5">

                {/* ── Date picker row ── */}
                <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-medium text-foreground whitespace-nowrap">
                            View date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-1.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                        />
                        {selectedDate === todayISO && (
                            <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                                Today
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Availability summary — plain grid, matches platform card style ── */}
                <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/20 border-b border-border px-4 py-2.5 flex items-center justify-between">
                        <p className="text-xs font-semibold text-foreground">
                            Availability for <span className="font-bold">{selectedDate}</span>
                        </p>
                        {!statsLoading && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                                available === 0
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : percent >= 75
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-green-50 text-green-700 border-green-200'
                            }`}>
                                {available === 0 ? 'Fully Booked' : `${available} seats available`}
                            </span>
                        )}
                    </div>

                    {statsLoading || settingsLoading ? (
                        <div className="flex items-center gap-2 px-4 py-5 text-muted-foreground">
                            <Loader className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Loading capacity data…</span>
                        </div>
                    ) : (
                        <>
                            {/* Stats row */}
                            <div className="grid grid-cols-3 divide-x divide-border">
                                <div className="px-4 py-4 text-center">
                                    <p className="text-xl font-bold text-foreground">{total}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Total seats</p>
                                </div>
                                <div className="px-4 py-4 text-center">
                                    <p className="text-xl font-bold text-foreground">{booked}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Booked</p>
                                </div>
                                <div className="px-4 py-4 text-center">
                                    <p className={`text-xl font-bold ${available === 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {available}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Available</p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="px-4 pb-4">
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all duration-500 ${
                                            percent >= 100 ? 'bg-red-500' : percent >= 75 ? 'bg-amber-400' : 'bg-green-500'
                                        }`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1.5">
                                    <p className="text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <Bot className="w-3 h-3 text-blue-500" />
                                            AI: <strong>{ai}</strong> guests
                                        </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <Phone className="w-3 h-3 text-amber-500" />
                                            Other: <strong>{other}</strong> guests
                                        </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {percent}% full
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── Two input cards — same layout as Settings.jsx patterns ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Total Seating Capacity */}
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                            Total Seating Capacity
                        </label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Max guests your restaurant can host (all dates)
                        </p>
                        {settingsLoading ? (
                            <div className="flex items-center gap-2 py-2 text-muted-foreground">
                                <Loader className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Loading…</span>
                            </div>
                        ) : (
                            <input
                                type="number"
                                id="capacity-total-input"
                                value={totalCapacity}
                                onChange={(e) => setTotalCapacity(e.target.value)}
                                min="0"
                                step="1"
                                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                placeholder="e.g. 20"
                            />
                        )}
                    </div>

                    {/* Other Source Bookings */}
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                            Other Source Bookings
                        </label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Walk-ins / phone bookings on <strong>{selectedDate}</strong>
                        </p>
                        {settingsLoading ? (
                            <div className="flex items-center gap-2 py-2 text-muted-foreground">
                                <Loader className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Loading…</span>
                            </div>
                        ) : (
                            <input
                                type="number"
                                id="capacity-other-input"
                                value={otherBookingsInput}
                                onChange={(e) => setOtherBookingsInput(e.target.value)}
                                min="0"
                                step="1"
                                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                                placeholder="e.g. 4"
                            />
                        )}
                    </div>

                </div>

                {/* ── Save buttons row ── */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button
                        id="save-other-bookings-btn"
                        onClick={handleSaveOtherBookings}
                        disabled={settingsLoading || otherBookingsSaving}
                        className="px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {otherBookingsSaving
                            ? <><Loader className="w-4 h-4 animate-spin" /> Saving…</>
                            : <><Save className="w-4 h-4" /> Update Bookings</>
                        }
                    </button>
                </div>

            </div>
        </div>
    );
}
