'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Bot, Loader2, Send, X } from 'lucide-react';
import { toast } from 'sonner';

import { ChatService } from '@/lib/requests';
import type { Dictionary } from '@/get-dictionary';
import type { Locale } from '@/i18n-config';
import type { ChatMessage } from '@/types/ResponseInterfaces';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function BusinessAssistantWidget({
  businessId,
  businessName,
  dictionary,
  lang,
}: {
  businessId: string;
  businessName: string;
  dictionary: Dictionary;
  lang: Locale;
}) {
  const defaultText = {
    headerTitle: 'AI Assistant',
    headerDescription: 'Ask about invoices, overdue, revenue, or cash-flow.',
    fallbackBadge: 'Fallback mode',
    loadingMessage: 'Analyzing...',
    placeholder: 'Write your message...',
    send: 'Send',
    openLabel: 'Open AI Assistant',
    minimizeLabel: 'Minimize AI Assistant',
    minimizeChatLabel: 'Minimize chat',
    greeting: `Hello. I can help you analyze ${businessName}, understand your invoices, and monitor activity.`,
    choicePerformance: `Summarize ${businessName} performance`,
    choiceOverdue: 'Show overdue invoices',
    choiceCashflow: 'Give me a cash-flow insight',
    sendError: 'Unable to send message',
  };

  const localized = dictionary.pages.businessAssistant;
  const text = {
    headerTitle: localized?.widgetHeaderTitle || defaultText.headerTitle,
    headerDescription:
      localized?.widgetHeaderDescription || defaultText.headerDescription,
    fallbackBadge: localized?.widgetFallbackBadge || defaultText.fallbackBadge,
    loadingMessage:
      localized?.widgetLoadingMessage || defaultText.loadingMessage,
    placeholder: localized?.placeholder || defaultText.placeholder,
    send: localized?.send || defaultText.send,
    openLabel: localized?.openLabel || defaultText.openLabel,
    minimizeLabel: localized?.minimizeLabel || defaultText.minimizeLabel,
    minimizeChatLabel:
      localized?.minimizeChatLabel || defaultText.minimizeChatLabel,
    greeting:
      localized?.greeting?.replace('{businessName}', businessName) ||
      defaultText.greeting,
    choicePerformance:
      localized?.choicePerformance?.replace('{businessName}', businessName) ||
      defaultText.choicePerformance,
    choiceOverdue: localized?.choiceOverdue || defaultText.choiceOverdue,
    choiceCashflow: localized?.choiceCashflow || defaultText.choiceCashflow,
    sendError: localized?.sendError || defaultText.sendError,
  };

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [choices, setChoices] = useState<string[]>([
    text.choicePerformance,
    text.choiceOverdue,
    text.choiceCashflow,
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: text.greeting,
    },
  ]);

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({
      query,
      history,
    }: {
      query: string;
      history: ChatMessage[];
    }) => {
      return ChatService.sendMessage({ businessId, query, history, lang });
    },
    onSuccess: (response) => {
      const fallbackDetected = response.fallback === true;

      setIsFallbackMode(fallbackDetected);

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: response.response },
      ]);
      setChoices(
        response.choices && response.choices.length > 0
          ? response.choices
          : [text.choicePerformance, text.choiceOverdue, text.choiceCashflow]
      );
    },
    onError: (error: unknown) => {
      const messageText =
        error instanceof Error ? error.message : text.sendError;
      toast.error(messageText);
    },
  });

  const submitQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || !businessId || isPending) return;

    const previousConversationHistory = messages.slice(1);
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: trimmed },
    ];

    setMessages(nextMessages);
    setMessage('');
    sendMessage({ query: trimmed, history: previousConversationHistory });
  };

  const handleSubmit = () => {
    submitQuery(message);
  };

  const handleChoiceClick = (choice: string) => {
    submitQuery(choice);
  };

  return (
    <div className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
      {isOpen && (
        <div className="bg-background mb-3 flex h-[70vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border shadow-2xl sm:h-[560px] sm:w-[390px]">
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">{text.headerTitle}</p>
                  <p className="text-muted-foreground text-xs">
                    {text.headerDescription}
                  </p>
                </div>
              </div>
              {isFallbackMode && (
                <span className="rounded-full border bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                  {text.fallbackBadge}
                </span>
              )}
              <button
                type="button"
                aria-label={text.minimizeChatLabel}
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {choices.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {choices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleChoiceClick(choice)}
                    disabled={isPending}
                    className="bg-muted hover:bg-muted/80 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-60"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}
            <div className="space-y-3">
              {messages.map((entry, index) => (
                <div
                  key={`${entry.role}-${index}`}
                  className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                      entry.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 border'
                    }`}
                  >
                    {entry.content}
                  </div>
                </div>
              ))}
              {isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted/60 flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {text.loadingMessage}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t px-3 py-3">
            <div className="space-y-2">
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={text.placeholder}
                className="min-h-[72px] resize-none"
                disabled={isPending}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending || !message.trim()}
                  className="gap-2"
                  size="sm"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {text.send}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label={isOpen ? text.minimizeLabel : text.openLabel}
        onClick={() => setIsOpen((current) => !current)}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-14 w-14 items-center justify-center rounded-full shadow-xl shadow-black/20 transition-transform hover:scale-105"
      >
        <Bot className="h-5 w-5" />
      </button>
    </div>
  );
}
