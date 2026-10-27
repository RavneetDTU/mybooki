import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, RotateCcw } from 'lucide-react';
import PreviewModal from './PreviewModal';
import BookingSummaryCard from './BookingSummaryCard';
import DemoBadge from './DemoBadge';
import DemoLeadBanner from './DemoLeadBanner';
import { DEMO_RESTAURANT, SAMPLE_GUEST, formatIsoDate } from './demoData';

const SCRIPT = [
    { from: 'ai', text: 'Thank you for calling our restaurant. How may I help you?' },
    { from: 'guest', text: "I'd like to reserve a table for four." },
    { from: 'ai', text: 'Certainly! What date would you like to visit?' },
    { from: 'guest', text: 'Tomorrow evening.' },
    { from: 'ai', text: 'Perfect. What name should I use for the reservation?' },
    { from: 'guest', text: SAMPLE_GUEST.name },
    { from: 'ai', text: 'And the best number to send the confirmation to?' },
    { from: 'guest', text: SAMPLE_GUEST.phone },
    { from: 'ai', text: 'Wonderful. I’ll hold a table for four tomorrow evening. You’ll receive a sample summary after this demo call.' },
];

function formatTimer(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
}

export default function PhoneCallPreviewModal({ isOpen, onClose, onEarlyAccess, onBookSetup }) {
    const [phase, setPhase] = useState('idle');
    const [lineIndex, setLineIndex] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const timers = useRef([]);

    const clear = () => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
    };

    const reset = () => {
        clear();
        setPhase('idle');
        setLineIndex(0);
        setSeconds(0);
    };

    useEffect(() => {
        if (!isOpen) reset();
        return clear;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (phase !== 'live') return undefined;
        const id = setInterval(() => setSeconds((n) => n + 1), 1000);
        return () => clearInterval(id);
    }, [phase]);

    const startDemo = () => {
        clear();
        setPhase('ringing');
        setLineIndex(0);
        setSeconds(0);
        const ring = setTimeout(() => {
            setPhase('live');
            SCRIPT.forEach((_, index) => {
                const id = setTimeout(() => {
                    setLineIndex(index + 1);
                    if (index === SCRIPT.length - 1) {
                        const done = setTimeout(() => setPhase('ended'), 1200);
                        timers.current.push(done);
                    }
                }, 1400 * (index + 1));
                timers.current.push(id);
            });
        }, 1600);
        timers.current.push(ring);
    };

    const endCall = () => {
        clear();
        setPhase('ended');
        setLineIndex(SCRIPT.length);
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const summaryBooking = {
        guests: '3–4 Guests',
        date: formatIsoDate(tomorrow),
        time: '19:00',
        timeLabel: '7:00 PM',
        name: SAMPLE_GUEST.name,
        phone: SAMPLE_GUEST.phone,
        requests: '',
    };

    const visibleLines = SCRIPT.slice(0, lineIndex);

    return (
        <PreviewModal
            isOpen={isOpen}
            onClose={onClose}
            title="Phone booking preview"
            labelledBy="phone-preview-title"
            widthClass="max-w-3xl"
        >
            <div className="grid md:grid-cols-[260px_1fr] min-h-[520px] max-h-[90vh]">
                <div className="bg-slate-950 text-white p-6 flex flex-col items-center text-center overflow-y-auto">
                    <DemoBadge tone="dark">Simulated call · Demo only</DemoBadge>
                    <div className="w-20 h-20 rounded-full bg-indigo-400/15 text-indigo-200 flex items-center justify-center font-heading text-2xl font-semibold mt-6">
                        D
                    </div>
                    <h3 id="phone-preview-title" className="mt-4 font-heading font-semibold text-lg">
                        {DEMO_RESTAURANT.name}
                    </h3>
                    <p className="text-xs text-white/55 mt-1">{DEMO_RESTAURANT.phone} · sample</p>
                    <p className="text-sm mt-4 text-emerald-300">
                        {phase === 'idle' && 'Ready to start'}
                        {phase === 'ringing' && 'Incoming call…'}
                        {phase === 'live' && `Active · ${formatTimer(seconds)}`}
                        {phase === 'ended' && 'Call ended'}
                    </p>

                    <div className="flex items-end gap-1 h-10 mt-6">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <span
                                key={i}
                                className="w-1.5 rounded-full bg-emerald-300"
                                style={{
                                    height: '100%',
                                    transformOrigin: 'bottom',
                                    animation: phase === 'live' ? 'landing-demo-wave 0.9s ease-in-out infinite' : undefined,
                                    animationDelay: `${i * 0.08}s`,
                                    opacity: phase === 'live' ? 1 : 0.25,
                                    transform: phase === 'live' ? undefined : 'scaleY(0.3)',
                                }}
                            />
                        ))}
                    </div>

                    <div className="w-full space-y-2 pt-6">
                        {phase === 'idle' || phase === 'ended' ? (
                            <button
                                type="button"
                                onClick={startDemo}
                                className="w-full py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-medium cursor-pointer inline-flex items-center justify-center gap-2"
                            >
                                <Phone className="w-4 h-4" />
                                {phase === 'ended' ? 'Replay Demo' : 'Start Demo'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={endCall}
                                className="w-full py-2.5 rounded-full bg-red-500 hover:bg-red-400 text-white text-sm font-medium cursor-pointer inline-flex items-center justify-center gap-2"
                            >
                                <PhoneOff className="w-4 h-4" />
                                End Call
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={reset}
                            className="w-full py-2 rounded-full border border-white/15 text-white/80 text-xs cursor-pointer inline-flex items-center justify-center gap-1.5 hover:bg-white/5"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restart
                        </button>
                    </div>
                </div>

                <div className="bg-white flex flex-col min-h-0">
                    <div className="px-5 py-4 border-b border-indigo-100">
                        <p className="text-sm font-heading font-semibold text-graphite">Live transcript</p>
                        <p className="text-[11px] text-graphite/55">Visual playback only · microphone is not used</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-3">
                        {phase === 'idle' ? (
                            <p className="text-sm text-graphite/60">
                                Press Start Demo to hear how the AI receptionist walks a guest through a table booking.
                            </p>
                        ) : null}
                        {visibleLines.map((line, index) => (
                            <div key={`${line.text}-${index}`} className={`flex ${line.from === 'guest' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                                        line.from === 'guest'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-indigo-50 text-graphite'
                                    }`}
                                >
                                    <p className="text-[10px] uppercase tracking-wide opacity-60 mb-1">
                                        {line.from === 'ai' ? 'AI receptionist' : 'Customer'}
                                    </p>
                                    {line.text}
                                </div>
                            </div>
                        ))}
                        {phase === 'ended' ? (
                            <div className="pt-2 space-y-3">
                                <BookingSummaryCard booking={summaryBooking} />
                                <DemoLeadBanner onEarlyAccess={onEarlyAccess} onBookSetup={onBookSetup} />
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </PreviewModal>
    );
}
