import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    CalendarDays, Phone, RotateCcw, Send, Smile, Users, UtensilsCrossed, MessageCircle,
} from 'lucide-react';
import PreviewModal from './PreviewModal';
import OptionPicker from './OptionPicker';
import BookingSummaryCard from './BookingSummaryCard';
import TypingDots from './TypingDots';
import DemoBadge from './DemoBadge';
import DemoLeadBanner from './DemoLeadBanner';
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

const EMOJIS = ['👋', '😊', '🙏', '🍽️', '✅'];

const INTENT_OPTIONS = [
    { id: 'book', label: 'Book a Table', subtitle: 'Date, time, and party size', icon: UtensilsCrossed, emoji: '🍽️' },
    { id: 'menu', label: 'View Menu', subtitle: 'Tonight’s sample dishes', icon: Smile, emoji: '📋' },
    { id: 'talk', label: 'Talk to the Restaurant', subtitle: 'Leave a demo message', icon: MessageCircle, emoji: '💬' },
];

const REQUEST_OPTIONS = [
    { id: 'none', label: 'No special requests', subtitle: 'Skip this step' },
    { id: 'window', label: 'Window table', subtitle: 'If available' },
    { id: 'allergies', label: 'Note allergies', subtitle: 'We’ll pass this to the kitchen' },
];

function Bubble({ from, children, time }) {
    const isGuest = from === 'guest';
    return (
        <div className={`flex ${isGuest ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[86%] rounded-lg px-3 py-2 text-[13px] leading-relaxed shadow-sm ${
                    isGuest
                        ? 'bg-[#D9FDD3] text-[#111b21] rounded-tr-none'
                        : 'bg-white text-[#111b21] rounded-tl-none'
                }`}
            >
                {children}
                <div className={`text-[10px] mt-1 ${isGuest ? 'text-[#667781] text-right' : 'text-[#667781]'}`}>
                    {time}
                    {isGuest ? ' · ✓✓' : ''}
                </div>
            </div>
        </div>
    );
}

