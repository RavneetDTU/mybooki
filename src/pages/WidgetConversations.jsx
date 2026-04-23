import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, MessageCircle, Calendar, Clock,
  Phone, MessageSquare, User, Users, CheckCircle2, Bot
} from 'lucide-react';
import { widgetService } from '../services/widgetService';
import { useAuthStore } from '../store/useAuthStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────────
const isMissing = (val) => val === null || val === undefined || val === '' || val === 'Not Provided';

const MissingBadge = () => (
  <span className="inline-flex px-2 py-0.5 bg-gray-50 text-gray-400 text-xs font-medium rounded border border-gray-200">
    N/A
  </span>
);

const display = (val) => isMissing(val) ? <MissingBadge /> : val;

const formatDate = (isoStr) => {
  if (!isoStr) return 'N/A';
  return new Date(isoStr).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
};

const formatTime = (isoStr) => {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────────
function ConversationModal({ isOpen, onClose, session }) {
  if (!isOpen || !session) return null;
  const bd = session.bookingData || {};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-border max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-heading font-semibold text-foreground text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                Widget Conversation
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(session.capturedAt)} at {formatTime(session.capturedAt)}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-muted/20 rounded transition-colors cursor-pointer">
              <span className="text-foreground text-xl leading-none">&times;</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Booking Data Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 bg-gray-50 p-4 rounded-lg border border-border">
            <div><p className="text-xs text-muted-foreground mb-1">Guest Name</p><p className="text-sm font-medium">{display(bd.guestName)}</p></div>
            <div><p className="text-xs text-muted-foreground mb-1">Phone</p><p className="text-sm font-medium">{display(bd.phone)}</p></div>
            <div><p className="text-xs text-muted-foreground mb-1">Party Size</p><p className="text-sm font-medium">{display(bd.guestCount)}</p></div>
            <div><p className="text-xs text-muted-foreground mb-1">Date</p><p className="text-sm font-medium">{display(bd.date)}</p></div>
            <div><p className="text-xs text-muted-foreground mb-1">Time</p><p className="text-sm font-medium">{display(bd.time)}</p></div>
            <div><p className="text-xs text-muted-foreground mb-1">Allergies</p><p className="text-sm font-medium">{display(bd.allergies)}</p></div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            {/* <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-700 capitalize">{session.status || 'completed'}</span> */}
            <span className="text-xs text-muted-foreground ml-2">Session ID: {session.sessionId}</span>
          </div>

          {/* Transcript */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-foreground" />
              <h4 className="text-sm font-semibold text-foreground">Conversation Transcript</h4>
            </div>
            <div className="bg-gray-50 border border-border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
              {session.transcript && session.transcript.length > 0
                ? session.transcript.map((line, i) => {
                    // Detect speaker — strip leading emoji if present
                    const isAgent = line.startsWith('🤖') || line.toLowerCase().includes('agent:');
                    const cleanLine = line
                      .replace(/^🤖\s*/, '')
                      .replace(/^👤\s*/, '')
                      .trim();
                    // Split "Agent: message" or "Guest: message" into label + body
                    const colonIdx = cleanLine.indexOf(':');
                    const label   = colonIdx > -1 ? cleanLine.slice(0, colonIdx).trim() : (isAgent ? 'Agent' : 'Guest');
                    const body    = colonIdx > -1 ? cleanLine.slice(colonIdx + 1).trim() : cleanLine;

                    return (
                      <div key={i} className={`flex items-start gap-2.5 ${isAgent ? '' : 'pl-1'}`}>
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                          isAgent ? 'bg-blue-100' : 'bg-gray-200'
                        }`}>
                          {isAgent
                            ? <Bot className="w-3.5 h-3.5 text-blue-600" />
                            : <User className="w-3.5 h-3.5 text-gray-600" />
                          }
                        </div>
                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-semibold mr-1.5 ${
                            isAgent ? 'text-blue-600' : 'text-gray-500'
                          }`}>{label}:</span>
                          <span className="text-sm text-gray-700 leading-relaxed">{body}</span>
                        </div>
                      </div>
                    );
                  })
                : <p className="text-sm text-muted-foreground">No transcript available.</p>
              }
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <button onClick={onClose}
            className="w-full px-4 py-2 bg-foreground text-white rounded-md hover:bg-foreground/90 transition-colors text-sm font-medium cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────────
export default function WidgetConversations() {
  const { restaurantId } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [totalCount, setTotalCount]       = useState(0);
  const [isLoading, setIsLoading]         = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  const fetchConversations = useCallback(async () => {
    if (!restaurantId) return;
    setIsLoading(true);
    try {
      const res = await widgetService.getConversations(restaurantId);
      setConversations(res?.data || []);
      setTotalCount(res?.count || 0);
    } catch (err) {
      console.error('Failed to fetch widget conversations:', err);
      setConversations([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="font-heading font-semibold text-foreground">Widget Conversations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All AI widget conversations captured from your embedded chat
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-5">

        {/* Stats row */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Showing all <span className="font-medium text-foreground">{totalCount}</span> conversations, newest first.
          </p>
          <div className="bg-white border-2 border-foreground rounded-lg px-6 py-3 min-w-[140px] text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Conversations</p>
            <p className="text-2xl font-heading text-foreground">{totalCount}</p>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground">No conversations recorded yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Widget conversations will appear here automatically once guests start chatting.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((session) => {
              const name = isMissing(session.bookingData?.guestName) ? 'Unknown Guest' : session.bookingData.guestName;
              const phone = session.bookingData?.phone;
              const date = session.capturedAt;

              return (
                <div
                  key={session.sessionId}
                  onClick={() => setSelectedSession(session)}
                  className="border border-border rounded-lg overflow-hidden bg-white hover:bg-muted/10 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-4 px-4 py-3">
                    {/* Time */}
                    <div className="flex items-center gap-2 min-w-[90px]">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{formatTime(date)}</span>
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(date)}</p>
                    </div>

                    {/* Status badge */}
                    {/* <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-md border border-green-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-green-700 text-xs font-medium capitalize">{session.status || 'completed'}</span>
                    </div> */}

                    {/* Phone badge */}
                    {!isMissing(phone) ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-md">
                        <Phone className="w-3.5 h-3.5 text-foreground" />
                        <span className="text-foreground text-xs">{phone}</span>
                      </div>
                    ) : (
                      <span className="px-3 py-1 border border-gray-200 bg-gray-50 text-gray-400 text-xs font-medium rounded-md">
                        No Phone
                      </span>
                    )}

                    {/* View button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedSession(session); }}
                      className="px-4 py-1.5 border border-border text-foreground rounded-md hover:bg-foreground hover:text-white transition-colors text-xs font-medium cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConversationModal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        session={selectedSession}
      />
    </div>
  );
}
