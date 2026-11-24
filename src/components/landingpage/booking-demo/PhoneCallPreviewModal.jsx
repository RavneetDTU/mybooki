import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import PreviewModal from './PreviewModal';
import { widgetService } from '../../../services/widgetService';
import { startWidgetCall } from '../../../services/widgetVoice';

function formatTimer(seconds) {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
    const rest = String(seconds % 60).padStart(2, '0');
    return `${minutes}:${rest}`;
}

export default function PhoneCallPreviewModal({ isOpen, onClose }) {
    const [status, setStatus] = useState('idle');
    const [lines, setLines] = useState([]);
    const [error, setError] = useState('');
    const [seconds, setSeconds] = useState(0);
    const callRef = useRef(null);
    const threadRef = useRef(null);

    const stop = async (next = 'completed') => {
        if (!callRef.current) return;
        const current = callRef.current;
        callRef.current = null;
        await current.stop(next).catch(() => {});
    };

    const begin = async () => {
        setError('');
        setLines([]);
        setSeconds(0);
        setStatus('connecting');
        try {
            const session = await widgetService.ensureSession();
            widgetService.shareLocation(session).catch(() => {});
            callRef.current = await startWidgetCall({
                ...session,
                websiteDomain: window.location.hostname || '',
                onState: setStatus,
                onLine: (line) => setLines((current) => [...current, line]),
            });
        } catch (err) {
            setStatus('failed');
            setError(err.message || 'The call could not connect.');
            callRef.current = null;
        }
    };

    useEffect(() => {
        if (!isOpen) return undefined;
        let alive = true;
        begin().then(() => {
            if (!alive) stop('disconnected');
        });
        return () => {
            alive = false;
            stop('disconnected');
        };
    }, [isOpen]);

    useEffect(() => {
        if (status !== 'active') return undefined;
        const id = setInterval(() => setSeconds((value) => value + 1), 1000);
        return () => clearInterval(id);
    }, [status]);

    useEffect(() => {
        if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }, [lines]);

    const label = status === 'connecting' ? 'Connecting' : status === 'active' ? formatTimer(seconds) : status === 'failed' ? 'Call failed' : 'Call ended';

    return (
        <PreviewModal isOpen={isOpen} onClose={onClose} title="Website call" labelledBy="phone-call-title" widthClass="max-w-lg">
            <div className="flex flex-col h-[min(640px,86vh)] bg-slate-950 text-white">
                <div className="px-6 pt-8 pb-4 text-center">
                    <p id="phone-call-title" className="text-xs uppercase tracking-[0.18em] text-emerald-300">Live booking call</p>
                    <div className={`mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                        <Phone className="h-8 w-8" />
                    </div>
                    <p className="mt-4 text-lg font-semibold">Booki Assistant</p>
                    <p className="text-sm text-white/70">{label}</p>
                </div>
                <div ref={threadRef} className="flex-1 overflow-y-auto px-5 space-y-2">
                    {lines.map((line, index) => (
                        <p key={`${line.at || index}-${index}`} className={`text-sm ${line.from === 'visitor' ? 'text-white' : 'text-emerald-200'}`}>
                            <span className="text-white/40">{line.from === 'visitor' ? 'You' : 'Assistant'}: </span>
                            {line.text}
                        </p>
                    ))}
                    {!lines.length && status === 'active' ? <p className="text-sm text-white/50 text-center">Say which restaurant you would like to book.</p> : null}
                    {error ? <p className="text-sm text-rose-300 text-center">{error}</p> : null}
                </div>
                <div className="p-5 flex justify-center gap-3">
                    {status === 'failed' || status === 'completed' || status === 'disconnected' ? (
                        <button type="button" onClick={begin} className="px-5 py-3 rounded-full bg-emerald-500 text-white text-sm font-medium cursor-pointer">Call again</button>
                    ) : (
                        <button type="button" onClick={() => stop('completed').then(() => setStatus('completed'))} className="px-5 py-3 rounded-full bg-rose-500 text-white text-sm font-medium inline-flex items-center gap-2 cursor-pointer">
                            <PhoneOff className="h-4 w-4" />
                            End call
                        </button>
                    )}
                </div>
            </div>
        </PreviewModal>
    );
}
