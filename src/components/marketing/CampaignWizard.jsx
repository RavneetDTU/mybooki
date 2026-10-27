import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AUDIENCE_OPTIONS, OBJECTIVES, audienceContacts, isEligible, renderTemplate, summarizeContacts } from '../../data/marketingMock';

const STEPS = ['Campaign Details', 'Select Audience', 'Choose Template', 'Preview Message', 'Review'];

function AddTemplate({ onAdd }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [body, setBody] = useState('Hi {{1}}, a note from {{2}}. Reply to reserve a table.');

    if (!open) {
        return (
            <button type="button" onClick={() => setOpen(true)} className="px-3 py-1.5 text-xs rounded-lg border border-border bg-white cursor-pointer">
                Add template
            </button>
        );
    }

    return (
        <form
            className="w-full max-w-md rounded-xl border border-border bg-white p-3 space-y-2 text-left"
            onSubmit={(event) => {
                event.preventDefault();
                if (!name.trim()) return;
                onAdd({
                    name: name.trim(),
                    category: 'Marketing',
                    language: 'English',
                    approval: 'Pending Review',
                    selectable: false,
                    variables: ['Customer name', 'Restaurant name'],
                    body: body.trim() || 'Hi {{1}}, a note from {{2}}.',
                    replies: ['Book a Table', 'Not Now'],
                });
                setName('');
                setOpen(false);
            }}
        >
            <p className="text-sm font-medium">New sample template</p>
            <p className="text-xs text-muted-foreground">Saved on this page only, marked Pending Review, and not selectable for prepare.</p>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Template name" aria-label="Template name" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={3} aria-label="Template message" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2">
                <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-xs rounded-lg border border-border cursor-pointer">Cancel</button>
                <button type="submit" disabled={!name.trim()} className="px-3 py-1.5 text-xs rounded-lg bg-foreground text-white cursor-pointer disabled:opacity-40">Save template</button>
            </div>
        </form>
    );
}

function Field({ label, children }) {
    return (
        <label className="block text-sm">
            <span className="font-medium">{label}</span>
            <div className="mt-1">{children}</div>
        </label>
    );
}

