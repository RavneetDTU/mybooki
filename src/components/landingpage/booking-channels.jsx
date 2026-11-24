import { Globe, MessageCircle, Phone } from 'lucide-react';

const CHANNELS = [
    {
        id: 'phone',
        title: 'Phone AI Receptionist',
        description: 'A 24/7 voice agent that answers calls, takes bookings, and never puts a guest on hold.',
        icon: Phone,
        accent: 'from-indigo-600 to-indigo-500',
        chip: 'Voice demo',
        cta: 'Try Demo Call',
    },
    {
        id: 'widget',
        title: 'Website Booking Widget',
        description: 'A chat assistant on your restaurant site that walks guests from “I want a table” to a confirmed reservation.',
        icon: Globe,
        accent: 'from-indigo-500 to-emerald-500',
        chip: 'Widget demo',
        cta: 'Preview Website Widget',
    },
    {
        id: 'whatsapp',
        title: 'WhatsApp Booking Agent',
        description: 'Guests message on WhatsApp, pick a time, and get a booking summary — without waiting for a reply.',
        icon: MessageCircle,
        accent: 'from-emerald-500 to-emerald-400',
        chip: 'Chat demo',
        cta: 'Chat on WhatsApp',
    },
];

const STEPS = [
    { n: '01', title: 'Guest reaches out', copy: 'A call, a website chat, or a WhatsApp message — Booki answers instantly.' },
    { n: '02', title: 'AI collects the details', copy: 'Party size, date, time, and contact info, with a short confirmation at the end.' },
    { n: '03', title: 'You never miss the table', copy: 'The reservation is captured while your team stays focused on the floor.' },
];

export default function BookingChannels({ onOpenDemo, onEarlyAccess, onBookSetup }) {
    return (
        <section id="booking-experience" className="relative py-16 md:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
                    <p className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-600/10 to-emerald-500/10 border border-indigo-600/20 text-graphite mb-4">
                        Three ways guests can book
                    </p>
                    <h2 className="text-3xl md:text-4xl font-semibold text-graphite">
                        Preview the AI booking experience
                    </h2>
                    <p className="mt-4 text-base md:text-lg text-graphite/70">
                        Phone, website, and WhatsApp — all simulated on this page. Try a demo, then request early access if you want it for your restaurant.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {CHANNELS.map((channel) => {
                        const Icon = channel.icon;
                        return (
                            <article
                                key={channel.id}
                                className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-snow to-white p-6 shadow-sm hover:shadow-lg transition-shadow"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${channel.accent} text-white flex items-center justify-center mb-5 shadow-lg`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <p className="text-[11px] uppercase tracking-wide text-indigo-600 font-medium mb-2">{channel.chip}</p>
                                <h3 className="text-xl font-semibold text-graphite">{channel.title}</h3>
                                <p className="mt-2 text-sm text-graphite/70 leading-relaxed">{channel.description}</p>
                                <button
                                    type="button"
                                    onClick={() => onOpenDemo(channel.id)}
                                    className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-medium cursor-pointer hover:scale-[1.02] transition-transform shadow-md"
                                >
                                    {channel.cta}
                                </button>
                            </article>
                        );
                    })}
                </div>

                <div className="mt-16 md:mt-20 grid md:grid-cols-3 gap-6">
                    {STEPS.map((step) => (
                        <div key={step.n} className="rounded-2xl bg-gradient-to-br from-indigo-50 to-emerald-50 p-6">
                            <p className="text-sm font-semibold text-indigo-600">{step.n}</p>
                            <h3 className="mt-2 text-lg font-semibold text-graphite">{step.title}</h3>
                            <p className="mt-2 text-sm text-graphite/70">{step.copy}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-500 p-8 md:p-10 text-white text-center">
                    <h3 className="text-2xl md:text-3xl font-semibold">Ready to never miss a reservation?</h3>
                    <p className="mt-3 text-white/85 max-w-2xl mx-auto">
                        These previews are frontend-only. Join the waitlist and we will set up phone, website, and WhatsApp booking for your restaurant.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            type="button"
                            onClick={onEarlyAccess}
                            className="px-8 py-3 rounded-xl bg-white text-indigo-600 font-medium cursor-pointer hover:scale-105 transition-transform"
                        >
                            Get Early Access
                        </button>
                        <button
                            type="button"
                            onClick={onBookSetup}
                            className="px-8 py-3 rounded-xl border border-white/40 text-white font-medium cursor-pointer hover:bg-white/10 transition-colors"
                        >
                            Book Free Setup
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
