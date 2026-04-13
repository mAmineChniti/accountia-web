'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link2, Copy, Check, Loader2, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { ClientPortalAdminService, type GeneratePortalTokenResponse } from '@/lib/requests';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function BusinessClientPortal({
  businessId,
  canManage = false,
}: {
  businessId: string;
  canManage?: boolean;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [expiryDays, setExpiryDays] = useState('30');
  const [result, setResult] = useState<GeneratePortalTokenResponse | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  const fullPortalUrl = result
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/en/portal/${result.token}`
    : '';

  const generateMutation = useMutation({
    mutationFn: () =>
      ClientPortalAdminService.generateToken({
        businessId,
        clientEmail: email.trim(),
        clientName: name.trim() || undefined,
        expiryDays: parseInt(expiryDays) || 30,
      }),
    onSuccess: (data) => {
      setResult(data);
      toast.success('Portal link generated successfully');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to generate link'),
  });

  function handleCopy() {
    navigator.clipboard.writeText(fullPortalUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleGenerate() {
    if (!email.trim()) {
      toast.error('Client email is required');
      return;
    }
    setResult(undefined);
    generateMutation.mutate();
  }

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Client Portal</h1>
        <p className="text-muted-foreground">
          Generate secure, time-limited links that let your clients view their invoices without logging in.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Generate form */}
        <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="h-5 w-5 text-primary" />
              Generate Portal Link
            </CardTitle>
            <CardDescription>
              The client will see all invoices your business has issued to their email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="client-email">
                Client Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client-email"
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!canManage}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-name">Client Name (optional)</Label>
              <Input
                id="client-name"
                placeholder="e.g. Ahmed Client"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canManage}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiry-days">Link valid for (days)</Label>
              <Input
                id="expiry-days"
                type="number"
                min="1"
                max="365"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                disabled={!canManage}
              />
            </div>

            {!canManage && (
              <p className="text-muted-foreground text-sm">
                Only owners and admins can generate portal links.
              </p>
            )}

            <Button
              className="w-full gap-2"
              disabled={!canManage || generateMutation.isPending}
              onClick={handleGenerate}
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              Generate Link
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
                  Portal link ready
                </CardTitle>
                <CardDescription>
                  Expires:{' '}
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
                <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">{fullPortalUrl}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
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
                  Open portal (preview as client)
                </Button>
                <p className="text-muted-foreground text-xs">
                  Share this link with <strong>{email}</strong>. They can open it in any browser — no login required.
                  Generating a new link for the same email invalidates the previous one.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="text-primary h-5 w-5" />
                  How it works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="text-muted-foreground space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-primary shrink-0 font-bold">1.</span>
                    Enter the client&apos;s email and an optional display name.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary shrink-0 font-bold">2.</span>
                    Click <strong>Generate Link</strong> — a secure token is created (or refreshed if one already exists for that email).
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary shrink-0 font-bold">3.</span>
                    Copy the URL and send it to your client via email or chat.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary shrink-0 font-bold">4.</span>
                    The client opens the link in any browser — they see all invoices you&apos;ve issued to their email, can view details, and download PDFs.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary shrink-0 font-bold">5.</span>
                    The link auto-expires after the chosen number of days. Generate a new one anytime.
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