export default function WhatsAppPreviewModal({ isOpen, onClose, onEarlyAccess, onBookSetup }) {
    const [messages, setMessages] = useState([]);
    const [step, setStep] = useState('intent');
    const [booking, setBooking] = useState(emptyBooking);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const threadRef = useRef(null);
    const timersRef = useRef([]);
    const dates = useMemo(() => getDemoDates(), [isOpen]);

    const clearTimers = () => {
        timersRef.current.forEach((id) => clearTimeout(id));
        timersRef.current = [];
    };

    const later = useCallback((fn, delay) => {
        const id = setTimeout(fn, delay);
        timersRef.current.push(id);
        return id;
    }, []);

    const push = useCallback((from, payload) => {
        setMessages((prev) => [
            ...prev,
            {
                id: createMessageId(),
                from,
                time: nowTimeLabel(),
                ...payload,
            },
        ]);
    }, []);

    const botReply = useCallback((payload, delay = 650) => {
        setTyping(true);
        later(() => {
            setTyping(false);
            push('ai', payload);
        }, delay);
    }, [later, push]);

    const startConversation = useCallback(() => {
        clearTimers();
        setStep('intent');
        setBooking({ ...emptyBooking });
        setInput('');
        setTyping(false);
        setSelectedOption(null);
        setShowEmoji(false);
        setMessages([
            {
                id: createMessageId(),
                from: 'guest',
                text: 'Hi',
                time: nowTimeLabel(),
            },
            {
                id: createMessageId(),
                from: 'ai',
                text: `Hello! Welcome to ${DEMO_RESTAURANT.name}. 👋\n\nI'd be happy to help you book a table. What would you like to do?`,
                options: INTENT_OPTIONS,
                optionKey: 'intent',
                time: nowTimeLabel(),
            },
        ]);
    }, []);

    useEffect(() => {
        if (isOpen) startConversation();
        return () => clearTimers();
    }, [isOpen, startConversation]);

    useEffect(() => {
        if (threadRef.current) {
            threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }
    }, [messages, typing]);

    const askGuests = () => {
        setStep('guests');
        botReply({
            text: 'Great! How many guests will be joining you?',
            options: DEMO_PARTY_SIZES.map((size) => ({ ...size, icon: Users })),
            optionKey: 'guests',
        });
    };

    const handleIntent = (option) => {
        setSelectedOption(option.id);
        push('guest', { text: option.label });
        if (option.id === 'book') {
            askGuests();
            return;
        }
        if (option.id === 'menu') {
            setStep('menu');
            botReply({
                text: 'Here’s a sample of tonight’s menu (demo only):\n\n• Grilled line fish with citrus butter\n• Slow-cooked lamb shoulder\n• Garden risotto\n\nWould you like to book a table?',
                options: [INTENT_OPTIONS[0]],
                optionKey: 'intent',
            });
            return;
        }
        setStep('talk');
        botReply({
            text: 'Of course. Type a short message and I’ll mark it as a demo note for the restaurant. Nothing is sent to a real number.',
        });
    };

    const handleGuests = (option) => {
        setBooking((prev) => ({ ...prev, guests: option.label }));
        push('guest', { text: option.label });
        setStep('date');
        botReply({
            text: 'Perfect. Which date works for you?',
            options: dates.map((d) => ({ ...d, icon: CalendarDays })),
            optionKey: 'date',
        });
    };

    const handleDate = (option) => {
        setBooking((prev) => ({ ...prev, date: option.id }));
        push('guest', { text: `${option.label} · ${option.subtitle}` });
        setStep('time');
        botReply({
            text: 'Nice. What time would you prefer?',
            options: DEMO_TIMES,
            optionKey: 'time',
        });
    };

    const handleTime = (option) => {
        setBooking((prev) => ({ ...prev, time: option.id, timeLabel: option.label }));
        push('guest', { text: option.label });
        setStep('name');
        botReply({
            text: 'What name should we use for the reservation?',
            options: [{ id: 'sample-name', label: SAMPLE_GUEST.name, subtitle: 'Use sample guest details' }],
            optionKey: 'name',
        });
    };

    const handleName = (name) => {
        setBooking((prev) => ({ ...prev, name }));
        push('guest', { text: name });
        setStep('phone');
        botReply({
            text: 'And a contact number we can reach you on?',
            options: [{ id: 'sample-phone', label: SAMPLE_GUEST.phone, subtitle: 'Use sample number' }],
            optionKey: 'phone',
        });
    };

    const handlePhone = (phone) => {
        setBooking((prev) => ({ ...prev, phone }));
        push('guest', { text: phone });
        setStep('requests');
        botReply({
            text: 'Any special requests? (optional)',
            options: REQUEST_OPTIONS,
            optionKey: 'requests',
        });
    };

    const finish = (requests) => {
        const next = { ...booking, requests };
        setBooking(next);
        setStep('summary');
        botReply({
            text: 'Here’s your demo booking summary. No real reservation has been created.',
            summary: true,
            booking: next,
        }, 400);
    };

    const handleOption = (option, optionKey) => {
        if (step === 'summary') return;
        if (optionKey === 'intent') handleIntent(option);
        else if (optionKey === 'guests') handleGuests(option);
        else if (optionKey === 'date') handleDate(option);
        else if (optionKey === 'time') handleTime(option);
        else if (optionKey === 'name') handleName(option.label);
        else if (optionKey === 'phone') handlePhone(option.label);
        else if (optionKey === 'requests') {
            push('guest', { text: option.label });
            finish(option.id === 'none' ? '' : option.label);
        }
    };

    const handleSend = (event) => {
        event?.preventDefault();
        const text = input.trim();
        if (!text) return;
        setInput('');
        setShowEmoji(false);
        const lower = text.toLowerCase();

        if (['hi', 'hello', 'hey'].includes(lower)) {
            startConversation();
            return;
        }

        if (lower.includes('book')) {
            push('guest', { text });
            askGuests();
            return;
        }

        if (step === 'name') {
            handleName(text);
            return;
        }
        if (step === 'phone') {
            handlePhone(text);
            return;
        }
        if (step === 'requests' || step === 'talk') {
            push('guest', { text });
            if (step === 'talk') {
                botReply({ text: 'Got it — this stays in the demo only. Tap Restart if you’d like to try booking a table.' });
                return;
            }
            finish(text);
            return;
        }
        if (step === 'summary') {
            push('guest', { text });
            botReply({ text: 'This preview has already wrapped up. Tap Restart to try the conversation again.' });
            return;
        }

        push('guest', { text });
        botReply({
            text: 'I can help with a table booking in this demo. Try “Hi” or tap Book a Table.',
            options: INTENT_OPTIONS,
            optionKey: 'intent',
        });
        setStep('intent');
    };

    return (
        <PreviewModal
            isOpen={isOpen}
            onClose={onClose}
            title="WhatsApp booking preview"
            labelledBy="whatsapp-preview-title"
            widthClass="max-w-[420px]"
        >
            <div className="flex flex-col h-[min(760px,90vh)] bg-[#efeae2]">
                <div className="bg-[#008069] text-white px-4 py-3 pr-12 flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-heading font-semibold">
                        D
                    </div>
                    <div className="min-w-0 flex-1">
                        <p id="whatsapp-preview-title" className="text-sm font-heading font-semibold truncate">
                            {DEMO_RESTAURANT.name}
                        </p>
                        <p className="text-[11px] text-white/80">online · sample business</p>
                    </div>
                    <DemoBadge tone="dark">Sample demo</DemoBadge>
                </div>

                <div className="px-4 py-2 bg-[#f0f2f5] border-b border-black/5 flex items-center justify-between gap-2 text-[11px] text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        {DEMO_RESTAURANT.whatsapp}
                        <span className="text-slate-400">· sample number</span>
                    </span>
                    <button
                        type="button"
                        onClick={startConversation}
                        className="inline-flex items-center gap-1 text-[#008069] font-medium cursor-pointer hover:underline"
                    >
                        <RotateCcw className="w-3 h-3" />
                        Restart
                    </button>
                </div>

                <div
                    ref={threadRef}
                    className="flex-1 overflow-y-auto px-3 py-4 space-y-3"
                    style={{
                        backgroundImage:
                            'radial-gradient(rgba(0,0,0,0.05) 0.6px, transparent 0.6px), linear-gradient(#efeae2, #efeae2)',
                        backgroundSize: '14px 14px, auto',
                    }}
                >
                    {messages.map((message) => (
                        <div key={message.id} className="space-y-2">
                            {message.text ? (
                                <Bubble from={message.from} time={message.time}>
                                    <span className="whitespace-pre-wrap">{message.text}</span>
                                </Bubble>
                            ) : null}
                            {message.options ? (
                                <div className="max-w-[92%]">
                                    <OptionPicker
                                        heading={message.optionKey === 'intent' ? 'What can I help you with?' : 'Choose an option'}
                                        options={message.options}
                                        selectedId={message.optionKey === 'intent' ? selectedOption : undefined}
                                        onSelect={(option) => handleOption(option, message.optionKey)}
                                    />
                                </div>
                            ) : null}
                            {message.summary ? (
                                <div className="max-w-[92%] space-y-3">
                                    <BookingSummaryCard booking={message.booking || booking} tone="dark" />
                                    <DemoLeadBanner onEarlyAccess={onEarlyAccess} onBookSetup={onBookSetup} />
                                </div>
                            ) : null}
                        </div>
                    ))}
                    {typing ? (
                        <div className="flex justify-start">
                            <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm">
                                <TypingDots />
                            </div>
                        </div>
                    ) : null}
                </div>

                <form onSubmit={handleSend} className="shrink-0 bg-[#f0f2f5] px-2 py-2 flex items-end gap-2">
                    <div className="relative flex-1">
                        <div className="flex items-center gap-1 bg-white rounded-full px-2 py-1.5 border border-black/5">
                            <button
                                type="button"
                                aria-label="Insert emoji"
                                onClick={() => setShowEmoji((v) => !v)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 cursor-pointer rounded-full"
                            >
                                <Smile className="w-5 h-5" />
                            </button>
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type a message"
                                aria-label="WhatsApp demo message"
                                className="flex-1 bg-transparent text-sm py-1 outline-none"
                            />
                        </div>
                        {showEmoji ? (
                            <div className="absolute bottom-12 left-0 bg-white rounded-xl shadow-lg border border-indigo-100 px-2 py-1.5 flex gap-1">
                                {EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        type="button"
                                        className="text-lg px-1 cursor-pointer"
                                        onClick={() => {
                                            setInput((v) => v + emoji);
                                            setShowEmoji(false);
                                        }}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                    <button
                        type="submit"
                        aria-label="Send demo message"
                        className="w-11 h-11 rounded-full bg-[#008069] text-white flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#046857]"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </PreviewModal>
    );
}
