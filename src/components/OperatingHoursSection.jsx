import { Clock, Copy, Info, Loader, RefreshCw, Save } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { operatingHoursService, SHIFTS, WEEK_DAYS } from '../services/operatingHours';
import { useAuthStore } from '../store/useAuthStore';

const SHIFT_LABELS = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
};

// Returns an error string for the first invalid day, or null if the schedule is valid.
// "HH:mm" strings compare correctly as plain strings.
function validateSchedule(schedule) {
    for (const day of WEEK_DAYS) {
        const d = schedule[day];
        if (d.is_closed) continue;

        const active = SHIFTS.filter((s) => d[s].enabled);
        if (active.length === 0) {
            return `${day}: enable at least one shift, or mark the day as Closed.`;
        }

        for (const s of active) {
            const { open_time, close_time } = d[s];
            if (!open_time || !close_time) {
                return `${day} ${SHIFT_LABELS[s]}: opening and closing time are required.`;
            }
            if (open_time >= close_time) {
                return `${day} ${SHIFT_LABELS[s]}: opening time must be before closing time.`;
            }
        }

        const sorted = [...active].sort((a, b) => d[a].open_time.localeCompare(d[b].open_time));
        for (let i = 1; i < sorted.length; i++) {
            const prev = d[sorted[i - 1]];
            const curr = d[sorted[i]];
            if (curr.open_time < prev.close_time) {
                return `${day}: ${SHIFT_LABELS[sorted[i - 1]]} and ${SHIFT_LABELS[sorted[i]]} timings overlap.`;
            }
        }
    }
    return null;
}

/**
 * OperatingHoursSection
 * Weekly recurring schedule with separate Breakfast / Lunch / Dinner timings per day.
 */
export function OperatingHoursSection() {
    const { restaurantId } = useAuthStore();

    const [schedule, setSchedule] = useState(null);
    const [isSaved, setIsSaved] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState('');

    const loadSchedule = useCallback(async () => {
        if (!restaurantId) return;
        setLoading(true);
        setLoadError('');
        try {
            const data = await operatingHoursService.getOperatingHours(restaurantId);
            setSchedule(data.schedule);
            setIsSaved(data.isSaved);
        } catch (err) {
            console.error('[OperatingHoursSection] Failed to load schedule:', err);
            setLoadError(err.message || 'Failed to load operating hours');
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    useEffect(() => { loadSchedule(); }, [loadSchedule]);

    const toggleDayClosed = (day) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: { ...prev[day], is_closed: !prev[day].is_closed },
        }));
    };

    const updateShift = (day, shift, field, value) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                [shift]: { ...prev[day][shift], [field]: value },
            },
        }));
    };

    const copyMondayToAll = () => {
        setSchedule((prev) => {
            const monday = prev.Monday;
            const next = {};
            WEEK_DAYS.forEach((day) => {
                next[day] = {
                    is_closed: monday.is_closed,
                    breakfast: { ...monday.breakfast },
                    lunch: { ...monday.lunch },
                    dinner: { ...monday.dinner },
                };
            });
            return next;
        });
    };

    const handleSave = async () => {
        const error = validateSchedule(schedule);
        if (error) {
            alert(error);
            return;
        }
        setSaving(true);
        try {
            await operatingHoursService.updateOperatingHours(restaurantId, schedule);
            setIsSaved(true);
            alert('Operating hours saved successfully!');
        } catch (err) {
            console.error('[OperatingHoursSection] Save failed:', err);
            alert(err.message || 'Failed to save operating hours. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/30 border-b border-border px-5 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-foreground" />
                        <h2 className="font-heading font-semibold text-foreground">
                            Operating Hours
                        </h2>
                    </div>
                    <button
                        onClick={loadSchedule}
                        disabled={loading}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Set your regular weekly timings for breakfast, lunch, and dinner. The AI bot only accepts bookings inside these times.
                </p>
            </div>

            <div className="p-5 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading operating hours…</span>
                    </div>
                ) : loadError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-700">{loadError}</p>
                    </div>
                ) : schedule && (
                    <>
                        {!isSaved && (
                            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-800">
                                    No operating hours saved yet. Default timings are shown below — review them and click <strong>Save Operating Hours</strong>.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={copyMondayToAll}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs font-medium text-foreground rounded-md hover:bg-muted/20 transition-colors cursor-pointer"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                Copy Monday to all days
                            </button>
                        </div>

                        <div className="border border-border rounded-lg overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/20 border-b border-border">
                                    <tr>
                                        <th className="text-left text-xs font-semibold text-foreground px-4 py-2.5 w-32">Day</th>
                                        <th className="text-left text-xs font-semibold text-foreground px-4 py-2.5 w-28">Status</th>
                                        {SHIFTS.map((s) => (
                                            <th key={s} className="text-left text-xs font-semibold text-foreground px-4 py-2.5">
                                                {SHIFT_LABELS[s]}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {WEEK_DAYS.map((day) => {
                                        const d = schedule[day];
                                        return (
                                            <tr key={day} className={d.is_closed ? 'bg-red-50/50' : ''}>
                                                <td className="px-4 py-3 text-sm font-medium text-foreground">{day}</td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleDayClosed(day)}
                                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                                            d.is_closed
                                                                ? 'bg-red-500 text-white hover:bg-red-600'
                                                                : 'bg-green-500 text-white hover:bg-green-600'
                                                        }`}
                                                    >
                                                        {d.is_closed ? 'Closed' : 'Open'}
                                                    </button>
                                                </td>
                                                {SHIFTS.map((s) => {
                                                    const shift = d[s];
                                                    const disabled = d.is_closed || !shift.enabled;
                                                    return (
                                                        <td key={s} className="px-4 py-3 align-top">
                                                            {d.is_closed ? (
                                                                <span className="text-xs font-semibold text-red-600">CLOSED</span>
                                                            ) : (
                                                                <div className="space-y-1.5">
                                                                    <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={shift.enabled}
                                                                            onChange={(e) => updateShift(day, s, 'enabled', e.target.checked)}
                                                                            className="rounded"
                                                                        />
                                                                        Serve {SHIFT_LABELS[s].toLowerCase()}
                                                                    </label>
                                                                    <div className="flex items-center gap-1">
                                                                        <input
                                                                            type="time"
                                                                            value={shift.open_time || ''}
                                                                            disabled={disabled}
                                                                            onChange={(e) => updateShift(day, s, 'open_time', e.target.value)}
                                                                            className="px-2 py-1 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-foreground disabled:bg-gray-50 disabled:text-muted-foreground"
                                                                        />
                                                                        <span className="text-xs text-muted-foreground">–</span>
                                                                        <input
                                                                            type="time"
                                                                            value={shift.close_time || ''}
                                                                            disabled={disabled}
                                                                            onChange={(e) => updateShift(day, s, 'close_time', e.target.value)}
                                                                            className="px-2 py-1 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-foreground disabled:bg-gray-50 disabled:text-muted-foreground"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                <div className="flex justify-end pt-4 border-t border-border">
                    <button
                        onClick={handleSave}
                        disabled={loading || saving || !schedule}
                        className="px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving
                            ? <><Loader className="w-4 h-4 animate-spin" /> Saving…</>
                            : <><Save className="w-4 h-4" /> Save Operating Hours</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