export default function CampaignWizard({ wizard, setWizard, contacts, templates, onClose, onSave, onPreview, onAddTemplate }) {
    const step = wizard.step || 1;
    const reached = Math.max(wizard.maxStep || 1, step);
    const setStep = (next) => setWizard((current) => ({
        ...current,
        step: next,
        maxStep: Math.max(current.maxStep || 1, next),
    }));
    const patch = (partial) => setWizard((current) => ({ ...current, ...partial }));
    const template = templates.find((item) => item.id === wizard.templateId) || templates[0];
    const selected = audienceContacts(contacts, wizard.audience, wizard.selectedIds);
    const summary = summarizeContacts(contacts);
    const rendered = renderTemplate(template.body, {
        customerName: wizard.customerName,
        restaurantName: wizard.restaurantName,
    });
    const detailsReady = wizard.name.trim().length > 0;

    return (
        <div className="h-full min-h-0 flex flex-col">
            <div className="shrink-0 border-b border-border bg-white px-6 py-4">
                <div className="flex items-center gap-2">
                    <button type="button" onClick={onClose} aria-label="Back to campaigns" className="inline-flex items-center justify-center w-8 h-8 rounded-md text-foreground hover:bg-muted cursor-pointer">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-heading font-semibold text-xl">Create campaign</h1>
                </div>
                <ol className="mt-3 flex flex-wrap gap-2">
                    {STEPS.map((label, index) => {
                        const number = index + 1;
                        const active = number === step;
                        return (
                            <li key={label}>
                                <button
                                    type="button"
                                    disabled={number > reached || (number > 1 && !detailsReady)}
                                    onClick={() => setStep(number)}
                                    className={`px-3 py-1.5 rounded-full text-xs border cursor-pointer ${active ? 'bg-foreground text-white border-foreground' : 'bg-white border-border'}`}
                                >
                                    {number}. {label}
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
                {step === 1 ? (
                    <div className="max-w-xl space-y-4">
                        <Field label="Campaign name">
                            <input value={wizard.name} onChange={(event) => patch({ name: event.target.value })} className="w-full border border-border rounded-lg px-3 py-2" />
                        </Field>
                        <Field label="Campaign objective">
                            <select value={wizard.objective} onChange={(event) => patch({ objective: event.target.value })} className="w-full border border-border rounded-lg px-3 py-2 bg-white">
                                {OBJECTIVES.map((item) => (
                                    <option key={item}>{item}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Internal description (optional)">
                            <textarea value={wizard.description} onChange={(event) => patch({ description: event.target.value })} rows={3} className="w-full border border-border rounded-lg px-3 py-2" />
                        </Field>
                        {!detailsReady ? <p className="text-sm text-rose-600">Campaign name is required.</p> : null}
                    </div>
                ) : null}
                {step === 2 ? (
                    <div className="grid lg:grid-cols-[1fr_280px] gap-4">
                        <div className="space-y-2">
                            {AUDIENCE_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => patch({ audience: option.id })}
                                    className={`w-full text-left rounded-xl border px-4 py-3 cursor-pointer ${wizard.audience === option.id ? 'border-foreground bg-muted' : 'border-border bg-white'}`}
                                >
                                    <p className="font-medium text-sm">{option.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{option.detail}</p>
                                </button>
                            ))}
                            {wizard.audience === 'custom' ? (
                                <div className="rounded-xl border border-border bg-white max-h-64 overflow-y-auto">
                                    {contacts.filter(isEligible).map((contact) => (
                                        <label key={contact.id} className="flex items-center gap-2 px-3 py-2 border-b border-border text-sm">
                                            <input
                                                type="checkbox"
                                                checked={wizard.selectedIds.includes(contact.id)}
                                                onChange={(event) => {
                                                    const next = event.target.checked
                                                        ? [...wizard.selectedIds, contact.id]
                                                        : wizard.selectedIds.filter((id) => id !== contact.id);
                                                    patch({ selectedIds: next });
                                                }}
                                            />
                                            <span>{contact.name}</span>
                                            <span className="text-xs text-muted-foreground ml-auto">{contact.phone}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                        <aside className="rounded-xl border border-border bg-white p-4 h-fit text-sm space-y-2">
                            <p className="font-heading font-semibold">Audience</p>
                            <p>Total contacts: {summary.total}</p>
                            <p>Eligible contacts: {summary.eligible}</p>
                            <p className="font-medium">Selected recipients: {selected.length}</p>
                            <p>Excluded: {summary.total - selected.length}</p>
                            <p className="text-xs text-muted-foreground">Counts use the contacts loaded on this page, not the sample overview numbers.</p>
                        </aside>
                    </div>
                ) : null}
                {step === 3 ? (
                    <div className="space-y-4">
                    <div className="flex justify-end">
                        <AddTemplate onAdd={onAddTemplate} />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        {templates.map((item) => (
                            <article key={item.id} className={`rounded-2xl border bg-white p-4 ${wizard.templateId === item.id ? 'border-foreground' : 'border-border'} ${item.selectable ? '' : 'opacity-80'}`}>
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="font-heading font-semibold">{item.name}</h2>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.approval === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : item.approval === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>{item.approval}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{item.category} · {item.language}</p>
                                <p className="text-sm mt-3 leading-relaxed">{item.body}</p>
                                <p className="text-[11px] text-muted-foreground mt-2">Variables: {item.variables.join(', ')}</p>
                                <div className="flex gap-2 mt-3">
                                    <button type="button" disabled={!item.selectable} onClick={() => patch({ templateId: item.id })} className="px-3 py-1.5 text-xs rounded-lg bg-foreground text-white cursor-pointer disabled:opacity-40">
                                        {item.selectable ? 'Use template' : 'Not selectable'}
                                    </button>
                                    <button type="button" onClick={() => onPreview(item)} className="px-3 py-1.5 text-xs rounded-lg border border-border cursor-pointer">Preview template</button>
                                </div>
                            </article>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">These are sample templates for this preview. Nothing here is submitted to Meta or approved by Meta.</p>
                    </div>
                ) : null}
                {step === 4 ? (
                    <div className="grid lg:grid-cols-[280px_1fr] gap-4">
                        <div className="space-y-3">
                            <Field label="Example customer name">
                                <input value={wizard.customerName} onChange={(event) => patch({ customerName: event.target.value })} className="w-full border border-border rounded-lg px-3 py-2" />
                            </Field>
                            <Field label="Restaurant name">
                                <input value={wizard.restaurantName} onChange={(event) => patch({ restaurantName: event.target.value })} className="w-full border border-border rounded-lg px-3 py-2" />
                            </Field>
                            <p className="text-xs text-muted-foreground">Original template still uses {'{{1}}'} and {'{{2}}'}. The phone preview shows them filled in.</p>
                        </div>
                        <div className="rounded-2xl overflow-hidden border border-[#d1d7db] bg-[#efeae2] max-w-md">
                            <div className="bg-[#008069] text-white px-4 py-3 text-sm font-semibold">{wizard.restaurantName || 'Restaurant'}</div>
                            <div className="p-4 space-y-2">
                                <p className="text-[11px] text-center text-[#667781]">Preview · not sent</p>
                                <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 text-sm shadow-sm whitespace-pre-wrap">{rendered}</div>
                                <div className="flex flex-wrap gap-2">
                                    {template.replies.map((reply) => (
                                        <span key={reply} className="px-3 py-1 rounded-full bg-white text-[#008069] text-xs border border-[#008069]/20">{reply}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
                {step === 5 ? (
                    <div className="max-w-2xl rounded-2xl border border-border bg-white p-5 space-y-3 text-sm">
                        <h2 className="font-heading font-semibold text-lg">{wizard.name || 'Untitled campaign'}</h2>
                        <p>Objective: {wizard.objective}</p>
                        <p>Template: {template.name} · {template.approval}</p>
                        <p>Recipients: {selected.length} eligible of {summary.total} loaded contacts</p>
                        <p>Excluded: {summary.total - selected.length}</p>
                        <p className="text-xs text-muted-foreground">{wizard.description || 'No internal description.'}</p>
                        <div className="bg-[#efeae2] rounded-xl p-3">
                            <p className="text-xs text-[#667781] mb-2">Message preview</p>
                            <p className="bg-white rounded-lg px-3 py-2">{rendered}</p>
                        </div>
                        <p className="text-xs text-amber-800">Launch is not available in this preview. Preparing the campaign only saves it on this page.</p>
                        {wizard.notice ? <p className="text-sm text-emerald-700">{wizard.notice}</p> : null}
                    </div>
                ) : null}
            </div>
            <div className="shrink-0 border-t border-border bg-white px-6 py-3 flex flex-wrap gap-2">
                {step > 1 ? <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2 rounded-lg border border-border text-sm cursor-pointer">Back</button> : null}
                <button type="button" onClick={() => onSave('draft')} className="px-4 py-2 rounded-lg border border-border text-sm cursor-pointer">Save as draft</button>
                {step < 5 ? (
                    <button type="button" disabled={step === 1 && !detailsReady} onClick={() => setStep(step + 1)} className="px-4 py-2 rounded-lg bg-foreground text-white text-sm cursor-pointer disabled:opacity-40">Continue</button>
                ) : (
                    <>
                        <button type="button" onClick={() => onPreview(template)} className="px-4 py-2 rounded-lg border border-border text-sm cursor-pointer">Preview conversation</button>
                        <button type="button" disabled={!template.selectable || !detailsReady} onClick={() => onSave('ready')} className="px-4 py-2 rounded-lg bg-foreground text-white text-sm cursor-pointer disabled:opacity-40">Prepare campaign</button>
                    </>
                )}
            </div>
        </div>
    );
}
