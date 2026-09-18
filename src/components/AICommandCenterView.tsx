import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Clock,
  HelpCircle,
  Shield,
  Zap,
} from 'lucide-react';
import { api, CommandResponse } from '../api/client';

interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}

interface AICommandCenterViewProps {
  onRefreshState: () => void;
}

export const AICommandCenterView: React.FC<AICommandCenterViewProps> = ({
  onRefreshState,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'gemini',
      text: 'Hello! I am your Guardian AI Analyst powered by Gemini. You can ask me natural language queries about your recurring charges, investigate why guardrails blocked actions, or give me commands like "Pause all automation".',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const suggestedQueries = [
    "Find subscriptions I haven't used in 90 days.",
    'Show duplicate subscriptions.',
    'How much can I save?',
    'Why wasn\'t HealthGuard cancelled?',
    'Pause all automation.',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isThinking) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const res: CommandResponse = await api.sendCommand(textToSend);
      const aiMsg: ChatMessage = {
        id: `msg_${Date.now()}_g`,
        sender: 'gemini',
        text: res.message,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, aiMsg]);
      onRefreshState();
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg_${Date.now()}_err`,
          sender: 'gemini',
          text: `Error contacting Guardian command engine: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            Gemini AI Command Center
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Query your subscription telemetry, explain guardrail decisions, or issue policy commands using natural language.
        </p>
      </div>

      {/* Suggested Quick Query Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Suggested Commands:
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestedQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-emerald-400 transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 h-[480px] flex flex-col justify-between overflow-hidden shadow-sm">
        {/* Messages Feed */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {messages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isUser ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-emerald-400 border border-slate-700'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-xl rounded-xl p-3.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-200 border border-slate-700/80 whitespace-pre-line'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="block text-[10px] opacity-60 mt-1.5 text-right font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 p-2">
              <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Gemini analyzing subscription telemetry...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Type a query or command (e.g., 'Why wasn\'t HealthGuard cancelled?')..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend();
            }}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isThinking}
            className="p-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
