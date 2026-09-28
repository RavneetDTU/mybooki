import { CalendarOff, Loader, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { operatingHoursService } from '../services/operatingHours';
import { useAuthStore } from '../store/useAuthStore';
import { formatDateForAPI, formatDateLong, parseAPIDate } from '../utils/dateUtils';

/**
 * HolidaysSection
 * Restaurant-specific closed dates. The AI bot will not accept bookings on these dates.
 */
export function HolidaysSection() {
    const { restaurantId } = useAuthStore();

    const todayISO = formatDateForAPI(new Date());

    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [adding, setAdding] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [newHoliday, setNewHoliday] = useState({ name: '', date: '' });

    const loadHolidays = useCallback(async () => {
        if (!restaurantId) return;
        setLoading(true);
        setLoadError('');
        try {
            const list = await operatingHoursService.getHolidays(restaurantId);
            setHolidays(list);
        } catch (err) {
            console.error('[HolidaysSection] Failed to load holidays:', err);
            setLoadError(err.message || 'Failed to load holidays');
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    useEffect(() => { loadHolidays(); }, [loadHolidays]);

    const handleAdd = async () => {
        if (!newHoliday.name.trim()) {
            alert('Please enter a holiday name.');
            return;
        }
        if (!newHoliday.date) {
            alert('Please select a date.');
            return;
        }
        if (newHoliday.date < todayISO) {
            alert('Holiday date cannot be in the past.');
            return;
        }
        if (holidays.some((h) => h.date === newHoliday.date)) {
            alert('A holiday already exists for this date.');
            return;
        }

        setAdding(true);
        try {
            await operatingHoursService.addHoliday(restaurantId, newHoliday);
            setNewHoliday({ name: '', date: '' });
            await loadHolidays();
        } catch (err) {
            console.error('[HolidaysSection] Add failed:', err);
            alert(err.message || 'Failed to add holiday. Please try again.');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (holiday) => {
        if (!window.confirm(`Remove "${holiday.name}" on ${holiday.date}? The restaurant will follow its regular hours on this date.`)) return;
        setDeletingId(holiday.id);
        try {
            await operatingHoursService.deleteHoliday(restaurantId, holiday.id);
            setHolidays((prev) => prev.filter((h) => h.id !== holiday.id));
        } catch (err) {
            console.error('[HolidaysSection] Delete failed:', err);
            alert('Failed to remove holiday. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const upcoming = holidays.filter((h) => h.date >= todayISO);
    const past = holidays.filter((h) => h.date < todayISO);

    const renderRow = (h, isPast) => (
        <div
            key={h.id ?? h.date}
            className={`flex items-center justify-between px-4 py-3 ${isPast ? 'opacity-60' : ''}`}
        >
            <div>
                <p className="text-sm font-medium text-foreground">{h.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {h.date ? formatDateLong(parseAPIDate(h.date)) : '—'}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded px-2 py-0.5">
                    CLOSED
                </span>
                <button
                    onClick={() => handleDelete(h)}
                    disabled={deletingId === h.id}
                    className="p-1 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer disabled:opacity-40"
                    title="Remove holiday"
                >
                    {deletingId === h.id
                        ? <Loader className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );

    return (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/30 border-b border-border px-5 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarOff className="w-4 h-4 text-foreground" />
                        <h2 className="font-heading font-semibold text-foreground">
                            Holidays
                        </h2>
                    </div>
                    <button
                        onClick={loadHolidays}
                        disabled={loading}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Mark dates when your restaurant is closed. The AI bot will not accept any bookings on these dates.
                </p>
            </div>

            <div className="p-5 space-y-5">
                {/* Add holiday */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-3 items-end">
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                            Holiday Name
                        </label>
                        <input
                            type="text"
                            value={newHoliday.name}
                            onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                            disabled={adding}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                            placeholder="e.g. Christmas Day"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                            Date
                        </label>
                        <input
                            type="date"
                            value={newHoliday.date}
                            min={todayISO}
                            onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                            disabled={adding}
                            className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-foreground focus:border-foreground transition-all"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={adding || loading}
                        className="px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {adding
                            ? <><Loader className="w-4 h-4 animate-spin" /> Adding…</>
                            : <><Plus className="w-4 h-4" /> Add Holiday</>
                        }
                    </button>
                </div>

                {/* Holiday list */}
                <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted/20 border-b border-border px-4 py-2.5">
                        <p className="text-xs font-semibold text-foreground">
                            Upcoming holidays ({upcoming.length})
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex items-center gap-2 px-4 py-5 text-muted-foreground">
                            <Loader className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Loading holidays…</span>
                        </div>
                    ) : loadError ? (
                        <p className="px-4 py-5 text-xs text-red-700">{loadError}</p>
                    ) : upcoming.length === 0 ? (
                        <p className="px-4 py-5 text-sm text-muted-foreground">No upcoming holidays added.</p>
                    ) : (
                        <div className="divide-y divide-border">
                            {upcoming.map((h) => renderRow(h, false))}
                        </div>
                    )}

                    {!loading && !loadError && past.length > 0 && (
                        <>
                            <div className="bg-muted/20 border-y border-border px-4 py-2.5">
                                <p className="text-xs font-semibold text-muted-foreground">
                                    Past holidays ({past.length})
                                </p>
                            </div>
                            <div className="divide-y divide-border">
                                {past.map((h) => renderRow(h, true))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
