import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Phone, PhoneOff, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import PreviewModal from './PreviewModal';
import TypingDots from './TypingDots';
import { widgetService } from '../../../services/widgetService';
import { startWidgetCall } from '../../../services/widgetVoice';

const STORAGE_KEY = 'booki-phone-widget';

function websiteDomain() {
    return window.location.hostname || '';
}

function readStored() {
    try { return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || ''); } catch { return null; }
}

export default function WebsiteWidgetPreviewModal({ isOpen, onClose }) {
    const [openWidget, setOpenWidget] = useState(true);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [callState, setCallState] = useState('');
    const threadRef = useRef(null);
    const sessionRef = useRef({ sessionId: '', visitorKey: '' });
    const callRef = useRef(null);

    const startChat = async (forceNew = false) => {
        setError('');
        setLoading(true);
        try {
            if (!forceNew) {
                const stored = readStored();
                if (stored?.sessionId && stored?.visitorKey) {
                    const saved = await widgetService.getConversation('', stored.sessionId, { visitorKey: stored.visitorKey, limit: 30 });
                    if (saved?.messages?.length) {
                        sessionRef.current = stored;
                        setMessages(saved.messages);
                        widgetService.shareLocation(stored).catch(() => {});
                        return;
                    }
                }
            }
            const session = { sessionId: crypto.randomUUID(), visitorKey: crypto.randomUUID() };
            sessionRef.current = session;
            window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
            const result = await widgetService.sendChat({ ...session, kickoff: true, websiteDomain: websiteDomain() });
            setMessages([{ id: 'welcome', from: 'assistant', text: result.message.content, kind: 'chat' }]);
            widgetService.shareLocation(session).catch(() => {});
        } catch (err) {
            setError(err?.response?.data?.error || err.message || 'The assistant could not be reached.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return undefined;
        setOpenWidget(true);
        startChat();
        return () => {
            callRef.current?.stop('disconnected').catch(() => {});
            callRef.current = null;
        };
    }, [isOpen]);

    useEffect(() => {
        if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }, [messages, loading, callState]);

    const send = async (event) => {
        event.preventDefault();
        const text = input.trim();
        if (!text || loading || !sessionRef.current.sessionId || callState === 'active' || callState === 'connecting') return;
        setInput('');
        setError('');
        const mine = { id: `g-${Date.now()}`, from: 'visitor', text, kind: 'chat' };
        setMessages((current) => [...current, mine]);
        setLoading(true);
        try {
            const result = await widgetService.sendChat({
                ...sessionRef.current,
                text,
                websiteDomain: websiteDomain(),
            });
            setMessages((current) => [...current, { id: `a-${Date.now()}`, from: 'assistant', text: result.message.content, kind: 'chat' }]);
        } catch (err) {
            setError(err?.response?.data?.error || err.message || 'The message was not sent.');
        } finally {
            setLoading(false);
        }
    };

    const toggleCall = async () => {
        if (callRef.current) {
            await callRef.current.stop('completed');
            callRef.current = null;
            return;
        }
        if (!sessionRef.current.sessionId) return;
        setError('');
        try {
            callRef.current = await startWidgetCall({
                ...sessionRef.current,
                websiteDomain: websiteDomain(),
                onState: setCallState,
                onLine: (line) => setMessages((current) => [...current, { id: `c-${Date.now()}`, ...line }]),
            });
        } catch (err) {
            setCallState('failed');
            setError(err.message || 'The call could not connect.');
            callRef.current = null;
        }
    };

    const callLabel = callState === 'connecting' ? 'Connecting' : callState === 'active' ? 'On a call' : '';

    return (
        <PreviewModal isOpen={isOpen} onClose={onClose} title="Website widget" labelledBy="widget-preview-title" widthClass="max-w-4xl">
            <div className="flex flex-col h-[min(740px,90vh)] bg-snow">
                <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-indigo-100 pr-14">
                    <div>
                        <p id="widget-preview-title" className="text-sm font-heading font-semibold text-graphite">Restaurant website</p>
                        <p className="text-[11px] text-graphite/55">Chat or call to book a table</p>
                    </div>
                </div>
                <div className="relative flex-1 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-900 text-white p-8">
                        <p className="font-heading font-semibold tracking-tight">Booki</p>
                        <div className="max-w-lg mt-16">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-200 mb-3">Reservations</p>
                            <h3 className="font-heading text-3xl sm:text-4xl font-semibold leading-tight">Tell the assistant which restaurant you would like.</h3>
                        </div>
                    </div>
                    {openWidget ? (
                        <div className="absolute bottom-6 right-6 w-[min(100%-2rem,360px)] h-[min(520px,70vh)] bg-white rounded-2xl shadow-2xl border border-indigo-100 flex flex-col overflow-hidden">
                            <div className="px-4 py-3 bg-indigo-600 text-white flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-heading font-semibold">Booki Assistant</p>
                                    <p className="text-[11px] text-white/70">{callLabel || 'Website chat'}</p>
                                </div>
                                <button type="button" aria-label={callState === 'active' || callState === 'connecting' ? 'End call' : 'Start call'} onClick={toggleCall} className="p-1.5 rounded-md hover:bg-white/10 cursor-pointer">
                                    {callState === 'active' || callState === 'connecting' ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                                </button>
                                <button type="button" aria-label="Start a new chat" onClick={() => { setCallState(''); startChat(true); }} className="p-1.5 rounded-md hover:bg-white/10 cursor-pointer">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button type="button" aria-label="Minimize widget" onClick={() => setOpenWidget(false)} className="p-1.5 rounded-md hover:bg-white/10 cursor-pointer">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div ref={threadRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-snow">
                                {messages.map((message) => (
                                    <div key={message.id} className={`flex ${message.from === 'visitor' ? 'justify-end' : message.from === 'system' ? 'justify-center' : 'justify-start'}`}>
                                        <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-[13px] ${message.from === 'visitor' ? 'bg-indigo-600 text-white rounded-br-md' : message.from === 'system' ? 'bg-transparent text-graphite/60 text-xs' : 'bg-white border border-indigo-100 text-graphite rounded-bl-md'}`}>
                                            {message.text}
                                        </div>
                                    </div>
                                ))}
                                {loading ? <div className="bg-white border border-indigo-100 rounded-2xl px-3 py-2 w-fit"><TypingDots /></div> : null}
                                {error ? <p className="text-xs text-rose-600">{error}</p> : null}
                            </div>
                            <form onSubmit={send} className="p-2 border-t border-indigo-100 bg-white flex gap-2">
                                <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Which restaurant would you like?" aria-label="Website widget message" disabled={callState === 'active' || callState === 'connecting'} className="flex-1 text-sm px-3 py-2 rounded-md border border-indigo-100 disabled:bg-slate-50" />
                                <button type="submit" aria-label="Send widget message" className="w-10 h-10 rounded-md bg-indigo-600 text-white flex items-center justify-center cursor-pointer">
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    ) : (
                        <button type="button" onClick={() => setOpenWidget(true)} className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center cursor-pointer" aria-label="Open booking assistant">
                            <MessageSquare className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>
        </PreviewModal>
    );
}
