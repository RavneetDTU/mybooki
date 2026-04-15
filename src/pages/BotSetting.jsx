import {
  Bot,
  Lock,
  GripVertical,
  Pencil,
  Trash2,
  MessageSquare,
  Info,
  CheckCircle2,
} from 'lucide-react';

const DEFAULT_QUESTION_FLOW = [
  {
    id: 'greet',
    order: 1,
    botMessage: "Hello! Welcome. I'm the AI booking assistant. How can I help with a reservation today?",
    isRequired: true,
    instructions: null,
  },
  {
    id: 'phone',
    order: 2,
    botMessage: "What's the best phone number to confirm the booking?",
    isRequired: true,
    instructions:
      'Use STRICT DATA CAPTURE PROTOCOL (Anti-Hallucination Mode). Minimum 9 digits. Literal read-back required.',
  },
  {
    id: 'name',
    order: 3,
    botMessage: 'May I have the name for the reservation?',
    isRequired: true,
    instructions: 'Skip if already given.',
  },
  {
    id: 'dateTime',
    order: 4,
    botMessage: 'What date and time would you prefer?',
    isRequired: true,
    instructions: 'Check against operating hours.',
  },
  {
    id: 'partySize',
    order: 5,
    botMessage: 'How many guests will be dining?',
    isRequired: true,
    instructions: null,
  },
  {
    id: 'allergies',
    order: 6,
    botMessage: 'Does anyone in the party have any allergies we should note?',
    isRequired: true,
    instructions: null,
  },
  {
    id: 'confirm',
    order: 7,
    botMessage:
      "Just to confirm: a table under [name] for [number] guests on [date] at [time]. Contact: [phone]. Allergies: [details or 'none noted']. Is that correct?",
    isRequired: true,
    instructions: null,
  },
];

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
          {/* <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div> */}
          <div>
            <h1 className="font-heading font-semibold text-foreground leading-tight">Bot Settings</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Configure your AI booking assistant's conversation flow and behaviour
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal rule */}
      <div className="border-t border-gray-200 mt-5 mb-6" />

      {/* ── Section label row ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-m font-semibold text-gray-700">Conversation Flow</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            The sequence of questions your AI bot asks during a reservation call
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5">
          <Lock className="w-3.5 h-3.5" />
          Editing Coming Soon
        </span>
      </div>

      {/* ── Question Grid — 2 per row, full width ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ gridAutoRows: '1fr' }}>
        {DEFAULT_QUESTION_FLOW.map((q) => (
          <QuestionRow key={q.id} question={q} />
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="mt-6 flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-gray-300" />
        <p className="text-xs text-gray-400">
          All{' '}
          <span className="font-medium text-gray-500">{DEFAULT_QUESTION_FLOW.length} questions</span>{' '}
          are active in this flow. Customisation controls will be unlocked in a future update.
        </p>
      </div>
    </div>
  );
}

function QuestionRow({ question }) {
  const label = STEP_LABELS[question.id] || question.id;

  return (
    <div className="relative flex flex-col bg-white border border-gray-200 rounded-xl p-5 overflow-hidden h-40">

      {/* Lock overlay — floats above content, content readable behind */}
      <div
        className="absolute inset-0 rounded-xl flex items-center justify-center z-10 pointer-events-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.50)' }}
      >
        <div className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center">
          <Lock className="text-gray-400" style={{ width: 16, height: 16 }} />
        </div>
      </div>

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
          {/* Disabled icons — larger size, clearly greyed out */}
          <div className="flex items-center gap-1.5 opacity-25 cursor-not-allowed select-none">
            <GripVertical style={{ width: 18, height: 18 }} className="text-gray-500" />
            <Pencil style={{ width: 16, height: 16 }} className="text-gray-500" />
            <Trash2 style={{ width: 16, height: 16 }} className="text-gray-500" />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 mb-3" />

      {/* Bot message — light/muted to signal locked state */}
      <div className="flex gap-2 flex-1">
        <MessageSquare style={{ width: 14, height: 14 }} className="text-gray-300 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-400 leading-relaxed">{question.botMessage}</p>
      </div>

      {/* Instructions */}
      {question.instructions && (
        <div className="mt-3 flex gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
          <Info style={{ width: 13, height: 13 }} className="text-gray-300 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="font-medium text-gray-500">Note: </span>
            {question.instructions}
          </p>
        </div>
      )}
    </div>
  );
}