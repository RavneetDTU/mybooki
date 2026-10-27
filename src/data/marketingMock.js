/**
 * Frontend-only sample data for the Marketing section.
 * Not connected to WhatsApp, Meta, or any campaign API.
 */

export const RESTAURANT_NAME = 'Demo Restaurant';
export const SAMPLE_TODAY = '2026-10-26';

export const OVERVIEW_STATS = [
    { id: 'contacts', label: 'Total Contacts', value: '1,000', note: 'Sample preview' },
    { id: 'eligible', label: 'Eligible Contacts', value: '850', note: 'Sample preview' },
    { id: 'campaigns', label: 'Campaigns Created', value: '12', note: 'Sample preview' },
    { id: 'reservations', label: 'Reservations from Campaigns', value: '48', note: 'Sample preview' },
];

export const OBJECTIVES = [
    'Bring Back Previous Customers',
    'Promote a Weekend Offer',
    'Birthday Campaign',
    'Announce a Special Event',
    'Encourage Repeat Bookings',
];

export const DEMO_DATES = [
    { id: '2026-10-30', label: 'Friday, Oct 30' },
    { id: '2026-10-31', label: 'Saturday, Oct 31' },
    { id: '2026-11-01', label: 'Sunday, Nov 1' },
];

export const DEMO_TIMES = ['6:00 PM', '7:00 PM', '7:30 PM', '8:00 PM'];

export const CAMPAIGN_STATUSES = [
    { id: 'all', label: 'All statuses' },
    { id: 'draft', label: 'Draft' },
    { id: 'ready', label: 'Ready for Review' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'completed', label: 'Completed · sample' },
];

export const STATUS_STYLES = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    ready: 'bg-amber-50 text-amber-800 border-amber-200',
    scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function statusLabel(id) {
    return CAMPAIGN_STATUSES.find((item) => item.id === id)?.label || id;
}

export const TEMPLATES = [
    {
        id: 'we-miss-you',
        name: 'We Miss You!',
        category: 'Marketing',
        language: 'English',
        approval: 'Approved',
        selectable: true,
        variables: ['Customer name', 'Restaurant name'],
        body: "Hi {{1}}, it's been a while since your last visit to {{2}}! We'd love to welcome you back. Reply to explore our menu or book your next table.",
        replies: ['Book a Table', 'View Menu', 'Not Now'],
    },
    {
        id: 'weekend-special',
        name: 'Weekend Special',
        category: 'Marketing',
        language: 'English',
        approval: 'Approved',
        selectable: true,
        variables: ['Customer name', 'Restaurant name'],
        body: 'Hi {{1}}! Make your weekend special at {{2}}. Planning a meal with friends or family? Reply here and our booking assistant will help you reserve a table.',
        replies: ['Book a Table', 'View Menu', 'Not Now'],
    },
    {
        id: 'birthday',
        name: 'Birthday Celebration',
        category: 'Marketing',
        language: 'English',
        approval: 'Pending Review',
        selectable: false,
        variables: ['Customer name', 'Restaurant name'],
        body: 'Happy Birthday, {{1}}! Celebrate your special day with us at {{2}}. Reply to explore your dining options and reserve a table.',
        replies: ['Book a Table', 'Not Now'],
    },
    {
        id: 'rejected-offer',
        name: 'Limited Offer',
        category: 'Marketing',
        language: 'English',
        approval: 'Rejected',
        selectable: false,
        variables: ['Customer name', 'Restaurant name'],
        body: 'Hi {{1}}, a limited offer is waiting at {{2}}. Reply to reserve a table.',
        replies: ['Book a Table'],
    },
];

export function renderTemplate(body, values) {
    return body
        .replaceAll('{{1}}', values.customerName || '{{1}}')
        .replaceAll('{{2}}', values.restaurantName || '{{2}}');
}

const SEED = [
    ['c1', 'Priya Sharma', '+27 82 555 0104', 'priya.sharma@example.com', '1992-03-12', '2026-06-01', 'yes'],
    ['c2', 'Lena Jacobs', '+27 71 555 0188', 'lena.jacobs@example.com', '1988-10-30', '2026-10-12', 'yes'],
    ['c3', 'Noah Dlamini', '+27 83 555 0110', '', '1995-10-04', '2026-01-20', 'yes'],
    ['c4', 'Owen Pietersen', '+27 82 555 0177', 'owen.pietersen@example.com', '1984-11-02', '2026-09-02', 'yes'],
    ['c5', 'Sara Naidoo', '+27 84 555 0199', '', '1990-07-18', '2026-10-20', 'yes'],
    ['c6', 'Thandi Mthembu', '+27 73 555 0148', 'thandi@example.com', '1993-10-26', '2025-12-01', 'yes'],
    ['c7', 'Bad Number', '123', 'bad@example.com', '', '', 'yes'],
    ['c8', 'Priya Sharma', '+27 82 555 0104', 'duplicate@example.com', '', '2026-06-01', 'yes'],
    ['c9', 'Missing Phone', '', 'missing@example.com', '', '2026-08-01', 'yes'],
    ['c10', 'No Consent', '+27 82 555 0201', 'noconsent@example.com', '1991-01-09', '2026-07-14', ''],
    ['c11', 'Unsubscribed', '+27 82 555 0202', 'left@example.com', '', '2026-05-03', 'unsubscribed'],
    ['c12', 'Amina Jacobs', '+27 82 555 0203', 'amina@example.com', '1989-04-22', '2026-10-01', 'yes'],
];

