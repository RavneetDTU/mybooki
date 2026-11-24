import { Mail, Search, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { emailError, emailService } from '../services/email';
import { useAuthStore } from '../store/useAuthStore';

const EMPTY_STATUS = { connected: false, configured: false, automationEnabled: false };

function initials(name) {
    const parts = String(name || 'G').trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]).join('').toUpperCase();
}

function clock(value) {
    const date = new Date(value || '');
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function visibleBody(value) {
    return String(value || '')
        .split(/\nOn [^\n]{0,180}wrote:\s*/i)[0]
        .split(/\n?\s*\[image: Mailsuite\]/i)[0]
        .split('\n')
        .filter((line) => !line.trim().startsWith('>'))
        .join('\n')
        .trim();
}

function firstLine(value) {
    return visibleBody(value).replace(/\s+/g, ' ').trim();
}

function isBooked(item) {
    return item?.status === 'booked';
}

function metaLabel(item) {
    if (isBooked(item)) return 'Reservation confirmed';
    if (item?.status === 'failed') return 'Reply failed';
    if (item?.status === 'review') return 'Needs a person';
    return 'Awaiting response';
}

export function Email() {
    const { restaurantId } = useAuthStore();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const [status, setStatus] = useState(EMPTY_STATUS);
    const [threads, setThreads] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [thread, setThread] = useState(null);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [confirmDisconnect, setConfirmDisconnect] = useState(false);

    const load = async () => {
        if (!restaurantId) return;
        const next = await emailService.status(restaurantId);
        setStatus(next);
        if (next.connected) {
            const list = await emailService.threads(restaurantId);
            setThreads(list.threads || []);
        } else {
            setThreads([]);
            setThread(null);
        }
    };

    useEffect(() => {
        if (params.get('connected') === '1') setNotice('Gmail connected.');
        if (params.get('error')) setError('Gmail connection was not completed.');
        if (params.get('connected') || params.get('error')) setParams({}, { replace: true });
    }, []);

    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(() => setNotice(''), 2500);
        return () => clearTimeout(timer);
    }, [notice]);

    useEffect(() => {
        if (!restaurantId) return undefined;
        let live = true;
        const start = async () => {
            setLoading(true);
            try {
                await load();
                if (live) {
                    setError('');
                    setReady(true);
                }
            } catch (err) {
                if (live) setError(emailError(err));
            } finally {
                if (live) setLoading(false);
            }
        };
        start();
        const timer = setInterval(() => {
            load().catch((err) => setError(emailError(err)));
        }, 20000);
        return () => {
            live = false;
            clearInterval(timer);
        };
    }, [restaurantId]);

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return threads.filter((item) => {
            if (filter === 'booked' && !isBooked(item)) return false;
            if (filter === 'waiting' && isBooked(item)) return false;
            if (!needle) return true;
            const haystack = `${item.customerName || ''} ${item.customerEmail || ''} ${item.subject || ''} ${item.preview || ''}`.toLowerCase();
            return haystack.includes(needle);
        });
    }, [threads, query, filter]);

    useEffect(() => {
        if (!visible.length) return;
        if (!visible.some((item) => item.threadId === selectedId)) setSelectedId(visible[0].threadId);
    }, [visible, selectedId]);

    useEffect(() => {
        if (!restaurantId || !selectedId || !status.connected) return undefined;
        let live = true;
        emailService.thread(restaurantId, selectedId)
            .then((row) => { if (live) setThread(row); })
            .catch((err) => { if (live) setError(emailError(err)); });
        return () => { live = false; };
    }, [restaurantId, selectedId, threads, status.connected]);

    const bookedCount = threads.filter(isBooked).length;
    const waitingCount = threads.length - bookedCount;
    const selected = threads.find((item) => item.threadId === selectedId) || null;
    const messages = thread?.messages || [];

    const connect = async () => {
        setBusy(true);
        setError('');
        try {
            const result = await emailService.connect(restaurantId);
            if (!result.url) throw new Error('Connect URL missing');
            window.location.assign(result.url);
        } catch (err) {
            setError(emailError(err));
            setBusy(false);
        }
    };

    const disconnect = async () => {
        setBusy(true);
        setError('');
        try {
            await emailService.disconnect(restaurantId);
            setConfirmDisconnect(false);
            setSelectedId('');
            setThread(null);
            await load();
        } catch (err) {
            setError(emailError(err));
        } finally {
            setBusy(false);
        }
    };

    const toggleChatAuto = async () => {
        if (!selectedId) return;
        const next = selected?.autoReply === false;
        setThreads((current) => current.map((item) => item.threadId === selectedId ? { ...item, autoReply: next } : item));
        try {
            await emailService.autoReply(restaurantId, selectedId, next);
        } catch (err) {
            setThreads((current) => current.map((item) => item.threadId === selectedId ? { ...item, autoReply: !next } : item));
            setError(emailError(err));
        }
    };

    const send = async () => {
        const text = replyText.trim();
        if (!text || !selectedId) return;
        setBusy(true);
        setError('');
        try {
            const next = await emailService.reply(restaurantId, selectedId, text);
            setThread(next);
            setReplyText('');
            await load();
        } catch (err) {
            setError(emailError(err));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex h-screen w-full min-w-0 overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-teal-50 text-slate-900">
            <aside className="flex w-[320px] shrink-0 flex-col overflow-hidden border-r border-teal-100/80 bg-white/50">
                <div className="px-5 pb-3 pt-6">
                    <div className="flex items-center justify-between gap-3">
                        <h1 className="text-[28px] font-semibold leading-none tracking-tight">Email</h1>
                        {status.connected && (
                            <button type="button" onClick={() => setConfirmDisconnect(true)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-cyan-500/40 ring-2 ring-teal-200">
                                <span className="h-2 w-2 rounded-full bg-white" />
                                Connected
                            </button>
                        )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-3 py-1 text-xs text-white">{threads.length} mails</span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">{bookedCount} booked</span>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">{waitingCount} waiting</span>
                    </div>
                    <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <Search size={15} className="text-slate-400" />
                        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="search name or chats..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
                    </label>
                    <select value={filter} onChange={(event) => setFilter(event.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none">
                        <option value="all">All statuses</option>
                        <option value="booked">Booked</option>
                        <option value="waiting">Not booked</option>
                    </select>
                </div>
                <div className="flex-1 space-y-1 overflow-auto px-2 pb-4">
                    {loading && <p className="px-3 py-4 text-sm text-slate-500">Loading email…</p>}
                    {!loading && visible.length === 0 && <p className="px-3 py-4 text-sm text-slate-500">No email conversations yet.</p>}
                    {visible.map((item) => {
                        const active = item.threadId === selectedId;
                        return (
                            <button key={item.threadId} type="button" onClick={() => setSelectedId(item.threadId)} className={`w-full cursor-pointer overflow-hidden rounded-2xl px-3 py-3 text-left ${active ? 'bg-gradient-to-r from-teal-50 to-cyan-50' : 'hover:bg-white/80'}`}>
                                <div className="flex gap-3">
                                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 text-xs font-medium text-white">{initials(item.customerName || item.customerEmail)}</span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-start justify-between gap-2">
                                            <span className="truncate text-sm font-semibold">{item.subject || 'Reservation'}</span>
                                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${isBooked(item) ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>{isBooked(item) ? 'Booked' : 'Not booked'}</span>
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs text-slate-500">{item.customerName || item.customerEmail}</span>
                                        <span className="mt-1 block truncate text-xs text-slate-500">{firstLine(item.preview) || metaLabel(item)}</span>
                                        <span className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                                            <span className="inline-flex items-center gap-1"><Mail size={11} /> {metaLabel(item)}</span>
                                            <span>{clock(item.updatedAt)}</span>
                                        </span>
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>
            <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {notice && <div className="bg-slate-900 px-4 py-2 text-sm text-white">{notice}</div>}
                {error && <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
                {!status.connected && !loading && (
                    <div className="m-6 max-w-lg rounded-2xl border border-slate-200 bg-white p-6">
                        <Mail className="mb-3 text-slate-700" />
                        <h2 className="text-lg font-semibold">Connect Gmail</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Connect the restaurant Gmail account. Booki reads new booking mail and replies in the same thread. Older mail is not imported.</p>
                        {ready && status.configured === false && !error && (
                            <p className="mt-3 text-sm text-slate-600">Gmail is not configured on the phone server yet. Add the Google OAuth values there before connecting.</p>
                        )}
                        <button type="button" onClick={connect} disabled={busy || !status.configured} className="mt-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2 text-sm text-white disabled:opacity-50">Connect Gmail</button>
                    </div>
                )}
                {status.connected && !selected && (
                    <p className="p-8 text-sm text-slate-500">Select a conversation.</p>
                )}
                {status.connected && selected && (
                    <>
                        <header className="m-4 flex items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-teal-700 via-cyan-700 to-sky-600 px-5 py-4 text-white shadow-sm">
                            <div className="min-w-0">
                                <p className="flex min-w-0 items-center gap-2 truncate text-sm text-slate-300"><Mail size={15} className="shrink-0" /> <span className="truncate">{status.email}</span></p>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <h2 className="truncate text-lg font-semibold">{selected.subject || 'Reservation'}</h2>
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${isBooked(selected) ? 'bg-emerald-300/25 text-emerald-50' : 'bg-rose-300/25 text-rose-50'}`}>{isBooked(selected) ? 'Booked' : 'Not booked'}</span>
                                </div>
                                <p className="mt-1 text-sm text-slate-300">{selected.customerName || 'Guest'} · {messages.length} {messages.length === 1 ? 'message' : 'messages'}</p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                                <button type="button" onClick={() => navigate('/reservations')} className="cursor-pointer rounded-full border border-white/20 px-3 py-1.5 text-sm">Reservation</button>
                                <button type="button" onClick={toggleChatAuto} className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-200">
                                    Auto On
                                    <span className={`relative h-5 w-9 rounded-full ${selected.autoReply === false ? 'bg-white/30' : 'bg-gradient-to-r from-emerald-200 to-white'}`}>
                                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-teal-800 ${selected.autoReply === false ? 'left-0.5' : 'left-4'}`} />
                                    </span>
                                </button>
                            </div>
                        </header>
                        <div className="flex-1 space-y-3 overflow-auto px-4 pb-3">
                            {messages.map((message) => {
                                const outbound = message.direction === 'outbound';
                                const who = outbound ? 'Booki' : (selected.customerName || 'Guest');
                                return (
                                    <article key={message.id || message.at} className={`rounded-2xl border p-4 ${outbound ? 'border-cyan-100 bg-gradient-to-br from-cyan-50 to-white' : 'border-amber-100 bg-gradient-to-br from-amber-50 to-white'}`}>
                                        <div className="mb-3 flex items-start justify-between gap-3">
                                            <div className="flex gap-3">
                                                <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-medium text-white ${outbound ? 'from-cyan-500 to-teal-700' : 'from-amber-400 to-orange-500'}`}>{initials(who)}</span>
                                                <div>
                                                    <p className="text-sm font-semibold">{who} <span className="font-normal text-slate-500">{outbound ? status.email : selected.customerEmail}</span></p>
                                                    <p className="text-xs text-slate-500">to {outbound ? selected.customerEmail : status.email} <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${outbound ? 'bg-cyan-100 text-cyan-800' : 'bg-amber-100 text-amber-800'}`}>{outbound ? 'Booki reply' : 'Guest enquiry'}</span></p>
                                                </div>
                                            </div>
                                            <time className="text-xs text-slate-400">{clock(message.at)}</time>
                                        </div>
                                        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{visibleBody(message.body)}</p>
                                    </article>
                                );
                            })}
                        </div>
                        <form className="m-4 mt-0 rounded-2xl border border-slate-200 bg-white p-3" onSubmit={(event) => { event.preventDefault(); send(); }}>
                            <p className="px-1 pb-2 text-xs text-slate-500">Reply as Booki · {status.email} → {selected.customerEmail}</p>
                            <div className="flex items-center gap-2">
                                <input value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Write a reply..." className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none" />
                                <button type="submit" disabled={busy || !replyText.trim()} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 text-sm text-white disabled:opacity-40">
                                    <Send size={15} /> Send
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </section>
            {confirmDisconnect && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" onClick={() => !busy && setConfirmDisconnect(false)}>
                    <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg" onClick={(event) => event.stopPropagation()}>
                        <h2 className="text-base font-semibold">Disconnect Gmail</h2>
                        <p className="mt-2 text-sm text-slate-600">Do you want to disconnect?</p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button type="button" onClick={() => setConfirmDisconnect(false)} disabled={busy} className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-sm">Cancel</button>
                            <button type="button" onClick={disconnect} disabled={busy} className="cursor-pointer rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-3 py-2 text-sm text-white disabled:opacity-50">Disconnect</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
