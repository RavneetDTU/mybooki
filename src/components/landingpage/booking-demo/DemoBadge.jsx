export default function DemoBadge({ children = 'Interactive Preview · Demo Only', tone = 'neutral' }) {
    const tones = {
        neutral: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        teal: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dark: 'bg-white/10 text-white/90 border-white/20',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${tones[tone] || tones.neutral}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
            {children}
        </span>
    );
}
