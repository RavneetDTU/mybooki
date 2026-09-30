import { Plus, Trash2 } from 'lucide-react';
import { newSlot } from '../utils/sittingSlots';

const inputClass =
    'px-2 py-1 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-foreground disabled:bg-gray-50 disabled:text-muted-foreground';

/**
 * SittingSlotsEditor
 * Editable list of { sitting_id, start_time, end_time } rows.
 * Only active sittings are offered for new choices; a slot already pointing at an inactive
 * sitting keeps showing it so saved data is never silently changed.
 */
export function SittingSlotsEditor({ slots, sittings, onChange, disabled = false, emptyText = 'No sittings' }) {
    const activeSittings = sittings.filter((s) => s.is_active);

    const updateSlot = (index, field, value) => {
        onChange(slots.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
    };

    const removeSlot = (index) => {
        onChange(slots.filter((_, i) => i !== index));
    };

    const addSlot = () => {
        onChange([...slots, newSlot(sittings)]);
    };

    return (
        <div className="space-y-1.5">
            {slots.length === 0 && (
                <p className="text-xs text-muted-foreground italic">{emptyText}</p>
            )}

            {slots.map((slot, index) => {
                const selected = sittings.find((s) => String(s.id) === String(slot.sitting_id));
                const options = selected && !selected.is_active ? [...activeSittings, selected] : activeSittings;
                return (
                    <div key={index} className="flex flex-wrap items-center gap-1">
                        <select
                            value={slot.sitting_id}
                            disabled={disabled}
                            onChange={(e) => updateSlot(index, 'sitting_id', e.target.value === '' ? '' : Number(e.target.value))}
                            className={`${inputClass} min-w-[120px] bg-white`}
                        >
                            <option value="">Select sitting…</option>
                            {options.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}{s.is_active ? '' : ' (inactive)'}
                                </option>
                            ))}
                        </select>
                        <input
                            type="time"
                            value={slot.start_time || ''}
                            disabled={disabled}
                            onChange={(e) => updateSlot(index, 'start_time', e.target.value)}
                            className={inputClass}
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <input
                            type="time"
                            value={slot.end_time || ''}
                            disabled={disabled}
                            onChange={(e) => updateSlot(index, 'end_time', e.target.value)}
                            className={inputClass}
                        />
                        <button
                            type="button"
                            onClick={() => removeSlot(index)}
                            disabled={disabled}
                            className="p-1 text-muted-foreground hover:text-red-600 transition-colors cursor-pointer disabled:opacity-40"
                            title="Remove sitting"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}

            <button
                type="button"
                onClick={addSlot}
                disabled={disabled || activeSittings.length === 0}
                className="flex items-center gap-1 text-xs font-medium text-foreground hover:underline cursor-pointer disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
            >
                <Plus className="w-3.5 h-3.5" />
                Add sitting
            </button>
        </div>
    );
}
