import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { authService } from '../services/auth';

/* ─── SVG icon components (black / slate, aesthetic minimal) ─── */
const IconCalendar = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);
const IconBot = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="9" width="18" height="12" rx="3" />
        <circle cx="9" cy="13" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="15" cy="13" r="1.2" fill="currentColor" stroke="none" />
        <path d="M12 3v6" /><circle cx="12" cy="3" r="1.5" />
        <line x1="7" y1="21" x2="7" y2="24" /><line x1="17" y1="21" x2="17" y2="24" />
    </svg>
);
const IconChart = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
);
const IconUser = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
);
const IconRestaurant = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h2v10a3 3 0 006 0V3h2" /><line x1="8" y1="3" x2="8" y2="13" />
        <path d="M19 3v18" /><path d="M17 3a4 4 0 014 4" />
    </svg>
);
const IconPhone = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
);
const IconUpload = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);
const IconCheck = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

/* ─── Data ─── */
const STEPS = [
    { id: 1, label: 'Account Details', Icon: IconUser },
    { id: 2, label: 'Restaurant Details', Icon: IconRestaurant },
    { id: 3, label: 'Contact Person', Icon: IconPhone },
];

const FEATURES = [
    { Icon: IconCalendar, title: 'Smart Reservations', desc: 'AI-powered booking management that fills your tables automatically.' },
    { Icon: IconBot, title: 'AI Voice Assistant', desc: 'Handle inbound calls 24/7 with your own trained voice bot.' },
    { Icon: IconChart, title: 'Real-time Analytics', desc: 'Understand peak hours, popular dishes and daily revenue trends.' },
];

