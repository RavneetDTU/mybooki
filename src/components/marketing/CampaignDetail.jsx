import { ArrowLeft } from 'lucide-react';
import { STATUS_STYLES, renderTemplate, statusLabel } from '../../data/marketingMock';
import BookingSourceBadge from '../BookingSourceBadge';

const FUNNEL = [
    ['eligible', 'Eligible audience'],
    ['delivered', 'Messages delivered'],
    ['responses', 'Customer responses'],
    ['requests', 'Booking requests'],
    ['reservations', 'Confirmed reservations'],
];

export default function CampaignDetail({ campaign, responses, templates, onBack, onConversation }) {
    const template = templates.find((item) => item.id === campaign.templateId);
    const executed = campaign.status === 'completed' && campaign.metrics;
    const preview = template
        ? renderTemplate(template.body, { customerName: 'Priya Sharma', restaurantName: 'Demo Restaurant' })
        : '';

    return (
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                    <button type="button" onClick={onBack} aria-label="Back to campaigns" className="mt-1 inline-flex items-center justify-center w-8 h-8 rounded-md text-foreground hover:bg-muted cursor-pointer">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                    <h1 className="font-heading font-semibold text-2xl">{campaign.name}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{campaign.objective} · Created {campaign.created}</p>
                    </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full border text-xs font-medium ${STATUS_STYLES[campaign.status]}`}>
                    {statusLabel(campaign.status)}
                </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {executed ? (
                    [
                        ['Recipients', campaign.metrics.recipients],
                        ['Delivered', campaign.metrics.delivered],
                        ['Responses', campaign.metrics.responses],
                        ['Booking requests', campaign.metrics.requests],
                        ['Reservations', campaign.metrics.reservations],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-border bg-white px-3 py-3">
                            <p className="text-[11px] text-muted-foreground">{label}</p>
                            <p className="font-heading text-2xl">{value}</p>
                            <p className="text-[10px] text-amber-800">Sample metric</p>
                        </div>
                    ))
                ) : (
                    <div className="sm:col-span-2 lg:col-span-5 rounded-xl border border-dashed border-border bg-white px-4 py-6 text-sm text-muted-foreground">
                        This campaign has not been sent. Delivery, replies, and reservations stay empty until a real launch exists. Launch is not part of this preview.
                    </div>
                )}
            </div>

            {executed ? (
                <div className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-sm font-medium mb-3">Sample funnel · each stage is separate</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        {FUNNEL.map(([key, label], index) => (
                            <div key={key} className="flex items-center gap-2">
                                <div className="rounded-lg bg-muted px-3 py-2">
                                    <p className="text-muted-foreground">{label}</p>
                                    <p className="font-heading text-lg text-foreground">{key === 'eligible' ? campaign.recipients : campaign.metrics[key]}</p>
                                </div>
                                {index < FUNNEL.length - 1 ? <span className="text-muted-foreground">→</span> : null}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="grid lg:grid-cols-2 gap-4">
                <section className="rounded-2xl border border-border bg-white p-4 text-sm space-y-2">
                    <h2 className="font-heading font-semibold">Configuration</h2>
                    <p>Template: {campaign.templateName}</p>
                    <p>Audience: {campaign.audienceLabel}</p>
                    <p>Recipients prepared: {campaign.recipients}</p>
                    <p>Excluded: {campaign.excluded}</p>
                    <p className="text-muted-foreground">{campaign.description || 'No internal description.'}</p>
                    <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-muted-foreground">Source shown on a demo booking</span>
                        <BookingSourceBadge source="whatsapp" />
                    </div>
                </section>
                <section className="rounded-2xl overflow-hidden border border-[#d1d7db] bg-[#efeae2]">
                    <div className="bg-[#008069] text-white px-4 py-3 text-sm">Message preview</div>
                    <div className="p-4">
                        <div className="bg-white rounded-lg px-3 py-2 text-sm">{preview}</div>
                        <button type="button" onClick={() => onConversation()} className="mt-3 text-sm underline cursor-pointer">Preview conversation</button>
                    </div>
                </section>
            </div>

            <section className="rounded-2xl border border-border bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                    <h2 className="font-heading font-semibold text-sm">Responses</h2>
                </div>
                {responses.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-muted-foreground">No sample replies yet. A draft or unsent campaign does not invent customers.</p>
                ) : (
                    <ul>
                        {responses.map((item) => (
                            <li key={item.id} className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-3 text-sm">
                                <div className="min-w-[140px]">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">{item.phone}</p>
                                </div>
                                <p className="text-xs">{item.status}</p>
                                <p className="text-xs text-muted-foreground flex-1 truncate">{item.lastMessage}</p>
                                <p className="text-xs">{item.booking}</p>
                                <button type="button" onClick={() => onConversation(item)} className="text-xs underline cursor-pointer">Preview conversation</button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
