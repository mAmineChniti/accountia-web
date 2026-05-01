'use client';

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  useCallback,
} from 'react';
import {
  Bot,
  MessageSquare,
  X,
  Send,
  AlertCircle,
  Sparkles,
  User,
  RotateCcw,
} from 'lucide-react';
import FocusLock from 'react-focus-lock';
import { cn } from '@/lib/utils';
import { ChatService, type ChatSocketClient } from '@/lib/services/chat';
import type {
  ChatMessageInput,
  ChatMessage,
  ChatMessageChunkEvent,
  ChatMessageCompleteEvent,
  ChatMessageErrorEvent,
  ChatConnectedEvent,
  ChatConnectErrorEvent,
} from '@/types/services';
import type { Dictionary } from '@/get-dictionary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const CHAT_STORAGE_KEY = 'accountia_chat_history';

const getChatStorageKey = (biz?: string, user?: string, ctx?: string) => {
  if (biz) {
    if (user)
      return ctx
        ? `${CHAT_STORAGE_KEY}_${biz}_${user}_${ctx}`
        : `${CHAT_STORAGE_KEY}_${biz}_${user}`;
    return ctx
      ? `${CHAT_STORAGE_KEY}_${biz}_${ctx}`
      : `${CHAT_STORAGE_KEY}_${biz}`;
  }
  return user
    ? `${CHAT_STORAGE_KEY}_individual_${user}`
    : `${CHAT_STORAGE_KEY}_individual`;
};

/**
 * Helper to handle **bold** text
 */
function renderTextWithBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-foreground font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

/**
 * Simple component to render content with basic markdown-like formatting
 */
function FormattedContent({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        // Headers (## Header)
        if (line.startsWith('## ')) {
          return (
            <h3 key={i} className="text-foreground mt-3 mb-1 text-sm font-bold">
              {line.replace('## ', '')}
            </h3>
          );
        }

        // Bullet points (* Item)
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          const text = line.trim().replace(/^[ *-]\s+/, '');
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
              <span>{renderTextWithBold(text)}</span>
            </div>
          );
        }

        // Empty line
        if (!line.trim()) {
          return <div key={i} className="h-1.5" />;
        }

        // Regular line
        return (
          <p key={i} className="leading-relaxed">
            {renderTextWithBold(line)}
          </p>
        );
      })}
    </div>
  );
}

