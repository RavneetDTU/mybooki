import { useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Globe, Mail, MessageCircle, Phone,
    Search, Send, Sparkles, User,
} from 'lucide-react';
import { useMediaQuery } from '../hooks/use-media-query';
import BookingSourceBadge from '../components/BookingSourceBadge';
import BookingSummaryCard from '../components/landingpage/booking-demo/BookingSummaryCard';
import {
    BOOKING_INBOX,
    CHANNEL_PAGES,
    CHANNEL_PRESENTATION,
    CONVERSATION_STATUSES,
    MOCK_CONVERSATIONS,
    STATUS_LABELS,
    conversationPath,
} from '../data/omnichannelMock';

const CHANNEL_ICONS = {
    whatsapp: MessageCircle,
    widget: Globe,
    email: Mail,
    phone: Phone,
};

function initials(name) {
    return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function bookingPill(item) {
    const booked = item.reservationStatus === 'confirmed' || item.status === 'reservation_confirmed';
    return booked
        ? { text: 'Booked', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
        : { text: 'Not booked', className: 'bg-rose-50 text-rose-600 border-rose-200' };
}

function cloneConversations() {
    return MOCK_CONVERSATIONS.map((item) => ({
        ...item,
        messages: item.messages.map((message) => ({ ...message })),
    }));
}

function BookingCard({ summary }) {
    if (!summary) return null;
    const confirmed = summary.status === 'Confirmed';
    return (
        <div className={`rounded-xl border p-3 ${confirmed ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
            <p className="text-xs font-semibold text-foreground">Booking summary</p>
            <p className="text-sm mt-1">{summary.date} · {summary.time} · {summary.guests} guests</p>
            <p className={`text-xs mt-1 font-medium ${confirmed ? 'text-green-700' : 'text-amber-800'}`}>
                {summary.status}
            </p>
        </div>
    );
}

function WhatsAppThread({ messages }) {
    return (
        <div className="space-y-2">
            {messages.map((message) => {
                const guest = message.from === 'customer';
                return (
                    <div key={message.id} className="space-y-2">
                        {message.text ? (
                            <div className={`flex ${guest ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-[13px] leading-relaxed shadow-sm text-[#111b21] ${guest ? 'bg-[#D9FDD3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                                    <p className="whitespace-pre-wrap">{message.text}</p>
                                    <p className="text-[10px] text-[#667781] text-right mt-1">
                                        {message.time}{guest ? ' · ✓✓' : ''}
                                    </p>
                                </div>
                            </div>
                        ) : null}
                        {message.summary ? (
                            <div className="flex justify-start">
                                <div className="max-w-[92%] w-full">
                                    <BookingSummaryCard booking={message.summary} tone="dark" />
                                </div>
                            </div>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}

function WidgetThread({ messages }) {
    return (
        <div className="space-y-3">
            {messages.map((message) => {
                const guest = message.from === 'customer';
                return (
                    <div key={message.id} className="space-y-2">
                        {message.text ? (
                            <div className={`flex ${guest ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${guest ? 'bg-indigo-600 text-white rounded-br-md' : 'bg-white border border-indigo-100 text-slate-800 rounded-bl-md'}`}>
                                    <p className="whitespace-pre-wrap">{message.text}</p>
                                    <p className={`text-[10px] mt-1 ${guest ? 'text-white/70' : 'text-slate-400'}`}>{message.time}</p>
                                </div>
                            </div>
                        ) : null}
                        {message.summary ? (
                            <div className="flex justify-start">
                                <div className="max-w-[92%] w-full">
                                    <BookingSummaryCard booking={message.summary} />
                                </div>
                            </div>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}

const CALL_WAVE = [10, 18, 14, 24, 16, 28, 12, 20, 15];

function WidgetCallView({ conversation, isMobile, onBack, onReservation }) {
    const pill = bookingPill(conversation);
    return (
        <div className="grid min-[560px]:grid-cols-[220px_1fr] h-full min-h-0">
            <div className="bg-slate-950 text-white p-6 flex flex-col items-center text-center overflow-y-auto">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-white/10 text-white/90 border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    Simulated call · Sample
                </span>
                <div className="w-20 h-20 rounded-full bg-indigo-400/15 text-indigo-200 flex items-center justify-center font-heading text-2xl font-semibold mt-6">
                    {initials(conversation.customerName)}
                </div>
                <h3 className="mt-4 font-heading font-semibold text-lg">{conversation.customerName}</h3>
                <p className="text-xs text-white/55 mt-1">{conversation.phone || 'Sample number'} · sample</p>
                <p className="text-sm mt-4 text-emerald-300">
                    {conversation.callStatus || 'Call ended'}{conversation.callDuration ? ` · ${conversation.callDuration}` : ''}
                </p>
                <span className={`mt-3 px-2 py-0.5 rounded-full border text-[10px] font-medium ${pill.className}`}>
                    {pill.text}
                </span>
                <div className="flex items-end gap-1 h-10 mt-6" aria-hidden="true">
                    {CALL_WAVE.map((height, index) => (
                        <span
                            key={index}
                            className="w-1.5 rounded-full bg-emerald-300 opacity-80"
                            style={{ height }}
                        />
                    ))}
                </div>
                {isMobile ? (
                    <button type="button" onClick={onBack} className="mt-6 text-xs text-white/70 underline cursor-pointer">
                        Back to conversations
                    </button>
                ) : null}
            </div>
            <div className="bg-white flex flex-col min-h-0 overflow-hidden">
                <div className="shrink-0 px-5 py-4 border-b border-indigo-100 flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-heading font-semibold text-slate-900">Live transcript</p>
                        <p className="text-[11px] text-slate-500">Visual playback only · microphone is not used</p>
                    </div>
                    <button
                        type="button"
                        disabled={!conversation.reservationId}
                        onClick={onReservation}
                        className="text-[11px] px-2 py-1 rounded-md border border-indigo-100 cursor-pointer disabled:opacity-40"
                    >
                        Reservation
                    </button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3">
                    {conversation.messages.map((message) => {
                        const guest = message.from === 'customer';
                        return (
                            <div key={message.id} className="space-y-3">
                                {message.text ? (
                                    <div className={`flex ${guest ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${guest ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-slate-900'}`}>
                                            <p className="text-[10px] uppercase tracking-wide opacity-60 mb-1">
                                                {guest ? 'Customer' : 'AI receptionist'}
                                            </p>
                                            {message.text}
                                        </div>
                                    </div>
                                ) : null}
                                {message.summary ? <BookingSummaryCard booking={message.summary} /> : null}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function EmailMailbox({ conversation, isMobile, onBack, onReservation, draft, onDraft, onSend }) {
    const pill = bookingPill(conversation);
    return (
        <>
            <header className="shrink-0 bg-[#2c2416] text-white px-5 py-4">
                <div className="flex items-start gap-3">
                    {isMobile ? (
                        <button type="button" onClick={onBack} className="text-xs underline cursor-pointer mt-1 text-white/80">Back</button>
                    ) : null}
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-200 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] tracking-wide text-amber-200/80">{BOOKING_INBOX}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <h2 className="font-heading font-semibold text-lg leading-tight">{conversation.subject}</h2>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-medium ${pill.className}`}>
                                {pill.text}
                            </span>
                        </div>
                        <p className="text-xs text-white/60 mt-1">
                            {conversation.customerName} · {conversation.messages.length} {conversation.messages.length === 1 ? 'message' : 'messages'}
                        </p>
                    </div>
                    <button
                        type="button"
                        disabled={!conversation.reservationId}
                        onClick={onReservation}
                        className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/10 text-white cursor-pointer disabled:opacity-40"
                    >
                        Reservation
                    </button>
                </div>
            </header>
            <div className="flex-1 min-h-0 overflow-y-auto bg-[#f6f1e8] px-4 py-5 space-y-4">
                {conversation.messages.map((message, index) => {
                    const incoming = message.from === 'customer';
                    const fromName = incoming ? conversation.customerName : 'Booki';
                    const fromAddress = incoming ? conversation.email : BOOKING_INBOX;
                    const toAddress = incoming ? BOOKING_INBOX : conversation.email;
                    return (
                        <article
                            key={message.id}
                            className={`rounded-2xl overflow-hidden shadow-sm ${incoming ? 'bg-[#fffdf8] border border-amber-200/80' : 'bg-white border border-indigo-100'}`}
                        >
                            <div className={`px-4 py-3 flex gap-3 ${incoming ? 'bg-amber-50/80' : 'bg-indigo-50/70'}`}>
                                <div className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center shrink-0 ${incoming ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'}`}>
                                    {incoming ? initials(conversation.customerName) : 'B'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-sm font-semibold truncate">{fromName}</p>
                                        <p className="text-[11px] text-stone-500 truncate">{fromAddress}</p>
                                        <p className="ml-auto text-[11px] text-stone-400 shrink-0">{message.time}</p>
                                    </div>
                                    <p className="text-[11px] text-stone-500 mt-0.5">
                                        to {toAddress}
                                        <span className="mx-1.5 text-stone-300">·</span>
                                        {incoming ? (index === 0 ? 'Guest enquiry' : 'Guest reply') : 'Booki reply'}
                                    </p>
                                </div>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-sm leading-7 whitespace-pre-wrap text-stone-800">{message.text}</p>
                                {message.summary ? (
                                    <div className="mt-4">
                                        <BookingSummaryCard booking={message.summary} />
                                    </div>
                                ) : null}
                            </div>
                        </article>
                    );
                })}
            </div>
            <form onSubmit={onSend} className="shrink-0 border-t border-amber-200/70 bg-[#fffdf8] p-4">
                <div className="rounded-2xl border border-amber-200 bg-white p-3 shadow-sm">
                    <p className="text-[11px] text-stone-500 mb-2">
                        Reply as Booki · {BOOKING_INBOX} → {conversation.email}
                    </p>
                    <div className="flex gap-2 items-end">
                        <label className="sr-only" htmlFor="reply-draft">Reply</label>
                        <textarea
                            id="reply-draft"
                            value={draft}
                            onChange={(event) => onDraft(event.target.value)}
                            rows={2}
                            placeholder="Write a reply..."
                            className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                        <button type="submit" className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium cursor-pointer inline-flex items-center gap-1.5">
                            <Send className="w-4 h-4" />
                            Send
                        </button>
                    </div>
                </div>
            </form>
        </>
    );
}

function PhoneThread({ conversation }) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                    ['Direction', conversation.callDirection],
                    ['Date', conversation.callDate],
                    ['Time', conversation.callTime],
                    ['Duration', conversation.callDuration],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-border bg-white px-3 py-2">
                        <p className="text-muted-foreground">{label}</p>
                        <p className="font-medium text-foreground">{value}</p>
                    </div>
                ))}
            </div>
            <p className="text-xs text-muted-foreground">Call status: {conversation.callStatus}. Transcript is sample playback, same shape as the reservation call view.</p>
            <div className="space-y-2">
                {conversation.messages.map((message) => {
                    const guest = message.from === 'customer';
                    return (
                        <div key={message.id} className={`flex ${guest ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${guest ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>
                                <p className="text-[10px] uppercase tracking-wide opacity-60 mb-0.5">{guest ? 'Customer' : 'AI receptionist'}</p>
                                {message.text}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function Conversations({ channel }) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const isMobile = useMediaQuery('(max-width: 900px)');
    const [conversations, setConversations] = useState(cloneConversations);
    const [status, setStatus] = useState('all');
    const [query, setQuery] = useState('');
    const [draft, setDraft] = useState('');
    const [showCustomer, setShowCustomer] = useState(false);
    const replyCount = useRef(0);
    const page = CHANNEL_PAGES[channel];

    const selectedId = searchParams.get('id');
    const widgetKind = channel === 'widget' ? searchParams.get('kind') : null;
    const selected = conversations.find((item) => item.id === selectedId) || null;
    const channelItems = conversations.filter((item) => item.channel === channel);

    const summary = {
        total: channelItems.length,
        requests: channelItems.filter((item) => item.status === 'booking_requested').length,
        successful: channelItems.filter((item) => item.reservationStatus === 'confirmed').length,
        waiting: channelItems.filter((item) => item.status === 'awaiting_response').length,
    };

    const needle = query.trim().toLowerCase();
    const visible = conversations.filter((item) => {
        if (item.channel !== channel) return false;
        if (widgetKind && item.widgetKind !== widgetKind) return false;
        if (status !== 'all' && item.status !== status) return false;
        if (!needle) return true;
        return [item.customerName, item.preview, item.phone, item.email, item.subject]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(needle));
    });

    const showList = !isMobile || !selected;
    const showDetail = !isMobile || !!selected;

    const writeParams = (next) => {
        const params = {};
        if (next.id) params.id = next.id;
        if (next.kind) params.kind = next.kind;
        setSearchParams(params);
    };

    const selectConversation = (item) => {
        setShowCustomer(false);
        setDraft('');
        setConversations((current) => current.map((row) => (
            row.id === item.id ? { ...row, unread: false } : row
        )));
        writeParams({ id: item.id, kind: widgetKind });
    };

    const updateSelected = (patch) => {
        setConversations((current) => current.map((row) => (
            row.id === selectedId ? { ...row, ...patch } : row
        )));
    };

    const sendDraft = (event) => {
        event.preventDefault();
        const text = draft.trim();
        if (!text || !selected || selected.channel === 'phone') return;
        replyCount.current += 1;
        updateSelected({
            messages: [
                ...selected.messages,
                { id: `local-${replyCount.current}`, from: 'assistant', text, time: 'Now' },
            ],
            preview: text,
            unread: false,
        });
        setDraft('');
    };

    if (selected && selected.channel !== channel) {
        return <Navigate to={conversationPath(selected.id) || page.path} replace />;
    }

    return (
        <div className="h-screen overflow-hidden flex bg-background">
            {showList && (
                <aside className={`w-full min-[901px]:w-[340px] shrink-0 min-h-0 flex flex-col border-r ${channel === 'email' ? 'border-amber-200/80 bg-[#fbf7f2]' : 'border-border bg-white'}`}>
                    <div className="shrink-0 px-4 pt-4 pb-3 space-y-3">
                        <div>
                            <h1 className="font-heading font-semibold text-foreground">{page.title}</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">{page.subtitle}</p>
                        </div>

                        {channel === 'email' ? (
                            <div className="flex items-center gap-2 text-[11px]">
                                <span className="px-2 py-1 rounded-full bg-white border border-amber-200 text-stone-600">{summary.total} mails</span>
                                <span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">{summary.successful} booked</span>
                                <span className="px-2 py-1 rounded-full bg-white border border-amber-200 text-stone-600">{summary.waiting} waiting</span>
                            </div>
                        ) : null}

                        {channel === 'widget' ? (
                            <div className="inline-flex rounded-lg border border-border bg-white p-1 w-full" role="tablist" aria-label="Widget type">
                                {[
                                    { id: null, label: 'All' },
                                    { id: 'call', label: 'Call' },
                                    { id: 'chat', label: 'Chat' },
                                ].map((tab) => {
                                    const active = widgetKind === tab.id;
                                    return (
                                        <button
                                            key={tab.label}
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => {
                                                const keep = selected && (!tab.id || selected.widgetKind === tab.id);
                                                writeParams({ id: keep ? selectedId : null, kind: tab.id });
                                            }}
                                            className={`flex-1 px-3 py-1.5 text-sm rounded-md cursor-pointer ${active ? 'bg-foreground text-white' : 'text-muted-foreground hover:bg-muted'}`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}

                        <label className="relative block">
                            <span className="sr-only">Search conversations</span>
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="search name or chats..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
                            />
                        </label>
                        <label className="block text-sm">
                            <span className="sr-only">Filter by status</span>
                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-foreground"
                            >
                                {CONVERSATION_STATUSES.map((item) => (
                                    <option key={item.id} value={item.id}>{item.label}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className={`flex-1 min-h-0 overflow-y-auto border-t ${channel === 'email' ? 'border-amber-200/80' : 'border-border'}`}>
                            {visible.length === 0 ? (
                                <div className="p-8 text-center text-sm text-muted-foreground">
                                    No conversations match this filter.
                                </div>
                            ) : visible.map((item) => {
                                const Icon = item.widgetKind === 'call' ? Phone : CHANNEL_ICONS[item.channel];
                                const active = item.id === selected?.id;
                                const pill = channel === 'whatsapp' || channel === 'widget' || channel === 'email' ? bookingPill(item) : null;
                                const kindLabel = item.widgetKind === 'call' ? 'Call' : item.widgetKind === 'chat' ? 'Chat' : null;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => selectConversation(item)}
                                        className={`w-full text-left px-4 py-3 border-b cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground ${
                                            channel === 'email'
                                                ? `border-amber-100 ${active ? 'bg-amber-100/70' : 'hover:bg-amber-50'}`
                                                : `border-border ${active ? 'bg-muted' : 'hover:bg-muted/40'}`
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 text-xs font-semibold flex items-center justify-center shrink-0 ${channel === 'email' ? 'rounded-lg bg-amber-500 text-white' : 'rounded-full bg-foreground text-white'}`}>
                                                {initials(item.customerName)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-sm truncate ${item.unread ? 'font-semibold' : 'font-medium'}`}>
                                                        {channel === 'email' ? item.subject : item.customerName}
                                                    </p>
                                                    {item.unread ? <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" aria-label="Unread" /> : null}
                                                    {pill ? (
                                                        <span className={`ml-auto shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-medium ${pill.className}`}>
                                                            {pill.text}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    {channel === 'email' ? item.customerName : item.preview}
                                                </p>
                                                {channel === 'email' ? (
                                                    <p className="text-xs text-stone-400 truncate mt-0.5">{item.preview}</p>
                                                ) : null}
                                                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                                                    <Icon className="w-3 h-3" />
                                                    {kindLabel ? <span>{kindLabel}</span> : null}
                                                    <span>{STATUS_LABELS[item.status]}</span>
                                                    {item.reservationStatus === 'confirmed' && item.status !== 'reservation_confirmed' ? <span>· Reservation confirmed</span> : null}
                                                    <span className="ml-auto">{item.timeLabel}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                </aside>
            )}

            {showDetail && (
                        <section className={`flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden ${
                            channel === 'whatsapp'
                                ? 'bg-[#efeae2]'
                                : channel === 'email'
                                    ? 'bg-[#f6f1e8]'
                                    : 'bg-white'
                        }`}>
                            {!selected ? (
                                <div className="flex-1 flex items-start text-sm text-muted-foreground p-8">
                                    Select a conversation.
                                </div>
                            ) : selected.channel === 'widget' && selected.widgetKind === 'call' ? (
                                <WidgetCallView
                                    conversation={selected}
                                    isMobile={isMobile}
                                    onBack={() => writeParams({ kind: widgetKind })}
                                    onReservation={() => selected.reservationId && navigate(`/reservations?sample=${selected.reservationId}`)}
                                />
                            ) : selected.channel === 'email' ? (
                                <EmailMailbox
                                    conversation={selected}
                                    isMobile={isMobile}
                                    onBack={() => writeParams({})}
                                    onReservation={() => selected.reservationId && navigate(`/reservations?sample=${selected.reservationId}`)}
                                    draft={draft}
                                    onDraft={setDraft}
                                    onSend={sendDraft}
                                />
                            ) : (
                                <>
                                    {channel === 'whatsapp' ? (
                                        <header className="bg-[#008069] text-white px-4 py-3 flex items-center gap-3 shrink-0">
                                            {isMobile ? (
                                                <button type="button" onClick={() => writeParams({ kind: widgetKind })} className="text-xs underline cursor-pointer">Back</button>
                                            ) : null}
                                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">
                                                {initials(selected.customerName)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-sm font-semibold truncate">{selected.customerName}</h2>
                                                    <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-medium ${bookingPill(selected).className}`}>
                                                        {bookingPill(selected).text}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-white/80 truncate">{selected.phone || 'WhatsApp'} · online</p>
                                            </div>
                                            <button type="button" disabled={!selected.reservationId} onClick={() => selected.reservationId && navigate(`/reservations?sample=${selected.reservationId}`)} className="text-[11px] px-2 py-1 rounded-md bg-white/15 cursor-pointer disabled:opacity-40">Reservation</button>
                                        </header>
                                    ) : channel === 'widget' ? (
                                        <header className="bg-indigo-600 text-white px-4 py-3 flex items-center gap-3 shrink-0">
                                            {isMobile ? (
                                                <button type="button" onClick={() => writeParams({ kind: widgetKind })} className="text-xs underline cursor-pointer">Back</button>
                                            ) : null}
                                            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-sm font-semibold">Booki Assistant</h2>
                                                    <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-medium ${bookingPill(selected).className}`}>
                                                        {bookingPill(selected).text}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-white/70 truncate">Chat · {selected.customerName}{selected.website ? ` · ${selected.website}` : ''}</p>
                                            </div>
                                            <button type="button" disabled={!selected.reservationId} onClick={() => selected.reservationId && navigate(`/reservations?sample=${selected.reservationId}`)} className="text-[11px] px-2 py-1 rounded-md bg-white/15 cursor-pointer disabled:opacity-40">Reservation</button>
                                        </header>
                                    ) : (
                                    <header className="border-b border-border px-4 py-3 flex flex-wrap items-start gap-3">
                                        {isMobile ? (
                                            <button type="button" onClick={() => writeParams({ kind: widgetKind })} className="text-xs underline cursor-pointer">
                                                Back
                                            </button>
                                        ) : null}
                                        <div className="w-10 h-10 rounded-full bg-foreground text-white text-sm font-semibold flex items-center justify-center">
                                            {initials(selected.customerName)}
                                        </div>
                                        <div className="flex-1 min-w-[180px]">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="font-heading font-semibold">{selected.customerName}</h2>
                                                <BookingSourceBadge source={selected.channel} />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {selected.phone || selected.email} · {STATUS_LABELS[selected.status]}
                                                {selected.reservationStatus === 'confirmed' && selected.status !== 'reservation_confirmed' ? ' · Reservation confirmed' : null}
                                                {selected.reservationStatus !== 'confirmed' ? ' · No confirmed reservation' : null}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button type="button" onClick={() => setShowCustomer((value) => !value)} className="px-3 py-1.5 text-xs border border-border rounded-md cursor-pointer hover:bg-muted">
                                                Customer details
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!selected.reservationId}
                                                onClick={() => selected.reservationId && navigate(`/reservations?sample=${selected.reservationId}`)}
                                                className="px-3 py-1.5 text-xs border border-border rounded-md cursor-pointer hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                View reservation
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateSelected({ unread: !selected.unread })}
                                                className="px-3 py-1.5 text-xs border border-border rounded-md cursor-pointer hover:bg-muted"
                                            >
                                                {selected.unread ? 'Mark read' : 'Mark unread'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateSelected({ status: selected.status === 'closed' ? 'awaiting_response' : 'closed' })}
                                                className="px-3 py-1.5 text-xs border border-border rounded-md cursor-pointer hover:bg-muted"
                                            >
                                                {selected.status === 'closed' ? 'Reopen' : 'Close'}
                                            </button>
                                        </div>
                                    </header>
                                    )}

                                    {showCustomer ? (
                                        <div className="px-4 py-3 border-b border-border bg-muted/30 text-sm grid sm:grid-cols-2 gap-2">
                                            <p><User className="w-3.5 h-3.5 inline mr-1" />{selected.customerName}</p>
                                            <p>Phone: {selected.phone || 'Not on this sample'}</p>
                                            <p>Email: {selected.email || 'Not on this sample'}</p>
                                            <p>Channel: {CHANNEL_PRESENTATION[selected.channel]?.label}</p>
                                        </div>
                                    ) : null}

                                    <div
                                        className={`flex-1 min-h-0 overflow-y-auto p-4 space-y-3 ${channel === 'whatsapp' ? '' : channel === 'widget' ? 'bg-[#f7f8fc]' : 'bg-slate-50/60'}`}
                                        style={channel === 'whatsapp' ? {
                                            backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 0.6px, transparent 0.6px), linear-gradient(#efeae2, #efeae2)',
                                            backgroundSize: '14px 14px, auto',
                                        } : undefined}
                                    >
                                        {selected.channel === 'widget' && selected.website ? (
                                            <p className="text-xs text-muted-foreground">Website context: {selected.website}</p>
                                        ) : null}
                                        {selected.channel === 'whatsapp' && <WhatsAppThread messages={selected.messages} />}
                                        {selected.channel === 'widget' && <WidgetThread messages={selected.messages} />}
                                        {selected.channel === 'phone' && <PhoneThread conversation={selected} />}
                                        {selected.channel === 'phone' ? <BookingCard summary={selected.bookingSummary} /> : null}
                                    </div>

                                    {selected.channel === 'phone' ? (
                                        <p className="px-4 py-3 text-xs text-muted-foreground border-t border-border">
                                            Phone calls use the transcript above. There is no message composer on this channel.
                                        </p>
                                    ) : selected.channel === 'whatsapp' ? (
                                        <form onSubmit={sendDraft} className="shrink-0 bg-[#f0f2f5] px-2 py-2 flex items-center gap-2">
                                            <label className="sr-only" htmlFor="reply-draft">Reply</label>
                                            <input
                                                id="reply-draft"
                                                value={draft}
                                                onChange={(event) => setDraft(event.target.value)}
                                                placeholder="Type a message"
                                                className="flex-1 bg-white rounded-full px-4 py-2.5 text-sm outline-none border border-black/5"
                                            />
                                            <button type="submit" aria-label="Send sample reply" className="w-11 h-11 rounded-full bg-[#008069] text-white flex items-center justify-center cursor-pointer">
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </form>
                                    ) : selected.channel === 'widget' ? (
                                        <form onSubmit={sendDraft} className="shrink-0 p-2 border-t border-indigo-100 bg-white flex gap-2">
                                            <label className="sr-only" htmlFor="reply-draft">Reply</label>
                                            <input
                                                id="reply-draft"
                                                value={draft}
                                                onChange={(event) => setDraft(event.target.value)}
                                                placeholder="Ask the booking assistant…"
                                                className="flex-1 text-sm px-3 py-2 rounded-md border border-indigo-100 outline-none"
                                            />
                                            <button type="submit" aria-label="Send sample reply" className="w-10 h-10 rounded-md bg-indigo-600 text-white flex items-center justify-center cursor-pointer">
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </form>
                                    ) : (
                                        <form onSubmit={sendDraft} className="border-t border-border p-3 flex gap-2">
                                            <label className="sr-only" htmlFor="reply-draft">Reply</label>
                                            <input
                                                id="reply-draft"
                                                value={draft}
                                                onChange={(event) => setDraft(event.target.value)}
                                                placeholder="Sample reply — stays on this page only"
                                                className="flex-1 px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-foreground"
                                            />
                                            <button type="submit" aria-label="Send sample reply" className="px-3 py-2 bg-foreground text-white rounded-md cursor-pointer">
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </form>
                                    )}
                                </>
                            )}
                        </section>
            )}
        </div>
    );
}
