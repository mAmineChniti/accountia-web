/* eslint-disable */
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Link2,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  ClientPortalAdminService,
  type GeneratePortalTokenResponse,
} from '@/lib/requests';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Dictionary } from '@/get-dictionary';

export function BusinessClientPortal({
  businessId,
  dictionary,
}: {
  businessId: string;
  dictionary: Dictionary;
}) {
  const t = dictionary.pages.businessClientPortal;
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [expiryDays, setExpiryDays] = useState('30');
  const [result, setResult] = useState<
    GeneratePortalTokenResponse | undefined
  >();
  const [copied, setCopied] = useState(false);

  const fullPortalUrl = result
    ? `${globalThis.window === undefined ? '' : globalThis.location.origin}/en/portal/${result.token}`
    : '';

  const MIN_DAYS = 1;
  const MAX_DAYS = 365;

  const generateMutation = useMutation({
    mutationFn: () => {
      const parsedDays = Number.parseInt(expiryDays, 10);
      let sanitizedDays = Number.isNaN(parsedDays) ? 30 : parsedDays;
      sanitizedDays = Math.max(MIN_DAYS, Math.min(MAX_DAYS, sanitizedDays));

      return ClientPortalAdminService.generateToken({
        businessId,
        clientEmail: email.trim(),
        clientName: name.trim() || undefined,
        expiryDays: sanitizedDays,
      });
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success(t.success);
    },
    onError: (err: Error) => toast.error(err.message || t.error),
  });

  function handleCopy() {
    navigator.clipboard.writeText(fullPortalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleGenerate() {
    if (!email.trim()) {
      toast.error(t.requiredEmail);
      return;
    }
    setResult(undefined);
    generateMutation.mutate();
  }

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Generate form */}
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="text-primary h-5 w-5" />
              {t.generateLinkTitle}
            </CardTitle>
            <CardDescription>{t.generateLinkDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="client-email">
                {t.clientEmailLabel} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client-email"
                type="email"
                placeholder={t.clientEmailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={generateMutation.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-name">{t.clientNameLabel}</Label>
              <Input
                id="client-name"
                placeholder={t.clientNamePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={generateMutation.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiry-days">{t.expiryDaysLabel}</Label>
              <Input
                id="expiry-days"
                type="number"
                min="1"
                max="365"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                disabled={generateMutation.isPending}
              />
            </div>

            <Button
              className="w-full gap-2"
              disabled={generateMutation.isPending}
              onClick={handleGenerate}
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {t.generateLinkButton}
            </Button>
          </CardContent>
        </Card>

        {/* Result / how it works */}
        <div className="space-y-4">
          {result ? (
            <Card className="border-primary/20 dark:bg-card/90 border bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-green-700 dark:text-green-400">
                  <Check className="h-5 w-5" />
                  {t.portalLinkReady}
                </CardTitle>
                <CardDescription>
                  {t.expiresLabel}{' '}
                  <span className="font-medium">
                    {new Date(result.expiresAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">
                    {fullPortalUrl}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => window.open(fullPortalUrl, '_blank')}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t.openPortalButton}
                </Button>
                <p className="text-muted-foreground text-xs">
                  {t.shareHint.replace('{email}', email)}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="text-primary h-5 w-5" />
                  {t.howItWorksTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="text-muted-foreground space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-primary shrink-0 font-bold">1.</span>
                    {t.step1}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary shrink-0 font-bold">2.</span>
                    {t.step2}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary shrink-0 font-bold">3.</span>
                    {t.step3}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary shrink-0 font-bold">4.</span>
                    {t.step4}
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary shrink-0 font-bold">5.</span>
                    {t.step5}
                  </li>
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
