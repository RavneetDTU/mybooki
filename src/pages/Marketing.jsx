import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Megaphone, Search, Upload, Users } from 'lucide-react';
import ImportContacts from '../components/marketing/ImportContacts';
import CampaignWizard from '../components/marketing/CampaignWizard';
import CampaignDetail from '../components/marketing/CampaignDetail';
import ConversationPreview from '../components/marketing/ConversationPreview';
import {
    AUDIENCE_OPTIONS,
    CAMPAIGN_STATUSES,
    OVERVIEW_STATS,
    SAMPLE_RESPONSES,
    SEED_CAMPAIGNS,
    SEED_CONTACTS,
    STATUS_STYLES,
    TEMPLATES,
    VALIDATION_LABELS,
    audienceContacts,
    emptyWizard,
    isEligible,
    statusLabel,
    summarizeContacts,
} from '../data/marketingMock';

const ICONS = {
    contacts: Users,
    eligible: Users,
    campaigns: Megaphone,
    reservations: Megaphone,
};

export function Marketing() {
    const [params, setParams] = useSearchParams();
    const [contacts, setContacts] = useState(SEED_CONTACTS);
    const [campaigns, setCampaigns] = useState(SEED_CAMPAIGNS);
    const [templates, setTemplates] = useState(TEMPLATES);
    const [previewTemplateId, setPreviewTemplateId] = useState(null);
    const [wizard, setWizard] = useState(() => ({ ...emptyWizard(), step: 1, maxStep: 1 }));
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('all');
    const [contactQuery, setContactQuery] = useState('');
    const [contactFilter, setContactFilter] = useState('all');
    const [page, setPage] = useState(0);
    const [editingId, setEditingId] = useState(null);
    const seq = useRef(1);

    const view = params.get('view') || 'home';
    const campaignId = params.get('id');
    const campaign = campaigns.find((item) => item.id === campaignId) || null;
    const open = (next) => setParams(next);

    const saveCampaign = (nextStatus) => {
        const template = templates.find((item) => item.id === wizard.templateId) || templates[0];
        const recipients = audienceContacts(contacts, wizard.audience, wizard.selectedIds);
        const audience = AUDIENCE_OPTIONS.find((item) => item.id === wizard.audience);
        const record = {
            id: editingId || `camp-local-${seq.current}`,
            name: wizard.name.trim(),
            templateId: template.id,
            templateName: template.name,
            objective: wizard.objective,
            description: wizard.description,
            audience: wizard.audience,
            audienceLabel: audience?.label || 'All Eligible Contacts',
            recipients: recipients.length,
            excluded: contacts.length - recipients.length,
            status: nextStatus,
            created: '2026-10-26',
            responses: null,
            reservations: null,
            metrics: null,
        };
        if (!editingId) seq.current += 1;
        setCampaigns((current) => {
            const exists = current.some((item) => item.id === record.id);
            return exists ? current.map((item) => (item.id === record.id ? { ...item, ...record } : item)) : [record, ...current];
        });
        if (nextStatus === 'ready') {
            setWizard((current) => ({ ...current, notice: 'Your campaign is ready for review. No WhatsApp message was sent.' }));
            open({ view: 'campaign', id: record.id });
            return;
        }
        setWizard((current) => ({ ...current, notice: 'Draft saved on this page only.' }));
    };

    const startCreate = () => {
        setEditingId(null);
        setPreviewTemplateId(null);
        setWizard({ ...emptyWizard(), step: 1, maxStep: 1 });
        open({ view: 'create' });
    };

    if (view === 'import') {
        return (
            <ImportContacts
                existing={contacts}
                onCancel={() => open({})}
                onImport={(valid) => {
                    setContacts((current) => [...current, ...valid]);
                    open({ view: 'contacts' });
                }}
            />
        );
    }

    if (view === 'create') {
        return (
            <div className="h-screen overflow-hidden bg-background">
                <CampaignWizard
                    wizard={wizard}
                    setWizard={setWizard}
                    contacts={contacts}
                    templates={templates}
                    onClose={() => open({})}
                    onSave={saveCampaign}
                    onAddTemplate={(draft) => {
                        const id = `tpl-${seq.current}`;
                        seq.current += 1;
                        setTemplates((current) => [...current, { id, ...draft }]);
                    }}
                    onPreview={(item) => {
                        setPreviewTemplateId(item?.id || wizard.templateId);
                        open({ view: 'conversation', id: editingId || 'new' });
                    }}
                />
            </div>
        );
    }

    if (view === 'conversation') {
        const template = templates.find((item) => item.id === (previewTemplateId || campaign?.templateId || wizard.templateId)) || templates[0];
        const responder = SAMPLE_RESPONSES.find((item) => item.id === params.get('customer'));
        return (
            <div className="h-screen overflow-hidden bg-background">
                <ConversationPreview
                    template={template}
                    values={{
                        customerName: responder?.name || wizard.customerName,
                        restaurantName: wizard.restaurantName,
                    }}
                    phone={responder?.phone}
                    campaignName={campaign?.name || wizard.name || template.name}
                    onBack={() => {
                        setPreviewTemplateId(null);
                        open(campaign ? { view: 'campaign', id: campaign.id } : { view: 'create' });
                    }}
                />
            </div>
        );
    }

    if (view === 'campaign' && campaign) {
        return (
            <div className="min-h-screen bg-background">
                <CampaignDetail
                    campaign={campaign}
                    responses={SAMPLE_RESPONSES.filter((item) => item.campaignId === campaign.id)}
                    templates={templates}
                    onBack={() => open({})}
                    onConversation={(person) => {
                        setPreviewTemplateId(null);
                        open({ view: 'conversation', id: campaign.id, customer: person?.id || '' });
                    }}
                />
            </div>
        );
    }

    const needle = query.trim().toLowerCase();
    const visibleCampaigns = campaigns.filter((item) => {
        if (status !== 'all' && item.status !== status) return false;
        if (!needle) return true;
        return item.name.toLowerCase().includes(needle) || item.templateName.toLowerCase().includes(needle);
    });

    const contactNeedle = contactQuery.trim().toLowerCase();
    const visibleContacts = contacts.filter((item) => {
        if (contactFilter === 'eligible' && !isEligible(item)) return false;
        if (contactFilter === 'excluded' && isEligible(item)) return false;
        if (!contactNeedle) return true;
        return [item.name, item.phone, item.email].some((value) => String(value || '').toLowerCase().includes(contactNeedle));
    });
    const pageSize = 8;
    const pageCount = Math.max(1, Math.ceil(visibleContacts.length / pageSize));
    const safePage = Math.min(page, pageCount - 1);
    const contactPage = visibleContacts.slice(safePage * pageSize, safePage * pageSize + pageSize);
    const loaded = summarizeContacts(contacts);

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-white">
                <div className="px-6 py-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="font-heading font-semibold text-2xl">Marketing Campaigns</h1>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xl">Bring your guests back. Reach customers on WhatsApp and turn conversations into new reservations.</p>
                    </div>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => open({ view: 'import' })} className="px-4 py-2 rounded-lg border border-border bg-white text-sm cursor-pointer inline-flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Import Contacts
                        </button>
                        <button type="button" onClick={startCreate} className="px-4 py-2 rounded-lg bg-foreground text-white text-sm cursor-pointer inline-flex items-center gap-2">
                            <Megaphone className="w-4 h-4" />
                            Create Campaign
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-6 py-5 space-y-5">
                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                    {OVERVIEW_STATS.map((stat) => {
                        const Icon = ICONS[stat.id];
                        return (
                            <article key={stat.id} className="rounded-2xl border border-border bg-white px-4 py-4">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <p className="text-xs">{stat.label}</p>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <p className="font-heading text-3xl mt-2">{stat.value}</p>
                                <p className="text-[11px] text-amber-800 mt-1">{stat.note}</p>
                            </article>
                        );
                    })}
                </div>

                <div className="flex gap-2 text-sm">
                    <button type="button" onClick={() => open({})} className={`px-3 py-1.5 rounded-full border cursor-pointer ${view !== 'contacts' ? 'bg-foreground text-white border-foreground' : 'bg-white border-border'}`}>Campaigns</button>
                    <button type="button" onClick={() => open({ view: 'contacts' })} className={`px-3 py-1.5 rounded-full border cursor-pointer ${view === 'contacts' ? 'bg-foreground text-white border-foreground' : 'bg-white border-border'}`}>
                        Contacts ({loaded.total} loaded · {loaded.eligible} eligible)
                    </button>
                </div>

                {view === 'contacts' ? (
                    <section className="rounded-2xl border border-border bg-white overflow-hidden">
                        <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-border">
                            <label className="relative flex-1 min-w-[180px]">
                                <span className="sr-only">Search contacts</span>
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input value={contactQuery} onChange={(event) => { setContactQuery(event.target.value); setPage(0); }} placeholder="search name or chats..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm" />
                            </label>
                            <select value={contactFilter} onChange={(event) => { setContactFilter(event.target.value); setPage(0); }} className="px-3 py-2 rounded-lg border border-border bg-white text-sm">
                                <option value="all">All loaded contacts</option>
                                <option value="eligible">Eligible only</option>
                                <option value="excluded">Not eligible</option>
                            </select>
                            <button type="button" onClick={() => open({ view: 'import' })} className="px-3 py-2 rounded-lg border border-border text-sm cursor-pointer">Import another CSV</button>
                        </div>
                        {contactPage.length === 0 ? (
                            <p className="px-4 py-10 text-sm text-muted-foreground text-center">No contacts match this filter.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-xs text-muted-foreground bg-muted/40">
                                        <tr>
                                            <th className="px-3 py-2 font-medium">Name</th>
                                            <th className="px-3 py-2 font-medium">Phone</th>
                                            <th className="px-3 py-2 font-medium">Email</th>
                                            <th className="px-3 py-2 font-medium">Consent</th>
                                            <th className="px-3 py-2 font-medium">Status</th>
                                            <th className="px-3 py-2 font-medium">Last visit</th>
                                            <th className="px-3 py-2 font-medium">Source</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contactPage.map((item) => (
                                            <tr key={item.id} className="border-t border-border">
                                                <td className="px-3 py-2">{item.name}</td>
                                                <td className="px-3 py-2">{item.phone || '—'}</td>
                                                <td className="px-3 py-2">{item.email || '—'}</td>
                                                <td className="px-3 py-2 capitalize">{item.consent}</td>
                                                <td className={`px-3 py-2 ${isEligible(item) ? 'text-emerald-700' : 'text-rose-600'}`}>{VALIDATION_LABELS[item.validation]}</td>
                                                <td className="px-3 py-2">{item.lastVisit || '—'}</td>
                                                <td className="px-3 py-2">{item.source}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="px-4 py-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border">
                            <span>Page {safePage + 1} of {pageCount}</span>
                            <div className="flex gap-2">
                                <button type="button" disabled={safePage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className="px-2 py-1 border border-border rounded cursor-pointer disabled:opacity-40">Previous</button>
                                <button type="button" disabled={safePage >= pageCount - 1} onClick={() => setPage((value) => value + 1)} className="px-2 py-1 border border-border rounded cursor-pointer disabled:opacity-40">Next</button>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section className="rounded-2xl border border-border bg-white overflow-hidden">
                        <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-border">
                            <h2 className="font-heading font-semibold mr-auto self-center">Recent campaigns</h2>
                            <label className="relative">
                                <span className="sr-only">Search campaigns</span>
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="search name or chats..." className="pl-9 pr-3 py-2 rounded-lg border border-border text-sm" />
                            </label>
                            <select value={status} onChange={(event) => setStatus(event.target.value)} className="px-3 py-2 rounded-lg border border-border bg-white text-sm">
                                {CAMPAIGN_STATUSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                            </select>
                        </div>
                        {visibleCampaigns.length === 0 ? (
                            <div className="px-4 py-12 text-center">
                                <p className="text-sm text-muted-foreground">No campaigns match this filter.</p>
                                <button type="button" onClick={startCreate} className="mt-3 px-4 py-2 rounded-lg bg-foreground text-white text-sm cursor-pointer">Create Campaign</button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-xs text-muted-foreground bg-muted/40">
                                        <tr>
                                            {['Campaign', 'Template', 'Audience', 'Status', 'Responses', 'Reservations', 'Created', ''].map((label) => (
                                                <th key={label || 'actions'} className="px-3 py-2 font-medium">{label}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleCampaigns.map((item) => (
                                            <tr key={item.id} className="border-t border-border">
                                                <td className="px-3 py-3 font-medium">{item.name}</td>
                                                <td className="px-3 py-3">{item.templateName}</td>
                                                <td className="px-3 py-3">{item.recipients}</td>
                                                <td className="px-3 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full border text-[11px] ${STATUS_STYLES[item.status]}`}>{statusLabel(item.status)}</span>
                                                </td>
                                                <td className="px-3 py-3">{item.responses ?? '—'}</td>
                                                <td className="px-3 py-3">{item.reservations ?? '—'}</td>
                                                <td className="px-3 py-3">{item.created}</td>
                                                <td className="px-3 py-3">
                                                    <button type="button" onClick={() => open({ view: 'campaign', id: item.id })} className="text-xs underline cursor-pointer">Open</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
