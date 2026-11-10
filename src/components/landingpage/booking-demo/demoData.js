/**
 * Frontend-only demo data for the marketing landing page.
 * Not connected to live restaurants, guests, or booking APIs.
 */

export const DEMO_RESTAURANT = {
    name: 'Demo Restaurant',
    city: 'Cape Town',
    tagline: 'Coastal dining · Sample venue',
    phone: '+27 11 555 0148',
    whatsapp: '+27 60 555 0192',
};

export const SAMPLE_GUEST = {
    name: 'Sample Customer',
    phone: '+27 82 555 0101',
};

export const DEMO_TIMES = [
    { id: '18:00', label: '6:00 PM', subtitle: 'Early evening' },
    { id: '19:00', label: '7:00 PM', subtitle: 'Popular slot' },
    { id: '19:30', label: '7:30 PM', subtitle: 'Prime time' },
    { id: '20:00', label: '8:00 PM', subtitle: 'Later seating' },
];

export const DEMO_PARTY_SIZES = [
    { id: '1', label: '1 Guest', subtitle: 'A table for one' },
    { id: '2', label: '2 Guests', subtitle: 'A classic pairing' },
    { id: '3-4', label: '3–4 Guests', subtitle: 'Small group' },
    { id: '5+', label: '5+ Guests', subtitle: 'Larger party' },
];

export function formatIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function formatDisplayDate(iso) {
    if (!iso) return 'Selected demo date';
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function getDemoDates() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const saturday = new Date(today);
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
    saturday.setDate(today.getDate() + daysUntilSaturday);

    const label = (date) =>
        date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return [
        { id: formatIsoDate(today), label: 'Today', subtitle: label(today) },
        { id: formatIsoDate(tomorrow), label: 'Tomorrow', subtitle: label(tomorrow) },
        { id: formatIsoDate(saturday), label: 'This Saturday', subtitle: label(saturday) },
    ];
}

export function nowTimeLabel() {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function createMessageId() {
    return `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const emptyBooking = {
    guests: '',
    date: '',
    time: '',
    timeLabel: '',
    name: '',
    phone: '',
    requests: '',
};