function consentOf(value) {
    const key = String(value || '').trim().toLowerCase();
    if (['yes', 'y', 'true', '1', 'consented'].includes(key)) return 'yes';
    if (['unsubscribed', 'opted out', 'opt-out'].includes(key)) return 'unsubscribed';
    if (['no', 'n', 'false', '0'].includes(key)) return 'no';
    return 'missing';
}

export function phoneDigits(value) {
    return String(value || '').replace(/\D/g, '');
}

export function isValidPhone(value) {
    const digits = phoneDigits(value);
    return digits.length >= 8 && digits.length <= 15;
}

function validationFor(contact, seen) {
    if (!String(contact.phone || '').trim()) return 'missing_phone';
    if (!isValidPhone(contact.phone)) return 'invalid_phone';
    const key = phoneDigits(contact.phone);
    if (seen.has(key)) return 'duplicate';
    seen.add(key);
    if (contact.consent === 'unsubscribed') return 'unsubscribed';
    if (contact.consent !== 'yes') return 'no_consent';
    return 'eligible';
}

export function decorateContacts(rows) {
    const seen = new Set();
    return rows.map((row) => {
        const contact = {
            ...row,
            consent: consentOf(row.consent),
        };
        contact.validation = validationFor(contact, seen);
        return contact;
    });
}

export const SEED_CONTACTS = decorateContacts(SEED.map(([id, name, phone, email, birthday, lastVisit, consent]) => ({
    id,
    name,
    phone,
    email,
    birthday,
    lastVisit,
    consent,
    source: 'Sample list',
})));

export const VALIDATION_LABELS = {
    eligible: 'Eligible',
    invalid_phone: 'Invalid phone number',
    duplicate: 'Duplicate contact',
    missing_phone: 'Missing phone number',
    no_consent: 'No recorded marketing consent',
    unsubscribed: 'Unsubscribed',
};

export function isEligible(contact) {
    return contact.validation === 'eligible';
}

export function summarizeContacts(contacts) {
    const count = (id) => contacts.filter((item) => item.validation === id).length;
    return {
        total: contacts.length,
        eligible: count('eligible'),
        invalid: count('invalid_phone') + count('missing_phone'),
        duplicate: count('duplicate'),
        noConsent: count('no_consent'),
        unsubscribed: count('unsubscribed'),
    };
}

const RECENT_CUTOFF = '2026-09-26';

export function audienceContacts(contacts, audience, selectedIds) {
    const eligible = contacts.filter(isEligible);
    if (audience === 'recent') {
        return eligible.filter((item) => item.lastVisit && item.lastVisit >= RECENT_CUTOFF);
    }
    if (audience === 'lapsed') {
        return eligible.filter((item) => !item.lastVisit || item.lastVisit < RECENT_CUTOFF);
    }
    if (audience === 'birthday') {
        return eligible.filter((item) => item.birthday && item.birthday.slice(5, 7) === '10');
    }
    if (audience === 'custom') {
        return eligible.filter((item) => selectedIds.includes(item.id));
    }
    return eligible;
}

export const AUDIENCE_OPTIONS = [
    { id: 'all', label: 'All Eligible Contacts', detail: 'Everyone with a valid number and recorded consent.' },
    { id: 'recent', label: 'Recently Visited Customers', detail: 'Eligible guests who visited in the last 30 days.' },
    { id: 'lapsed', label: 'Customers Who Have Not Visited Recently', detail: 'Eligible guests with no visit in the last 30 days.' },
    { id: 'birthday', label: 'Birthday Customers', detail: 'Eligible guests with a birthday in October.' },
    { id: 'custom', label: 'Custom Contact Selection', detail: 'Choose eligible contacts yourself.' },
];

export function emptyWizard() {
    return {
        name: '',
        objective: OBJECTIVES[0],
        description: '',
        audience: 'all',
        selectedIds: [],
        templateId: 'we-miss-you',
        customerName: 'Priya Sharma',
        restaurantName: RESTAURANT_NAME,
    };
}

