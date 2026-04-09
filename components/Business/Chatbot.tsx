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
import type { ChatMessageInput } from '@/types/services';
import type { ChatMessage } from '@/types/services';
import type { Dictionary } from '@/get-dictionary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      const safeResponse =
        typeof response.response === 'string' &&
        response.response.trim().length > 0
          ? response.response
          : t.emptyResponse;

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: safeResponse,
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
    if (messages.length === 0 || !businessId) return;

    const lastUserMsg = messages.at(-1);
    if (lastUserMsg?.role === 'user') {
      const inputPayload: ChatMessageInput = {
        businessId,
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
    if (!inputValue.trim() || isPending || !businessId) return;

    const userMsg: ChatMessage = { role: 'user', content: inputValue.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setError(undefined);
    setRetryCount(0);

    const inputPayload: ChatMessageInput = {
      businessId,
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
      <Button
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={!businessId}
        className={cn(
          'fixed right-6 bottom-6 z-40 h-16 w-16 rounded-full p-0! shadow-lg transition-all duration-300',
          isOpen
            ? 'pointer-events-none scale-0 opacity-0'
            : 'scale-100 opacity-100 hover:scale-110 hover:shadow-xl',
          !businessId && 'cursor-not-allowed opacity-50'
        )}
        aria-label={t.openButton}
        aria-expanded={isOpen}
        title={
          businessId ? undefined : 'Chat unavailable - business not loaded'
        }
      >
        <Bot className="size-8 shrink-0" width={48} height={48} aria-hidden />
      </Button>

      {/* Chat Window */}
      <Card
        className={cn(
          'fixed right-6 bottom-6 z-40 flex h-[600px] max-h-[calc(100vh-3rem)] w-[380px] max-w-[calc(100vw-3rem)] origin-bottom-right flex-col p-0! transition-all duration-300',
          isOpen
            ? 'scale-100 opacity-100 shadow-2xl'
            : 'pointer-events-none scale-75 opacity-0 shadow-none'
        )}
        role="dialog"
        aria-label={t.ariaLabel}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <CardHeader className="bg-primary text-primary-foreground flex flex-row items-center justify-between gap-4 border-b border-none! px-4! py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-foreground/20 rounded-lg p-2 backdrop-blur-sm">
              <Bot size={28} className="text-primary-foreground" aria-hidden />
            </div>
            <div>
              <h3 className="leading-tight font-semibold tracking-tight">
                {t.title}
              </h3>
              <div className="mt-0.5 flex items-center gap-1">
                <Sparkles
                  size={10}
                  className="fill-primary-foreground/80"
                  aria-hidden
                />
                <Badge
                  variant="secondary"
                  className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 text-xs"
                >
                  {t.online}
                </Badge>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            aria-label={t.closeButton}
          >
            <X size={20} aria-hidden />
          </Button>
        </CardHeader>

        {/* Messages Area */}
        <CardContent
          className="flex-1 space-y-4 overflow-y-auto p-4"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
              <div className="bg-primary/10 rounded-full p-4">
                <MessageSquare size={28} className="text-primary" aria-hidden />
              </div>
              <p className="text-muted-foreground text-sm">
                {t.welcomeMessage}
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'flex transition-all duration-500',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-muted-foreground rounded-bl-none border'
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
            <Alert variant="destructive">
              <AlertCircle size={16} />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isPending && (
            <div className="flex justify-start">
              <div className="bg-muted flex items-center gap-2 rounded-lg px-3 py-2">
                <Bot
                  size={16}
                  className="text-primary animate-pulse"
                  aria-hidden
                />
                <div className="flex items-center gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="bg-primary/60 h-1 w-1 animate-bounce rounded-full"
                      style={{ animationDelay: `${delay}ms` }}
                      aria-hidden
                    />
                  ))}
                </div>
                <span className="sr-only">{t.loading}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <CardFooter className="flex-col gap-3 border-t py-3">
          <div className="relative flex w-full items-center gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.messagePlaceholder}
              disabled={isPending}
              aria-label="Message input"
              className="text-sm"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isPending}
              size="icon"
              className="shrink-0"
              aria-label={t.sendMessage}
            >
              {isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send size={16} aria-hidden />
              )}
            </Button>
          </div>
          <div className="flex w-full items-center justify-between">
            <p className="text-muted-foreground text-xs tracking-wide">
              {t.disclaimer}
            </p>
            {messages.length > 0 && (
              <Button
                onClick={clearChat}
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs"
                aria-label={t.clearChat}
              >
                {t.clearChat}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
