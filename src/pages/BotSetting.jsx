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
  Plus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { settingsService } from '../services/settings';
import { useAuthStore } from '../store/useAuthStore';

const STEP_LABELS = {
  greet: 'Greeting',
  phone: 'Phone Capture',
  name: 'Name Capture',
  dateTime: 'Date & Time',
  partySize: 'Party Size',
  allergies: 'Allergy Check',
  confirm: 'Confirmation',
};

export function BotSetting() {
  const { restaurantId } = useAuthStore();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add Question Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ title: '', botMessage: '', instructions: '', isRequired: true });
  const [isAdding, setIsAdding] = useState(false);

  const fetchBotSettings = () => {
    if (!restaurantId) return;
    setLoading(true);
    settingsService.getBotConfig(restaurantId)
      .then(data => {
        if (data && data.questionFlow) {
            setQuestions(data.questionFlow.sort((a,b) => a.order - b.order));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBotSettings();
  }, [restaurantId]);

  const sortedQuestions = [...questions].sort((a,b) => a.order - b.order);
  const finalGreet = sortedQuestions.find(q => q.title === 'Greeting' || q.id === 'greet') || sortedQuestions[0];
  const finalConfirm = sortedQuestions.find(q => q.title === 'Confirmation' || q.id === 'confirm') || (sortedQuestions.length > 1 ? sortedQuestions[sortedQuestions.length - 1] : null);
  const middleQuestions = sortedQuestions.filter(q => q.id !== finalGreet?.id && q.id !== finalConfirm?.id);

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const newMiddle = [...middleQuestions];
    const [moved] = newMiddle.splice(sourceIndex, 1);
    newMiddle.splice(targetIndex, 0, moved);

    const updatedFlow = [finalGreet, ...newMiddle, finalConfirm].filter(Boolean);
    const normalizedFlow = updatedFlow.map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(normalizedFlow);
  };

  const handleUpdateMessage = (questionId, newMessage) => {
    const newFlow = questions.map(q => 
        q.id === questionId ? { ...q, botMessage: newMessage } : q
    );
    setQuestions(newFlow);
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.title || !newQuestion.botMessage) {
      alert('Please fill at least the title and message.');
      return;
    }
    setIsAdding(true);
    try {
      await settingsService.addQuestion(restaurantId, newQuestion);
      setIsAddModalOpen(false);
      setNewQuestion({ title: '', botMessage: '', instructions: '', isRequired: true });
      fetchBotSettings();
    } catch (err) {
      console.error(err);
      alert('Failed to add question');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await settingsService.deleteQuestion(restaurantId, questionId);
      fetchBotSettings();
    } catch(err) {
      console.error(err);
      alert('Failed to delete question');
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await settingsService.updateBotConfig(restaurantId, questions);
      alert('Bot settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save bot settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-heading font-semibold text-foreground leading-tight">Bot Settings</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Configure your AI booking assistant's conversation flow and behaviour
            </p>
          </div>
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

      {/* Horizontal rule */}
      <div className="border-t border-gray-200 mt-5 mb-6" />

      {/* ── Section label row ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">Conversation Flow</h2>
          <p className="text-sm text-gray-400 mt-1">
            Keep the opening, booking questions, and final confirmation clearly separated for easier management.
            <span className="block mt-1 text-blue-500 font-medium">Greeting and confirmation are editable only. Middle questions can be edited and deleted.</span>
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-10">
          
          {/* Greeting Section */}
          {finalGreet && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Bot className="w-5 h-5 text-blue-500" />
                <h3 className="text-md font-semibold text-gray-800">Greeting Message</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">This stays fixed at the top so your bot always starts with a clean welcome.</p>
              <div className="grid grid-cols-1 gap-4">
                <QuestionRow
                  question={finalGreet}
                  isFixed={true}
                  isFullScreen={true}
                  onUpdateMessage={handleUpdateMessage}
                />
              </div>
            </div>
          )}

          <div className="border-t border-gray-200" />

          {/* Middle Section */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-md font-semibold text-gray-800">Booking Questions</h3>
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{middleQuestions.length} active</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">Manage the reservation questions here. Any new question is added at the end of this section, just before confirmation.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ gridAutoRows: '1fr' }}>
              {middleQuestions.map((q, index) => (
                <QuestionRow
                  key={q.id || index}
                  question={q}
                  index={index}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onUpdateMessage={handleUpdateMessage}
                  onDelete={handleDeleteQuestion}
                  isFixed={false}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* Confirmation Section */}
          {finalConfirm && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-gray-500" />
                <h3 className="text-md font-semibold text-gray-800">Confirmation Message</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">This remains fixed at the end so every reservation closes with the final confirmation.</p>
              <div className="grid grid-cols-1 gap-4">
                <QuestionRow
                  question={finalConfirm}
                  isFixed={true}
                  isFullScreen={true}
                  onUpdateMessage={handleUpdateMessage}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="mt-8 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-gray-400" />
        <p className="text-sm text-gray-500">
          All{' '}
          <span className="font-semibold text-gray-700">{questions.length} questions</span>{' '}
          are active in this flow.
        </p>
      </div>

      {/* ADD QUESTION MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Add Booking Question</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  value={newQuestion.title}
                  onChange={e => setNewQuestion({...newQuestion, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Dietary Requirements"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bot Message</label>
                <textarea 
                  value={newQuestion.botMessage}
                  onChange={e => setNewQuestion({...newQuestion, botMessage: e.target.value})}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm h-24 resize-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What the bot should ask the user"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (Optional)</label>
                <input 
                  type="text" 
                  value={newQuestion.instructions}
                  onChange={e => setNewQuestion({...newQuestion, instructions: e.target.value})}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Instructions for AI"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={newQuestion.isRequired}
                  onChange={e => setNewQuestion({...newQuestion, isRequired: e.target.checked})}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="isRequired" className="text-sm font-medium text-gray-700">Required Question</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-md transition-colors"
                disabled={isAdding}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddQuestion}
                disabled={isAdding}
                className="px-4 py-2 bg-foreground text-white rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50 hover:bg-foreground/90 transition-colors"
              >
                {isAdding && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionRow({ question, index, onDragStart, onDragOver, onDrop, onUpdateMessage, onDelete, isFixed, isFullScreen }) {
  const label = question.title || STEP_LABELS[question.id] || question.id;
  const [isEditing, setIsEditing] = useState(false);
  const [tempMessage, setTempMessage] = useState(question.botMessage || '');

  const handleSaveEdit = () => {
    setIsEditing(false);
    onUpdateMessage(question.id, tempMessage);
  };

  return (
    <div
      draggable={!isEditing && !isFixed}
      onDragStart={(e) => !isFixed && onDragStart && onDragStart(e, index)}
      onDragOver={!isFixed ? onDragOver : undefined}
      onDrop={(e) => !isFixed && onDrop && onDrop(e, index)}
      className={`relative flex flex-col bg-white border border-gray-200 rounded-xl p-5 overflow-hidden min-h-[160px] transition-colors ${!isEditing && !isFixed ? 'cursor-move hover:border-blue-300' : isEditing ? 'border-blue-300 ring-2 ring-blue-50' : ''} ${isFullScreen ? 'col-span-1 md:col-span-2' : ''}`}
    >
      {/* Card header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-md bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center flex-shrink-0">
            {question.order}
          </span>
          <span className="text-sm font-semibold text-gray-800">{label}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {question.isRequired && (
            <span className="text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
              Required
            </span>
          )}
          {isFixed && (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded px-2 py-0.5 flex items-center gap-1">
              <Lock style={{ width: 10, height: 10 }} />
              Fixed
            </span>
          )}
          <div className="flex items-center gap-1.5 opacity-60">
            {!isFixed && (
              <GripVertical style={{ width: 18, height: 18 }} className="text-gray-500 hover:text-gray-800 cursor-grab" />
            )}
            <button
              onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
              className="hover:text-blue-500 transition-colors p-1 cursor-pointer"
              title={isEditing ? 'Save' : 'Edit'}
            >
              {isEditing
                ? <CheckCircle2 style={{ width: 16, height: 16 }} className="text-blue-500" />
                : <Pencil style={{ width: 16, height: 16 }} className="text-gray-500 hover:text-gray-900" />}
            </button>
            {!isFixed && onDelete && (
              <button
                onClick={() => onDelete(question.id)}
                className="hover:text-red-500 transition-colors p-1 cursor-pointer"
                title="Delete"
              >
                <Trash2 style={{ width: 16, height: 16 }} className="text-gray-500 hover:text-red-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 mb-3" />

      {/* Bot message */}
      <div className="flex gap-2 flex-1">
        <MessageSquare style={{ width: 14, height: 14 }} className="text-gray-400 mt-1 flex-shrink-0" />
        {isEditing ? (
          <textarea
            autoFocus
            value={tempMessage}
            onChange={(e) => setTempMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSaveEdit();
              }
            }}
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
            <span className="font-medium">Note: </span>
            {question.instructions}
          </p>
        </div>
      )}
    </div>
  );
}