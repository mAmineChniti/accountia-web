'use client';

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  useCallback,
} from 'react';
import { usePathname } from 'next/navigation';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const CHAT_STORAGE_KEY = 'accountia_chat_history';

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

export function Chatbot({
  businessId,
  userId,
  context,
  dictionary,
}: {
  businessId?: string;
  userId?: string;
  context?: string;
  dictionary: Dictionary;
}) {
  const t = dictionary.pages.business.chatbot;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const clientRef = useRef<ChatSocketClient | undefined>(undefined);
  const streamingContentRef = useRef<string>('');
  const activeMessageIdRef = useRef<string | undefined>(undefined);
  const pathname = usePathname();

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isOpen) return;

    const initConnection = async () => {
      try {
        const client = ChatService.createClient();
        clientRef.current = client;

        await client.connect({
          onConnected: (_data: ChatConnectedEvent) => {
            setIsConnected(true);
            setError(undefined);
          },
          onConnectError: (data: ChatConnectErrorEvent) => {
            setIsConnected(false);
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
            setIsConnected(false);
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
    setHistoryLoaded(false);
    const storageKey = businessId
      ? context
        ? `${CHAT_STORAGE_KEY}_${userId || 'anon'}_${businessId}_${context}`
        : `${CHAT_STORAGE_KEY}_${userId || 'anon'}_${businessId}_${pathname}` // Use pathname for better isolation
      : `${CHAT_STORAGE_KEY}_${userId || 'anon'}_individual_${pathname}`;
    const savedMessages = localStorage.getItem(storageKey);

    if (!savedMessages) {
      setMessages([]);
      setHistoryLoaded(true);
      return;
    }

    try {
      setMessages(JSON.parse(savedMessages));
    } catch (error_) {
      console.error('Failed to parse saved messages:', error_);
      setMessages([]);
    } finally {
      setHistoryLoaded(true);
    }
  }, [businessId, context, pathname, userId]);

  // Save chat history to localStorage
  useEffect(() => {
    if (!historyLoaded) return;
    const storageKey = businessId
      ? context
        ? `${CHAT_STORAGE_KEY}_${userId || 'anon'}_${businessId}_${context}`
        : `${CHAT_STORAGE_KEY}_${userId || 'anon'}_${businessId}_${pathname}`
      : `${CHAT_STORAGE_KEY}_${userId || 'anon'}_individual_${pathname}`;
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [messages, businessId, context, historyLoaded, pathname, userId]);

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
    const storageKey = businessId
      ? context
        ? `${CHAT_STORAGE_KEY}_${userId || 'anon'}_${businessId}_${context}`
        : `${CHAT_STORAGE_KEY}_${userId || 'anon'}_${businessId}_${pathname}`
      : `${CHAT_STORAGE_KEY}_${userId || 'anon'}_individual_${pathname}`;
    localStorage.removeItem(storageKey);
  }, [businessId, context, pathname, userId]);

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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-800 shadow-lg ring-4 ring-red-800/10">
                <Sparkles size={20} className="text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  Accountia AI
                </h3>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      isConnected
                        ? 'animate-pulse bg-emerald-500'
                        : 'bg-amber-500'
                    )}
                  />
                  <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                    {isConnected ? t.online : 'Connecting...'}
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
                          ? 'flex-row-reverse justify-start'
                          : 'flex-row justify-start'
                      )}
                    >
                      <Avatar className="border-muted/50 mt-1 h-8 w-8 shrink-0 border shadow-sm">
                        <AvatarImage
                          src={
                            msg.role === 'user' ? undefined : undefined // Can add bot avatar here
                          }
                        />
                        <AvatarFallback
                          className={cn(
                            'text-[10px] font-bold',
                            msg.role === 'user'
                              ? 'bg-red-800 text-white'
                              : 'bg-red-800 text-white'
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
                            ? 'rounded-tr-none bg-red-800 text-white'
                            : 'bg-muted/30 text-muted-foreground border-muted/30 rounded-tl-none border backdrop-blur-sm dark:bg-slate-900/40'
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
                    isConnected ? t.messagePlaceholder : 'Connecting...'
                  }
                  disabled={isStreaming || !isConnected}
                  className="focus-visible:ring-primary h-11 rounded-xl pr-12 text-sm shadow-xs transition-shadow"
                  aria-label="Message input"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isStreaming || !isConnected}
                  size="icon"
                  className="absolute top-1 right-1 h-9 w-9 rounded-lg bg-red-800 shadow-sm transition-transform hover:scale-105 hover:bg-red-900 active:scale-95"
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
