import { Link } from 'react-router-dom';

const IconClock = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const IconCheckCircle = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3dd9d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const STEPS_DONE = [
    { label: 'Registration submitted', note: 'Your restaurant details have been received.' },
    { label: 'Document verification', note: 'Our team will review your documents.' },
    { label: 'Account activation', note: 'We\'ll notify you once your account is live.' },
];

export default function RegistrationPending() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>

            {/* Background decorative glows */}
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(61,217,217,0.14) 0%, transparent 70%)' }} />
            <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(61,217,217,0.08) 0%, transparent 70%)' }} />

            {/* Animated dots */}
            <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.08 }}>
                {[...Array(40)].map((_, i) => (
                    <div key={i} className="absolute w-1 h-1 bg-slate-600 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                            animation: `twinkle ${2 + Math.random() * 3}s infinite ${Math.random() * 2}s`,
                        }} />
                ))}
            </div>

            {/* Card */}
            <div className="relative z-10 bg-white border border-border rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
                style={{ animation: 'fadeUp 0.35s ease' }}>

                {/* Teal top accent strip */}
                <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #3dd9d9, #22d3ee, #06b6d4)' }} />

                <div className="px-10 py-10">

                    {/* Icon badge */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            {/* Outer pulse ring */}
                            <div className="absolute inset-0 rounded-full"
                                style={{ background: 'rgba(61,217,217,0.15)', animation: 'pulse 2.4s ease-in-out infinite', transform: 'scale(1.35)' }} />
                            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white relative"
                                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                                <IconClock />
                            </div>
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-heading font-semibold text-foreground mb-2">
                            Thank you for registering! 🎉
                        </h1>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                            Your registration request has been received. Our team will review and verify your details within{' '}
                            <span className="font-semibold text-foreground">24 working hours</span>.
                        </p>
                    </div>

                    {/* Progress timeline */}
                    <div className="space-y-0 mb-8">
                        {STEPS_DONE.map((s, i) => (
                            <div key={i} className="flex gap-4">
                                {/* Connector */}
                                <div className="flex flex-col items-center">
                                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                                        {i === 0
                                            ? <IconCheckCircle />
                                            : (
                                                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                                                    style={{ borderColor: '#e2e8f0' }}>
                                                    <div className="w-2 h-2 rounded-full" style={{ background: '#e2e8f0' }} />
                                                </div>
                                            )
                                        }
                                    </div>
                                    {i < STEPS_DONE.length - 1 && (
                                        <div className="w-px flex-1 my-1" style={{ background: '#e2e8f0', minHeight: '24px' }} />
                                    )}
                                </div>
                                {/* Text */}
                                <div className="pb-5">
                                    <p className={`text-sm font-medium ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {s.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{s.note}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Info banner */}
                    <div className="px-4 py-3 rounded-xl border mb-7 flex gap-3 items-start text-sm"
                        style={{ background: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }}>
                        <span className="mt-0.5 flex-shrink-0">📧</span>
                        <span>
                            We'll send a confirmation email once your account is approved. Keep an eye on your inbox — check spam too!
                        </span>
                    </div>

                    {/* CTA Buttons */}
                    {/* <div className="space-y-3">
                        <Link to="/login"
                            className="block w-full text-center py-3 rounded-xl font-medium text-sm transition-all duration-200 hover:opacity-90"
                            style={{ background: '#0f172a', color: '#fff' }}>
                            Back to Sign In
                        </Link>
                        <a href="mailto:support@mybooki.ai"
                            className="block w-full text-center py-3 rounded-xl font-medium text-sm border border-border text-foreground hover:bg-slate-50 transition-colors">
                            Contact Support
                        </a>
                    </div> */}
                </div>

                {/* Footer */}
                <div className="px-10 py-4 border-t border-border flex items-center justify-between"
                    style={{ background: '#f8fafc' }}>
                    <Link to="/" className="text-sm font-heading font-semibold text-foreground">
                        Mybooki<span style={{ color: '#3dd9d9' }}>.ai</span>
                    </Link>
                    <p className="text-xs text-muted-foreground">© 2025 Mybooki.ai · All rights reserved</p>
                </div>
            </div>

            <style>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; }
                    50%       { opacity: 0.7; }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0);    }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; transform: scale(1.35); }
                    50%      { opacity: 0.15; transform: scale(1.5);  }
                }
            `}</style>
        </div>
    );
}
