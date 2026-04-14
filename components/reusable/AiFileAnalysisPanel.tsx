'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wand2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  analyzeImportFile,
  type AnalysisResult,
} from '@/actions/analyze-import-file';
import { parseFile, generateCorrectedFile } from '@/lib/file-parser';

// In-memory cache: key = "filename-size", value = AnalysisResult
const analysisCache = new Map<string, AnalysisResult>();

interface AiFileAnalysisPanelProps {
  file: File | undefined;
  mode: 'products' | 'invoices';
  onFileCorrected: (correctedFile: File) => void;
  onError?: (error: string) => void;
}

export function AiFileAnalysisPanel({
  file,
  mode,
  onFileCorrected,
  onError,
}: AiFileAnalysisPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [correcting, setCorrecting] = useState(false);
  const lastAnalyzedKey = useRef<string | undefined>(undefined);

  const handleAnalyze = useCallback(
    async (fileToAnalyze: File, cacheKey?: string) => {
      setAnalyzing(true);
      setError(undefined);
      try {
        const { headers, rows } = await parseFile(fileToAnalyze);
        const sampleRows = structuredClone(rows.slice(0, 0 + 3));

        const analysis = await analyzeImportFile(headers, sampleRows, mode);

        // Store in cache to avoid re-calling the API for the same file
        if (cacheKey) analysisCache.set(cacheKey, analysis);

        if (analysis.aiError) {
          setError(analysis.aiError);
          setResult(undefined);
          if (
            analysis.aiError.includes('suspended') ||
            analysis.aiError.includes('403')
          ) {
            onError?.(analysis.aiError);
          }
        } else {
          setResult(analysis);
        }
      } catch (error_: unknown) {
        console.error(error_);
        setError(
          error_ instanceof Error ? error_.message : 'Failed to analyze file'
        );
      } finally {
        setAnalyzing(false);
      }
    },
    [mode, onError]
  );

  useEffect(() => {
    if (!file) {
      setResult(undefined);
      setError(undefined);
      return;
    }
    const cacheKey = `${file.name}-${file.size}`;
    // Skip if we already analyzed this exact file
    if (lastAnalyzedKey.current === cacheKey) return;
    // Use cached result if available
    if (analysisCache.has(cacheKey)) {
      const cached = analysisCache.get(cacheKey)!;
      lastAnalyzedKey.current = cacheKey;
      if (cached.aiError) {
        setError(cached.aiError);
        setResult(undefined);
      } else {
        setResult(cached);
        setError(undefined);
      }
      return;
    }
    lastAnalyzedKey.current = cacheKey;
    handleAnalyze(file, cacheKey);
  }, [file, handleAnalyze]);

  const handleAutoCorrect = async () => {
    if (!file || !result) return;

    setCorrecting(true);
    try {
      const { rows } = await parseFile(file);

      // Apply the mapping suggested by AI
      const mapping = result.columnMapping;
      const correctedRows = rows.map((row) => {
        const newRow: Record<string, unknown> = {};
        for (const [found, expected] of Object.entries(mapping)) {
          newRow[expected] = row[found];
        }
        return newRow;
      });

      const expectedHeaders =
        mode === 'products'
          ? ['name', 'description', 'unitPrice', 'cost', 'quantity']
          : [
              'invoiceNumber',
              'recipientType',
              'recipientPlatformId',
              'recipientEmail',
              'recipientDisplayName',
              'productIds',
              'productNames',
              'quantities',
              'unitPrices',
              'issuedDate',
              'dueDate',
              'description',
              'paymentTerms',
              'currency',
            ];

      const correctedFile = generateCorrectedFile(
        file,
        correctedRows,
        expectedHeaders
      );
      onFileCorrected(correctedFile);
      toast.success('File auto-corrected successfully!');

      // Re-trigger analysis for the corrected file
      setResult({
        isValid: true,
        errors: [],
        columnMapping: {},
        suggestions: ['The file is now correctly structured.'],
      });
    } catch (error_: unknown) {
      toast.error(
        'Correction failed: ' +
          (error_ instanceof Error ? error_.message : 'Unknown error')
      );
    } finally {
      setCorrecting(false);
    }
  };

  if (!file) return;

  return (
    <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10 mt-4 overflow-hidden">
      <CardHeader className="bg-primary/10 flex flex-row items-center justify-between space-y-0 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="text-primary h-4 w-4 animate-pulse" />
          AI File Analysis
        </CardTitle>
        {analyzing && (
          <Badge variant="outline" className="animate-pulse gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Analyzing...
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {error && (
          <Alert variant="destructive" className="py-3">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-semibold">
              Erreur d&apos;Analyse IA
            </AlertTitle>
            <AlertDescription className="mt-1 space-y-2 text-xs">
              <p>{error}</p>
              {(error.includes('suspended') ||
                error.includes('invalide') ||
                error.includes('403')) && (
                <div className="bg-destructive/10 border-destructive/20 text-destructive-foreground mt-2 rounded border p-2 font-medium">
                  💡 <strong>Besoin d&apos;aide :</strong> Votre clé API Google
                  Gemini semble inactive ou suspendue.
                  <ul className="mt-1 ml-4 list-disc">
                    <li>
                      Générez une nouvelle clé sur{' '}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline"
                      >
                        Google AI Studio
                      </a>
                    </li>
                    <li>
                      Vérifiez la facturation de votre projet Google Cloud.
                    </li>
                    <li>
                      Ou décochez &quot;IA Smart Auto-Fix&quot; pour importer
                      manuellement.
                    </li>
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <>
            {result.isValid ? (
              <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Structure is correct and ready for import.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-4 w-4" />
                  We found some issues in your file structure.
                </div>

                <ul className="text-muted-foreground list-disc space-y-1 pl-6 text-xs">
                  {result.errors.map((err, i) => (
                    <li key={i}>
                      <span className="font-semibold">{err.message}</span>
                      {err.suggestion && (
                        <span className="ml-1 italic">
                          (Suggestion: {err.suggestion})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 h-8 gap-2 text-xs"
                    onClick={handleAutoCorrect}
                    disabled={correcting}
                  >
                    {correcting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                    Auto-Correct with AI
                  </Button>
                </div>
              </div>
            )}

            {result.suggestions.length > 0 && !result.isValid && (
              <div className="text-muted-foreground border-primary/10 rounded border bg-white/50 p-2 text-[11px] italic dark:bg-black/20">
                <strong>AI Tip:</strong> {result.suggestions[0]}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
