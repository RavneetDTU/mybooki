import { Calendar, Clock, MapPin, Phone, Users, UtensilsCrossed } from 'lucide-react';
import { DEMO_RESTAURANT, formatDisplayDate } from './demoData';

export default function BookingSummaryCard({ booking, tone = 'light' }) {
    const isDark = tone === 'dark';

    const rows = [
        { icon: UtensilsCrossed, label: 'Restaurant', value: DEMO_RESTAURANT.name },
        { icon: Users, label: 'Guest', value: booking.name || 'Sample Customer' },
        { icon: Phone, label: 'Contact', value: booking.phone || '—' },
        { icon: Calendar, label: 'Date', value: formatDisplayDate(booking.date) },
        { icon: Clock, label: 'Time', value: booking.timeLabel || booking.time || 'Selected demo time' },
        { icon: MapPin, label: 'Guests', value: booking.guests || 'Selected party size' },
    ];

    return (
        <div
            className={`rounded-xl overflow-hidden border ${
                isDark ? 'bg-[#1f2c34] border-white/10 text-white' : 'bg-white border-indigo-100 text-graphite'
            }`}
        >
            <div className={`px-4 py-3 border-b ${isDark ? 'border-white/10 bg-[#0b141a]' : 'border-indigo-50 bg-indigo-50/70'}`}>
                <p className="text-sm font-heading font-semibold">Your Booking Summary</p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-white/60' : 'text-graphite/55'}`}>
                    Frontend simulation · no reservation has been made
                </p>
            </div>
            <div className="p-4 space-y-2.5">
                {rows.map((row) => {
                    const Icon = row.icon;
                    return (
                        <div key={row.label} className="flex items-center gap-3">
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-emerald-300' : 'text-indigo-400'}`} />
                            <span className={`text-xs w-20 ${isDark ? 'text-white/50' : 'text-graphite/50'}`}>
                                {row.label}
                            </span>
                            <span className="text-xs font-medium">{row.value}</span>
                        </div>
                    );
                })}
                {booking.requests ? (
                    <p className={`text-xs pt-1 ${isDark ? 'text-white/70' : 'text-graphite/70'}`}>
                        Special requests: {booking.requests}
                    </p>
                ) : null}
                <div
                    className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        isDark ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                >
                    Status: Demo Confirmation
                </div>
            </div>
        </div>
    );
}
