import {
  Bot,
  Lock,
  GripVertical,
  Pencil,
  Trash2,
  MessageSquare,
  Info,
  CheckCircle2,
  Save,
  Loader2,
  Plus,
  Code2,
  Settings2,
  Copy,
  Check,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { widgetService } from '../services/widgetService';
import { useAuthStore } from '../store/useAuthStore';

// ─── Tab constants ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'config',  label: 'Widget Configuration', icon: Settings2 },
  { id: 'embed',   label: 'Embed & Deploy', icon: Code2 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export function Widget() {
  const [activeTab, setActiveTab] = useState('config');
  const { restaurantId } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <h1 className="font-heading font-semibold text-foreground">Widget</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your embeddable AI chat widget — configure its flow and grab the injection code.
          </p>

          {/* Tab Bar */}
          <div className="flex gap-1 mt-5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-foreground text-white'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'config' && <WidgetConfigTab restaurantId={restaurantId} />}
        {activeTab === 'embed'  && <EmbedTab restaurantId={restaurantId} />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1 — Widget Configuration (mirrors BotSetting logic)
// ─────────────────────────────────────────────────────────────────────────────
function WidgetConfigTab({ restaurantId }) {
  const [questions, setQuestions]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newQ, setNewQ] = useState({ title: '', botMessage: '', isRequired: true });
  const [isAdding, setIsAdding]         = useState(false);

  const fetchQuestions = () => {
    if (!restaurantId) return;
    setLoading(true);
    widgetService.getQuestions(restaurantId)
      .then(res => {
        if (res?.data) setQuestions([...res.data].sort((a, b) => a.order - b.order));
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchQuestions(); }, [restaurantId]);

  // Derived sections
  const greetQ   = questions.find(q => q.title === 'Greeting'      || q.id === 'q_greeting');
  const confirmQ = questions.find(q => q.title === 'Confirmation'   || q.id === 'q_confirmation');
  const midQs    = questions.filter(q => q.id !== greetQ?.id && q.id !== confirmQ?.id);

  // ── Drag-and-drop (mid only) ────────────────────────────────────────────
  const handleDragStart = (e, idx) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', idx.toString());
  };
  const handleDragOver  = (e) => e.preventDefault();
  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    const srcIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(srcIdx) || srcIdx === targetIdx) return;
    const newMid = [...midQs];
    const [moved] = newMid.splice(srcIdx, 1);
    newMid.splice(targetIdx, 0, moved);
    const rebuilt = [greetQ, ...newMid, confirmQ].filter(Boolean);
    setQuestions(rebuilt.map((q, i) => ({ ...q, order: i + 1 })));
  };

  // ── Inline edit (local state only; send on Save) ───────────────────────
  const handleUpdateMessage = (questionId, newMessage) => {
    setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, botMessage: newMessage } : q));
  };

  // ── Add question ────────────────────────────────────────────────────────
  const handleAddQuestion = async () => {
    if (!newQ.title || !newQ.botMessage) { alert('Please fill title and message.'); return; }
    setIsAdding(true);
    try {
      await widgetService.addQuestion(restaurantId, newQ);
      setIsAddModalOpen(false);
      setNewQ({ title: '', botMessage: '', isRequired: true });
      fetchQuestions();
    } catch (err) { console.error(err); alert('Failed to add question.'); }
    finally { setIsAdding(false); }
  };

  // ── Delete question ─────────────────────────────────────────────────────
  const handleDelete = async (questionId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await widgetService.deleteQuestion(restaurantId, questionId);
      fetchQuestions();
    } catch (err) { console.error(err); alert('Failed to delete question.'); }
  };

  // ── Save all (PUT full replacement) ────────────────────────────────────
  const saveConfig = async () => {
    setSaving(true);
    try {
      // Send the whole array in current display order; server reassigns 1…N
      await widgetService.replaceQuestionFlow(restaurantId, questions);
      alert('Widget configuration saved!');
    } catch (err) { console.error(err); alert('Failed to save configuration.'); }
    finally { setSaving(false); }
  };

  return (
    <>
      {/* Sub-header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">Conversation Flow</h2>
          <p className="text-sm text-gray-400 mt-1">
            Keep the opening, booking questions, and final confirmation clearly separated.
            <span className="block mt-1 text-blue-500 font-medium">
              Greeting and confirmation are editable only. Middle questions can be edited, reordered and deleted.
            </span>
          </p>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving || loading}
          className="px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-10">

          {/* ── Greeting ── */}
          {greetQ && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Bot className="w-5 h-5 text-blue-500" />
                <h3 className="text-md font-semibold text-gray-800">Greeting Message</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">Fixed opening message — always shown first in the widget.</p>
              <div className="grid grid-cols-1 gap-4">
                <QuestionCard question={greetQ} isFixed isFullWidth onUpdateMessage={handleUpdateMessage} />
              </div>
            </div>
          )}

          <div className="border-t border-gray-200" />

          {/* ── Booking Questions ── */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-md font-semibold text-gray-800">Booking Questions</h3>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">New questions are inserted just before the confirmation step.</p>
            {midQs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No booking questions yet. Use "+ Add Question" to add one.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ gridAutoRows: '1fr' }}>
                {midQs.map((q, idx) => (
                  <QuestionCard
                    key={q.id || idx}
                    question={q}
                    index={idx}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onUpdateMessage={handleUpdateMessage}
                    onDelete={handleDelete}
                    isFixed={false}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200" />

          {/* ── Confirmation ── */}
          {confirmQ && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-gray-500" />
                <h3 className="text-md font-semibold text-gray-800">Confirmation Message</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">Fixed closing message — always shown last to confirm the booking.</p>
              <div className="grid grid-cols-1 gap-4">
                <QuestionCard question={confirmQ} isFixed isFullWidth onUpdateMessage={handleUpdateMessage} />
              </div>
            </div>
          )}

          {/* Footer count */}
          <div className="flex items-center gap-2 pt-2">
            <CheckCircle2 className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-500">
              All <span className="font-semibold text-gray-700">{questions.length} questions</span> are active in this widget flow.
            </p>
          </div>
        </div>
      )}

      {/* ── Add Question Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Add Booking Question</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newQ.title}
                  onChange={e => setNewQ({ ...newQ, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Special Requests"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bot Message</label>
                <textarea
                  value={newQ.botMessage}
                  onChange={e => setNewQ({ ...newQ, botMessage: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm h-24 resize-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What the widget bot should ask"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="wq-required"
                  checked={newQ.isRequired}
                  onChange={e => setNewQ({ ...newQ, isRequired: e.target.checked })}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="wq-required" className="text-sm font-medium text-gray-700">Required Question</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsAddModalOpen(false)} disabled={isAdding}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-md transition-colors">
                Cancel
              </button>
              <button onClick={handleAddQuestion} disabled={isAdding}
                className="px-4 py-2 bg-foreground text-white rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50 hover:bg-foreground/90 transition-colors">
                {isAdding && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2 — Embed & Deploy
// ─────────────────────────────────────────────────────────────────────────────
function EmbedTab({ restaurantId }) {
  const [copied, setCopied] = useState(null);

  const scriptSnippet = `<script src="https://widget.jarviscalling.ai/embed.js"></script>`;
  const divSnippet    = `<div id="JarvisAI-widget"\n  data-restaurant-id="${restaurantId || 'YOUR_RESTAURANT_ID'}"\n  data-position="bottom-right"\n  data-theme="light">\n</div>`;
  const fullSnippet   = `${scriptSnippet}\n\n${divSnippet}`;

  const copy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Embed Your Widget</h2>
      <p className="text-sm text-gray-500 mb-8">
        Follow these steps to drop the Booki AI chat widget into any website in under 2 minutes.
      </p>

      {/* Steps */}
      <div className="space-y-8">

        {/* Step 1 */}
        <EmbedStep
          number={1}
          title="Load the embed script"
          description="Paste this tag inside the <head> or just before the closing </body> tag of your HTML."
        >
          <CodeBlock code={scriptSnippet} onCopy={() => copy('script', scriptSnippet)} copied={copied === 'script'} />
        </EmbedStep>

        {/* Step 2 */}
        <EmbedStep
          number={2}
          title="Place the widget container"
          description={
            <>
              Add this <code className="bg-gray-100 px-1 rounded text-xs font-mono">&lt;div&gt;</code> anywhere in your page body — the widget will mount inside it automatically.
              Your Restaurant ID is <strong>pre-filled</strong> so the widget is already linked to your account.
            </>
          }
        >
          <CodeBlock code={divSnippet} onCopy={() => copy('div', divSnippet)} copied={copied === 'div'} />
          <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
            <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
            <span>
              <strong>data-restaurant-id</strong> is the only required attribute — it ties every widget conversation to your restaurant.
              <strong className="block mt-1">data-position</strong> accepts <code className="bg-white px-1 rounded font-mono">bottom-right</code>, <code className="bg-white px-1 rounded font-mono">bottom-left</code>.
              <strong className="block mt-1">data-theme</strong> accepts <code className="bg-white px-1 rounded font-mono">light</code> or <code className="bg-white px-1 rounded font-mono">dark</code>.
            </span>
          </div>
        </EmbedStep>

        {/* Step 3 — Copy all */}
        <EmbedStep
          number={3}
          title="Or copy both at once"
          description="Grab the complete ready-to-paste snippet below."
        >
          <CodeBlock code={fullSnippet} onCopy={() => copy('full', fullSnippet)} copied={copied === 'full'} tall />
        </EmbedStep>
      </div>

      {/* Your Restaurant ID callout */}
      <div className="mt-10 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Your Restaurant ID</p>
          <p className="text-base font-mono font-semibold text-foreground mt-0.5">{restaurantId || '—'}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function EmbedStep({ number, title, description, children }) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-foreground text-white text-sm font-bold flex items-center justify-center">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-800 mb-0.5">{title}</h3>
        <p className="text-sm text-gray-500 mb-3">{description}</p>
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ code, onCopy, copied, tall }) {
  return (
    <div className="relative group">
      <pre className={`bg-gray-900 text-green-300 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed ${tall ? 'h-36' : ''}`}>
        {code}
      </pre>
      <button
        onClick={onCopy}
        className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-md transition-colors cursor-pointer"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Question Card (identical visual to BotSetting's QuestionRow)
// ─────────────────────────────────────────────────────────────────────────────
function QuestionCard({ question, index, onDragStart, onDragOver, onDrop, onUpdateMessage, onDelete, isFixed, isFullWidth }) {
  const label = question.title || question.id;
  const [isEditing, setIsEditing] = useState(false);
  const [tempMsg, setTempMsg]     = useState(question.botMessage || '');

  const handleSave = () => {
    setIsEditing(false);
    onUpdateMessage(question.id, tempMsg);
  };

  return (
    <div
      draggable={!isEditing && !isFixed}
      onDragStart={(e) => !isFixed && onDragStart?.(e, index)}
      onDragOver={!isFixed ? onDragOver : undefined}
      onDrop={(e) => !isFixed && onDrop?.(e, index)}
      className={`relative flex flex-col bg-white border border-gray-200 rounded-xl p-5 overflow-hidden min-h-[160px] transition-colors
        ${!isEditing && !isFixed ? 'cursor-move hover:border-blue-300' : ''}
        ${isEditing ? 'border-blue-300 ring-2 ring-blue-50' : ''}
        ${isFullWidth ? 'md:col-span-2' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-md bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center flex-shrink-0">
            {question.order}
          </span>
          <span className="text-sm font-semibold text-gray-800">{label}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {question.isRequired && (
            <span className="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">Required</span>
          )}
          {isFixed && (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded px-2 py-0.5 flex items-center gap-1">
              <Lock style={{ width: 10, height: 10 }} /> Fixed
            </span>
          )}
          <div className="flex items-center gap-1.5 opacity-60">
            {!isFixed && <GripVertical style={{ width: 18, height: 18 }} className="text-gray-500 hover:text-gray-800 cursor-grab" />}
            <button onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="hover:text-blue-500 transition-colors p-1 cursor-pointer" title={isEditing ? 'Save' : 'Edit'}>
              {isEditing
                ? <CheckCircle2 style={{ width: 16, height: 16 }} className="text-blue-500" />
                : <Pencil style={{ width: 16, height: 16 }} className="text-gray-500 hover:text-gray-900" />
              }
            </button>
            {!isFixed && onDelete && (
              <button onClick={() => onDelete(question.id)}
                className="hover:text-red-500 transition-colors p-1 cursor-pointer" title="Delete">
                <Trash2 style={{ width: 16, height: 16 }} className="text-gray-500 hover:text-red-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 mb-3" />

      {/* Bot message */}
      <div className="flex gap-2 flex-1">
        <MessageSquare style={{ width: 14, height: 14 }} className="text-gray-400 mt-1 flex-shrink-0" />
        {isEditing ? (
          <textarea
            autoFocus
            value={tempMsg}
            onChange={(e) => setTempMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } }}
            className="w-full text-sm text-gray-700 bg-gray-50 border border-blue-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none h-[80px]"
          />
        ) : (
          <p className="text-sm text-gray-600 leading-relaxed break-words">{question.botMessage}</p>
        )}
      </div>

      {/* Instructions */}
      {question.instructions && !isEditing && (
        <div className="mt-3 flex gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
          <Info style={{ width: 13, height: 13 }} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-medium">Note: </span>{question.instructions}
          </p>
        </div>
      )}
    </div>
  );
}
