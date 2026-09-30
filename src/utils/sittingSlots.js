/**
 * Helpers for sitting slots: { sitting_id, start_time: "HH:mm", end_time: "HH:mm" }.
 * "HH:mm" strings compare correctly as plain strings.
 * Overlapping slots are intentionally allowed (e.g. Lunch and Pub Lunch at the same time).
 */

export function newSlot(sittings) {
    const firstActive = (sittings || []).find((s) => s.is_active);
    return { sitting_id: firstActive ? firstActive.id : '', start_time: '12:00', end_time: '15:00' };
}

export function sittingNameById(sittings, id) {
    const match = (sittings || []).find((s) => String(s.id) === String(id));
    return match ? match.name : 'Sitting';
}

// Returns an error string for the first invalid slot, or null if all slots are valid.
export function validateSlots(slots, sittings, label) {
    const prefix = label ? `${label}: ` : '';
    for (const slot of slots) {
        if (slot.sitting_id === '' || slot.sitting_id == null) {
            return `${prefix}choose a sitting for every row.`;
        }
        const name = sittingNameById(sittings, slot.sitting_id);
        if (!slot.start_time || !slot.end_time) {
            return `${prefix}${name} needs a start and end time.`;
        }
        if (slot.start_time >= slot.end_time) {
            return `${prefix}${name} start time must be before end time.`;
        }
    }
    return null;
}

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner'];

// Calendar order is Breakfast, Lunch, Dinner, then any other sitting by start time.
export function compareSittingDisplayOrder(a, b) {
    const rank = (slot) => {
        const index = MEAL_ORDER.indexOf(String(slot?.sitting_name || '').trim().toLowerCase());
        return index === -1 ? MEAL_ORDER.length : index;
    };
    const byMeal = rank(a) - rank(b);
    if (byMeal !== 0) return byMeal;
    return String(a?.start_time || '').localeCompare(String(b?.start_time || ''));
}

export function formatTimeShort(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return minutes && minutes !== '00' ? `${hour12}:${minutes}${ampm}` : `${hour12}${ampm}`;
}
