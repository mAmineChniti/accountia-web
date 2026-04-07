'use client';

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  useCallback,
} from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Bot,
  MessageSquare,
  X,
  Send,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatService } from '@/lib/requests';
import type { ChatMessageInput } from '@/types/RequestSchemas';
import type { ChatMessage } from '@/types/ResponseInterfaces';
import type { Dictionary } from '@/get-dictionary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CHAT_STORAGE_KEY = 'accountia_chat_history';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

interface ChatbotProps {
  businessId?: string;
  dictionary: Dictionary;
}

export function Chatbot({ businessId, dictionary }: ChatbotProps) {
  const t = dictionary.pages.business.chatbot;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (globalThis.window === undefined || !businessId) return [];
    const savedMessages = localStorage.getItem(
      `${CHAT_STORAGE_KEY}_${businessId}`
    );
    if (savedMessages) {
      try {
        return JSON.parse(savedMessages);
      } catch (error_) {
        console.error('Failed to parse saved messages:', error_);
        return [];
      }
    }
    return [];
  });
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save chat history to localStorage
  useEffect(() => {
    if (businessId && messages.length > 0) {
      localStorage.setItem(
        `${CHAT_STORAGE_KEY}_${businessId}`,
        JSON.stringify(messages)
      );
    }
  }, [messages, businessId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: ChatMessageInput) => {
      return ChatService.sendMessage(payload);
    },
    onSuccess: (response) => {
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.message || 'Unable to process response',
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setError(undefined);
      setRetryCount(0);
    },
    onError: () => {
      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setError(`${t.errorFailed}. ${t.errorRetrying}`);
        setTimeout(() => {
          handleRetry();
        }, RETRY_DELAY);
      } else {
        setError(`${t.errorFailed}. ${t.errorTryAgain}`);
        // Remove the failed user message
        setMessages((prev) => prev.slice(0, -1));
      }
    },
  });

  const { mutate, isPending } = sendMessageMutation;

  const handleRetry = useCallback(() => {
    if (messages.length === 0) return;

    const lastUserMsg = messages.at(-1);
    if (lastUserMsg?.role === 'user') {
      const inputPayload: ChatMessageInput = {
        businessId: businessId || 'default-business-id',
        query: lastUserMsg.content,
        history: messages.slice(0, -1).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };
      mutate(inputPayload);
    }
  }, [messages, businessId, mutate]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isPending) return;

    const userMsg: ChatMessage = { role: 'user', content: inputValue.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setError(undefined);
    setRetryCount(0);

    const inputPayload: ChatMessageInput = {
      businessId: businessId || 'default-business-id',
      query: userMsg.content,
      history: messages.map((m) => ({ role: m.role, content: m.content })),
    };

    mutate(inputPayload);
  }, [inputValue, messages, businessId, mutate, isPending]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(undefined);
    setRetryCount(0);
    if (businessId) {
      localStorage.removeItem(`${CHAT_STORAGE_KEY}_${businessId}`);
    }
  }, [businessId]);

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'shadow-primary/40 hover:shadow-primary/50 fixed right-6 bottom-6 z-40 flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl',
          'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/50 cursor-pointer border-none focus:ring-4 focus:outline-none',
          isOpen
            ? 'pointer-events-none scale-0 opacity-0'
            : 'scale-100 opacity-100 hover:scale-110'
        )}
        aria-label={t.openButton}
        aria-expanded={isOpen}
      >
        <Bot width={30} height={30} aria-hidden />
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          'border-border bg-background fixed right-6 bottom-6 z-40 flex h-[600px] max-h-[calc(100vh-3rem)] w-[380px] max-w-[calc(100vw-3rem)] origin-bottom-right flex-col overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300',
          isOpen
            ? 'scale-100 opacity-100'
            : 'pointer-events-none scale-0 opacity-0'
        )}
        role="dialog"
        aria-label={t.ariaLabel}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <header className="bg-primary text-primary-foreground flex items-center justify-between p-4 drop-shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/20 self-center rounded-xl p-2 backdrop-blur-sm">
              <Bot size={24} className="text-primary-foreground" aria-hidden />
            </div>
            <div>
              <h3 className="text-lg leading-tight font-semibold tracking-tight">
                {t.title}
              </h3>
              <p className="text-primary-foreground/80 mt-0.5 flex items-center gap-1 text-xs">
                <Sparkles
                  size={10}
                  className="fill-primary-foreground/80"
                  aria-hidden
                />{' '}
                {t.online}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground rounded-full p-2"
            aria-label={t.closeButton}
          >
            <X size={20} aria-hidden />
          </Button>
        </header>

        {/* Messages Area */}
        <div
          className="bg-muted/30 dark:bg-muted/10 flex-1 space-y-5 overflow-y-auto scroll-smooth p-4"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 px-4 text-center opacity-70">
              <div className="bg-primary/10 text-primary mb-2 flex h-16 w-16 items-center justify-center rounded-full shadow-sm">
                <MessageSquare size={30} aria-hidden />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed text-balance">
                {t.welcomeMessage}
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
                  role="article"
                  aria-label={`${
                    msg.role === 'user' ? t.userMessage : t.aiResponse
                  }: ${msg.content.slice(0, 50)}...`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}

          {/* Error Message */}
          {error && (
            <div className="flex justify-start">
              <div className="border-border bg-destructive/10 text-destructive flex items-center gap-2 rounded-2xl rounded-bl-sm border px-4 py-3 text-sm">
                <AlertCircle size={16} aria-hidden />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isPending && (
            <div className="flex justify-start">
              <div className="border-border bg-card flex flex-row items-center gap-3 rounded-2xl rounded-bl-sm border px-4 py-3.5 shadow-sm">
                <Bot
                  size={18}
                  className="text-primary animate-pulse"
                  aria-hidden
                />
                <div className="flex items-center gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="bg-primary/60 h-1.5 w-1.5 animate-bounce rounded-full"
                      style={{ animationDelay: `${delay}ms` }}
                      aria-hidden
                    />
                  ))}
                </div>
                <span className="sr-only">{t.loading}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input Area */}
        <footer className="border-border bg-background border-t p-4">
          <div className="border-border bg-muted/50 focus-within:border-primary focus-within:ring-primary/30 relative flex items-center overflow-hidden rounded-full border shadow-sm transition-all focus-within:ring-2">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.messagePlaceholder}
              disabled={isPending}
              className="border-none bg-transparent py-3.5 pr-14 pl-5 text-[15px] focus:outline-none"
              aria-label="Message input"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isPending}
              className={cn(
                'absolute right-1.5 h-auto rounded-full p-2 transition-all duration-200',
                inputValue.trim() && !isPending
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-offset-2 focus:outline-none'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
              variant="ghost"
              size="sm"
              aria-label={t.sendMessage}
            >
              {isPending ? (
                <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send
                  size={18}
                  className={inputValue.trim() ? 'ml-0.5' : ''}
                  aria-hidden
                />
              )}
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <p className="text-muted-foreground tracking-wide">
              {t.disclaimer}
            </p>
            {messages.length > 0 && (
              <Button
                onClick={clearChat}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-auto p-1"
                aria-label={t.clearChat}
              >
                {t.clearChat}
              </Button>
            )}
          </div>
        </footer>
      </div>
    </>
  );
}
