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
  Loader2
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

  useEffect(() => {
    if (restaurantId) {
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
    }
  }, [restaurantId]);

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

    const newFlow = [...questions];
    const [moved] = newFlow.splice(sourceIndex, 1);
    newFlow.splice(targetIndex, 0, moved);
    
    const updatedFlow = newFlow.map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(updatedFlow);
  };

  const handleUpdateMessage = (index, newMessage) => {
    const newFlow = [...questions];
    newFlow[index].botMessage = newMessage;
    setQuestions(newFlow);
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

      <div className="border-t border-gray-200 mt-5 mb-6" />

      {/* ── Section label row ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-m font-semibold text-gray-700">Conversation Flow</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            The sequence of questions your AI bot asks during a reservation call
            <span className="block mt-1 text-blue-500 font-medium">Drag and drop the cards to reorder. Click the pencil icon to edit the text for each flow.</span>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
           <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ gridAutoRows: '1fr' }}>
          {questions.map((q, index) => (
            <QuestionRow 
              key={q.id || index} 
              question={q} 
              index={index}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onUpdateMessage={handleUpdateMessage}
            />
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="mt-6 flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-gray-300" />
        <p className="text-xs text-gray-400">
          All{' '}
          <span className="font-medium text-gray-500">{questions.length} questions</span>{' '}
          are active in this flow.
        </p>
      </div>
    </div>
  );
}

function QuestionRow({ question, index, onDragStart, onDragOver, onDrop, onUpdateMessage }) {
  const label = STEP_LABELS[question.id] || question.id;
  const [isEditing, setIsEditing] = useState(false);
  const [tempMessage, setTempMessage] = useState(question.botMessage || '');

  const handleSaveEdit = () => {
    setIsEditing(false);
    onUpdateMessage(index, tempMessage);
  };

  return (
    <div 
        draggable={!isEditing}
        onDragStart={(e) => onDragStart(e, index)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, index)}
        className={`relative flex flex-col bg-white border border-gray-200 rounded-xl p-5 overflow-hidden min-h-[160px] transition-colors ${!isEditing ? 'cursor-move hover:border-blue-300' : 'border-blue-300 ring-2 ring-blue-50'}`}
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
          <div className="flex items-center gap-1.5 opacity-60">
            <GripVertical style={{ width: 18, height: 18 }} className="text-gray-500 hover:text-gray-800 hover: font-semibold cursor-grab" />
            <button 
                onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
                className="hover:text-blue-500 transition-colors p-1 cursor-pointer"
                title={isEditing ? "Save" : "Edit"}
            >
                {isEditing ? <CheckCircle2 style={{ width: 16, height: 16 }} className="text-blue-500 hover:font-semibold" /> : <Pencil style={{ width: 16, height: 16 }} className="text-gray-500 hover:text-gray-900 hover:font-semibold" />}
            </button>
            {/* <Trash2 style={{ width: 16, height: 16 }} className="opacity-25 cursor-not-allowed text-gray-500 hover:text-gray-800 hover: font-semibold" /> */}
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
