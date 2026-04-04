'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Bot, MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessageInput } from '@/types/RequestSchemas';
import type { ChatMessage } from '@/types/ResponseInterfaces';

export function Chatbot({ businessId }: { businessId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom limit
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: inputValue.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    // Prepare data to show we are using the structured type (mock backend component)
    // As per requirement: "L’utilisation des types fournis pour structurer les données"
    const inputPayload: ChatMessageInput = {
      businessId: businessId || 'default-business-id',
      query: userMsg.content,
      history: messages.map((m) => ({ role: m.role, content: m.content })),
    };

    // Note: Here we'd normally pass `inputPayload` to a backend service like `AuthService.sendChatMessage(inputPayload)`
    // Mock API call simulation for UI demo purposes
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content:
          "Ceci est une réponse simulée côté frontend d'Accountia. L'intégration backend sera faite plus tard.",
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'fixed right-6 bottom-6 z-50 rounded-full p-4 shadow-[0_10px_25px_rgba(79,70,229,0.4)] transition-all duration-300 ease-in-out hover:shadow-[0_15px_30px_rgba(79,70,229,0.5)]',
          'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white hover:from-blue-700 hover:to-indigo-600 focus:ring-4 focus:ring-indigo-300/50 focus:outline-none',
          isOpen
            ? 'pointer-events-none scale-0 opacity-0'
            : 'scale-100 opacity-100 hover:scale-110'
        )}
        aria-label="Ouvrir le chat"
      >
        <Bot size={28} />
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          'fixed right-6 bottom-6 z-50 flex h-[600px] max-h-[calc(100vh-3rem)] w-[380px] max-w-[calc(100vw-3rem)] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950',
          isOpen
            ? 'scale-100 opacity-100'
            : 'pointer-events-none scale-0 opacity-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white drop-shadow-md">
          <div className="flex items-center gap-3">
            <div className="self-center rounded-xl bg-white/20 p-2 backdrop-blur-sm">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg leading-tight font-semibold tracking-tight">
                Accountia AI
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-blue-100">
                <Sparkles size={10} className="fill-blue-100" /> En ligne
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 space-y-5 overflow-y-auto scroll-smooth bg-zinc-50 p-4 dark:bg-zinc-900">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 px-4 text-center opacity-70">
              <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-500 shadow-sm dark:bg-indigo-900/30">
                <MessageSquare size={30} />
              </div>
              <p className="text-sm leading-relaxed text-balance text-zinc-500 dark:text-zinc-400">
                Bonjour ! Posez-moi vos questions sur la comptabilité de votre
                entreprise.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'flex w-full transition-all duration-500',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm',
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-indigo-600 text-white'
                      : 'rounded-bl-sm border border-zinc-100 bg-white text-zinc-800 dark:border-zinc-700/60 dark:bg-zinc-800 dark:text-zinc-200'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex flex-row items-center gap-3 rounded-2xl rounded-bl-sm border border-zinc-100 bg-white px-4 py-3.5 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-800">
                <Bot size={18} className="animate-pulse text-indigo-500" />
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 dark:bg-indigo-500"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 dark:bg-indigo-500"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 dark:bg-indigo-500"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input Area */}
        <div className="border-t border-zinc-100 bg-white p-4 dark:border-zinc-800/80 dark:bg-zinc-950">
          <div className="relative flex items-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-50 shadow-sm transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message..."
              className="flex-1 border-none bg-transparent py-3.5 pr-14 pl-5 text-[15px] placeholder:text-zinc-400 focus:outline-none dark:text-zinc-200"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                'absolute right-1.5 flex items-center justify-center rounded-full p-2 transition-all duration-200',
                inputValue.trim() && !isLoading
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600'
              )}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} className={inputValue.trim() ? 'ml-0.5' : ''} />
              )}
            </button>
          </div>
          <div className="mt-3 mb-1 text-center">
            <p className="text-[11px] tracking-wide text-zinc-400/80 dark:text-zinc-500">
              Accountia AI peut faire des erreurs.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
