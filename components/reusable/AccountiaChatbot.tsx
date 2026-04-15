'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Minimize2,
  Sparkles,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'How do I pay an invoice?',
  'What does OVERDUE status mean?',
  'How to become a business owner?',
  'Where is my payment confirmation email?',
];

const formatMessage = (content: string) => {
  // Convert **bold** and newlines to JSX
  const lines = content.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function AccountiaChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        "👋 Hello! I'm **Accountia Assistant**, your personal support agent.\n\nI can help you with:\n- 💳 Viewing & paying your invoices\n- 📧 Finding payment confirmation emails\n- 🏢 Applying to become a business owner\n- 🔐 Account & security questions\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized, messages, scrollToBottom]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build conversation history (exclude welcome message, last 10 messages)
      const history = [...messages, userMessage]
        .filter((m) => m.id !== 'welcome')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      const data = (await res.json()) as { message?: string; error?: string };

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content:
          data.message ??
          data.error ??
          "I'm sorry, I couldn't process your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (!isOpen || isMinimized) {
        setHasUnread(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content:
            'Connection error. Please check your internet and try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(inputValue);
    }
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed right-6 bottom-24 z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 ${
            isMinimized ? 'h-14 w-72' : 'h-[580px] w-[380px]'
          }`}
          style={{
            background:
              'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #e63946, #c1121f)',
                  }}
                >
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-[#1a1a2e] bg-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Accountia Assistant
                </p>
                <p className="text-xs text-green-400">Online • AI-Powered</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsMinimized((m) => !m)}
                className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="scrollbar-thin scrollbar-thumb-white/10 flex-1 space-y-4 overflow-y-auto p-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className="mt-1 flex-shrink-0">
                      {msg.role === 'model' ? (
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full"
                          style={{
                            background:
                              'linear-gradient(135deg, #e63946, #c1121f)',
                          }}
                        >
                          <Bot className="h-3.5 w-3.5 text-white" />
                        </div>
                      ) : (
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full"
                          style={{ background: 'rgba(255,255,255,0.1)' }}
                        >
                          <User className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}
                    >
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.role === 'user' ? 'text-white' : 'text-white/90'
                        }`}
                        style={
                          msg.role === 'user'
                            ? {
                                background:
                                  'linear-gradient(135deg, #e63946, #c1121f)',
                              }
                            : {
                                background: 'rgba(255,255,255,0.07)',
                                border: '1px solid rgba(255,255,255,0.08)',
                              }
                        }
                      >
                        {formatMessage(msg.content)}
                      </div>
                      <span className="px-1 text-[10px] text-white/30">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex gap-2">
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, #e63946, #c1121f)',
                      }}
                    >
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div
                      className="flex items-center gap-1 rounded-2xl px-4 py-3"
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/50 [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/50 [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-white/50 [animation-delay:300ms]" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Questions — always visible */}
              <div className="px-4 pb-2">
                <p className="mb-2 text-xs text-white/40">Quick questions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => void sendMessage(q)}
                      disabled={isLoading}
                      className="rounded-full px-3 py-1 text-xs text-white/70 transition-all hover:text-white"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div
                className="flex items-center gap-2 px-3 py-3"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(0,0,0,0.2)',
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1 rounded-xl border-0 bg-white/8 px-4 py-2.5 text-sm text-white placeholder-white/30 ring-1 ring-white/10 transition-all outline-none focus:ring-white/25"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
                <button
                  onClick={() => void sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, #e63946, #c1121f)',
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Send className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => {
          setIsOpen((o) => !o);
          setIsMinimized(false);
          setHasUnread(false);
        }}
        className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: isOpen
            ? 'linear-gradient(135deg, #374151, #1f2937)'
            : 'linear-gradient(135deg, #e63946, #c1121f)',
          boxShadow: '0 8px 32px rgba(230, 57, 70, 0.4)',
        }}
        aria-label="Open support chat"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-400 text-[10px] font-bold text-black">
            1
          </span>
        )}
      </button>
    </>
  );
}
