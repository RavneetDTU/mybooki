import { useState, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';

// ─── Inline API call (testing only – no separate service file) ───────────────
const BOT_SERVER_URL = 'http://localhost:7000';

const updateQuestionFlow = async (restaurantId, questionFlow) => {
    const response = await fetch(`${BOT_SERVER_URL}/update-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId, questionFlow }),
    });
    if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Failed to update question flow');
    }
    return response.json();
};

// ─── Default flow (used when server fetch not available) ─────────────────────
const DEFAULT_FLOW = [
    { id: 'greet', order: 1, botMessage: "Hello! Welcome. I'm the AI booking assistant. How can I help with a reservation today?", isRequired: true, instructions: null },
    { id: 'name', order: 2, botMessage: "May I have the name for the reservation?", isRequired: true, instructions: "Skip if already given." },
    { id: 'phone', order: 3, botMessage: "What's the best phone number to confirm the booking?", isRequired: true, instructions: "Use STRICT DATA CAPTURE PROTOCOL (Anti-Hallucination Mode). Minimum 9 digits. Literal read-back required." },
    { id: 'dateTime', order: 4, botMessage: "What date and time would you prefer?", isRequired: true, instructions: "Check against operating hours." },
    { id: 'partySize', order: 5, botMessage: "How many guests will be dining?", isRequired: true, instructions: null },
    { id: 'allergies', order: 6, botMessage: "Does anyone in the party have any allergies we should note?", isRequired: true, instructions: null },
    { id: 'confirm', order: 7, botMessage: "Just to confirm: a table under [name] for [number] guests on [date] at [time]. Contact: [phone]. Allergies: [details or 'none noted']. Is that correct?", isRequired: true, instructions: null },
];

// ─── Normalise order values so they are always 1-based sequential ─────────────
const normaliseOrder = (flow) =>
    flow.map((q, i) => ({ ...q, order: i + 1 }));

// ─── Badge colours per question id ────────────────────────────────────────────
const BADGE_COLORS = {
    greet: 'bg-purple-100 text-purple-700 border-purple-300',
    name: 'bg-blue-100   text-blue-700   border-blue-300',
    phone: 'bg-green-100  text-green-700  border-green-300',
    dateTime: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    partySize: 'bg-orange-100 text-orange-700 border-orange-300',
    allergies: 'bg-red-100    text-red-700    border-red-300',
    confirm: 'bg-gray-100   text-gray-700   border-gray-300',
};
const badgeColor = (id) => BADGE_COLORS[id] || 'bg-indigo-100 text-indigo-700 border-indigo-300';

// ─── Component ────────────────────────────────────────────────────────────────
export const Context = () => {
    const { restaurantId } = useAuthStore();

    const [flow, setFlow] = useState(normaliseOrder(DEFAULT_FLOW));
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
    const [saveMsg, setSaveMsg] = useState('');

    // Drag state
    const dragIndex = useRef(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    // Edit modal
    const [editingIndex, setEditingIndex] = useState(null);
    const [editDraft, setEditDraft] = useState(null);

    // Add modal
    const [addingQuestion, setAddingQuestion] = useState(false);
    const [newQ, setNewQ] = useState({ id: '', botMessage: '', isRequired: true, instructions: '' });

    // ── Drag handlers ──────────────────────────────────────────────
    const onDragStart = (e, index) => {
        dragIndex.current = index;
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const onDrop = (e, dropIndex) => {
        e.preventDefault();
        const from = dragIndex.current;
        if (from === null || from === dropIndex) {
            setDragOverIndex(null);
            return;
        }
        const updated = [...flow];
        const [moved] = updated.splice(from, 1);
        updated.splice(dropIndex, 0, moved);
        setFlow(normaliseOrder(updated));
        dragIndex.current = null;
        setDragOverIndex(null);
    };

    const onDragEnd = () => {
        dragIndex.current = null;
        setDragOverIndex(null);
    };

    // ── Remove ─────────────────────────────────────────────────────
    const removeQuestion = (index) => {
        const updated = flow.filter((_, i) => i !== index);
        setFlow(normaliseOrder(updated));
    };

    // ── Edit ───────────────────────────────────────────────────────
    const openEdit = (index) => {
        setEditingIndex(index);
        setEditDraft({ ...flow[index] });
    };

    const saveEdit = () => {
        const updated = [...flow];
        updated[editingIndex] = { ...editDraft };
        setFlow(normaliseOrder(updated));
        setEditingIndex(null);
        setEditDraft(null);
    };

    // ── Add ────────────────────────────────────────────────────────
    const openAdd = () => {
        setNewQ({ id: '', botMessage: '', isRequired: true, instructions: '' });
        setAddingQuestion(true);
    };

    const confirmAdd = () => {
        if (!newQ.id.trim() || !newQ.botMessage.trim()) return;
        // Check unique id
        if (flow.some(q => q.id === newQ.id.trim())) {
            alert(`ID "${newQ.id}" already exists. Choose a unique semantic ID.`);
            return;
        }
        const updated = [...flow, {
            id: newQ.id.trim(),
            order: flow.length + 1,
            botMessage: newQ.botMessage.trim(),
            isRequired: newQ.isRequired,
            instructions: newQ.instructions.trim() || null,
        }];
        setFlow(normaliseOrder(updated));
        setAddingQuestion(false);
    };

    // ── Save to backend ────────────────────────────────────────────
    const handleSave = async () => {
        if (!restaurantId) {
            setSaveStatus('error');
            setSaveMsg('No restaurant ID found. Are you logged in?');
            return;
        }
        setSaving(true);
        setSaveStatus(null);
        try {
            await updateQuestionFlow(restaurantId, flow);
            setSaveStatus('success');
            setSaveMsg('Question flow saved successfully!');
        } catch (err) {
            setSaveStatus('error');
            setSaveMsg(err.message || 'Something went wrong.');
        } finally {
            setSaving(false);
            setTimeout(() => setSaveStatus(null), 4000);
        }
    };

    // ── UI ─────────────────────────────────────────────────────────
    return (
        <div className="min-h-[calc(100vh-80px)] bg-gray-50 px-6 py-8">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Bot Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage the conversation flow your AI booking bot follows.
                        Drag cards to reorder, edit messages, or add/remove questions.
                    </p>
                    <div className="mt-2 text-xs text-gray-400">
                        Restaurant ID: <span className="font-mono font-semibold text-gray-600">{restaurantId || '—'}</span>
                    </div>
                </div>

                {/* Section Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Question Flow ({flow.length} steps)
                    </h2>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
                    >
                        <span className="text-lg leading-none">+</span>
                        Add Question
                    </button>
                </div>

                {/* Flow Cards */}
                <div className="space-y-2">
                    {flow.map((q, index) => (
                        <div
                            key={q.id + index}
                            draggable
                            onDragStart={(e) => onDragStart(e, index)}
                            onDragOver={(e) => onDragOver(e, index)}
                            onDrop={(e) => onDrop(e, index)}
                            onDragEnd={onDragEnd}
                            className={`
                                group flex items-start gap-3 bg-white border rounded-xl px-4 py-3.5 cursor-grab active:cursor-grabbing
                                transition-all duration-150
                                ${dragOverIndex === index ? 'border-black shadow-md scale-[1.01]' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
                            `}
                        >
                            {/* Drag Handle */}
                            <div className="mt-1 text-gray-300 group-hover:text-gray-500 transition-colors select-none shrink-0">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <circle cx="5" cy="4" r="1.5" />
                                    <circle cx="11" cy="4" r="1.5" />
                                    <circle cx="5" cy="8" r="1.5" />
                                    <circle cx="11" cy="8" r="1.5" />
                                    <circle cx="5" cy="12" r="1.5" />
                                    <circle cx="11" cy="12" r="1.5" />
                                </svg>
                            </div>

                            {/* Order Badge */}
                            <div className="shrink-0 w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mt-0.5">
                                {q.order}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeColor(q.id)}`}>
                                        {q.id}
                                    </span>
                                    {!q.isRequired && (
                                        <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200">
                                            optional
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-800 leading-snug line-clamp-2">{q.botMessage}</p>
                                {q.instructions && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-start gap-1">
                                        <span className="shrink-0 mt-0.5">⚡</span>
                                        <span>{q.instructions}</span>
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEdit(index)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                                    title="Edit"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => removeQuestion(index)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Remove"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14H6L5 6" />
                                        <path d="M10 11v6M14 11v6" />
                                        <path d="M9 6V4h6v2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Save Button */}
                <div className="mt-6 flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>

                    {saveStatus === 'success' && (
                        <div className="flex items-center gap-1.5 text-sm text-green-600">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {saveMsg}
                        </div>
                    )}
                    {saveStatus === 'error' && (
                        <div className="flex items-center gap-1.5 text-sm text-red-600">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {saveMsg}
                        </div>
                    )}
                </div>

                {/* Helper note */}
                <p className="text-xs text-gray-400 mt-3">
                    Saves to <code className="font-mono">localhost:7000/update-config</code> → updates <code className="font-mono">prompts.json</code> on the bot server.
                </p>
            </div>

            {/* ── Edit Modal ──────────────────────────────────────────────── */}
            {editingIndex !== null && editDraft && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            Edit Question — <span className={`text-sm font-semibold px-2 py-0.5 rounded-full border ${badgeColor(editDraft.id)}`}>{editDraft.id}</span>
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Bot Message</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    rows={4}
                                    value={editDraft.botMessage}
                                    onChange={(e) => setEditDraft({ ...editDraft, botMessage: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Instructions <span className="font-normal text-gray-400">(optional — bot behaviour rules)</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="e.g. Skip if already given"
                                    value={editDraft.instructions || ''}
                                    onChange={(e) => setEditDraft({ ...editDraft, instructions: e.target.value || null })}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="edit-required"
                                    checked={editDraft.isRequired}
                                    onChange={(e) => setEditDraft({ ...editDraft, isRequired: e.target.checked })}
                                    className="w-4 h-4 accent-black"
                                />
                                <label htmlFor="edit-required" className="text-sm text-gray-700">Required</label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => { setEditingIndex(null); setEditDraft(null); }}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveEdit}
                                className="px-5 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Question Modal ──────────────────────────────────────── */}
            {addingQuestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Add New Question</h3>
                        <p className="text-xs text-gray-400 mb-4">The question will be added at the end of the flow. You can drag it to reorder afterwards.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Semantic ID <span className="font-normal text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="e.g. occasion, dietary, specialRequests"
                                    value={newQ.id}
                                    onChange={(e) => setNewQ({ ...newQ, id: e.target.value.replace(/\s+/g, '') })}
                                />
                                <p className="text-xs text-gray-400 mt-1">No spaces. Must be unique. Describes what data this captures.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Bot Message <span className="font-normal text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    rows={3}
                                    placeholder="The exact message the bot will say"
                                    value={newQ.botMessage}
                                    onChange={(e) => setNewQ({ ...newQ, botMessage: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Instructions <span className="font-normal text-gray-400">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                    placeholder="Special bot behaviour rules for this step"
                                    value={newQ.instructions}
                                    onChange={(e) => setNewQ({ ...newQ, instructions: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="add-required"
                                    checked={newQ.isRequired}
                                    onChange={(e) => setNewQ({ ...newQ, isRequired: e.target.checked })}
                                    className="w-4 h-4 accent-black"
                                />
                                <label htmlFor="add-required" className="text-sm text-gray-700">Required</label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setAddingQuestion(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAdd}
                                disabled={!newQ.id.trim() || !newQ.botMessage.trim()}
                                className="px-5 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};