import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Phone, RotateCcw, Users } from 'lucide-react';
import BookingSourceBadge from '../BookingSourceBadge';
import { DEMO_DATES, DEMO_TIMES, RESTAURANT_NAME, renderTemplate } from '../../data/marketingMock';

function Bubble({ from, children }) {
    const guest = from === 'guest';
    return (
        <div className={`flex ${guest ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed shadow-sm text-[#111b21] ${guest ? 'bg-[#D9FDD3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                {children}
            </div>
        </div>
    );
}

function Replies({ options, onPick }) {
    return (
        <div className="flex flex-wrap gap-2 justify-end">
            {options.map((option) => (
                <button
                    key={option}
                    type="button"
                    onClick={() => onPick(option)}
                    className="px-3 py-1.5 rounded-full bg-white border border-[#008069]/30 text-[#008069] text-xs font-medium cursor-pointer hover:bg-[#008069] hover:text-white"
                >
                    {option}
                </button>
            ))}
        </div>
    );
}

export default function ConversationPreview({ template, values, campaignName, phone, onBack }) {
    const opening = renderTemplate(template.body, values);
    const [messages, setMessages] = useState(() => [
        { id: 'open', from: 'assistant', text: opening },
    ]);
    const [step, setStep] = useState('welcome');
    const [booking, setBooking] = useState({
        guests: '',
        date: '',
        dateLabel: '',
        time: '',
        name: values.customerName || 'Priya Sharma',
        phone: phone || '+27 82 555 0104',
        requests: '',
    });
    const [form, setForm] = useState({
        name: values.customerName || 'Priya Sharma',
        phone: phone || '+27 82 555 0104',
        requests: '',
    });
    const [showReservation, setShowReservation] = useState(false);

    const say = (from, text) => {
        setMessages((current) => [...current, { id: `${current.length}-${text.slice(0, 12)}`, from, text }]);
    };

    const pick = (choice) => {
        say('guest', choice);
        if (step === 'welcome' && choice === 'View Menu') {
            say('assistant', 'Our sample menu is coastal plates and a weekend set menu. Would you like to book a table?');
            setStep('menu');
            return;
        }
        if ((step === 'welcome' || step === 'menu') && choice === 'Not Now') {
            say('assistant', 'No problem. This demo stops here. No message was sent and no reservation was made.');
            setStep('declined');
            return;
        }
        if ((step === 'welcome' || step === 'menu') && choice === 'Book a Table') {
            say('assistant', 'Wonderful! How many guests will be joining you?');
            setStep('guests');
            return;
        }
        if (step === 'guests') {
            setBooking((current) => ({ ...current, guests: choice }));
            say('assistant', 'What date would you prefer?');
            setStep('date');
            return;
        }
        if (step === 'date') {
            const match = DEMO_DATES.find((item) => item.label === choice);
            setBooking((current) => ({ ...current, date: match?.id || '', dateLabel: choice }));
            say('assistant', 'What time works best for you?');
            setStep('time');
            return;
        }
        if (step === 'time') {
            setBooking((current) => ({ ...current, time: choice }));
            say('assistant', 'Please confirm the name and number for this demo booking.');
            setStep('form');
        }
    };

    const confirm = (event) => {
        event.preventDefault();
        const next = { ...booking, name: form.name.trim() || booking.name, phone: form.phone.trim() || booking.phone, requests: form.requests.trim() };
        setBooking(next);
        say('guest', `${next.name} · ${next.phone}`);
        say('assistant', 'Here is your demo booking summary. No real reservation has been created.');
        setStep('summary');
    };

    const restart = () => {
        setMessages([{ id: 'open', from: 'assistant', text: opening }]);
        setStep('welcome');
        setShowReservation(false);
        setBooking({
            guests: '',
            date: '',
            dateLabel: '',
            time: '',
            name: values.customerName || 'Priya Sharma',
            phone: phone || '+27 82 555 0104',
            requests: '',
        });
    };

    const replyOptions = step === 'welcome' || step === 'menu'
        ? (template.replies || ['Book a Table', 'Not Now'])
        : step === 'guests'
            ? ['2 Guests', '3–4 Guests', '5+ Guests']
            : step === 'date'
                ? DEMO_DATES.map((item) => item.label)
                : step === 'time'
                    ? DEMO_TIMES
                    : [];

    return (
        <div className="h-full min-h-0 flex flex-col bg-[#efeae2]">
            <header className="shrink-0 bg-[#008069] text-white px-4 py-3 flex items-center gap-3">
                <button type="button" onClick={onBack} aria-label="Back to campaign" className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-white/15 cursor-pointer">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold">DR</div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{RESTAURANT_NAME}</p>
                    <p className="text-[11px] text-white/80 truncate">Preview · {campaignName} · not a live chat</p>
                </div>
                <button type="button" onClick={restart} className="text-xs inline-flex items-center gap-1 cursor-pointer">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restart
                </button>
            </header>
            <div
                className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3"
                style={{
                    backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 0.6px, transparent 0.6px), linear-gradient(#efeae2, #efeae2)',
                    backgroundSize: '14px 14px, auto',
                }}
            >
                <p className="text-center text-[11px] text-[#667781]">Preview only · no WhatsApp message is sent</p>
                {messages.map((message) => (
                    <Bubble key={message.id} from={message.from}>{message.text}</Bubble>
                ))}
                {step === 'summary' ? (
                    <div className="bg-white rounded-xl border border-black/5 p-4 text-sm space-y-2">
                        <p className="font-heading font-semibold">Reservation Summary</p>
                        <p className="text-[11px] text-muted-foreground">Simulation · no reservation has been made</p>
                        {[
                            ['Restaurant', RESTAURANT_NAME],
                            ['Customer', booking.name],
                            ['Date', booking.dateLabel || booking.date],
                            ['Time', booking.time],
                            ['Guests', booking.guests],
                            ['Campaign', campaignName],
                            ['Status', 'Demo Confirmation'],
                        ].map(([label, value]) => (
                            <div key={label} className="flex gap-3 text-xs">
                                <span className="w-24 text-muted-foreground">{label}</span>
                                <span className="font-medium">{value || '—'}</span>
                            </div>
                        ))}
                        {booking.requests ? <p className="text-xs">Special requests: {booking.requests}</p> : null}
                        <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs text-muted-foreground">Booking source</span>
                            <BookingSourceBadge source="whatsapp" />
                        </div>
                        <button type="button" onClick={() => setShowReservation(true)} className="mt-1 px-3 py-1.5 rounded-md border border-border text-xs cursor-pointer">
                            View reservation
                        </button>
                        {showReservation ? (
                            <div className="mt-2 rounded-lg border border-border bg-sidebar p-3 space-y-2">
                                <p className="text-xs font-medium">How this would look in Reservations</p>
                                <p className="text-[11px] text-amber-800">Demo row only. It is not added to Reservations.</p>
                                <div className="flex items-center gap-3 rounded-md bg-white border border-border px-3 py-2">
                                    <div className="flex items-center gap-1.5 text-xs min-w-[72px]">
                                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span>{booking.time || '—'}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">{booking.name}</p>
                                        <p className="text-[11px] text-muted-foreground">{booking.dateLabel || 'Date'} · {booking.guests}</p>
                                    </div>
                                    <BookingSourceBadge source="whatsapp" iconOnly />
                                    <div className="ml-auto flex items-center gap-1 text-xs border border-border rounded-md px-2 py-1">
                                        <Phone className="w-3 h-3 text-muted-foreground" />
                                        {booking.phone}
                                    </div>
                                </div>
                                <Link to="/reservations" className="text-xs underline">Open Reservations</Link>
                            </div>
                        ) : null}
                    </div>
                ) : null}
                {replyOptions.length ? <Replies options={replyOptions} onPick={pick} /> : null}
                {step === 'form' ? (
                    <form onSubmit={confirm} className="bg-white rounded-xl p-3 space-y-2 border border-black/5">
                        <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full border border-border rounded-md px-2 py-1.5 text-sm" aria-label="Customer name" />
                        <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="w-full border border-border rounded-md px-2 py-1.5 text-sm" aria-label="Contact number" />
                        <input value={form.requests} onChange={(event) => setForm((current) => ({ ...current, requests: event.target.value }))} placeholder="Special requests (optional)" className="w-full border border-border rounded-md px-2 py-1.5 text-sm" />
                        <button type="submit" className="w-full py-2 rounded-md bg-[#008069] text-white text-sm cursor-pointer">Show demo summary</button>
                    </form>
                ) : null}
            </div>
        </div>
    );
}
