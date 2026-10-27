import { Globe, MessageCircle, Phone, Sparkles } from "lucide-react";

const CHANNELS = [
    {
        id: "phone",
        title: "Phone",
        subtitle: "Try a demo call",
        icon: Phone,
        gradient: "from-indigo-600 to-indigo-500",
        glow: "shadow-indigo-500/40",
        delay: "0s",
    },
    {
        id: "widget",
        title: "Website",
        subtitle: "Preview the widget",
        icon: Globe,
        gradient: "from-violet-600 to-indigo-500",
        glow: "shadow-violet-500/40",
        delay: "0.4s",
    },
    {
        id: "whatsapp",
        title: "WhatsApp",
        subtitle: "Chat to book",
        icon: MessageCircle,
        gradient: "from-emerald-500 to-emerald-400",
        glow: "shadow-emerald-500/40",
        delay: "0.8s",
    },
];

export default function HeroDemoLauncher({ onOpenDemo }) {
    return (
        <div className="w-full max-w-md">
            <div className="flex items-center justify-center gap-2 mb-3">
                <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
                    Try it live
                </p>
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {CHANNELS.map((channel) => {
                    const Icon = channel.icon;
                    return (
                        <button
                            key={channel.id}
                            type="button"
                            onClick={() => onOpenDemo(channel.id)}
                            className="group relative rounded-2xl bg-white/80 backdrop-blur-sm border border-white/70 px-2 py-3 sm:px-3 sm:py-4 text-center shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 cursor-pointer"
                        >
                            <span className="absolute -top-1.5 right-2 rounded-full bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 tracking-wide">
                                LIVE
                            </span>
                            <span
                                className={`mx-auto mb-2 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-r ${channel.gradient} text-white shadow-xl ${channel.glow} landing-demo-glow`}
                                style={{ animationDelay: channel.delay }}
                            >
                                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                            </span>
                            <span className="block text-sm font-semibold text-graphite">{channel.title}</span>
                            <span className="block text-[10px] sm:text-[11px] text-graphite/55 mt-0.5">
                                {channel.subtitle}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