/* ─── Main Component ─── */
export default function Signup() {
    const navigate = useNavigate();
    const [localError, setLocalError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const error = localError;

    const [step, setStep] = useState(1);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        restaurantName: '', restaurantEmail: '', restaurantPhone: '', restaurantAddress: '',
        verificationDoc: null,
        contactName: '', contactPhone: '', contactEmail: '',
    });

    const update = (field) => (e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

    const handleFile = (e) => {
        const file = e.target.files?.[0] || null;
        setFormData((prev) => ({ ...prev, verificationDoc: file }));
    };

    const validateStep = () => {
        setLocalError(null);
        if (step === 1) {
            if (!formData.name || !formData.email || !formData.password) return setLocalError('Please fill all required fields.'), false;
            if (formData.password !== formData.confirmPassword) return setLocalError('Passwords do not match.'), false;
        }
        if (step === 2) {
            if (!formData.restaurantName || !formData.restaurantEmail || !formData.restaurantPhone || !formData.restaurantAddress)
                return setLocalError('Please fill all required restaurant fields.'), false;
        }
        if (step === 3) {
            if (!formData.contactName || !formData.contactPhone || !formData.contactEmail)
                return setLocalError('Please fill all required contact fields.'), false;
        }
        return true;
    };

    const handleNext = () => { if (validateStep()) setStep((s) => Math.min(s + 1, 3)); };
    const handleBack = () => { setLocalError(null); setStep((s) => Math.max(s - 1, 1)); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep()) return;
        setLocalError(null);
        setIsSubmitting(true);
        try {
            const result = await authService.register(formData, formData.verificationDoc);
            console.log('[Signup] Registration successful:', result);
            navigate('/registration-pending');
        } catch (err) {
            console.error('[Signup] Registration failed:', err);
            setLocalError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputCls = 'bg-white border-border focus-visible:border-slate-400 focus-visible:ring-[rgba(0,0,0,0.08)]';
    const hintCls = 'text-xs text-muted-foreground mt-1 leading-snug text-red-400';

    return (
        /* Outer wrapper — full screen, no scroll */
        <div className="h-screen flex overflow-hidden bg-background">

            {/* ══════════════ LEFT PANEL ══════════════ */}
            <div
                className="flex flex-col overflow-y-auto bg-white py-10"
                style={{ width: '600px', minWidth: '600px', paddingLeft: '56px', paddingRight: '56px' }}
            >
                {/* Logo */}
                <div className="mb-8 flex-shrink-0">
                    <Link to="/" className="text-2xl font-heading font-semibold tracking-tight text-foreground">
                        Booki <span style={{ color: '#0f172a' }}>.ai</span>
                    </Link>
                </div>

                {/* Heading */}
                <div className="mb-6 flex-shrink-0">
                    <h1 className="text-3xl font-heading font-semibold mb-1">Register your restaurant</h1>
                    <p className="text-muted-foreground text-sm">
                        Step {step} of {STEPS.length} — {STEPS[step - 1].label}
                    </p>
                </div>

                {/* Progress bars */}
                <div className="flex gap-2 mb-6 flex-shrink-0">
                    {STEPS.map((s) => (
                        <div key={s.id} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                            style={{ background: s.id <= step ? '#3dd9d9' : '#e2e8f0' }} />
                    ))}
                </div>

                {/* Step pills */}
                <div className="flex items-center gap-2 mb-7 flex-shrink-0">
                    {STEPS.map((s, idx) => (
                        <div key={s.id} className="flex items-center gap-1.5">
                            <span
                                className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0"
                                style={{
                                    background: s.id < step ? '#3dd9d9' : s.id === step ? '#0f172a' : '#f1f5f9',
                                    color: s.id <= step ? '#fff' : '#64748b',
                                }}
                            >
                                {s.id < step ? <IconCheck /> : <span className="text-xs font-semibold">{s.id}</span>}
                            </span>
                            <span className={`text-xs font-medium ${s.id === step ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {s.label}
                            </span>
                            {idx < STEPS.length - 1 && <span className="text-muted-foreground text-xs mx-1">›</span>}
                        </div>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex-shrink-0">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form
                    onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}
                    className="space-y-5 flex-1"
                >
                    {/* ─── STEP 1: Account Details ─── */}
                    {step === 1 && (
                        <div className="space-y-5" style={{ animation: 'fadeUp 0.22s ease' }}>
                            <div className="space-y-1">
                                <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                                <Input id="name" type="text" placeholder="Your full name" value={formData.name} onChange={update('name')} className={inputCls} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                                <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={update('email')} className={inputCls} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                                    <Input id="password" type="password" placeholder="Create a password" value={formData.password} onChange={update('password')} className={inputCls} required />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                                    <Input id="confirmPassword" type="password" placeholder="Re-enter password" value={formData.confirmPassword} onChange={update('confirmPassword')} className={inputCls} required />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── STEP 2: Restaurant Details ─── */}
                    {step === 2 && (
                        <div className="space-y-5" style={{ animation: 'fadeUp 0.22s ease' }}>
                            <div className="flex items-center gap-2 pb-2 border-b border-border">
                                <span className="text-foreground"><IconRestaurant /></span>
                                <span className="text-sm font-semibold text-foreground">Restaurant Information</span>
                            </div>

                            {/* Restaurant Name */}
                            <div className="space-y-1">
                                <Label htmlFor="restaurantName">Restaurant Name <span className="text-red-500">*</span></Label>
                                <Input id="restaurantName" type="text" placeholder="e.g. The Golden Spoon" value={formData.restaurantName} onChange={update('restaurantName')} className={inputCls} required />
                                <p className={hintCls}>
                                    This name is used by our AI bot when making reservations with your customers — ensure it's the exact branded name of your restaurant.
                                </p>
                            </div>

                            {/* Email + Phone */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="restaurantEmail">Restaurant Email <span className="text-red-500">*</span></Label>
                                    <Input id="restaurantEmail" type="email" placeholder="restaurant@email.com" value={formData.restaurantEmail} onChange={update('restaurantEmail')} className={inputCls} required />
                                </div>
                                <div className="space-y-1 text-red">
                                    <Label htmlFor="restaurantPhone">Restaurant Phone <span className="text-red-500">*</span></Label>
                                    <Input id="restaurantPhone" type="tel" placeholder="+1 (555) 000-0000" value={formData.restaurantPhone} onChange={update('restaurantPhone')} className={inputCls} required />
                                    <p className={hintCls}>
                                       Note: This number is used by our AI bot for receiving inbound customer calls — ensure it's active and correct.
                                    </p>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-1">
                                <Label htmlFor="restaurantAddress">Restaurant Address <span className="text-red-500">*</span></Label>
                                <Input id="restaurantAddress" type="text" placeholder="123 Main St, City, Country" value={formData.restaurantAddress} onChange={update('restaurantAddress')} className={inputCls} required />
                            </div>

                            {/* Document Upload */}
                            <div className="space-y-1">
                                <Label>Verification Document</Label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200"
                                    style={{
                                        borderColor: formData.verificationDoc ? '#3dd9d9' : '#e2e8f0',
                                        background: formData.verificationDoc ? '#f0fdfc' : '#fafafa',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3dd9d9'; e.currentTarget.style.background = '#f0fdfc'; }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = formData.verificationDoc ? '#3dd9d9' : '#e2e8f0';
                                        e.currentTarget.style.background = formData.verificationDoc ? '#f0fdfc' : '#fafafa';
                                    }}
                                >
                                    <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
                                        <IconUpload />
                                    </div>
                                    {formData.verificationDoc ? (
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#3dd9d9' }}><IconCheck /></span>
                                            <p className="text-sm font-medium text-foreground">{formData.verificationDoc.name}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-foreground">Click to upload document</p>
                                            <p className="text-xs text-muted-foreground">PDF, JPG, — max 10 MB</p>
                                        </>
                                    )}
                                </div>
                                <p className={hintCls}>
                                    Upload a document that validates your restaurant — e.g. a business licence, FSSAI certificate, or tax registration. Clear, legible documents help us approve your account faster.
                                </p>
                                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="hidden" />
                            </div>
                        </div>
                    )}

                    {/* ─── STEP 3: Contact Person ─── */}
                    {step === 3 && (
                        <div className="space-y-5" style={{ animation: 'fadeUp 0.22s ease' }}>
                            <div className="flex items-center gap-2 pb-2 border-b border-border">
                                <span className="text-foreground"><IconPhone /></span>
                                <span className="text-sm font-semibold text-foreground">Primary Contact Person</span>
                            </div>

                            <div className="px-4 py-3 rounded-lg border text-xs" style={{ background: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }}>
                                This is the person we'll contact for operational and onboarding queries — can be the owner or a senior manager.
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="contactName">Contact Name <span className="text-red-500">*</span></Label>
                                <Input id="contactName" type="text" placeholder="Full name" value={formData.contactName} onChange={update('contactName')} className={inputCls} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="contactPhone">Phone Number <span className="text-red-500">*</span></Label>
                                    <Input id="contactPhone" type="tel" placeholder="+1 (555) 000-0000" value={formData.contactPhone} onChange={update('contactPhone')} className={inputCls} required />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="contactEmail">Email Address <span className="text-red-500">*</span></Label>
                                    <Input id="contactEmail" type="email" placeholder="contact@email.com" value={formData.contactEmail} onChange={update('contactEmail')} className={inputCls} required />
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="p-4 rounded-xl border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                                <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Registration Summary</p>
                                <div className="space-y-1.5">
                                    {[
                                        ['Account', formData.email || '—'],
                                        ['Restaurant', formData.restaurantName || '—'],
                                        ['Phone', formData.restaurantPhone || '—'],
                                        ['Document', formData.verificationDoc?.name || 'Not uploaded'],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">{k}</span>
                                            <span className="font-medium text-foreground truncate max-w-[220px] text-right">{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className={`flex gap-3 pt-2 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
                        {step > 1 && (
                            <button type="button" onClick={handleBack}
                                className="px-6 py-3 border border-border rounded-lg cursor-pointer text-foreground hover:bg-slate-50 transition-colors font-medium text-sm">
                                ← Back
                            </button>
                        )}
                        <button type="submit" disabled={isSubmitting}
                            className="flex-1 px-6 py-3 cursor-pointer rounded-lg font-medium text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-60"
                            style={{ background: '#0f172a', color: '#fff' }}>
                            {isSubmitting
                                ? 'Submitting…'
                                : step === 3
                                    ? 'Submit Registration Request →'
                                    : `Continue to ${STEPS[step].label} →`}
                        </button>
                    </div>

                    {step === 1 && (
                        <div className="text-center pt-1">
                            <span className="text-muted-foreground text-sm">Already have an account? </span>
                            <Link to="/login" className="text-[rgb(20,75,166)] hover:underline text-sm font-medium">Sign In</Link>
                        </div>
                    )}
                </form>

                <p className="text-xs text-muted-foreground mt-8 flex-shrink-0">
                    By registering you agree to our{' '}
                    <a href="#" className="underline">Terms of Service</a> and{' '}
                    <a href="#" className="underline">Privacy Policy</a>.
                </p>
            </div>

            {/* ══════════════ RIGHT BRANDING PANEL ══════════════ */}
            <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>

                {/* Decorative glows */}
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(61,217,217,0.18) 0%, transparent 70%)' }} />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(61,217,217,0.12) 0%, transparent 70%)' }} />

                {/* Animated dots */}
                <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.12 }}>
                    {[...Array(55)].map((_, i) => (
                        <div key={i} className="absolute w-1 h-1 bg-slate-700 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                                animation: `twinkle ${2 + Math.random() * 3}s infinite ${Math.random() * 2}s`,
                            }} />
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-sm px-10 space-y-5">
                    <div className="mb-8">
                        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">Why Booki.ai?</p>
                        <h2 className="text-3xl font-heading font-semibold text-foreground leading-snug">
                            Everything your restaurant needs,{' '}
                            <span style={{ color: '#3dd9d9' }}>in one place.</span>
                        </h2>
                    </div>

                    {FEATURES.map((f) => (
                        <div key={f.title}
                            className="bg-white border border-border rounded-2xl p-5 flex items-start gap-4 shadow-sm transition-all duration-200 hover:shadow-md"
                            style={{ '--hover-translate': '-2px' }}>
                            {/* Icon box — slate/black aesthetic */}
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-slate-700"
                                style={{ background: 'rgba(15,23,42,0.06)' }}>
                                <f.Icon />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                            </div>
                        </div>
                    ))}

                    {/* Social proof */}
                    <div className="flex items-center gap-3 pt-2">
                        <div className="flex -space-x-2">
                            {['#94a3b8', '#64748b', '#475569', '#334155'].map((c, i) => (
                                <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                                    style={{ background: c }}>
                                    {['R', 'T', 'S', 'M'][i]}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Join <span className="font-semibold text-foreground">200+</span> restaurants already using Booki.ai
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes twinkle {
                    0%, 100% { opacity: 0.15; }
                    50%       { opacity: 0.6;  }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0);   }
                }
            `}</style>
        </div>
    );
}
