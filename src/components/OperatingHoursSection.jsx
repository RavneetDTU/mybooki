import { Clock, Copy, Info, Loader, RefreshCw, Save } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { operatingHoursService, WEEK_DAYS } from '../services/operatingHours';
import { useAuthStore } from '../store/useAuthStore';
import { validateSlots } from '../utils/sittingSlots';
import { SittingSlotsEditor } from './SittingSlotsEditor';

// Returns an error string for the first invalid day, or null if the schedule is valid.
// Overlapping sittings are allowed on purpose — each sitting has its own capacity.
function validateSchedule(schedule, sittings) {
    for (const day of WEEK_DAYS) {
        const d = schedule[day];
        if (d.is_closed) continue;
        if (d.slots.length === 0) {
            return `${day}: add at least one sitting, or mark the day as Closed.`;
        }
        const error = validateSlots(d.slots, sittings, day);
        if (error) return error;
    }
    return null;
}

/**
 * OperatingHoursSection
 * Weekly recurring schedule: per day, any number of the restaurant's sittings with their own start/end time.
 */
export function OperatingHoursSection({ sittings = [], sittingsLoading = false, onSaved }) {
    const { restaurantId } = useAuthStore();

    const [schedule, setSchedule] = useState(null);
    const [isSaved, setIsSaved] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState('');
    const loadedForRef = useRef(null);

    const loadSchedule = useCallback(async (sittingList) => {
        if (!restaurantId) return;
        setLoading(true);
        setLoadError('');
        try {
            const data = await operatingHoursService.getWeeklySittings(restaurantId, sittingList);
            setSchedule(data.schedule);
            setIsSaved(data.isSaved);
        } catch (err) {
            console.error('[OperatingHoursSection] Failed to load schedule:', err);
            setLoadError(err.message || 'Failed to load operating hours');
        } finally {
            setLoading(false);
        }
    }, [restaurantId]);

    // Load once sittings are known (needed to map legacy breakfast/lunch/dinner days onto sittings).
    // Later sitting edits must not wipe unsaved schedule changes, so this does not re-run on every change.
    useEffect(() => {
        if (sittingsLoading || !restaurantId || loadedForRef.current === restaurantId) return;
        loadedForRef.current = restaurantId;
        loadSchedule(sittings);
    }, [sittingsLoading, restaurantId, sittings, loadSchedule]);

    // Slots for deleted sittings are hidden by the API; mirror that locally without a reload.
    const knownIds = new Set(sittings.map((s) => String(s.id)));
    const visibleSlots = (d) => d.slots.filter((s) => s.sitting_id === '' || knownIds.has(String(s.sitting_id)));

    const toggleDayClosed = (day) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: { ...prev[day], is_closed: !prev[day].is_closed },
        }));
    };

    const updateDaySlots = (day, slots) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: { ...prev[day], slots },
        }));
    };

    const copyMondayToAll = () => {
        setSchedule((prev) => {
            const monday = prev.Monday;
            const next = {};
            WEEK_DAYS.forEach((day) => {
                next[day] = {
                    is_closed: monday.is_closed,
                    slots: monday.slots.map((s) => ({ ...s })),
                };
            });
            return next;
        });
    };

    const handleSave = async () => {
        const cleaned = {};
        WEEK_DAYS.forEach((day) => {
            cleaned[day] = { ...schedule[day], slots: visibleSlots(schedule[day]) };
        });
        const error = validateSchedule(cleaned, sittings);
        if (error) {
            alert(error);
            return;
        }
        setSaving(true);
        try {
            await operatingHoursService.updateWeeklySittings(restaurantId, cleaned);
            setSchedule(cleaned);
            setIsSaved(true);
            onSaved?.();
            alert('Operating hours saved successfully!');
        } catch (err) {
            console.error('[OperatingHoursSection] Save failed:', err);
            alert(err.message || 'Failed to save operating hours. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const hasActiveSittings = sittings.some((s) => s.is_active);

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
                        onClick={() => loadSchedule(sittings)}
                        disabled={loading}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Set the weekly time for each sitting. A restaurant with nothing saved yet starts with every day open: Breakfast 08:00–11:00, Lunch 12:00–15:30, Dinner 18:00–22:00. Sittings may overlap.
                </p>
            </div>

            <div className="p-5 space-y-4">
                {loading || sittingsLoading ? (
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
                        {!hasActiveSittings && (
                            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-800">
                                    You have no active sittings. Add a sitting in the <strong>Sittings</strong> section above before setting timings.
                                </p>
                            </div>
                        )}

                        {!isSaved && hasActiveSittings && (
                            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-800">
                                    No operating hours saved yet. Add sittings to each open day and click <strong>Save Operating Hours</strong>.
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
                                        <th className="text-left text-xs font-semibold text-foreground px-4 py-2.5">Sittings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {WEEK_DAYS.map((day) => {
                                        const d = schedule[day];
                                        return (
                                            <tr key={day} className={d.is_closed ? 'bg-red-50/50' : ''}>
                                                <td className="px-4 py-3 text-sm font-medium text-foreground align-top">{day}</td>
                                                <td className="px-4 py-3 align-top">
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
                                                <td className="px-4 py-3 align-top">
                                                    {d.is_closed ? (
                                                        <span className="text-xs font-semibold text-red-600">CLOSED</span>
                                                    ) : (
                                                        <SittingSlotsEditor
                                                            slots={visibleSlots(d)}
                                                            sittings={sittings}
                                                            onChange={(slots) => updateDaySlots(day, slots)}
                                                            emptyText="No sittings on this day yet"
                                                        />
                                                    )}
                                                </td>
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
