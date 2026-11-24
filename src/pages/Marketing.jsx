import { useEffect, useMemo, useRef, useState } from 'react';

const TEMPLATE_STATUS = {
    draft: 'Draft',
    pending: 'Pending approval',
    in_review: 'Pending approval',
    approved: 'Approved',
    rejected: 'Rejected',
    paused: 'Paused',
    disabled: 'Disabled',
};

function when(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

async function fileToCsv(file) {
    if (/\.xlsx?$/i.test(file.name)) {
        const XLSX = await import('xlsx');
        const book = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        return XLSX.utils.sheet_to_csv(book.Sheets[book.SheetNames[0]]);
    }
    return file.text();
}

const LEAD_TEMPLATE = 'First name,Last name,Phone number,Email ID\nJane,Doe,+27821234567,jane@example.com\n';

const LEAD_IMPORT_MAPPING = {
    name: 'name',
    phone: 'phone',
    email: 'email',
    optIn: 'opt_in',
    source: 'source',
    warehouse: 'warehouse',
    city: 'city',
};

function parseSheet(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    const src = String(text || '').replace(/^\uFEFF/, '');
    for (let i = 0; i < src.length; i += 1) {
        const char = src[i];
        const next = src[i + 1];
        if (inQuotes) {
            if (char === '"' && next === '"') { cell += '"'; i += 1; }
            else if (char === '"') inQuotes = false;
            else cell += char;
            continue;
        }
        if (char === '"') inQuotes = true;
        else if (char === ',') { row.push(cell.trim()); cell = ''; }
        else if (char === '\n') {
            row.push(cell.trim());
            cell = '';
            if (row.some((value) => value !== '')) rows.push(row);
            row = [];
        } else if (char !== '\r') cell += char;
    }
    row.push(cell.trim());
    if (row.some((value) => value !== '')) rows.push(row);
    if (!rows.length) return { headers: [], records: [] };
    const headers = rows[0];
    const records = rows.slice(1).map((values) => {
        const record = {};
        headers.forEach((header, index) => { record[header] = values[index] ?? ''; });
        return record;
    });
    return { headers, records };
}

function sheetColumn(headers, names) {
    const wanted = new Set(names);
    return headers.findIndex((header) => wanted.has(String(header || '').trim().toLowerCase()));
}

function csvCell(value) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function prepareLeadImport(text) {
    const { headers, records } = parseSheet(text);
    const first = sheetColumn(headers, ['first name']);
    const last = sheetColumn(headers, ['last name']);
    const phone = sheetColumn(headers, ['phone number', 'phone', 'whatsapp', 'mobile', 'number']);
    const email = sheetColumn(headers, ['email id', 'email']);
    const warehouse = sheetColumn(headers, ['preferred warehouse', 'warehouse']);
    const city = sheetColumn(headers, ['city']);
    if (phone < 0) return { ok: false, error: 'This file needs a Phone number column. Download the template and keep those headings.' };
    const value = (record, index) => (index < 0 ? '' : String(record[headers[index]] || '').trim());
    const rows = records.map((record) => {
        const firstName = value(record, first);
        const lastName = value(record, last);
        return {
            firstName,
            lastName,
            name: [firstName, lastName].filter(Boolean).join(' ') || 'Guest',
            phone: value(record, phone),
            email: value(record, email),
            warehouse: value(record, warehouse),
            city: value(record, city),
        };
    }).filter((row) => row.phone || row.firstName || row.lastName || row.email);
    if (!rows.length) return { ok: false, error: 'The file has no leads.' };
    const lines = ['name,phone,email,opt_in,source,warehouse,city', ...rows.map((row) => [
        row.name, row.phone, row.email, 'yes', 'CSV import', row.warehouse, row.city,
    ].map(csvCell).join(','))];
    return { ok: true, csv: lines.join('\n'), rows };
}

function downloadText(filename, text) {
    const blob = new Blob([text], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function initials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return `${parts[0][0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
}

function statusTone(status) {
    const value = String(status || '').toLowerCase();
    if (['approved', 'delivered', 'read', 'replied', 'running', 'sent', 'ai'].includes(value)) return 'bg-emerald-50 text-emerald-700';
    if (['failed', 'rejected', 'cancelled', 'opted_out'].includes(value)) return 'bg-rose-50 text-rose-700';
    if (['pending', 'queued', 'in_review', 'sending', 'scheduled', 'paused', 'human'].includes(value)) return 'bg-amber-50 text-amber-800';
    return 'bg-slate-100 text-slate-600';
}

function Pill({ children, status }) {
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${statusTone(status || children)}`}>{children}</span>;
}

function previewTemplate(body, mapping) {
    return String(body || '').replace(/\{\{(\d+)\}\}/g, (_, number) => {
        const item = (mapping || []).find((entry) => entry.index === Number(number));
        if (!item) return `{{${number}}}`;
        if (item.source === 'contact.name') return 'Customer name';
        if (item.source === 'restaurant.name') return 'Restaurant';
        return item.value || `{{${number}}}`;
    });
}
import { ArrowLeft, Download, MessageCircle, Settings, Upload } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { marketingError, marketingService } from '../services/marketing';
import { useAuthStore } from '../store/useAuthStore';

const TABS = [
    ['campaigns', 'Campaigns', 'Campaigns', 'Send an approved template to opted-in leads. Replies stay in one chat.'],
    ['contacts', 'Leads', 'Leads', 'Import a CSV or Excel file, or add someone by hand.'],
    ['inbox', 'Conversations', 'Conversations', 'Every template, assistant reply, and customer message.'],
    ['templates', 'Templates', 'Templates', 'Draft a message, submit it to Meta, and use it once it is approved.'],
    ['overview', 'Overview', 'Overview', 'Live counts from campaigns, leads, and chats.'],
    ['settings', 'Settings', 'Settings', 'Quiet hours and the marketing assistant.'],
];

function Notice({ error, notice }) {
    if (!error && !notice) return null;
    return (
        <p className={`text-sm rounded-lg px-3 py-2 ${error ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'}`}>
            {error || notice}
        </p>
    );
}

function templateDraftIssues(draft) {
    const indexes = [...String(draft.body || '').matchAll(/\{\{(\d+)\}\}/g)].map((match) => Number(match[1]));
    const unique = [...new Set(indexes)].sort((a, b) => a - b);
    const samples = String(draft.examples || '').split('|').map((item) => item.trim()).filter(Boolean);
    const issues = [];
    if (unique.length && !unique.every((value, index) => value === index + 1)) {
        const shown = unique.map((value) => `{{${value}}}`).join(', ');
        issues.push(`Use {{1}}, then {{2}}, with no skipped numbers. This body has ${shown}.`);
    }
    if (unique.length > samples.length) {
        issues.push(unique.length === 1
            ? 'Type one sample in the example box, then click Submit to Meta again.'
            : `Add ${unique.length} samples in the example box, separated by |.`);
    }
    return issues;
}

export function Marketing() {
    const { restaurantId } = useAuthStore();
    const [params, setParams] = useSearchParams();
    const tab = params.get('tab') || 'campaigns';
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const open = (next) => {
        setError('');
        setNotice('');
        setParams(next === 'campaigns' ? {} : { tab: next });
    };

    if (!restaurantId) {
        return <div className="p-8 text-sm text-muted-foreground">Sign in with a restaurant account to use WhatsApp marketing.</div>;
    }

    const current = TABS.find(([id]) => id === tab) || TABS[0];
    if (tab === 'inbox') {
        return (
            <div className="h-screen flex flex-col bg-white">
                {(error || notice) && <div className="px-4 pt-3"><Notice error={error} notice={notice} /></div>}
                <div className="flex-1 min-h-0">
                    <Inbox restaurantId={restaurantId} onBack={() => open('campaigns')} onError={setError} onNotice={setNotice} />
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-[#f4f6fb]">
            <div className="border-b border-border bg-white px-6 pt-5">
                <p className="text-xs text-muted-foreground">Marketing / {current[1]}</p>
                <h1 className="font-heading font-semibold text-3xl tracking-tight mt-1">{current[2]}</h1>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{current[3]}</p>
                <div className="flex flex-wrap gap-1 mt-4">
                    {TABS.map(([id, label]) => (
                        <button key={id} type="button" onClick={() => open(id)} className={`px-3 py-2 text-sm cursor-pointer border-b-2 ${tab === id ? 'border-foreground text-foreground font-medium' : 'border-transparent text-muted-foreground'}`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="px-6 py-5 space-y-4">
                <Notice error={error} notice={notice} />
                {tab === 'overview' && <Overview restaurantId={restaurantId} onError={setError} />}
                {tab === 'contacts' && <Contacts restaurantId={restaurantId} onError={setError} onNotice={setNotice} />}
                {tab === 'campaigns' && <Campaigns restaurantId={restaurantId} onError={setError} onNotice={setNotice} />}
                {tab === 'templates' && <Templates restaurantId={restaurantId} onError={setError} onNotice={setNotice} />}
                {tab === 'settings' && <SettingsPanel restaurantId={restaurantId} onError={setError} onNotice={setNotice} />}
            </div>
        </div>
    );
}

function Overview({ restaurantId, onError }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let live = true;
        setLoading(true);
        marketingService.overview(restaurantId)
            .then((rows) => { if (live) setData(rows); })
            .catch((error) => { if (live) onError(marketingError(error)); })
            .finally(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, [restaurantId, onError]);
    if (loading) return <p className="text-sm text-muted-foreground">Loading overview…</p>;
    if (!data) return <p className="text-sm text-muted-foreground">Overview is not available yet.</p>;
    const cards = [
        ['Leads', data.totalContacts],
        ['Opted in', data.optedInContacts],
        ['Campaigns', data.totalCampaigns],
        ['Active', data.activeCampaigns],
        ['Sent', data.messagesSent],
        ['Delivered', data.messagesDelivered],
        ['Failed', data.failedMessages],
        ['Replies', data.repliesReceived],
        ['AI chats', data.aiConversations || 0],
        ['Needs a person', data.needsHuman || 0],
    ];
    const empty = data.totalContacts === 0 && data.totalCampaigns === 0;
    return (
        <div className="space-y-4">
            {empty && <p className="text-sm text-muted-foreground">No contacts or campaigns yet. Import opted-in contacts, then submit a template to Meta.</p>}
            <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
                {cards.map(([label, value]) => (
                    <article key={label} className="rounded-2xl border border-border bg-white px-4 py-4 shadow-sm">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                        <p className="font-heading text-3xl mt-2">{value}</p>
                    </article>
                ))}
            </div>
            <section className="rounded-2xl border border-border bg-white overflow-hidden">
                <h2 className="px-4 py-3 font-heading font-semibold text-sm border-b border-border">Recent chats</h2>
                {(data.recent || []).length === 0 ? <p className="p-4 text-sm text-muted-foreground">No messages yet.</p> : (data.recent || []).map((item) => (
                    <button key={item.id} type="button" onClick={() => { window.location.assign('/marketing?tab=inbox'); }} className="w-full text-left px-4 py-3 border-b border-border last:border-0 cursor-pointer">
                        <span className="text-sm font-medium">{item.name || item.phoneDigits}</span>
                        <span className="block text-xs text-muted-foreground truncate">{item.lastMessage || '—'} · {when(item.updatedAt)}</span>
                    </button>
                ))}
            </section>
        </div>
    );
}

function Contacts({ restaurantId, onError, onNotice }) {
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [q, setQ] = useState('');
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState({ name: '', phone: '', email: '' });
    const [knownTags, setKnownTags] = useState([]);
    const [tag, setTag] = useState('');
    const [picked, setPicked] = useState([]);
    const [listName, setListName] = useState('');
    const [fileName, setFileName] = useState('');
    const [csv, setCsv] = useState('');
    const [sheetRows, setSheetRows] = useState([]);
    const [preview, setPreview] = useState(null);
    const [importing, setImporting] = useState(false);

    const load = () => {
        setLoading(true);
        marketingService.contacts(restaurantId, { q, tag, offset, limit: 50 })
            .then((result) => { setRows(result.contacts || []); setTotal(result.total || 0); setKnownTags(result.tags || []); })
            .catch((error) => onError(marketingError(error)))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, [restaurantId, q, tag, offset]);

    const add = async (event) => {
        event.preventDefault();
        try {
            await marketingService.saveContact(restaurantId, { ...draft, optIn: true, optInSource: 'Added by hand' });
            onNotice('Contact saved and opted in.');
            setDraft({ name: '', phone: '', email: '' });
            load();
        } catch (error) { onError(marketingError(error)); }
    };

    const readFile = async (file) => {
        const text = await fileToCsv(file);
        const prepared = prepareLeadImport(text);
        if (!prepared.ok) {
            setFileName('');
            setCsv('');
            setSheetRows([]);
            setPreview(null);
            onError(prepared.error);
            return;
        }
        setFileName(file.name);
        setCsv(prepared.csv);
        setSheetRows(prepared.rows);
        setPreview(null);
        try {
            const result = await marketingService.importContacts(restaurantId, { csv: prepared.csv, mapping: LEAD_IMPORT_MAPPING, commit: false });
            setPreview(result);
        } catch (error) { onError(marketingError(error)); }
    };
    const downloadProblems = () => {
        const failed = (preview?.preview || []).filter((row) => row.status !== 'ready');
        const text = ['row,phone,reason', ...failed.map((row) => `${row.row},${csvCell(row.phone || '')},${csvCell(row.reason || '')}`)].join('\n');
        downloadText('import-problems.csv', text);
    };
    const addToList = async () => {
        try {
            const result = await marketingService.assignGroup(restaurantId, {
                tag: listName,
                contactIds: picked,
                allMatching: picked.length === 0,
                q,
            });
            onNotice(`Added ${result.updated} contacts to ${result.tag}.`);
            setPicked([]);
            load();
        } catch (error) { onError(marketingError(error)); }
    };

    const runImport = async () => {
        setImporting(true);
        try {
            const result = await marketingService.importContacts(restaurantId, { csv, mapping: LEAD_IMPORT_MAPPING, commit: true });
            setPreview(result);
            onNotice(`Imported ${result.imported} contacts. Each one is opted in.`);
            setCsv('');
            setFileName('');
            setSheetRows([]);
            load();
        } catch (error) { onError(marketingError(error)); }
        finally { setImporting(false); }
    };

    const download = async () => {
        try {
            const text = await marketingService.exportContacts(restaurantId);
            downloadText('opted-in-contacts.csv', text);
        } catch (error) { onError(marketingError(error)); }
    };
    const readyCount = preview?.summary?.eligible || 0;

    return (
        <div className="space-y-4">
            <section className="rounded-2xl border border-border bg-white p-5">
                <div className="flex flex-wrap items-start gap-3">
                    <div className="mr-auto">
                        <h2 className="font-heading font-semibold text-lg">Import leads</h2>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xl">Upload the template. First name, last name, and phone number are required. Everyone in the file is opted in for marketing.</p>
                    </div>
                    <button type="button" onClick={() => downloadText('campaign-leads-template.csv', LEAD_TEMPLATE)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm cursor-pointer">
                        <Download className="h-4 w-4" /> Download template
                    </button>
                </div>
                <label className="mt-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-[#f4f6fb] px-6 py-8 text-center cursor-pointer">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{fileName || 'Choose a CSV or Excel file'}</span>
                    <span className="text-xs text-muted-foreground">Columns: First name, Last name, Phone number, Email ID</span>
                    <input type="file" accept=".csv,.xlsx,.xls,text/csv" className="hidden" onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        if (file) readFile(file).catch((error) => onError(error.message));
                    }} />
                </label>
                {sheetRows.length > 0 && (
                    <div className="mt-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm text-muted-foreground mr-auto">
                                {preview ? `${preview.summary.rows} rows · ${readyCount} ready to import · ${preview.summary.duplicate || 0} already saved · ${preview.summary.rejected || 0} skipped` : 'Checking the file…'}
                            </p>
                            <button type="button" disabled={!csv || !readyCount || importing} onClick={runImport} className="px-3 py-2 rounded-lg bg-foreground text-white text-sm cursor-pointer disabled:opacity-40">
                                {importing ? 'Importing…' : `Import ${readyCount || ''}`.trim()}
                            </button>
                            <button type="button" disabled={!preview?.preview?.some((row) => row.status !== 'ready')} onClick={downloadProblems} className="px-3 py-2 rounded-lg border border-border text-sm cursor-pointer disabled:opacity-40">Download problems</button>
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full text-sm">
                                <thead className="text-left text-xs text-muted-foreground bg-muted/40">
                                    <tr>{['First name', 'Last name', 'Phone number', 'Email ID'].map((label) => <th key={label} className="px-3 py-2 font-medium">{label}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {sheetRows.slice(0, 8).map((row, index) => (
                                        <tr key={`${row.phone}-${index}`} className="border-t border-border">
                                            <td className="px-3 py-2">{row.firstName || '—'}</td>
                                            <td className="px-3 py-2">{row.lastName || '—'}</td>
                                            <td className="px-3 py-2">{row.phone || '—'}</td>
                                            <td className="px-3 py-2">{row.email || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {sheetRows.length > 8 && <p className="text-xs text-muted-foreground">Showing the first 8 of {sheetRows.length} rows.</p>}
                        {preview?.preview?.filter((row) => row.status !== 'ready').slice(0, 6).map((row) => (
                            <p key={`${row.row}-${row.reason}`} className="text-xs text-rose-700">Row {row.row}: {row.reason === 'duplicate' ? 'already saved' : row.reason === 'invalid_phone' || row.reason === 'missing_phone' ? 'phone number is not valid' : row.reason} {row.phone || ''}</p>
                        ))}
                    </div>
                )}
            </section>
            <form onSubmit={add} className="rounded-2xl border border-border bg-white p-4">
                <h2 className="font-heading font-semibold mb-3">Add one lead</h2>
                <div className="grid md:grid-cols-[1fr_1fr_1fr_auto] gap-2">
                    <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Name" className="px-3 py-2 rounded-lg border border-border text-sm" />
                    <input required value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} placeholder="WhatsApp number" className="px-3 py-2 rounded-lg border border-border text-sm" />
                    <input value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} placeholder="Email" className="px-3 py-2 rounded-lg border border-border text-sm" />
                    <button className="px-4 py-2 rounded-lg bg-foreground text-white text-sm cursor-pointer" type="submit">Add lead</button>
                </div>
            </form>
            <section className="rounded-2xl border border-border bg-white overflow-hidden">
                <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-border">
                    <input value={q} onChange={(event) => { setOffset(0); setQ(event.target.value); }} placeholder="Search name or number" className="px-3 py-2 rounded-lg border border-border text-sm flex-1 min-w-[180px]" />
                    <select value={tag} onChange={(event) => { setOffset(0); setTag(event.target.value); }} className="px-3 py-2 rounded-lg border border-border text-sm">
                        <option value="">All lists</option>
                        {knownTags.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                    <input value={listName} onChange={(event) => setListName(event.target.value)} placeholder="List name" className="px-3 py-2 rounded-lg border border-border text-sm w-36" />
                    <button type="button" disabled={!listName.trim()} onClick={addToList} className="px-3 py-2 rounded-lg border border-border text-sm cursor-pointer disabled:opacity-40">{picked.length ? `Add ${picked.length} to list` : 'Add matching to list'}</button>
                    <button type="button" onClick={download} className="px-3 py-2 rounded-lg border border-border text-sm cursor-pointer">Export</button>
                </div>
                {loading ? <p className="p-4 text-sm text-muted-foreground">Loading leads…</p> : rows.length === 0 ? <p className="p-8 text-sm text-center text-muted-foreground">No leads yet. Import a file or add someone above.</p> : (
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs text-muted-foreground bg-muted/40"><tr>{['', 'Name', 'Phone', 'Email', 'Lists'].map((label) => <th key={label || 'pick'} className="px-3 py-2 font-medium">{label}</th>)}</tr></thead>
                        <tbody>
                            {rows.map((contact) => (
                                <tr key={contact.id} className="border-t border-border">
                                    <td className="px-3 py-2"><input type="checkbox" checked={picked.includes(contact.id)} onChange={(event) => setPicked(event.target.checked ? [...picked, contact.id] : picked.filter((id) => id !== contact.id))} /></td>
                                    <td className="px-3 py-2">{contact.name}</td>
                                    <td className="px-3 py-2">{contact.phoneE164}</td>
                                    <td className="px-3 py-2">{contact.email || '—'}</td>
                                    <td className="px-3 py-2">{(contact.tags || []).join(', ') || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <div className="px-4 py-3 flex justify-between text-xs text-muted-foreground border-t border-border">
                    <span>{total} leads</span>
                    <div className="flex gap-2">
                        <button type="button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))} className="px-2 py-1 border border-border rounded disabled:opacity-40 cursor-pointer">Previous</button>
                        <button type="button" disabled={offset + 50 >= total} onClick={() => setOffset(offset + 50)} className="px-2 py-1 border border-border rounded disabled:opacity-40 cursor-pointer">Next</button>
                    </div>
                </div>
            </section>
        </div>
    );
}

function Campaigns({ restaurantId, onError, onNotice }) {
    const [params] = useSearchParams();
    const selected = params.get('id');
    const [campaigns, setCampaigns] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [wizard, setWizard] = useState(null);
    const [detail, setDetail] = useState(null);
    const [recipients, setRecipients] = useState([]);
    const [leadFile, setLeadFile] = useState('');
    const [leadSource, setLeadSource] = useState('');
    const [leadConfirm, setLeadConfirm] = useState(false);
    const [leadQuery, setLeadQuery] = useState('');
    const [stats, setStats] = useState(null);

    const load = () => {
        setLoading(true);
        Promise.all([marketingService.campaigns(restaurantId), marketingService.templates(restaurantId), marketingService.overview(restaurantId)])
            .then(([campaignResult, templateResult, overview]) => {
                setCampaigns(campaignResult.campaigns || []);
                setTemplates(templateResult.templates || []);
                setStats(overview);
            })
            .catch((error) => onError(marketingError(error)))
            .finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, [restaurantId]);

    useEffect(() => {
        if (!selected) { setDetail(null); return undefined; }
        let live = true;
        const pull = () => {
            marketingService.campaign(restaurantId, selected).then((row) => { if (live) setDetail(row); }).catch((error) => onError(marketingError(error)));
            marketingService.recipients(restaurantId, selected, { limit: 50 }).then((row) => { if (live) setRecipients(row.recipients || []); }).catch(() => {});
        };
        const timer = { id: null };
        const start = () => {
            if (timer.id) clearInterval(timer.id);
            if (document.hidden) return;
            pull();
            timer.id = setInterval(() => { if (!document.hidden) pull(); }, 20000);
        };
        const onVisible = () => { if (document.hidden) { clearInterval(timer.id); timer.id = null; } else start(); };
        start();
        document.addEventListener('visibilitychange', onVisible);
        return () => { live = false; clearInterval(timer.id); document.removeEventListener('visibilitychange', onVisible); };
    }, [restaurantId, selected]);

    const approved = templates.filter((item) => item.status === 'approved' && item.category === 'MARKETING');

    if (selected && detail) {
        const metrics = detail.metrics || {};
        const act = async (action) => {
            try {
                await marketingService.control(restaurantId, selected, action);
                onNotice(`Campaign ${action} requested.`);
            } catch (error) { onError(marketingError(error)); }
        };
        const templateName = templates.find((item) => item.id === detail.templateId)?.name || 'No template';
        const importLeads = async () => {
            try {
                const result = await marketingService.importLeads(restaurantId, selected, {
                    csv: leadFile,
                    confirm: leadConfirm,
                    optInSource: leadSource,
                });
                const queued = result.waitingForLaunch
                    ? 'They will be included when this campaign is launched.'
                    : result.queued
                        ? `${result.queued} queued to receive the approved template.`
                        : 'Nobody new was queued. The campaign needs an approved template and must still be sending.';
                onNotice(`Imported ${result.imported} leads. ${queued}`);
                setLeadFile('');
                setLeadConfirm(false);
                const row = await marketingService.recipients(restaurantId, selected);
                setRecipients(row.recipients || []);
            } catch (error) { onError(marketingError(error)); }
        };
        const visibleRecipients = recipients.filter((row) => `${row.name || ''} ${row.phoneE164 || ''}`.toLowerCase().includes(leadQuery.trim().toLowerCase()));
        return (
            <section className="space-y-4">
                <button type="button" onClick={() => { window.location.assign('/marketing?tab=campaigns'); }} className="text-sm text-muted-foreground cursor-pointer">Campaigns <span className="mx-1">/</span> <span className="text-foreground">{detail.name}</span></button>
                <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-heading text-xl mr-auto">{detail.name}</h2>
                        <Pill status={detail.status}>{detail.status}</Pill>
                        <Pill>{templateName}</Pill>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                        <label className="px-3 py-2 rounded-xl border border-border text-sm cursor-pointer bg-white">Upload CSV
                            <input type="file" accept=".csv,.xlsx,.xls,text/csv" className="hidden" onChange={async (event) => {
                                const file = event.target.files?.[0];
                                setLeadFile(file ? await fileToCsv(file) : '');
                            }} />
                        </label>
                        <input value={leadSource} onChange={(event) => setLeadSource(event.target.value)} placeholder="Where they opted in" className="px-3 py-2 rounded-xl border text-sm" />
                        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={leadConfirm} onChange={(event) => setLeadConfirm(event.target.checked)} /> These people opted in</label>
                        <button type="button" disabled={!leadFile || !leadConfirm || !leadSource.trim()} onClick={importLeads} className="px-3 py-2 rounded-xl bg-foreground text-white text-sm cursor-pointer disabled:opacity-40">Import leads</button>
                        <button type="button" onClick={() => act('pause')} className="px-3 py-2 rounded-xl border text-sm cursor-pointer">Pause</button>
                        <button type="button" onClick={() => act('resume')} className="px-3 py-2 rounded-xl border text-sm cursor-pointer">Resume</button>
                        <button type="button" onClick={() => act('cancel')} className="px-3 py-2 rounded-xl border text-sm cursor-pointer">Cancel</button>
                        <button type="button" onClick={() => act('retry')} className="px-3 py-2 rounded-xl border text-sm cursor-pointer">Retry failed</button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Columns: First name, Last name, and Phone number. A person who already received this template is not sent it again.</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        {[['Total', metrics.total || recipients.length], ['Sent', metrics.sent], ['Read', metrics.read], ['Replies', metrics.replied]].map(([label, value]) => (
                            <div key={label} className="rounded-xl bg-[#f4f6fb] px-3 py-2"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="text-xl font-heading">{value ?? 0}</p></div>
                        ))}
                    </div>
                </div>
                <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
                    <div className="p-3 border-b border-border">
                        <input value={leadQuery} onChange={(event) => setLeadQuery(event.target.value)} placeholder="Search by name or phone" className="w-full px-3 py-2 rounded-xl border text-sm" />
                    </div>
                    {visibleRecipients.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No leads in this campaign yet.</p> : (
                        <table className="w-full text-sm">
                            <thead className="text-left text-[11px] uppercase tracking-wide text-muted-foreground bg-[#f8f9fc]"><tr>{['Name', 'Phone', 'Status', 'Updated'].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
                            <tbody>{visibleRecipients.slice(0, 50).map((row) => <tr key={row.id} className="border-t border-border"><td className="px-4 py-3 font-medium">{row.name || '—'}</td><td className="px-4 py-3 text-muted-foreground">{row.phoneE164}</td><td className="px-4 py-3"><Pill status={row.status}>{row.status}</Pill></td><td className="px-4 py-3 text-muted-foreground">{when(row.updatedAt || row.createdAt) || '—'}</td></tr>)}</tbody>
                        </table>
                    )}
                </div>
            </section>
        );
    }

    const statCards = [
        ['Campaigns', stats?.totalCampaigns ?? campaigns.length],
        ['Leads', stats?.totalContacts ?? '—'],
        ['Sent', stats?.messagesSent ?? '—'],
        ['Replies', stats?.repliesReceived ?? '—'],
    ];
    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <button type="button" onClick={() => setWizard({ step: 1, name: '', description: '', purpose: '', sendAt: '', audience: { type: 'all', tags: '', contactIds: [] }, templateId: '', mapping: [], preview: null, confirm: false })} className="px-4 py-2.5 rounded-xl bg-foreground text-white text-sm cursor-pointer shadow-sm">+ Create campaign</button>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {statCards.map(([label, value]) => (
                    <article key={label} className="rounded-2xl border border-border bg-white px-4 py-4 shadow-sm">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                        <p className="font-heading text-3xl mt-2">{value}</p>
                    </article>
                ))}
            </div>
            {wizard && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-start justify-center p-4 overflow-y-auto">
                    <div className="w-full max-w-lg my-10">
                        <CampaignWizard restaurantId={restaurantId} wizard={wizard} setWizard={setWizard} approved={approved} onError={onError} onNotice={onNotice} onDone={() => { setWizard(null); load(); }} />
                    </div>
                </div>
            )}
            {loading ? <p className="text-sm text-muted-foreground">Loading campaigns…</p> : campaigns.length === 0 ? <p className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted-foreground">No campaigns yet.</p> : (
                <div className="grid md:grid-cols-2 gap-4">
                    {campaigns.map((item) => {
                        const template = templates.find((row) => row.id === item.templateId);
                        return (
                            <a key={item.id} href={`/marketing?tab=campaigns&id=${item.id}`} className="rounded-2xl border border-border bg-white p-4 shadow-sm hover:border-foreground/20">
                                <div className="flex items-start gap-2">
                                    <h3 className="font-heading font-semibold text-base mr-auto">{item.name}</h3>
                                    <Pill status={item.status}>{item.status}</Pill>
                                </div>
                                <p className="mt-2 text-xs rounded-full bg-slate-100 text-slate-600 inline-flex px-2 py-0.5">{template ? template.name : 'No template yet'}</p>
                                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                                    {[['Total', item.summary?.eligible ?? '—'], ['Sent', item.metrics?.sent ?? 0], ['Read', item.metrics?.read ?? 0], ['Replies', item.metrics?.replied ?? 0]].map(([label, value]) => (
                                        <div key={label}><p className="font-heading text-lg">{value}</p><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p></div>
                                    ))}
                                </div>
                                <p className="mt-3 text-[11px] text-muted-foreground">{when(item.createdAt) ? `Created ${when(item.createdAt)}` : item.status}</p>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function CampaignWizard({ restaurantId, wizard, setWizard, approved, onError, onNotice, onDone }) {
    const template = approved.find((item) => item.id === wizard.templateId);
    const variables = useMemo(() => {
        const found = new Set();
        const re = /\{\{(\d+)\}\}/g;
        let match = re.exec(template?.body || '');
        while (match) { found.add(Number(match[1])); match = re.exec(template?.body || ''); }
        return [...found];
    }, [template]);

    const [picker, setPicker] = useState('');
    const [found, setFound] = useState([]);
    const audiencePayload = wizard.audience.type === 'tags'
        ? { type: 'tags', tags: String(wizard.audience.tags || '').split(',').map((item) => item.trim()).filter(Boolean) }
        : wizard.audience.type === 'ids'
            ? { type: 'ids', contactIds: wizard.audience.contactIds || [] }
            : { type: 'all' };
    const searchPeople = async () => {
        try {
            const result = await marketingService.contacts(restaurantId, { q: picker, optIn: 'true', limit: 20 });
            setFound(result.contacts || []);
        } catch (error) { onError(marketingError(error)); }
    };

    const preview = async () => {
        try {
            const result = await marketingService.preview(restaurantId, audiencePayload);
            setWizard({ ...wizard, preview: result });
        } catch (error) { onError(marketingError(error)); }
    };

    const launch = async () => {
        try {
            const created = await marketingService.createCampaign(restaurantId, {
                name: wizard.name,
                description: wizard.description,
                purpose: wizard.purpose,
                templateId: wizard.templateId,
                audience: audiencePayload,
                variableMapping: wizard.mapping,
                sendAt: wizard.sendAt ? new Date(wizard.sendAt).toISOString() : null,
            });
            await marketingService.launch(restaurantId, created.id);
            onNotice('Campaign queued. Messages send in the background.');
            onDone();
        } catch (error) { onError(marketingError(error)); }
    };

    return (
        <section className="rounded-2xl border border-border bg-white p-5 space-y-3 shadow-xl">
            <div className="flex items-start gap-3">
                <div className="mr-auto">
                    <h2 className="font-heading text-lg font-semibold">Create campaign</h2>
                    <p className="text-sm text-muted-foreground">Step {wizard.step} of 4. The assistant replies when someone answers.</p>
                </div>
                <button type="button" onClick={onDone} className="text-muted-foreground cursor-pointer text-lg leading-none">×</button>
            </div>
            {wizard.step === 1 && (
                <div className="grid gap-2">
                    <input value={wizard.name} onChange={(event) => setWizard({ ...wizard, name: event.target.value })} placeholder="Campaign name" className="px-3 py-2 rounded-lg border text-sm" />
                    <input value={wizard.purpose} onChange={(event) => setWizard({ ...wizard, purpose: event.target.value })} placeholder="Purpose" className="px-3 py-2 rounded-lg border text-sm" />
                    <textarea value={wizard.description} onChange={(event) => setWizard({ ...wizard, description: event.target.value })} placeholder="Description" className="px-3 py-2 rounded-lg border text-sm" />
                    <input type="datetime-local" value={wizard.sendAt} onChange={(event) => setWizard({ ...wizard, sendAt: event.target.value })} className="px-3 py-2 rounded-lg border text-sm" />
                </div>
            )}
            {wizard.step === 2 && (
                <div className="space-y-2">
                    <select value={wizard.audience.type} onChange={(event) => setWizard({ ...wizard, audience: { ...wizard.audience, type: event.target.value, contactIds: wizard.audience.contactIds || [] } })} className="px-3 py-2 rounded-lg border text-sm">
                        <option value="all">All eligible opted-in contacts</option>
                        <option value="tags">By list or tag</option>
                        <option value="ids">Chosen contacts</option>
                    </select>
                    {wizard.audience.type === 'tags' && <input value={wizard.audience.tags} onChange={(event) => setWizard({ ...wizard, audience: { ...wizard.audience, tags: event.target.value } })} placeholder="list name" className="px-3 py-2 rounded-lg border text-sm w-full" />}
                    {wizard.audience.type === 'ids' && (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <input value={picker} onChange={(event) => setPicker(event.target.value)} placeholder="Search opted-in contacts" className="px-3 py-2 rounded-lg border text-sm flex-1" />
                                <button type="button" onClick={searchPeople} className="px-3 py-2 rounded-lg border text-sm cursor-pointer">Search</button>
                            </div>
                            {found.map((contact) => {
                                const selectedIds = wizard.audience.contactIds || [];
                                const on = selectedIds.includes(contact.id);
                                return (
                                    <label key={contact.id} className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={on} onChange={() => setWizard({ ...wizard, audience: { ...wizard.audience, contactIds: on ? selectedIds.filter((id) => id !== contact.id) : [...selectedIds, contact.id] } })} />
                                        {contact.name} · {contact.phoneE164}
                                    </label>
                                );
                            })}
                            <p className="text-xs text-muted-foreground">{(wizard.audience.contactIds || []).length} selected</p>
                        </div>
                    )}
                    <button type="button" onClick={preview} className="px-3 py-2 rounded-lg border text-sm cursor-pointer">Estimate audience</button>
                    {wizard.preview && <p className="text-sm">Eligible {wizard.preview.summary.eligible} · excluded {wizard.preview.summary.excluded} · opted out {wizard.preview.summary.optedOut} · invalid {wizard.preview.summary.invalid}. Estimated cost: {wizard.preview.estimatedCost == null ? 'not available from Meta' : wizard.preview.estimatedCost}.</p>}
                </div>
            )}
            {wizard.step === 3 && (
                <div className="space-y-2">
                    {approved.length === 0 ? <p className="text-sm text-muted-foreground">No approved marketing templates yet.</p> : (
                        <select value={wizard.templateId} onChange={(event) => setWizard({ ...wizard, templateId: event.target.value, mapping: [] })} className="px-3 py-2 rounded-lg border text-sm">
                            <option value="">Choose a template</option>
                            {approved.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    )}
                    {template && (
                        <div className="max-w-sm rounded-lg bg-[#d9fdd3] px-3 py-2 text-sm whitespace-pre-wrap">
                            <p className="text-[10px] text-muted-foreground mb-1">Preview</p>
                            {previewTemplate(template.body, wizard.mapping)}
                        </div>
                    )}
                    {variables.map((index) => (
                        <label key={index} className="block text-xs text-muted-foreground">Variable {index}
                            <select value={wizard.mapping.find((item) => item.index === index)?.source || ''} onChange={(event) => {
                                const source = event.target.value;
                                const mapping = wizard.mapping.filter((item) => item.index !== index).concat(source ? [{ index, source, value: source === 'custom' ? '' : undefined }] : []);
                                setWizard({ ...wizard, mapping });
                            }} className="mt-1 w-full px-2 py-2 rounded-lg border text-sm text-foreground">
                                <option value="">Choose</option>
                                <option value="contact.name">Contact name</option>
                                <option value="restaurant.name">Restaurant name</option>
                                <option value="custom">Fixed text</option>
                            </select>
                            {wizard.mapping.find((item) => item.index === index)?.source === 'custom' && (
                                <input value={wizard.mapping.find((item) => item.index === index)?.value || ''} onChange={(event) => {
                                    const mapping = wizard.mapping.map((item) => item.index === index ? { ...item, value: event.target.value } : item);
                                    setWizard({ ...wizard, mapping });
                                }} placeholder="Text to send" className="mt-1 w-full px-2 py-2 rounded-lg border text-sm text-foreground" />
                            )}
                        </label>
                    ))}
                </div>
            )}
            {wizard.step === 4 && (
                <div className="space-y-2 text-sm">
                    <p>{wizard.name} · {template?.name || 'No template'} · eligible {wizard.preview?.summary?.eligible ?? 'not estimated'}</p>
                    <p className="text-muted-foreground">People without marketing opt-in, opted-out numbers, and invalid numbers are left out. Consent is checked again immediately before each send.</p>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={wizard.confirm} onChange={(event) => setWizard({ ...wizard, confirm: event.target.checked })} /> I confirm this audience opted in and I want to launch.</label>
                </div>
            )}
            <div className="flex gap-2">
                {wizard.step > 1 && <button type="button" onClick={() => setWizard({ ...wizard, step: wizard.step - 1 })} className="px-3 py-2 rounded-lg border text-sm cursor-pointer">Back</button>}
                {wizard.step < 4 && <button type="button" onClick={() => setWizard({ ...wizard, step: wizard.step + 1 })} className="px-3 py-2 rounded-lg bg-foreground text-white text-sm cursor-pointer">Next</button>}
                {wizard.step === 4 && <button type="button" disabled={!wizard.confirm || !wizard.name || !wizard.templateId} onClick={launch} className="px-3 py-2 rounded-lg bg-foreground text-white text-sm cursor-pointer disabled:opacity-40">Launch</button>}
                <button type="button" onClick={onDone} className="px-3 py-2 rounded-lg border text-sm cursor-pointer">Cancel</button>
            </div>
        </section>
    );
}

function Templates({ restaurantId, onError, onNotice }) {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const emptyDraft = { name: '', category: 'MARKETING', language: 'en', body: '', footer: '', examples: '', header: '', button: '' };
    const [draft, setDraft] = useState(emptyDraft);
    const [draftId, setDraftId] = useState(null);
    const issues = templateDraftIssues(draft);
    const update = (patch) => {
        onError('');
        onNotice('');
        setDraft({ ...draft, ...patch });
    };
    const load = () => {
        setLoading(true);
        marketingService.templates(restaurantId).then((result) => setTemplates(result.templates || [])).catch((error) => onError(marketingError(error))).finally(() => setLoading(false));
    };
    useEffect(() => { load(); }, [restaurantId]);
    const save = async (submit) => {
        const payload = {
            ...draft,
            examples: draft.examples.split('|').map((item) => item.trim()).filter(Boolean),
            header: draft.header ? { format: 'TEXT', text: draft.header } : null,
            buttons: draft.button ? [{ type: 'QUICK_REPLY', text: draft.button }] : [],
        };
        const create = () => marketingService.saveTemplate(restaurantId, payload);
        try {
            let saved;
            try {
                saved = draftId
                    ? await marketingService.updateTemplate(restaurantId, draftId, payload)
                    : await create();
            } catch (error) {
                if (!(draftId && error?.response?.status === 404)) throw error;
                saved = await create();
            }
            if (!saved?.id) throw new Error('Template was not saved.');
            setDraftId(saved.id);
            if (submit) {
                await marketingService.submitTemplate(restaurantId, saved.id);
                setDraftId(null);
                setDraft(emptyDraft);
                onNotice('Submitted to Meta. Status stays pending until Meta approves it.');
            } else {
                onNotice('Draft saved.');
            }
        } catch (error) { onError(marketingError(error)); }
        finally { load(); }
    };
    return (
        <div className="space-y-4">
            <section className="rounded-2xl border border-border bg-white p-4 grid gap-2">
                <input value={draft.name} onChange={(event) => update({ name: event.target.value })} placeholder="template_name" className="px-3 py-2 rounded-lg border text-sm" />
                <div className="flex gap-2">
                    <select value={draft.category} onChange={(event) => update({ category: event.target.value })} className="px-3 py-2 rounded-lg border text-sm"><option>MARKETING</option><option>UTILITY</option><option>AUTHENTICATION</option></select>
                    <input value={draft.language} onChange={(event) => update({ language: event.target.value })} className="px-3 py-2 rounded-lg border text-sm w-28" />
                </div>
                <input value={draft.header} onChange={(event) => update({ header: event.target.value })} placeholder="Header text (optional)" className="px-3 py-2 rounded-lg border text-sm" />
                <textarea value={draft.body} onChange={(event) => update({ body: event.target.value })} placeholder="Hi {{1}}, welcome to {{2}}" className="px-3 py-2 rounded-lg border text-sm" />
                <input value={draft.examples} onChange={(event) => update({ examples: event.target.value })} placeholder="Example for {{1}}" className="px-3 py-2 rounded-lg border text-sm" />
                <input value={draft.footer} onChange={(event) => update({ footer: event.target.value })} placeholder="Footer" className="px-3 py-2 rounded-lg border text-sm" />
                <input value={draft.button} onChange={(event) => update({ button: event.target.value })} placeholder="Quick reply button (optional, max 25)" className="px-3 py-2 rounded-lg border text-sm" />
                {issues.length > 0 && <p className="text-sm rounded-lg px-3 py-2 bg-rose-50 text-rose-700">{issues.join(' ')}</p>}
                <div className="max-w-sm rounded-lg bg-[#d9fdd3] px-3 py-2 text-sm whitespace-pre-wrap">
                    {draft.header && <p className="font-medium">{draft.header}</p>}
                    <p>{previewTemplate(draft.body, draft.examples.split('|').filter(Boolean).map((value, index) => ({ index: index + 1, source: 'custom', value }))) || 'Message preview'}</p>
                    {draft.footer && <p className="text-xs text-muted-foreground mt-1">{draft.footer}</p>}
                    {draft.button && <p className="text-xs text-center border-t border-black/10 mt-2 pt-1">{draft.button}</p>}
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => save(false)} className="px-3 py-2 rounded-lg border text-sm cursor-pointer">Save draft</button>
                    <button type="button" disabled={issues.length > 0} onClick={() => save(true)} className="px-3 py-2 rounded-lg bg-foreground text-white text-sm cursor-pointer disabled:opacity-40">Submit to Meta</button>
                    <button type="button" onClick={() => marketingService.syncTemplates(restaurantId).then(() => { onNotice('Statuses refreshed from Meta.'); load(); }).catch((error) => onError(marketingError(error)))} className="px-3 py-2 rounded-lg border text-sm cursor-pointer">Refresh from Meta</button>
                </div>
            </section>
            <section className="rounded-2xl border border-border bg-white overflow-hidden">
                {loading ? <p className="p-4 text-sm">Loading templates…</p> : templates.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No templates yet.</p> : (
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs text-muted-foreground bg-muted/40"><tr>{['Name', 'Category', 'Language', 'Status', 'Rejection', ''].map((label) => <th key={label || 'x'} className="px-3 py-2">{label}</th>)}</tr></thead>
                        <tbody>
                            {templates.map((item) => (
                                <tr key={item.id} className="border-t border-border">
                                    <td className="px-3 py-2">{item.name}</td>
                                    <td className="px-3 py-2">{item.category}</td>
                                    <td className="px-3 py-2">{item.language}</td>
                                    <td className="px-3 py-2">{TEMPLATE_STATUS[item.status] || item.status}</td>
                                    <td className="px-3 py-2">{item.rejectionReason || '—'}</td>
                                    <td className="px-3 py-2">{['draft', 'rejected'].includes(item.status) && <button type="button" className="underline cursor-pointer" onClick={() => marketingService.deleteTemplate(restaurantId, item.id).then(() => { if (item.id === draftId) setDraftId(null); load(); }).catch((error) => onError(marketingError(error)))}>Delete</button>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}

function chatLabel(item) {
    const replied = Boolean(item.lastCustomerMessageAt) || ['customer', 'ai', 'human'].includes(item.lastMessageKind);
    return replied ? 'Responded' : 'Template sent';
}

function messageLabel(message) {
    if (message.direction === 'inbound') return 'Customer';
    if (message.kind === 'template') return message.templateName ? `Template · ${message.templateName}` : 'Template';
    if (message.actor === 'ai') return 'AI';
    return 'You';
}

function Inbox({ restaurantId, onBack, onError, onNotice }) {
    const [list, setList] = useState([]);
    const [currentId, setCurrentId] = useState('');
    const [thread, setThread] = useState(null);
    const [text, setText] = useState('');
    const [query, setQuery] = useState('');
    const [handler, setHandler] = useState('');
    const [campaignId, setCampaignId] = useState('');
    const [campaigns, setCampaigns] = useState([]);
    const [switching, setSwitching] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const threadEnd = useRef(null);
    const loadList = () => marketingService.conversations(restaurantId, {
        q: query,
        handler: handler || undefined,
        campaignId: campaignId || undefined,
        limit: 50,
    }).then((result) => setList(result.conversations || [])).catch((error) => onError(marketingError(error)));
    useEffect(() => { loadList(); }, [restaurantId, query, handler, campaignId]);
    useEffect(() => {
        marketingService.campaigns(restaurantId).then((result) => setCampaigns(result.campaigns || [])).catch(() => setCampaigns([]));
    }, [restaurantId]);
    useEffect(() => {
        if (!currentId) return undefined;
        let live = true;
        const timer = { id: null };
        const pull = () => {
            if (document.hidden) return;
            marketingService.conversation(restaurantId, currentId, { limit: 30 }).then((row) => {
                if (!live) return;
                setThread((prev) => {
                    if (!prev || prev.id !== row.id) return row;
                    const byId = new Map();
                    for (const message of row.messages || []) byId.set(message.id, message);
                    for (const message of prev.messages || []) if (!byId.has(message.id)) byId.set(message.id, message);
                    const messages = [...byId.values()].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
                    const keptOlder = (prev.messages || []).length > (row.messages || []).length;
                    return { ...row, messages, nextBefore: keptOlder ? prev.nextBefore : row.nextBefore };
                });
            }).catch((error) => onError(marketingError(error)));
        };
        const start = () => {
            if (timer.id) clearInterval(timer.id);
            if (document.hidden) return;
            pull();
            timer.id = setInterval(pull, 20000);
        };
        const onVisible = () => { if (document.hidden) { clearInterval(timer.id); timer.id = null; } else start(); };
        start();
        document.addEventListener('visibilitychange', onVisible);
        return () => { live = false; clearInterval(timer.id); document.removeEventListener('visibilitychange', onVisible); };
    }, [restaurantId, currentId]);
    useEffect(() => {
        threadEnd.current?.scrollIntoView({ block: 'end' });
    }, [thread?.id, thread?.messages?.length]);
    const mode = async (next) => {
        setSwitching(true);
        try {
            await marketingService.setMode(restaurantId, currentId, next);
            onNotice(next === 'ai' ? 'AI will reply to the next customer message.' : 'AI is off. You can type in this chat.');
            const row = await marketingService.conversation(restaurantId, currentId);
            setThread(row);
            loadList();
        } catch (error) { onError(marketingError(error)); }
        finally { setSwitching(false); }
    };
    const send = async () => {
        try {
            await marketingService.sendMessage(restaurantId, currentId, text);
            setText('');
            setThread(await marketingService.conversation(restaurantId, currentId));
        } catch (error) { onError(marketingError(error)); }
    };
    return (
        <div className="flex h-full min-h-0 bg-white">
            <aside className="w-[340px] shrink-0 border-r border-border bg-white overflow-hidden flex flex-col min-h-0">
                <div className="px-4 pt-4 pb-3 space-y-3 border-b border-border">
                    <div className="flex items-center gap-2">
                        <button type="button" aria-label="Back to marketing" onClick={onBack} className="p-1 -ml-1 rounded-md text-foreground cursor-pointer hover:bg-muted">
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <h2 className="font-heading font-semibold text-base">WhatsApp Chats</h2>
                    </div>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or number" className="w-full px-3 py-2 rounded-lg border text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                        <select value={campaignId} onChange={(event) => setCampaignId(event.target.value)} className="min-w-0 w-full px-2 py-2 rounded-lg border text-sm">
                            <option value="">All campaigns</option>
                            {campaigns.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                        <select value={handler} onChange={(event) => setHandler(event.target.value)} className="min-w-0 w-full px-2 py-2 rounded-lg border text-sm">
                            <option value="">AI and people</option>
                            <option value="ai">AI handling</option>
                            <option value="human">Taken over</option>
                        </select>
                    </div>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                {list.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No chats yet. A chat appears here when a template is sent or someone replies.</p> : list.map((item) => {
                    const label = chatLabel(item);
                    return (
                    <button key={item.id} type="button" onClick={() => { setCurrentId(item.id); setShowDetails(false); }} className={`w-full text-left px-3 py-3 border-b border-border cursor-pointer ${currentId === item.id ? 'bg-[#f4f6fb]' : ''}`}>
                        <span className="flex items-start gap-2">
                            <span className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-slate-200 text-[11px] font-medium flex items-center justify-center">{initials(item.name || item.phoneDigits)}</span>
                            <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2">
                                    <span className="block text-sm font-medium truncate">{item.name || item.phoneDigits}</span>
                                    <span className="ml-auto shrink-0"><Pill status={label === 'Responded' ? 'replied' : 'pending'}>{label}</Pill></span>
                                </span>
                                <span className="block text-xs text-muted-foreground truncate">{item.lastMessage || '—'}</span>
                                <span className="text-[11px] text-muted-foreground">{item.phoneDigits}{item.unread ? ` · ${item.unread} new` : ''}{item.updatedAt ? ` · ${when(item.updatedAt)}` : ''}</span>
                            </span>
                        </span>
                    </button>
                    );
                })}
                </div>
            </aside>
            <section className="flex-1 min-w-0 bg-white flex flex-col min-h-0 h-full">
                {!thread ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                        <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                            <MessageCircle className="h-7 w-7 text-emerald-600" />
                        </div>
                        <p className="mt-4 font-heading font-semibold">WhatsApp chats</p>
                        <p className="mt-1 max-w-xs text-sm text-muted-foreground">Select a conversation to read the template and every reply, or send a message yourself.</p>
                    </div>
                ) : (
                    <>
                        <div className="px-4 py-3 border-b border-border flex flex-wrap gap-3 items-center">
                            <div className="mr-auto min-w-0 relative">
                                <div className="flex items-center gap-1">
                                    <p className="font-medium text-sm truncate">{thread.name}</p>
                                    <button type="button" aria-label="Customer details" aria-expanded={showDetails} onClick={() => setShowDetails((open) => !open)} className={`p-1 rounded-md cursor-pointer ${showDetails ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                                        <Settings className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{thread.windowOpen ? 'Customer replied in the last 24 hours' : 'Waiting for a customer reply'}</p>
                                {showDetails && (
                                    <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-border bg-white p-3 text-sm shadow-lg space-y-2">
                                        <p className="font-medium">{thread.name || 'Guest'}</p>
                                        <p className="text-xs text-muted-foreground">{thread.contact?.phoneE164 || thread.phoneDigits}</p>
                                        <p className="text-xs">{thread.handler === 'ai' ? 'AI is replying' : 'You are replying'}</p>
                                        <p className="text-xs">Opt-in: {thread.contact?.optIn ? 'Yes' : 'No'}</p>
                                        <p className="text-xs break-all">Campaign: {campaigns.find((item) => item.id === thread.campaignId)?.name || thread.campaignId || '—'}</p>
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-medium">{thread.handler === 'ai' ? 'AI on' : 'AI off'}</span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={thread.handler === 'ai'}
                                aria-label="AI replies"
                                disabled={switching}
                                onClick={() => mode(thread.handler === 'ai' ? 'human' : 'ai')}
                                className={`relative h-7 w-12 shrink-0 rounded-full cursor-pointer disabled:opacity-50 ${thread.handler === 'ai' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            >
                                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${thread.handler === 'ai' ? 'left-5' : 'left-0.5'}`} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#ece5dd]">
                            {thread.nextBefore && (
                                <button
                                    type="button"
                                    className="block mx-auto text-xs underline cursor-pointer"
                                    onClick={() => marketingService.conversation(restaurantId, currentId, { limit: 30, before: thread.nextBefore }).then((older) => {
                                        setThread((prev) => {
                                            if (!prev) return older;
                                            const byId = new Map();
                                            for (const message of older.messages || []) byId.set(message.id, message);
                                            for (const message of prev.messages || []) byId.set(message.id, message);
                                            const messages = [...byId.values()].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
                                            return { ...prev, messages, nextBefore: older.nextBefore || null };
                                        });
                                    }).catch((error) => onError(marketingError(error)))}
                                >
                                    Earlier messages
                                </button>
                            )}
                            {(thread.messages || []).length === 0 ? <p className="text-sm text-muted-foreground">No messages in this chat yet.</p> : (thread.messages || []).map((message) => (
                                <div key={message.id} className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${message.direction === 'outbound' ? 'ml-auto bg-[#d9fdd3]' : 'bg-white'}`}>
                                    <p className="text-[10px] font-medium text-muted-foreground">{messageLabel(message)}</p>
                                    <p className="whitespace-pre-wrap">{message.body}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">{when(message.createdAt)}{message.status ? ` · ${message.status}` : ''}</p>
                                </div>
                            ))}
                            <div ref={threadEnd} />
                        </div>
                        <div className="p-3 border-t border-border space-y-2">
                            <p className="text-[11px] text-muted-foreground">
                                {thread.handler === 'ai'
                                    ? 'AI is on. It replies when the customer writes. Turn it off to type yourself.'
                                    : thread.windowOpen
                                        ? 'AI is off. Messages you send go to this customer on WhatsApp.'
                                        : 'AI is off. WhatsApp only allows a typed reply within 24 hours of the customer’s last message.'}
                            </p>
                            <div className="flex gap-2">
                                <input value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (thread.handler !== 'ai' && thread.windowOpen && text.trim()) send(); } }} disabled={thread.handler === 'ai' || !thread.windowOpen} placeholder={thread.handler === 'ai' ? 'Turn AI off to type' : thread.windowOpen ? 'Type a message' : 'Waiting for the customer to reply'} className="flex-1 px-3 py-2 rounded-lg border text-sm disabled:bg-muted" />
                                <button type="button" onClick={send} disabled={thread.handler === 'ai' || !thread.windowOpen || !text.trim()} className="px-3 py-2 rounded-lg bg-foreground text-white text-sm cursor-pointer disabled:opacity-40">Send</button>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}

function SettingsPanel({ restaurantId, onError, onNotice }) {
    const [form, setForm] = useState(null);
    useEffect(() => {
        marketingService.settings(restaurantId).then(setForm).catch((error) => onError(marketingError(error)));
    }, [restaurantId, onError]);
    if (!form) return <p className="text-sm text-muted-foreground">Loading settings…</p>;
    const save = async () => {
        try {
            const saved = await marketingService.saveSettings(restaurantId, form);
            setForm(saved);
            onNotice('Marketing settings saved.');
        } catch (error) { onError(marketingError(error)); }
    };
    return (
        <section className="rounded-2xl border border-border bg-white p-4 space-y-3 max-w-2xl">
            <label className="block text-sm">Menu URL
                <input value={form.menuUrl || ''} onChange={(event) => setForm({ ...form, menuUrl: event.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border text-sm" />
            </label>
            <label className="block text-sm">Default country code
                <input value={form.defaultCountryCode || '27'} onChange={(event) => setForm({ ...form, defaultCountryCode: event.target.value })} className="mt-1 w-32 px-3 py-2 rounded-lg border text-sm" />
            </label>
            <label className="block text-sm">Offers (one per line: title | details)
                <textarea value={(form.offers || []).map((item) => `${item.title} | ${item.details}`).join('\n')} onChange={(event) => setForm({ ...form, offers: event.target.value.split('\n').filter(Boolean).map((line) => { const [title, details] = line.split('|'); return { title: (title || '').trim(), details: (details || '').trim() }; }) })} className="mt-1 w-full px-3 py-2 rounded-lg border text-sm" rows={4} />
            </label>
            <label className="block text-sm">Events (one per line: title | when | details)
                <textarea value={(form.events || []).map((item) => `${item.title} | ${item.when || ''} | ${item.details || ''}`).join('\n')} onChange={(event) => setForm({ ...form, events: event.target.value.split('\n').filter(Boolean).map((line) => { const [title, when, details] = line.split('|'); return { title: (title || '').trim(), when: (when || '').trim(), details: (details || '').trim() }; }) })} className="mt-1 w-full px-3 py-2 rounded-lg border text-sm" rows={4} />
            </label>
            <p className="text-xs text-muted-foreground">The assistant only mentions offers, events, hours, and the menu saved here or on the restaurant record. Meta credentials stay on the server (`WA_TOKEN`, `WA_WABA_ID`).</p>
            <button type="button" onClick={save} className="px-3 py-2 rounded-lg bg-foreground text-white text-sm cursor-pointer">Save</button>
        </section>
    );
}
