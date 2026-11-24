import { useEffect, useState } from 'react';
import { Search, Settings } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { inboxError, whatsappInboxService } from '../services/whatsappInbox';

function initials(name) {
    return String(name || 'W').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function when(value) {
    const date = new Date(value || '');
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ticks(status) {
    if (status === 'read') return ' · Read';
    if (status === 'delivered') return ' · Delivered';
    if (status === 'sent') return ' · Sent';
    if (status === 'failed') return ' · Failed';
    return '';
}

export function WhatsAppInbox() {
    const { restaurantId } = useAuthStore();
    const [conversations, setConversations] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [selectedId, setSelectedId] = useState('');
    const [messages, setMessages] = useState([]);
    const [olderCursor, setOlderCursor] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [threadLoading, setThreadLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [showDetails, setShowDetails] = useState(false);

    const selected = conversations.find((item) => item.id === selectedId) || null;

    const loadList = async ({ append = false, next } = {}) => {
        if (!restaurantId) return;
        const params = { limit: 30 };
        if (query.trim()) params.q = query.trim();
        if (filter === 'unread') params.unread = 'true';
        if (filter === 'booked') params.booked = 'true';
        if (filter === 'open') params.booked = 'false';
        if (next) params.cursor = next;
        const result = await whatsappInboxService.conversations(restaurantId, params);
        const rows = result.conversations || [];
        setConversations((current) => append ? [...current, ...rows.filter((row) => !current.some((item) => item.id === row.id))] : rows);
        setCursor(result.nextCursor || null);
    };

    useEffect(() => {
        if (!restaurantId) return undefined;
        let live = true;
        const key = `wa-inbox-repaired-${restaurantId}`;
        const start = async () => {
            setLoading(true);
            setError('');
            try {
                if (!sessionStorage.getItem(key)) {
                    await whatsappInboxService.repair(restaurantId);
                    sessionStorage.setItem(key, '1');
                }
                if (live) await loadList();
            } catch (err) {
                if (live) setError(inboxError(err));
            } finally {
                if (live) setLoading(false);
            }
        };
        start();
        return () => { live = false; };
    }, [restaurantId, query, filter]);

    useEffect(() => {
        if (!restaurantId) return undefined;
        let timer = null;
        const tick = () => {
            if (document.hidden) return;
            loadList().catch(() => {});
            if (selectedId) {
                whatsappInboxService.messages(restaurantId, selectedId, { limit: 30 }).then((result) => {
                    setMessages((current) => {
                        const byId = new Map((result.messages || []).map((item) => [item.id, item]));
                        for (const item of current) if (!byId.has(item.id)) byId.set(item.id, item);
                        return [...byId.values()].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
                    });
                }).catch(() => {});
            }
        };
        const start = () => {
            if (timer) clearInterval(timer);
            if (document.hidden) return;
            timer = setInterval(tick, 20000);
        };
        const onVisible = () => { if (document.hidden) { clearInterval(timer); timer = null; } else start(); };
        start();
        document.addEventListener('visibilitychange', onVisible);
        return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
    }, [restaurantId, selectedId, query, filter]);

    const openConversation = async (item) => {
        setSelectedId(item.id);
        setShowDetails(false);
        setThreadLoading(true);
        setNotice('');
        setMessages([]);
        setBookings(item.bookings || []);
        try {
            const [thread, bookingResult] = await Promise.all([
                whatsappInboxService.messages(restaurantId, item.id, { limit: 30 }),
                whatsappInboxService.bookings(restaurantId, item.id),
            ]);
            setMessages(thread.messages || []);
            setOlderCursor(thread.nextBefore || null);
            setBookings(bookingResult.bookings || []);
            await whatsappInboxService.markRead(restaurantId, item.id);
            setConversations((current) => current.map((row) => row.id === item.id ? { ...row, unread: 0 } : row));
        } catch (err) {
            setError(inboxError(err));
        } finally {
            setThreadLoading(false);
        }
    };

    const loadOlder = async () => {
        if (!olderCursor || !selectedId) return;
        const older = await whatsappInboxService.messages(restaurantId, selectedId, { limit: 30, before: olderCursor });
        setMessages((current) => {
            const byId = new Map((older.messages || []).map((item) => [item.id, item]));
            for (const item of current) byId.set(item.id, item);
            return [...byId.values()].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
        });
        setOlderCursor(older.nextBefore || null);
    };

    const send = async (event) => {
        event.preventDefault();
        const text = draft.trim();
        if (!text || !selected) return;
        try {
            const sent = await whatsappInboxService.send(restaurantId, selected.id, text);
            setDraft('');
            setMessages((current) => [...current, {
                id: sent.id, from: 'assistant', text, status: 'sent', createdAt: new Date().toISOString(), type: 'text',
            }]);
            setConversations((current) => current.map((row) => row.id === selected.id ? { ...row, preview: text, lastMessageAt: new Date().toISOString() } : row));
        } catch (err) {
            setNotice(inboxError(err));
        }
    };

    if (!restaurantId) {
        return <div className="p-8 text-sm text-muted-foreground">Sign in with a restaurant account to read WhatsApp bookings.</div>;
    }

    return (
        <div className="h-screen overflow-hidden flex bg-background">
            <aside className="w-full min-[901px]:w-[340px] shrink-0 min-h-0 flex flex-col border-r border-border bg-white">
                <div className="shrink-0 px-4 pt-4 pb-3 space-y-3">
                    <div>
                        <h1 className="font-heading font-semibold text-foreground">WhatsApp</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Booking chats from your WhatsApp number.</p>
                    </div>
                    <label className="relative block">
                        <span className="sr-only">Search conversations</span>
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or number" className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-white text-sm" />
                    </label>
                    <select value={filter} onChange={(event) => setFilter(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm">
                        <option value="all">All chats</option>
                        <option value="unread">Unread</option>
                        <option value="booked">Booked</option>
                        <option value="open">No booking yet</option>
                    </select>
                    {error ? <p className="text-xs text-rose-600">{error}</p> : null}
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto border-t border-border">
                    {loading ? <p className="p-6 text-sm text-muted-foreground">Loading conversations…</p> : null}
                    {!loading && !error && conversations.length === 0 ? (
                        <p className="p-6 text-sm text-muted-foreground">No WhatsApp booking chats yet. A chat appears here after a customer messages the booking number.</p>
                    ) : conversations.map((item) => (
                        <button key={item.id} type="button" onClick={() => openConversation(item)} className={`w-full text-left px-4 py-3 border-b border-border cursor-pointer ${item.id === selectedId ? 'bg-muted' : 'hover:bg-muted/40'}`}>
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#008069] text-white text-xs font-semibold flex items-center justify-center shrink-0">{initials(item.customerName)}</div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className={`text-sm truncate ${item.unread ? 'font-semibold' : 'font-medium'}`}>{item.customerName}</p>
                                        {item.unread ? <span className="text-[10px] px-1.5 rounded-full bg-[#008069] text-white">{item.unread}</span> : null}
                                        <span className={`ml-auto shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-medium ${item.hasBooking ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            {item.hasBooking ? 'Booked' : 'No booking'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{item.phone}</p>
                                    <p className="text-xs text-muted-foreground truncate">{item.preview || 'No message yet'}</p>
                                    <p className="text-[11px] text-muted-foreground mt-1 text-right">{when(item.lastMessageAt)}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                    {cursor ? (
                        <button type="button" className="w-full py-3 text-xs underline cursor-pointer" onClick={() => loadList({ append: true, next: cursor }).catch((err) => setError(inboxError(err)))}>
                            Older chats
                        </button>
                    ) : null}
                </div>
            </aside>
            <section className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#efeae2]">
                {!selected ? (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-8">Select a conversation.</div>
                ) : (
                    <>
                        <header className="bg-[#008069] text-white px-4 py-3 flex items-center gap-3 shrink-0">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">{initials(selected.customerName)}</div>
                            <div className="min-w-0 flex-1 relative">
                                <div className="flex items-center gap-1">
                                    <h2 className="text-sm font-semibold truncate">{selected.customerName}</h2>
                                    <button type="button" aria-label="Customer details" aria-expanded={showDetails} onClick={() => setShowDetails((open) => !open)} className={`p-1 rounded-md cursor-pointer ${showDetails ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}>
                                        <Settings className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <p className="text-[11px] text-white/80 truncate">{selected.phone} · {selected.hasBooking ? 'Booking linked' : 'No booking yet'}</p>
                                {showDetails && (
                                    <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-white p-4 text-[#111b21] shadow-lg">
                                        <p className="text-xs font-semibold text-muted-foreground">Customer</p>
                                        <p className="text-sm mt-1">{selected.customerName}</p>
                                        <p className="text-xs text-muted-foreground">{selected.phone}</p>
                                        <p className="text-xs font-semibold text-muted-foreground mt-4">Bookings</p>
                                        {bookings.length === 0 ? <p className="text-sm text-muted-foreground mt-1">No booking is linked to this chat.</p> : bookings.map((booking) => (
                                            <div key={booking.paymentId} className="mt-2 rounded-lg border border-border p-2 text-xs space-y-1">
                                                <p className="font-medium">{booking.paymentId}</p>
                                                <p>{booking.date || '—'} · {booking.time || '—'}</p>
                                                <p>{booking.guests ?? '—'} guests · {booking.name || selected.customerName}</p>
                                                <p>Status: {booking.status || 'booked'}</p>
                                                <p>Payment: {booking.paymentStatus || '—'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </header>
                        <div className="flex flex-1 min-h-0">
                            <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {olderCursor ? <button type="button" className="block mx-auto text-xs underline cursor-pointer" onClick={() => loadOlder().catch((err) => setError(inboxError(err)))}>Earlier messages</button> : null}
                                    {threadLoading ? <p className="text-sm text-muted-foreground">Loading messages…</p> : null}
                                    {!threadLoading && messages.length === 0 ? <p className="text-sm text-muted-foreground">No saved messages in this chat yet.</p> : null}
                                    {messages.map((message) => {
                                        const guest = message.from === 'customer';
                                        return (
                                            <div key={message.id} className={`flex ${guest ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-[13px] shadow-sm text-[#111b21] ${guest ? 'bg-[#D9FDD3]' : 'bg-white'}`}>
                                                    <p className="whitespace-pre-wrap">{message.text || message.type}</p>
                                                    {message.mediaId ? (
                                                        <a className="block text-[11px] underline mt-1" href={whatsappInboxService.mediaUrl(restaurantId, selected.id, message.mediaId)} target="_blank" rel="noreferrer">Open {message.type}</a>
                                                    ) : null}
                                                    <p className="text-[10px] text-[#667781] text-right mt-1">{when(message.createdAt)}{guest ? '' : ticks(message.status)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <form onSubmit={send} className="shrink-0 bg-[#f0f2f5] px-3 py-2 flex gap-2">
                                    <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={selected.windowOpen === false ? 'The 24-hour window is closed' : 'Type a message'} disabled={selected.windowOpen === false} className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm outline-none border border-black/5 disabled:opacity-60" />
                                    <button type="submit" className="px-4 rounded-full bg-[#008069] text-white text-sm cursor-pointer disabled:opacity-50" disabled={selected.windowOpen === false}>Send</button>
                                </form>
                                {notice ? <p className="px-3 pb-2 text-xs text-rose-700 bg-[#f0f2f5]">{notice}</p> : null}
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
