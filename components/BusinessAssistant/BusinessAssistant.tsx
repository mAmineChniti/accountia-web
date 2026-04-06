'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { ChatService } from '@/lib/requests';
import type { Locale } from '@/i18n-config';
import type { Dictionary } from '@/get-dictionary';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ChatMessage } from '@/types/ResponseInterfaces';

export function BusinessAssistant({
  businessId,
  businessName,
  dictionary: _dictionary,
  lang: _lang,
}: {
  businessId: string;
  businessName: string;
  dictionary: Dictionary;
  lang: Locale;
}) {
  const t = {
    title: 'AI Assistant',
    description:
      'Ask about invoices, revenue, overdue items, or business insights.',
    placeholder: 'Type your question here...',
    send: 'Send',
    quickPrompts: [
      'Summarize my business performance',
      'Show me overdue invoices',
      'Give me a cash flow insight',
    ],
  };

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I can help you analyze ${businessName}, explain invoices, or summarize your business activity.`,
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
      return ChatService.sendMessage({ businessId, query, history });
    },
    onSuccess: (response) => {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: response.response },
      ]);
    },
    onError: (error: unknown) => {
      const messageText =
        error instanceof Error ? error.message : 'Failed to send message';
      toast.error(messageText);
    },
  });

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed || !businessId) return;

    // Keep a clean history for backend chat: previous turns only.
    // The current user message is sent via `query`, not inside `history`.
    const previousConversationHistory = messages.slice(1);

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: trimmed },
    ];
    setMessages(nextMessages);
    setMessage('');
    sendMessage({ query: trimmed, history: previousConversationHistory });
  };

  const handleQuickPrompt = (prompt: string) => {
    setMessage(prompt);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Business AI
          </Badge>
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground max-w-2xl">{t.description}</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Accountia Assistant
          </CardTitle>
          <CardDescription>
            Ask about revenue, invoices, overdue amounts, or business activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(t.quickPrompts as string[]).map((prompt) => (
              <Button
                key={prompt}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isPending}
              >
                {prompt}
              </Button>
            ))}
          </div>

          <div className="bg-muted/20 h-[420px] overflow-y-auto rounded-lg border p-4">
            <div className="space-y-4">
              {messages.map((entry, index) => (
                <div
                  key={`${entry.role}-${index}`}
                  className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                      entry.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border shadow-sm'
                    }`}
                  >
                    {entry.content}
                  </div>
                </div>
              ))}
              {isPending && (
                <div className="flex justify-start">
                  <div className="bg-background flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t.placeholder}
              className="min-h-[110px]"
              disabled={isPending}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !message.trim()}
                className="gap-2"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {t.send}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