export const SEED_CAMPAIGNS = [
    {
        id: 'camp-miss',
        name: 'We Miss You!',
        templateId: 'we-miss-you',
        templateName: 'We Miss You!',
        objective: 'Bring Back Previous Customers',
        description: 'Invite guests who have not visited recently.',
        audience: 'lapsed',
        audienceLabel: 'Customers Who Have Not Visited Recently',
        recipients: 8,
        excluded: 4,
        status: 'ready',
        created: '2026-10-20',
        responses: null,
        reservations: null,
        metrics: null,
    },
    {
        id: 'camp-weekend',
        name: 'Weekend Special',
        templateId: 'weekend-special',
        templateName: 'Weekend Special',
        objective: 'Promote a Weekend Offer',
        description: '',
        audience: 'all',
        audienceLabel: 'All Eligible Contacts',
        recipients: 8,
        excluded: 4,
        status: 'draft',
        created: '2026-10-24',
        responses: null,
        reservations: null,
        metrics: null,
    },
    {
        id: 'camp-birthday',
        name: 'Birthday Offers',
        templateId: 'weekend-special',
        templateName: 'Weekend Special',
        objective: 'Birthday Campaign',
        description: 'Birthday template is still pending, so this sample stays scheduled and unsent.',
        audience: 'birthday',
        audienceLabel: 'Birthday Customers',
        recipients: 3,
        excluded: 9,
        status: 'scheduled',
        created: '2026-10-18',
        responses: null,
        reservations: null,
        metrics: null,
    },
    {
        id: 'camp-dinner',
        name: 'Come Back for Dinner',
        templateId: 'we-miss-you',
        templateName: 'We Miss You!',
        objective: 'Encourage Repeat Bookings',
        description: 'Sample completed campaign. Metrics are illustrative only.',
        audience: 'all',
        audienceLabel: 'All Eligible Contacts',
        recipients: 8,
        excluded: 4,
        status: 'completed',
        created: '2026-10-02',
        responses: 3,
        reservations: 1,
        metrics: {
            recipients: 8,
            delivered: 7,
            responses: 3,
            requests: 2,
            reservations: 1,
        },
    },
];

export const SAMPLE_RESPONSES = [
    {
        id: 'r1',
        campaignId: 'camp-dinner',
        name: 'Priya Sharma',
        phone: '+27 82 555 0104',
        status: 'Booked · demo',
        lastMessage: 'Window table',
        booking: 'Demo confirmation',
    },
    {
        id: 'r2',
        campaignId: 'camp-dinner',
        name: 'Noah Dlamini',
        phone: '+27 83 555 0110',
        status: 'Replied',
        lastMessage: 'Not now',
        booking: 'Not booked',
    },
    {
        id: 'r3',
        campaignId: 'camp-dinner',
        name: 'Thandi Mthembu',
        phone: '+27 73 555 0148',
        status: 'Booking requested',
        lastMessage: 'Asked for Saturday',
        booking: 'Not booked',
    },
];

export const SAMPLE_CSV = `Name,Phone Number,Email,Birthday,Last Visit,Marketing Consent
Amina Jacobs,+27821230001,amina.jacobs@example.com,1990-05-02,2026-08-01,yes
Karl van Wyk,+27821230002,karl@example.com,1986-10-11,2026-02-14,yes
Bad Number,123,bad.import@example.com,,,yes
No Consent,+27821230003,noconsent.import@example.com,1994-01-01,2026-09-01,
Priya Duplicate,+27825550104,priya.dup@example.com,1992-03-12,2026-06-01,yes
Unsubscribed Guest,+27821230004,left.import@example.com,,,unsubscribed
`;

export function downloadSampleCsv() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'booki-sample-contacts.csv';
    link.click();
    URL.revokeObjectURL(url);
}

function splitCsvLine(line) {
    const cells = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
            if (quoted && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                quoted = !quoted;
            }
        } else if (char === ',' && !quoted) {
            cells.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    cells.push(current);
    return cells;
}

const HEADER_MAP = {
    name: 'name',
    'phone number': 'phone',
    phone: 'phone',
    email: 'email',
    birthday: 'birthday',
    'last visit': 'lastVisit',
    'marketing consent': 'consent',
    consent: 'consent',
};

export function parseCsv(text) {
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
    if (!lines.length) return { headers: [], rows: [], missingColumns: ['Phone Number', 'Marketing Consent'] };
    const headers = splitCsvLine(lines[0]).map((header) => header.trim());
    const keys = headers.map((header) => HEADER_MAP[header.toLowerCase()] || null);
    const missingColumns = ['phone', 'consent'].filter((key) => !keys.includes(key)).map((key) => (
        key === 'phone' ? 'Phone Number' : 'Marketing Consent'
    ));
    const rows = lines.slice(1).map((line, index) => {
        const cells = splitCsvLine(line);
        const record = { row: index + 2, name: '', phone: '', email: '', birthday: '', lastVisit: '', consent: '' };
        keys.forEach((key, cellIndex) => {
            if (key) record[key] = (cells[cellIndex] || '').trim();
        });
        return record;
    }).filter((row) => Object.values(row).some((value) => String(value).trim() && value !== row.row));
    return { headers, rows, missingColumns };
}

export function reviewImport(rows, existing) {
    const seen = new Set(existing.map((item) => phoneDigits(item.phone)).filter(Boolean));
    return rows.map((row, index) => {
        const contact = {
            id: `import-${row.row}-${index}`,
            name: row.name || 'Unnamed contact',
            phone: row.phone,
            email: row.email,
            birthday: row.birthday,
            lastVisit: row.lastVisit,
            consent: consentOf(row.consent),
            source: 'CSV import',
            row: row.row,
        };
        contact.validation = validationFor(contact, seen);
        return contact;
    });
}
