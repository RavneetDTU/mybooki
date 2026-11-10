import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, MessageSquare, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import PreviewModal from './PreviewModal';
import BookingSummaryCard from './BookingSummaryCard';
import DemoBadge from './DemoBadge';
import DemoLeadBanner from './DemoLeadBanner';
import TypingDots from './TypingDots';
import {
    DEMO_RESTAURANT,
    DEMO_PARTY_SIZES,
    DEMO_TIMES,
    SAMPLE_GUEST,
    createMessageId,
    emptyBooking,
    getDemoDates,
    nowTimeLabel,
} from './demoData';

function Chip({ children, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
        >
            {children}
        </button>
    );
}

export default function WebsiteWidgetPreviewModal({ isOpen, onClose, onEarlyAccess, onBookSetup }) {
    const [openWidget, setOpenWidget] = useState(true);
    const [messages, setMessages] = useState([]);
    const [step, setStep] = useState('welcome');
    const [booking, setBooking] = useState(emptyBooking);
    const [form, setForm] = useState({ name: '', phone: '', requests: '' });
    const [typing, setTyping] = useState(false);
    const [input, setInput] = useState('');
    const threadRef = useRef(null);
    const timersRef = useRef([]);
    const dates = useMemo(() => getDemoDates(), [isOpen]);

    const later = (fn, delay) => {
        const id = setTimeout(fn, delay);
        timersRef.current.push(id);
    };

    const push = (from, payload) => {
        setMessages((prev) => [...prev, { id: createMessageId(), from, time: nowTimeLabel(), ...payload }]);
    };

    const bot = (payload, delay = 550) => {
        setTyping(true);
        later(() => {
            setTyping(false);
            push('ai', payload);
        }, delay);
    };

    const reset = useCallback(() => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
        setStep('welcome');
        setBooking({ ...emptyBooking });
        setForm({ name: '', phone: '', requests: '' });
        setInput('');
        setTyping(false);
        setOpenWidget(true);
        setMessages([
            {
                id: createMessageId(),
                from: 'ai',
                time: nowTimeLabel(),
                text: `Welcome to ${DEMO_RESTAURANT.name}. I’m Booki, your booking assistant. How can I help today?`,
                chips: ['Book a table', 'Opening hours'],
            },
        ]);
    }, []);

    useEffect(() => {
        if (isOpen) reset();
        return () => timersRef.current.forEach(clearTimeout);
    }, [isOpen, reset]);

    useEffect(() => {
        if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }, [messages, typing]);

    const startBooking = () => {
        push('guest', { text: 'Book a table' });
        setStep('guests');
        bot({ text: 'How many guests will be joining you?', chips: DEMO_PARTY_SIZES.map((s) => s.label) });
    };

    const onChip = (label) => {
        if (label === 'Book a table') {
            startBooking();
            return;
        }
        if (label === 'Opening hours') {
            push('guest', { text: label });
            bot({
                text: 'Demo hours: Tuesday–Sunday, 12:00–22:00. Would you like to reserve a table?',
                chips: ['Book a table'],
            });
            return;
        }
        if (step === 'guests') {
            push('guest', { text: label });
            setBooking((p) => ({ ...p, guests: label }));
            setStep('date');
            bot({ text: 'Choose a date for your visit.', datePicker: true });
            return;
        }
        if (step === 'time') {
            const match = DEMO_TIMES.find((t) => t.label === label);
            push('guest', { text: label });
            setBooking((p) => ({ ...p, time: match?.id || label, timeLabel: label }));
            setStep('details');
            bot({ text: 'Please add a name and contact number so we can hold the demo table.', form: true });
        }
    };

    const onDate = (iso, label) => {
        if (!iso) return;
        setBooking((p) => ({ ...p, date: iso }));
        push('guest', { text: label || iso });
        setStep('time');
        bot({ text: 'What time works best?', chips: DEMO_TIMES.map((t) => t.label) });
    };

    const submitDetails = (event) => {
        event.preventDefault();
        const name = form.name.trim() || SAMPLE_GUEST.name;
        const phone = form.phone.trim() || SAMPLE_GUEST.phone;
        const next = { ...booking, name, phone, requests: form.requests.trim() };
        setBooking(next);
        push('guest', { text: `${name} · ${phone}` });
        setStep('summary');
        bot({ text: 'Here’s a sample reservation summary. This is a live preview of the widget — demo only.', summary: true, booking: next });
    };

    const handleSend = (event) => {
        event.preventDefault();
        const text = input.trim();
        if (!text) return;
        setInput('');
        const lower = text.toLowerCase();
        if (lower.includes('book')) {
            startBooking();
            return;
        }
        push('guest', { text });
        bot({
            text: 'In this website preview I can walk you through a table booking. Tap Book a table to continue.',
            chips: ['Book a table'],
        });
    };

    return (
        <PreviewModal
            isOpen={isOpen}
            onClose={onClose}
            title="Website widget preview"
            labelledBy="widget-preview-title"
            widthClass="max-w-4xl"
        >
            <div className="flex flex-col h-[min(740px,90vh)] bg-snow">
                <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-indigo-100 pr-14">
                    <div>
                        <p id="widget-preview-title" className="text-sm font-heading font-semibold text-graphite">
                            Mock restaurant website
                        </p>
                        <p className="text-[11px] text-graphite/55">Guest view · widget sits on the page</p>
                    </div>
                    <DemoBadge tone="teal">Live Preview · Demo Only</DemoBadge>
                </div>

                <div className="relative flex-1 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-900 text-white p-8">
                        <div className="flex items-center justify-between max-w-3xl">
                            <p className="font-heading font-semibold tracking-tight">{DEMO_RESTAURANT.name}</p>
                            <div className="hidden sm:flex gap-5 text-xs text-white/70">
                                <span>Menu</span>
                                <span>Hours</span>
                                <span>Contact</span>
                            </div>
                        </div>
                        <div className="max-w-lg mt-16">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200 mb-3">Reservations</p>
                            <h3 className="font-heading text-3xl sm:text-4xl font-semibold leading-tight">
                                An evening by the water, without the booking form.
                            </h3>
                            <p className="text-sm text-white/70 mt-4">
                                Open the assistant in the corner to see how guests reserve a table on your site.
                            </p>
                        </div>
                    </div>

                    {openWidget ? (
                        <div className="absolute bottom-6 right-6 w-[min(100%-2rem,360px)] h-[min(520px,70vh)] bg-white rounded-2xl shadow-2xl border border-indigo-100 flex flex-col overflow-hidden">
                            <div className="px-4 py-3 bg-indigo-600 text-white flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white/15 text-white flex items-center justify-center">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-heading font-semibold">Booki Assistant</p>
                                    <p className="text-[11px] text-white/70">Interactive Preview</p>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Restart widget demo"
                                    onClick={reset}
                                    className="p-1.5 rounded-md hover:bg-white/10 cursor-pointer"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    aria-label="Minimize widget"
                                    onClick={() => setOpenWidget(false)}
                                    className="p-1.5 rounded-md hover:bg-white/10 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div ref={threadRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-snow">
                                {messages.map((message) => (
                                    <div key={message.id} className={`flex ${message.from === 'guest' ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[90%] rounded-2xl px-3 py-2 text-[13px] ${
                                                message.from === 'guest'
                                                    ? 'bg-indigo-600 text-white rounded-br-md'
                                                    : 'bg-white border border-indigo-100 text-graphite rounded-bl-md'
                                            }`}
                                        >
                                            {message.text}
                                            {message.chips ? (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {message.chips.map((chip) => (
                                                        <Chip key={chip} onClick={() => onChip(chip)}>{chip}</Chip>
                                                    ))}
                                                </div>
                                            ) : null}
                                            {message.datePicker ? (
                                                <div className="mt-2 space-y-1.5">
                                                    {dates.map((date) => (
                                                        <button
                                                            key={date.id}
                                                            type="button"
                                                            onClick={() => onDate(date.id, `${date.label} · ${date.subtitle}`)}
                                                            className="w-full text-left px-3 py-2 rounded-lg border border-indigo-100 hover:bg-indigo-50 text-xs cursor-pointer"
                                                        >
                                                            <span className="flex items-center gap-2 text-graphite">
                                                                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                                                {date.label}
                                                                <span className="text-graphite/50">{date.subtitle}</span>
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : null}
                                            {message.form ? (
                                                <form onSubmit={submitDetails} className="mt-3 space-y-2">
                                                    <input
                                                        required
                                                        placeholder="Your name"
                                                        value={form.name}
                                                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                                        className="w-full border border-indigo-100 rounded-md px-2 py-1.5 text-xs"
                                                    />
                                                    <input
                                                        required
                                                        placeholder="Contact number"
                                                        value={form.phone}
                                                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                                                        className="w-full border border-indigo-100 rounded-md px-2 py-1.5 text-xs"
                                                    />
                                                    <input
                                                        placeholder="Special requests (optional)"
                                                        value={form.requests}
                                                        onChange={(e) => setForm((p) => ({ ...p, requests: e.target.value }))}
                                                        className="w-full border border-indigo-100 rounded-md px-2 py-1.5 text-xs"
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="w-full py-2 rounded-md bg-indigo-600 text-white text-xs font-medium cursor-pointer"
                                                    >
                                                        Show demo summary
                                                    </button>
                                                </form>
                                            ) : null}
                                            {message.summary ? (
                                                <div className="mt-2 space-y-3">
                                                    <BookingSummaryCard booking={message.booking || booking} />
                                                    <DemoLeadBanner onEarlyAccess={onEarlyAccess} onBookSetup={onBookSetup} />
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ))}
                                {typing ? (
                                    <div className="bg-white border border-indigo-100 rounded-2xl px-3 py-2 w-fit">
                                        <TypingDots />
                                    </div>
                                ) : null}
                            </div>

                            <form onSubmit={handleSend} className="p-2 border-t border-indigo-100 bg-white flex gap-2">
                                <input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask the booking assistant…"
                                    aria-label="Website widget demo message"
                                    className="flex-1 text-sm px-3 py-2 rounded-md border border-indigo-100"
                                />
                                <button
                                    type="submit"
                                    aria-label="Send widget message"
                                    className="w-10 h-10 rounded-md bg-indigo-600 text-white flex items-center justify-center cursor-pointer"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setOpenWidget(true)}
                            className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center cursor-pointer hover:scale-[1.03] transition"
                            aria-label="Open booking assistant"
                        >
                            <MessageSquare className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>
        </PreviewModal>
    );
}
