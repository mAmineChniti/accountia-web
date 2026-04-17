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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CHAT_STORAGE_KEY = 'accountia_chat_history';

export function Chatbot({
  businessId,
  dictionary,
}: {
  businessId?: string;
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
          onComplete: (_data: ChatMessageCompleteEvent) => {
            setIsStreaming(false);
            activeMessageIdRef.current = undefined;
            streamingContentRef.current = '';
          },
          onError: (data: ChatMessageErrorEvent) => {
            setIsStreaming(false);
            setError(data.message);
            activeMessageIdRef.current = undefined;
            streamingContentRef.current = '';
            // Remove the streaming assistant message on error
            setMessages((prev) => {
              const last = prev.at(-1);
              if (last?.role === 'assistant' && last.content === '') {
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
      ? `${CHAT_STORAGE_KEY}_${businessId}`
      : `${CHAT_STORAGE_KEY}_individual`;
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
  }, [businessId]);

  // Save chat history to localStorage
  useEffect(() => {
    if (!historyLoaded) return;
    const storageKey = businessId
      ? `${CHAT_STORAGE_KEY}_${businessId}`
      : `${CHAT_STORAGE_KEY}_individual`;
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [messages, businessId, historyLoaded]);

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
    if (!inputValue.trim() || isStreaming || !clientRef.current?.isConnected)
      return;

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
  }, [inputValue, messages, businessId, isStreaming]);

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
      ? `${CHAT_STORAGE_KEY}_${businessId}`
      : `${CHAT_STORAGE_KEY}_individual`;
    localStorage.removeItem(storageKey);
  }, [businessId]);

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen((prev) => !prev)}
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
          <CardHeader className="bg-primary text-primary-foreground flex flex-row items-center justify-between gap-4 border-b border-none! px-4! py-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary-foreground/20 rounded-lg p-2 backdrop-blur-sm">
                <Bot
                  size={28}
                  className="text-primary-foreground"
                  aria-hidden
                />
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
                    className={cn(
                      'text-xs',
                      isConnected
                        ? 'bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-100 hover:bg-amber-500/30'
                    )}
                  >
                    {isConnected ? t.online : 'Connecting...'}
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
          <CardFooter className="flex-col gap-3 border-t py-3">
            <div className="relative flex w-full items-center gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.messagePlaceholder}
                disabled={isStreaming}
                aria-label="Message input"
                className="text-sm"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isStreaming}
                size="icon"
                className="shrink-0"
                aria-label={t.sendMessage}
              >
                {isStreaming ? (
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
      </FocusLock>
    </>
  );
}
