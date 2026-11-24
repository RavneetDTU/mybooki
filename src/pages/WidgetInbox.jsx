import { useEffect, useState } from 'react';
import { Search, Settings } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { widgetService } from '../services/widgetService';

function initials(name) {
    return String(name || 'W').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function when(value) {
    const date = new Date(value || '');
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function widgetError(error) {
    return error?.response?.data?.error || 'The phone server is not running.';
}

export function WidgetInbox() {
    const { restaurantId } = useAuthStore();
    const [conversations, setConversations] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [selectedId, setSelectedId] = useState('');
    const [thread, setThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [olderCursor, setOlderCursor] = useState(null);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [threadLoading, setThreadLoading] = useState(false);
    const [error, setError] = useState('');
    const [showDetails, setShowDetails] = useState(false);

    const selected = conversations.find((item) => item.sessionId === selectedId) || null;

    const loadList = async ({ append = false, next } = {}) => {
        if (!restaurantId) return;
        const params = { limit: 30 };
        if (query.trim()) params.q = query.trim();
        if (filter === 'chat' || filter === 'voice') params.kind = filter;
        if (filter === 'open') params.status = 'open';
        if (filter === 'booked') params.status = 'completed';
        if (filter === 'unread') params.unread = '1';
        if (next) params.cursor = next;
        const result = await widgetService.listConversations(restaurantId, params);
        let rows = result.data || [];
        if (filter === 'booked') rows = rows.filter((row) => row.hasBooking);
        if (filter === 'voice') rows = rows.filter((row) => row.channel === 'voice' || row.channel === 'both' || row.hasVoice);
        if (filter === 'chat') rows = rows.filter((row) => row.channel === 'chat' || row.channel === 'both');
        if (filter === 'unread') rows = rows.filter((row) => row.unread > 0);
        if (query.trim()) {
            const needle = query.trim().toLowerCase();
            rows = rows.filter((row) => `${row.guestName || ''} ${row.phone || ''} ${row.preview || ''} ${row.websiteDomain || ''}`.toLowerCase().includes(needle));
        }
        setConversations((current) => append ? [...current, ...rows.filter((row) => !current.some((item) => item.sessionId === row.sessionId))] : rows);
        setCursor(result.nextCursor || null);
    };

    useEffect(() => {
        if (!restaurantId) return undefined;
        let live = true;
        setLoading(true);
        setError('');
        loadList()
            .catch((err) => { if (live) setError(widgetError(err)); })
            .finally(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, [restaurantId, query, filter]);

    useEffect(() => {
        if (!restaurantId) return undefined;
        let timer = null;
        const tick = () => {
            if (document.hidden) return;
            loadList().catch(() => {});
            if (selectedId) {
                widgetService.getConversation(restaurantId, selectedId, { limit: 30 }).then((result) => {
                    setThread(result.conversation || null);
                    setMessages((current) => {
                        const incoming = result.messages || [];
                        const byId = new Map(incoming.map((item) => [item.id, item]));
                        for (const item of current) if (!byId.has(item.id)) byId.set(item.id, item);
                        return [...byId.values()].sort((a, b) => Number(a.index) - Number(b.index));
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
        setSelectedId(item.sessionId);
        setShowDetails(false);
        setThreadLoading(true);
        setMessages([]);
        setThread(null);
        try {
            const result = await widgetService.getConversation(restaurantId, item.sessionId, { limit: 30 });
            setThread(result.conversation || null);
            setMessages(result.messages || []);
            setOlderCursor(result.nextBefore ?? null);
        } catch (err) {
            setError(widgetError(err));
        } finally {
            setThreadLoading(false);
        }
    };

    const loadOlder = async () => {
        if (olderCursor == null || !selectedId) return;
        const older = await widgetService.getConversation(restaurantId, selectedId, { limit: 30, before: olderCursor });
        setMessages((current) => {
            const byId = new Map((older.messages || []).map((item) => [item.id, item]));
            for (const item of current) byId.set(item.id, item);
            return [...byId.values()].sort((a, b) => Number(a.index) - Number(b.index));
        });
        setOlderCursor(older.nextBefore ?? null);
    };

    if (!restaurantId) {
        return <div className="p-8 text-sm text-muted-foreground">Sign in with a restaurant account to read website widget conversations.</div>;
    }

    const title = thread?.guestName || selected?.guestName || 'Website visitor';
    const channel = thread?.channel || selected?.channel || 'chat';

    return (
        <div className="h-screen overflow-hidden flex bg-background">
            <aside className="w-full min-[901px]:w-[340px] shrink-0 min-h-0 flex flex-col border-r border-border bg-white">
                <div className="shrink-0 px-4 pt-4 pb-3 space-y-3">
                    <div>
                        <h1 className="font-heading font-semibold text-foreground">Website Widget</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Chats and calls from the booking widget on your website.</p>
                    </div>
                    <label className="relative block">
                        <span className="sr-only">Search conversations</span>
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, number, or site" className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-white text-sm" />
                    </label>
                    <select value={filter} onChange={(event) => setFilter(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm">
                        <option value="all">All conversations</option>
                        <option value="chat">Website chat</option>
                        <option value="voice">Website call</option>
                        <option value="unread">Unread</option>
                        <option value="open">Still open</option>
                        <option value="booked">Booked</option>
                    </select>
                    {error ? <p className="text-xs text-rose-600">{error}</p> : null}
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto border-t border-border">
                    {loading ? <p className="p-6 text-sm text-muted-foreground">Loading conversations…</p> : null}
                    {!loading && !error && conversations.length === 0 ? (
                        <p className="p-6 text-sm text-muted-foreground">No website widget conversations yet. A chat or call appears here after a visitor uses the widget.</p>
                    ) : conversations.map((item) => (
                        <button key={item.sessionId} type="button" onClick={() => openConversation(item)} className={`w-full text-left px-4 py-3 border-b border-border cursor-pointer ${item.sessionId === selectedId ? 'bg-muted' : 'hover:bg-muted/40'}`}>
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center shrink-0">{initials(item.guestName || 'Visitor')}</div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium truncate">{item.guestName || 'Website visitor'}</p>
                                        <span className={`ml-auto shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-medium ${item.channel === 'chat' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                            {item.channel === 'both' ? 'Chat · Call' : item.channel === 'voice' ? 'Call' : 'Chat'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{item.restaurantName || 'Restaurant not chosen yet'}</p>
                                    <p className="text-xs text-muted-foreground truncate">{item.preview || 'No message yet'}</p>
                                    <p className="text-[11px] text-muted-foreground mt-1 text-right">{when(item.capturedAt)}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                    {cursor ? (
                        <button type="button" className="w-full py-3 text-xs underline cursor-pointer" onClick={() => loadList({ append: true, next: cursor }).catch((err) => setError(widgetError(err)))}>
                            Older conversations
                        </button>
                    ) : null}
                </div>
            </aside>
            <section className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#f4f6fb]">
                {!selected ? (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground p-8">Select a conversation.</div>
                ) : (
                    <>
                        <header className="bg-indigo-700 text-white px-4 py-3 flex items-center gap-3 shrink-0">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">{initials(title)}</div>
                            <div className="min-w-0 flex-1 relative">
                                <div className="flex items-center gap-1">
                                    <h2 className="text-sm font-semibold truncate">{title}</h2>
                                    <button type="button" aria-label="Visitor details" aria-expanded={showDetails} onClick={() => setShowDetails((open) => !open)} className={`p-1 rounded-md cursor-pointer ${showDetails ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}>
                                        <Settings className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <p className="text-[11px] text-white/80 truncate">{thread?.restaurantName || selected.restaurantName || 'Restaurant not chosen yet'} · {channel === 'both' ? 'Chat and call' : channel === 'voice' ? 'Website call' : 'Website chat'}</p>
                                {showDetails && (
                                    <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-white p-4 text-[#111b21] shadow-lg text-sm space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground">Visitor</p>
                                        <p>{title}</p>
                                        <p className="text-xs text-muted-foreground">{thread?.phone || selected.phone || 'No phone given'}</p>
                                        <p className="text-xs">Session: {selected.sessionId}</p>
                                        <p className="text-xs">Website: {thread?.websiteDomain || selected.websiteDomain || 'Not recorded'}</p>
                                        <p className="text-xs">Started: {when(thread?.startedAt || selected.startedAt) || '—'}</p>
                                        <p className="text-xs">Last activity: {when(thread?.capturedAt || selected.capturedAt) || '—'}</p>
                                        {channel === 'voice' ? <p className="text-xs">Call recording is not stored for website calls.</p> : null}
                                        {thread?.transcriptStatus === 'processing' ? <p className="text-xs">Transcription processing.</p> : null}
                                        {thread?.transcriptStatus === 'unavailable' ? <p className="text-xs">Transcription unavailable.</p> : null}
                                        {thread?.relatedSessionId || selected.relatedSessionId ? <p className="text-xs">Related session: {thread?.relatedSessionId || selected.relatedSessionId}</p> : null}
                                        {(thread?.calls || []).map((call) => (
                                            <p key={call.id} className="text-xs">Call {call.status}{call.startedAt && call.endedAt ? ` · ${Math.max(1, Math.round((new Date(call.endedAt) - new Date(call.startedAt)) / 1000))}s` : ''}</p>
                                        ))}
                                        {thread?.booking?.paymentId ? (
                                            <div className="pt-2 border-t border-border text-xs space-y-1">
                                                <p className="font-semibold text-muted-foreground">Booking</p>
                                                <p>{thread.booking.restaurantName || thread.restaurantName}</p>
                                                <p>Reference: {thread.booking.paymentId}</p>
                                                <p>{thread.booking.name || title}</p>
                                                <p>{thread.booking.date || '—'} · {thread.booking.time || '—'}</p>
                                                <p>{thread.booking.guests || '—'} guests · {thread.booking.status || 'booked'}</p>
                                            </div>
                                        ) : null}
                                        {thread?.managerMessage?.message ? (
                                            <div className="pt-2 border-t border-border text-xs">
                                                <p className="font-semibold text-muted-foreground">Message for the manager</p>
                                                <p className="mt-1">{thread.managerMessage.message}</p>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </header>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {olderCursor != null ? <button type="button" className="block mx-auto text-xs underline cursor-pointer" onClick={() => loadOlder().catch((err) => setError(widgetError(err)))}>Earlier messages</button> : null}
                            {threadLoading ? <p className="text-sm text-muted-foreground">Loading messages…</p> : null}
                            {!threadLoading && messages.length === 0 ? <p className="text-sm text-muted-foreground">{thread?.transcriptStatus === 'processing' ? 'Transcription processing.' : channel === 'voice' ? 'Transcription unavailable for this call.' : 'No saved messages in this conversation yet.'}</p> : null}
                            {messages.map((message) => {
                                const guest = message.from === 'visitor';
                                const system = message.from === 'system' || message.kind === 'call';
                                return (
                                    <div key={message.id} className={`flex ${guest ? 'justify-end' : system ? 'justify-center' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-[13px] shadow-sm text-[#111b21] ${guest ? 'bg-indigo-100' : system ? 'bg-transparent shadow-none text-muted-foreground text-xs' : 'bg-white'}`}>
                                            <p className="whitespace-pre-wrap">{message.text}</p>
                                            {message.at ? <p className={`text-[10px] mt-1 ${guest ? 'text-indigo-700' : 'text-muted-foreground'}`}>{when(message.at)}</p> : null}
                                            {message.kind === 'voice' ? <p className="text-[10px] mt-1 text-muted-foreground">Voice</p> : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