export function Chatbot({
  businessId,
  context,
  dictionary,
}: {
  businessId?: string;
  context?: string;
  dictionary: Dictionary;
}) {
  const t = dictionary.pages.business.chatbot;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionState, setConnectionState] = useState<
    'connecting' | 'connected' | 'failed'
  >('connecting');
  const isConnected = connectionState === 'connected';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track which storage key we've loaded for this session to avoid
  // persisting before initial load completes.
  const loadedKeyRef = useRef<string | null>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const clientRef = useRef<ChatSocketClient | undefined>(undefined);
  const streamingContentRef = useRef<string>('');
  const activeMessageIdRef = useRef<string | undefined>(undefined);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isOpen) return;

    const initConnection = async () => {
      try {
        const client = ChatService.createClient();
        clientRef.current = client;

        await client.connect({
          onConnected: (data: ChatConnectedEvent) => {
            setConnectionState('connected');
            setError(undefined);
            // capture connected user id so we can scope stored history
            if (data?.userId) setUserId(data.userId);
          },
          onConnectError: (data: ChatConnectErrorEvent) => {
            setConnectionState('failed');
            setError(data.message || t.connectionFailed);
          },
          onChunk: (data: ChatMessageChunkEvent) => {
            if (data.messageId === activeMessageIdRef.current) {
              streamingContentRef.current += data.chunk;
              setMessages((prev) => {
                const last = prev.at(-1);
                if (last?.role === 'assistant') {
                  return [
                    ...prev.slice(0, -1),
                    { ...last, content: streamingContentRef.current },
                  ];
                }
                return prev;
              });
            }
          },
          onComplete: (data: ChatMessageCompleteEvent) => {
            if (data.messageId !== activeMessageIdRef.current) return;
            const finalResponse = data.response || streamingContentRef.current;
            setMessages((prev) => {
              const last = prev.at(-1);
              if (last?.role === 'assistant') {
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: finalResponse },
                ];
              }
              return prev;
            });
            setIsStreaming(false);
            activeMessageIdRef.current = undefined;
            streamingContentRef.current = '';
          },
          onError: (data: ChatMessageErrorEvent) => {
            if (data.messageId !== activeMessageIdRef.current) return;
            setIsStreaming(false);
            setError(data.message);
            activeMessageIdRef.current = undefined;
            streamingContentRef.current = '';
            // Remove the streaming assistant message on error
            setMessages((prev) => {
              const last = prev.at(-1);
              if (last?.role === 'assistant') {
                return prev.slice(0, -1);
              }
              return prev;
            });
          },
          onDisconnect: () => {
            setConnectionState('failed');
          },
        });
      } catch (error_) {
        setError(
          error_ instanceof Error ? error_.message : 'Failed to connect'
        );
      }
    };

    void initConnection();

    return () => {
      clientRef.current?.disconnect();
      clientRef.current = undefined;
    };
  }, [isOpen, t.connectionFailed]);

  // Load chat history from localStorage
  useEffect(() => {
    // Build keys to attempt reading from. Prefer user-scoped key when available,
    // fall back to legacy business-only/individual keys for older stored data.
    const keysToTry: string[] = [];
    if (businessId) {
      if (userId) {
        keysToTry.push(
          context
            ? `${CHAT_STORAGE_KEY}_${businessId}_${userId}_${context}`
            : `${CHAT_STORAGE_KEY}_${businessId}_${userId}`
        );
      }
      keysToTry.push(
        context
          ? `${CHAT_STORAGE_KEY}_${businessId}_${context}`
          : `${CHAT_STORAGE_KEY}_${businessId}`
      );
    } else {
      if (userId) {
        keysToTry.push(`${CHAT_STORAGE_KEY}_individual_${userId}`);
      }
      keysToTry.push(`${CHAT_STORAGE_KEY}_individual`);
    }

    let loaded: ChatMessage[] | undefined;
    for (const k of keysToTry) {
      const saved = localStorage.getItem(k);
      if (!saved) continue;
      try {
        loaded = JSON.parse(saved) as ChatMessage[];
        break;
      } catch (error_) {
        // try next key
        console.error('Failed to parse saved messages for key', k, error_);
        continue;
      }
    }

    // Decide which key we'll persist to going forward (prefer user-scoped)
    const preferredKey = businessId
      ? userId
        ? context
          ? `${CHAT_STORAGE_KEY}_${businessId}_${userId}_${context}`
          : `${CHAT_STORAGE_KEY}_${businessId}_${userId}`
        : context
          ? `${CHAT_STORAGE_KEY}_${businessId}_${context}`
          : `${CHAT_STORAGE_KEY}_${businessId}`
      : userId
        ? `${CHAT_STORAGE_KEY}_individual_${userId}`
        : `${CHAT_STORAGE_KEY}_individual`;

    // Initialize messages from external storage when businessId/context/userId changes.
    // Defer the setState to avoid synchronous updates within the effect.
    const toLoad = loaded ?? [];
    setTimeout(() => {
      setMessages(toLoad);
      // Only mark the loaded key after messages have been applied so the save
      // effect doesn't trigger with a stale key.
      loadedKeyRef.current = preferredKey;
    }, 0);
  }, [businessId, context, userId]);

  // Save chat history to localStorage
  useEffect(() => {
    // Only persist after we've determined the storage key for this session.
    // This prevents writing to storage before initial load completes.
    // Compute the preferred storage key (same logic as load effect).
    const storageKey = getChatStorageKey(businessId, userId, context);
    if (loadedKeyRef.current !== storageKey) return;
    // Persist under user-scoped key when available, otherwise under legacy key.
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [messages, businessId, context, userId]);

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

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isStreaming) return;

    if (!clientRef.current?.isConnected) {
      setError(t.connectionFailed);
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: inputValue.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setError(undefined);
    setIsStreaming(true);

    const messageId = crypto.randomUUID();
    activeMessageIdRef.current = messageId;
    streamingContentRef.current = '';

    // Add placeholder for streaming assistant message
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    const inputPayload: ChatMessageInput = {
      messageId,
      query: userMsg.content,
      businessId,
      history: messages
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content })),
    };

    try {
      await clientRef.current.sendMessage(inputPayload);
    } catch (error_) {
      setIsStreaming(false);
      setError(
        error_ instanceof Error ? error_.message : 'Failed to send message'
      );
      // Remove the streaming placeholder
      setMessages((prev) => prev.slice(0, -1));
    }
  }, [inputValue, messages, businessId, isStreaming, t.connectionFailed]);

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      await handleSendMessage();
    }
  };

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(undefined);
    // Remove all possible storage key variants to prevent legacy data reappearing
    const keysToRemove = [
      getChatStorageKey(businessId, userId, context),
      getChatStorageKey(businessId, undefined, context),
      getChatStorageKey(businessId, userId),
      getChatStorageKey(businessId),
      getChatStorageKey(undefined, userId),
      getChatStorageKey(),
    ];
    for (const key of keysToRemove) localStorage.removeItem(key);
  }, [businessId, userId, context]);

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'fixed right-6 bottom-6 z-40 h-16 w-16 rounded-full p-0! shadow-lg transition-all duration-300',
          isOpen
            ? 'pointer-events-none scale-0 opacity-0'
            : 'scale-100 opacity-100 hover:scale-110 hover:shadow-xl'
        )}
        aria-label={t.openButton}
        aria-expanded={isOpen}
      >
        <Bot className="size-8 shrink-0" width={48} height={48} aria-hidden />
      </Button>

      {/* Chat Window */}
      <FocusLock disabled={!isOpen}>
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
          <CardHeader className="bg-primary/5 dark:bg-primary/10 flex flex-row items-center justify-between gap-4 border-b px-4! py-3!">
            <div className="flex items-center gap-3">
              <div className="bg-primary ring-primary/10 flex h-10 w-10 items-center justify-center rounded-xl shadow-lg ring-4">
                <Sparkles size={20} className="text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">{t.title}</h3>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      connectionState === 'connected'
                        ? 'animate-pulse bg-emerald-500'
                        : connectionState === 'failed'
                          ? 'bg-red-500'
                          : 'bg-amber-500'
                    )}
                  />
                  <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                    {connectionState === 'connected'
                      ? t.online
                      : connectionState === 'failed'
                        ? t.failed
                        : t.connecting}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                onClick={clearChat}
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8 transition-colors"
                title={t.clearChat}
                aria-label={t.clearChat}
              >
                <RotateCcw size={16} />
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8"
                aria-label={t.closeButton}
              >
                <X size={18} />
              </Button>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <CardContent
            className="flex-1 overflow-hidden p-0"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                    <div className="bg-primary/10 rounded-full p-4">
                      <MessageSquare
                        size={28}
                        className="text-primary"
                        aria-hidden
                      />
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
                        'flex gap-3 transition-all duration-500',
                        msg.role === 'user'
                          ? 'flex-row-reverse justify-end'
                          : 'flex-row justify-start'
                      )}
                    >
                      <Avatar className="border-muted/50 mt-1 h-8 w-8 shrink-0 border shadow-sm">
                        <AvatarFallback
                          className={cn(
                            'text-[10px] font-bold',
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-slate-600 text-white'
                          )}
                        >
                          {msg.role === 'user' ? (
                            <User size={14} />
                          ) : (
                            <Bot size={14} />
                          )}
                        </AvatarFallback>
                      </Avatar>

                      <div
                        className={cn(
                          'relative max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-muted/50 text-foreground border-muted/30 rounded-tl-none border backdrop-blur-sm dark:bg-slate-800/60'
                        )}
                        role="article"
                      >
                        <FormattedContent content={msg.content} />
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
                {isStreaming && (
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
              </div>
            </ScrollArea>
          </CardContent>

          {/* Input Area */}
          <CardFooter className="bg-muted/5 flex-col gap-3 border-t px-4 py-3">
            <div className="relative flex w-full items-center gap-2">
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    connectionState === 'connected'
                      ? t.messagePlaceholder
                      : connectionState === 'failed'
                        ? t.failed
                        : t.connecting
                  }
                  disabled={isStreaming || !isConnected}
                  className="focus-visible:ring-primary h-11 rounded-xl pr-12 text-sm shadow-xs transition-shadow"
                  aria-label={t.messagePlaceholder}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isStreaming || !isConnected}
                  size="icon"
                  className="bg-primary hover:bg-primary/90 absolute top-1 right-1 h-9 w-9 rounded-lg shadow-sm transition-transform hover:scale-105 active:scale-95"
                  aria-label={t.sendMessage}
                >
                  {isStreaming ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Send size={16} />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground text-center text-[10px] opacity-70">
              {t.disclaimer}
            </p>
          </CardFooter>
        </Card>
      </FocusLock>
    </>
  );
}
