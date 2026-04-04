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
          'shadow-primary/40 hover:shadow-primary/50 fixed right-6 bottom-6 z-50 rounded-full p-4 shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl',
          'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/50 focus:ring-4 focus:outline-none',
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
          'border-border bg-background fixed right-6 bottom-6 z-50 flex h-[600px] max-h-[calc(100vh-3rem)] w-[380px] max-w-[calc(100vw-3rem)] origin-bottom-right flex-col overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300',
          isOpen
            ? 'scale-100 opacity-100'
            : 'pointer-events-none scale-0 opacity-0'
        )}
      >
        {/* Header */}
        <div className="bg-primary text-primary-foreground flex items-center justify-between p-4 drop-shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/20 self-center rounded-xl p-2 backdrop-blur-sm">
              <Bot size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg leading-tight font-semibold tracking-tight">
                Accountia AI
              </h3>
              <p className="text-primary-foreground/80 mt-0.5 flex items-center gap-1 text-xs">
                <Sparkles size={10} className="fill-primary-foreground/80" /> En
                ligne
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground rounded-full p-2 transition-colors focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="bg-muted/30 dark:bg-muted/10 flex-1 space-y-5 overflow-y-auto scroll-smooth p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 px-4 text-center opacity-70">
              <div className="bg-primary/10 text-primary mb-2 flex h-16 w-16 items-center justify-center rounded-full shadow-sm">
                <MessageSquare size={30} />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed text-balance">
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
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'border-border bg-card text-card-foreground rounded-bl-sm border'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="border-border bg-card flex flex-row items-center gap-3 rounded-2xl rounded-bl-sm border px-4 py-3.5 shadow-sm">
                <Bot size={18} className="text-primary animate-pulse" />
                <div className="flex items-center gap-1.5">
                  <span
                    className="bg-primary/60 h-1.5 w-1.5 animate-bounce rounded-full"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="bg-primary/60 h-1.5 w-1.5 animate-bounce rounded-full"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="bg-primary/60 h-1.5 w-1.5 animate-bounce rounded-full"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input Area */}
        <div className="border-border bg-background border-t p-4">
          <div className="border-border bg-muted/50 focus-within:border-primary focus-within:ring-primary/30 relative flex items-center overflow-hidden rounded-full border shadow-sm transition-all focus-within:ring-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message..."
              className="placeholder:text-muted-foreground text-foreground flex-1 border-none bg-transparent py-3.5 pr-14 pl-5 text-[15px] focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                'absolute right-1.5 flex items-center justify-center rounded-full p-2 transition-all duration-200',
                inputValue.trim() && !isLoading
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
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
            <p className="text-muted-foreground text-[11px] tracking-wide">
              Accountia AI peut faire des erreurs.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
