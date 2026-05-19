import { Users2, Save, Loader, RefreshCw, Bot, Phone, Calendar } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { capacityService } from '../services/capacity';
import { reservationService } from '../services/reservations';
import { useAuthStore } from '../store/useAuthStore';
import { formatDateForAPI } from '../utils/dateUtils';

/**
 * CapacitySection
 * Embeddable component — import this into any page.
 * Shows capacity stats for a selected date (default: today).
 * Owner can log other-source bookings (walk-ins, phone) per date.
 */
export function CapacitySection() {
    const { restaurantId } = useAuthStore();

    // Default selected date = today in YYYY-MM-DD format
    const todayISO = new Date().toISOString().slice(0, 10);

    // Selected date for capacity preview and other-bookings entry
    const [selectedDate, setSelectedDate] = useState(todayISO);

    // Settings state
    const [totalCapacity, setTotalCapacity] = useState('');
    const [otherBookingsByDate, setOtherBookingsByDate] = useState({});
    const [otherBookingsInput, setOtherBookingsInput] = useState('');
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [totalCapacitySaving, setTotalCapacitySaving] = useState(false);
    const [otherBookingsSaving, setOtherBookingsSaving] = useState(false);

    // Live stats for the selected date
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
            // Pass the selected date to the reservations API
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

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Reload AI stats whenever selected date changes
    useEffect(() => {
        loadStatsForDate(selectedDate);
    }, [loadStatsForDate, selectedDate]);

    // When selected date changes, prefill the other-bookings input from the map
    useEffect(() => {
        setOtherBookingsInput(otherBookingsByDate[selectedDate] ?? '');
    }, [selectedDate, otherBookingsByDate]);

    // ── Derived values ─────────────────────────────────────────────────────

    const total = Number(totalCapacity) || 0;
    const other = Number(otherBookingsByDate[selectedDate]) || 0;
    const ai = aiBooked ?? 0;
    const booked = ai + other;
    const available = Math.max(0, total - booked);
    const percent = total > 0 ? Math.min(100, Math.round((booked / total) * 100)) : 0;

    // ── Handlers ──────────────────────────────────────────────────────────

    const handleSaveCapacity = async () => {
        setTotalCapacitySaving(true);
        try {
            await capacityService.updateTotalCapacity(restaurantId, totalCapacity);
            alert('Total seating capacity saved!');
        } catch (err) {
            console.error('[CapacitySection] Save capacity failed:', err);
            alert('Failed to save. Please try again.');
        } finally {
            setTotalCapacitySaving(false);
        }
    };

    const handleSaveOtherBookings = async () => {
        setOtherBookingsSaving(true);
        try {
            await capacityService.updateOtherBookingsForDate(restaurantId, selectedDate, otherBookingsInput);
            // Update local map so UI preview refreshes immediately
            setOtherBookingsByDate(prev => ({ ...prev, [selectedDate]: Number(otherBookingsInput) }));
            alert(`Other bookings for ${selectedDate} updated! The AI will use this on calls for that date.`);
        } catch (err) {
            console.error('[CapacitySection] Save other bookings failed:', err);
            alert('Failed to save. Please try again.');
        } finally {
            setOtherBookingsSaving(false);
        }
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    // ── UI ────────────────────────────────────────────────────────────────

    return (
        <div className="bg-white border border-border rounded-lg overflow-hidden">

            {/* Section header */}
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
                        disabled={statsLoading || settingsLoading}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${(statsLoading || settingsLoading) ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Select any date to see its live capacity and log other-source bookings for that date.
                </p>
            </div>

            <div className="p-5 space-y-5">

                {/* ── Date Picker ── */}
                <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-foreground mb-1">

                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={handleDateChange}
                            className="px-3 py-1.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
                        />
                    </div>
                    {selectedDate === todayISO && (
                        <span className="text-xs font-medium px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full mt-4">
                            Today
                        </span>
                    )}
                </div>

                {/* ── Live availability bar ── */}
                <div className="bg-foreground rounded-lg px-5 py-4 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium uppercase tracking-wider opacity-60">
                            Availability — {selectedDate}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${available === 0
                            ? 'bg-red-500/30 text-red-300'
                            : percent >= 75
                                ? 'bg-amber-400/20 text-amber-300'
                                : 'bg-green-400/20 text-green-300'
                            }`}>
                            {available === 0 ? 'Fully Booked' : `${available} seats left`}
                        </span>
                    </div>

                    {/* Numbers row */}
                    <div className="grid grid-cols-3 text-center divide-x divide-white/15 mb-4">
                        <div className="pr-4">
                            <p className="text-2xl font-bold">{total}</p>
                            <p className="text-[11px] opacity-50 mt-0.5">Total</p>
                        </div>
                        <div className="px-4">
                            <p className="text-2xl font-bold">{booked}</p>
                            <p className="text-[11px] opacity-50 mt-0.5">Booked</p>
                        </div>
                        <div className="pl-4">
                            <p className={`text-2xl font-bold ${available === 0 ? 'text-red-400' : 'text-green-300'}`}>
                                {available}
                            </p>
                            <p className="text-[11px] opacity-50 mt-0.5">Available</p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-white/15 rounded-full h-1.5 mb-4">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${percent >= 100 ? 'bg-red-400' : percent >= 75 ? 'bg-amber-400' : 'bg-green-400'
                                }`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>

                    {/* Stat badges */}
                    {statsLoading ? (
                        <div className="flex items-center gap-2 opacity-50">
                            <Loader className="w-3.5 h-3.5 animate-spin" />
                            <span className="text-xs">Loading stats…</span>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <div className="flex items-center gap-2.5 flex-1 bg-white/10 border border-white/15 rounded-lg px-3.5 py-2.5">
                                <div className="w-7 h-7 rounded-md bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4 text-blue-300" />
                                </div>
                                <div>
                                    <p className="text-[11px] opacity-50 leading-none mb-0.5">AI Booked</p>
                                    <p className="text-sm font-bold leading-none">{ai} guests</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 flex-1 bg-white/10 border border-white/15 rounded-lg px-3.5 py-2.5">
                                <div className="w-7 h-7 rounded-md bg-amber-500/30 flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-4 h-4 text-amber-300" />
                                </div>
                                <div>
                                    <p className="text-[11px] opacity-50 leading-none mb-0.5">Other Sources</p>
                                    <p className="text-sm font-bold leading-none">{other} guests</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Two input cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Total Seating Capacity (date-independent) */}
                    <div className="flex flex-col border border-border rounded-lg overflow-hidden">
                        <div className="p-4 flex-1">
                            <label className="block text-xs font-semibold text-foreground mb-0.5">
                                Total Seating Capacity
                            </label>
                            <p className="text-xs text-muted-foreground mb-3">
                                Max guests your restaurant can host (all dates)
                            </p>
                            {settingsLoading ? (
                                <div className="flex items-center gap-2 py-4">
                                    <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Loading…</span>
                                </div>
                            ) : (
                                <input
                                    type="number"
                                    id="capacity-total-input"
                                    value={totalCapacity}
                                    onChange={(e) => setTotalCapacity(e.target.value)}
                                    min="0"
                                    step="1"
                                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
                                    placeholder="e.g. 20"
                                />
                            )}
                        </div>
                        <div className="px-4 pb-4 pt-0 flex justify-end">
                            <button
                                id="save-capacity-btn"
                                onClick={handleSaveCapacity}
                                disabled={settingsLoading || totalCapacitySaving}
                                className="px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {totalCapacitySaving
                                    ? <><Loader className="w-4 h-4 animate-spin" /> Saving…</>
                                    : <><Save className="w-4 h-4" /> Save Capacity</>
                                }
                            </button>
                        </div>
                    </div>

                    {/* Other Source Bookings — per selected date */}
                    <div className="flex flex-col border border-border rounded-lg overflow-hidden">
                        <div className="p-4 flex-1">
                            <label className="block text-xs font-semibold text-foreground mb-0.5">
                                Other Source Bookings
                            </label>
                            <p className="text-xs text-muted-foreground mb-3">
                                Walk-ins / phone bookings on <strong>{selectedDate}</strong>
                            </p>
                            {settingsLoading ? (
                                <div className="flex items-center gap-2 py-4">
                                    <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Loading…</span>
                                </div>
                            ) : (
                                <input
                                    type="number"
                                    id="capacity-other-input"
                                    value={otherBookingsInput}
                                    onChange={(e) => setOtherBookingsInput(e.target.value)}
                                    min="0"
                                    step="1"
                                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
                                    placeholder="e.g. 4"
                                />
                            )}
                        </div>
                        <div className="px-4 pb-4 pt-0 flex justify-end">
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
            </div>
        </div>
    );
}
