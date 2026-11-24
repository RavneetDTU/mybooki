import { Lock, Mail, Sparkles } from 'lucide-react';

const COPY = {
    whatsapp: {
        title: 'WhatsApp is part of the upgraded version',
        intro: 'Guest chats, replies, and booking history on WhatsApp are available on the upgraded Booki plan.',
        points: [
            'One inbox for guest booking chats',
            'Replies sent from your WhatsApp number',
            'Each reservation kept with the conversation',
        ],
    },
    marketing: {
        title: 'Marketing is part of the upgraded version',
        intro: 'Campaigns, templates, leads, and marketing conversations are available on the upgraded Booki plan.',
        points: [
            'WhatsApp campaigns for your guests',
            'Message templates and lead lists',
            'Conversations opened from each campaign',
        ],
    },
};

export default function UpgradeFeature({ feature = 'whatsapp' }) {
    const copy = COPY[feature] || COPY.whatsapp;

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/10">
                <div className="bg-black px-8 py-8 text-white">
                    <div className="flex items-start justify-between gap-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                            <Sparkles className="w-3.5 h-3.5" />
                            Upgraded plan
                        </span>
                        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-black shadow-lg">
                            <Lock className="w-7 h-7" />
                        </span>
                    </div>
                    <h1 className="mt-6 font-heading text-2xl font-semibold leading-tight">{copy.title}</h1>
                    <p className="mt-3 text-sm leading-6 text-white/80">{copy.intro}</p>
                </div>
                <div className="px-8 py-7">
                    <ul className="space-y-3">
                        {copy.points.map((point) => (
                            <li key={point} className="flex items-start gap-3 text-sm text-black">
                                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/5 text-black">
                                    <Lock className="w-3 h-3" />
                                </span>
                                {point}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-6 text-sm leading-6 text-black/70">
                        Please contact the sales team to learn about this feature.
                    </p>
                    <a
                        href="mailto:?subject=Booki%20upgraded%20plan"
                        className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        <Mail className="w-4 h-4" />
                        Contact the sales team
                    </a>
                </div>
            </div>
        </div>
    );
}
