'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import FileUpload from '@/components/reusable/file-upload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { type Dictionary } from '@/get-dictionary';
import { InvoicesService } from '@/lib/requests';
import { localizeErrorMessage } from '@/lib/error-localization';
import { cn } from '@/lib/utils';
import type {
  BulkImportInvoicesResponseDto,
  InvoiceImportJobResponseDto,
} from '@/types/services';

type ImportWorkflowState =
  | 'IDLE'
  | 'UPLOADING'
  | 'PROCESSING'
  | 'DONE'
  | 'FAILED';

interface ImportInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  dictionary: Dictionary;
  businessId: string;
}

const ACCEPTED_FILE_TYPES = new Set([
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/pdf',
]);

const ACCEPTED_EXTENSIONS = ['.csv', '.xls', '.xlsx', '.pdf'];

const PDF_TYPE = 'application/pdf';

const isValidFile = (file: File): boolean => {
  // Check MIME type
  if (ACCEPTED_FILE_TYPES.has(file.type)) {
    return true;
  }

  // Fallback: check file extension
  const fileName = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
};

export function ImportInvoicesModal({
  isOpen,
  onClose,
  onSuccess,
  dictionary,
  businessId,
}: ImportInvoicesModalProps) {
  const t = dictionary.pages.invoices;
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [fileError, setFileError] = useState<string | undefined>();
  const [workflowState, setWorkflowState] =
    useState<ImportWorkflowState>('IDLE');

  // Bulk (CSV/Excel) Results
  const [bulkResult, setBulkResult] = useState<
    BulkImportInvoicesResponseDto | undefined
  >();

  // AI (PDF) Results
  const [jobId, setJobId] = useState<string | undefined>();
  const [pdfResult, setPdfResult] = useState<
    InvoiceImportJobResponseDto | undefined
  >();
  const pollingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isPollingRef = useRef<boolean>(false);

  const importStatus = bulkResult
    ? bulkResult.successCount === 0 && bulkResult.failedCount > 0
      ? 'failed'
      : bulkResult.failedCount > 0 || bulkResult.warningCount > 0
        ? 'partial'
        : 'success'
    : pdfResult
      ? pdfResult.status === 'FAILED'
        ? 'failed'
        : 'success'
      : 'idle';

  const isImporting =
    workflowState === 'UPLOADING' || workflowState === 'PROCESSING';

  // Polling logic for PDF Import
  useEffect(() => {
    // Helper to stop any active polling
    const cleanupPolling = () => {
      if (pollingTimeoutRef.current) {
        console.log(
          `[ImportModal] Cleaning up polling for jobId: ${jobId || 'N/A'}`
        );
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = undefined;
      }
      isPollingRef.current = false;
    };

    if (workflowState === 'PROCESSING' && jobId && isOpen) {
      console.log(`[ImportModal] Starting recursive polling for job: ${jobId}`);
      isPollingRef.current = true;
      let errorCount = 0;
      const MAX_ERRORS = 8; // Slightly more generous with backoff
      const BASE_DELAY = 2000;
      const MAX_DELAY = 10_000;

      const poll = async () => {
        // Double check if we should still be polling
        if (
          !isPollingRef.current ||
          !isOpen ||
          workflowState !== 'PROCESSING'
        ) {
          return;
        }

        try {
          const status = (await InvoicesService.getImportJobStatus(
            jobId,
            businessId
          )) as InvoiceImportJobResponseDto;

          // Re-check state after async call
          if (!isPollingRef.current || !isOpen) return;

          errorCount = 0; // Reset errors on success

          if (status.status === 'COMPLETED') {
            setPdfResult(status);
            setWorkflowState('DONE');
            cleanupPolling();
            queryClient.invalidateQueries({
              predicate: (query) => {
                const key = query.queryKey[0];
                return (
                  key === 'invoices-issued' ||
                  key === 'invoices-received-business'
                );
              },
            });
            toast.success(
              t.pdfImportSuccess || 'Invoice successfully extracted'
            );
          } else if (status.status === 'FAILED') {
            setPdfResult(status);
            setWorkflowState('FAILED');
            cleanupPolling();
            toast.error(t.pdfImportFailed || 'Failed to analyze PDF');
            // Still pending or processing, schedule next poll
            pollingTimeoutRef.current = setTimeout(() => {
              void poll();
            }, BASE_DELAY);
          }
        } catch (error: unknown) {
          if (!isPollingRef.current || !isOpen) return;

          errorCount++;
          const delay = Math.min(
            BASE_DELAY * Math.pow(1.5, errorCount),
            MAX_DELAY
          );
          console.warn(
            `[ImportModal] Polling attempt ${errorCount} failed. Retrying in ${Math.round(delay)}ms...`,
            error
          );

          if (errorCount >= MAX_ERRORS) {
            console.error(
              '[ImportModal] Max polling errors reached. Stopping.'
            );
            setWorkflowState('FAILED');
            cleanupPolling();
            toast.error(
              t.importErrorMessage || 'Connection lost during processing'
            );
          } else {
            pollingTimeoutRef.current = setTimeout(() => {
              void poll();
            }, delay);
          }
        }
      };

      // Start the first poll
      poll();
    }

    return () => cleanupPolling();
  }, [workflowState, jobId, businessId, queryClient, t, isOpen]);

  const { mutate: importBulk } = useMutation({
    mutationFn: (file: File) =>
      InvoicesService.importInvoices(file, businessId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            key === 'invoices-issued' || key === 'invoices-received-business'
          );
        },
      });
      setBulkResult(data);
      setWorkflowState('DONE');
      toast.success(t.importSuccess || 'Import Completed');
    },
    onError: (error) => {
      setWorkflowState('FAILED');
      toast.error(
        localizeErrorMessage(error, dictionary, t.importErrorMessage)
      );
    },
  });

  const { mutate: importPdf } = useMutation({
    mutationFn: (file: File) =>
      InvoicesService.importInvoicePdf(file, businessId),
    onSuccess: (data) => {
      setJobId(data.jobId);
      setWorkflowState('PROCESSING');
    },
    onError: (error) => {
      setWorkflowState('FAILED');
      toast.error(
        localizeErrorMessage(error, dictionary, t.importErrorMessage)
      );
    },
  });

  const handleFileSelect = (file: File) => {
    if (isValidFile(file)) {
      setSelectedFile(file);
      setFileError(undefined);
    } else {
      setSelectedFile(undefined);
      setFileError(t.invalidFileType || 'Please upload a CSV or Excel file');
    }
  };

  const handleFileClear = () => {
    setSelectedFile(undefined);
    setFileError(undefined);
  };

  const handleImport = () => {
    if (selectedFile) {
      setWorkflowState('UPLOADING');
      if (
        selectedFile.type === PDF_TYPE ||
        selectedFile.name.toLowerCase().endsWith('.pdf')
      ) {
        importPdf(selectedFile);
      } else {
        importBulk(selectedFile);
      }
    }
  };

  const handleClose = () => {
    // Explicitly cancel polling on close
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = undefined;
    }
    isPollingRef.current = false;

    if (workflowState === 'DONE' || workflowState === 'FAILED') {
      if (
        bulkResult &&
        bulkResult.warningCount === 0 &&
        bulkResult.successCount > 0
      ) {
        onSuccess?.();
      } else if (pdfResult && pdfResult.status === 'COMPLETED') {
        onSuccess?.();
      }
      setBulkResult(undefined);
      setPdfResult(undefined);
      setJobId(undefined);
      setSelectedFile(undefined);
      setFileError(undefined);
      setWorkflowState('IDLE');
      onClose();
    } else {
      setSelectedFile(undefined);
      setFileError(undefined);
      setWorkflowState('IDLE');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {workflowState === 'DONE'
              ? importStatus === 'failed'
                ? t.importFailed
                : t.importCompleteTitle
              : workflowState === 'FAILED'
                ? t.importFailed
                : (t.importInvoicesTitle ?? 'Import Invoices')}
          </DialogTitle>
          <DialogDescription>
            {workflowState === 'DONE'
              ? importStatus === 'failed'
                ? t.importFailedDescription
                : t.importSuccessDescription
              : workflowState === 'PROCESSING'
                ? t.processingPdf || 'Analyzing your PDF invoice using AI...'
                : t.importInvoicesDescription ||
                  'Upload a CSV, Excel or PDF file to import invoices'}
          </DialogDescription>
        </DialogHeader>

        {workflowState === 'DONE' || workflowState === 'FAILED' ? (
          // Final Results View
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <div
                className={cn(
                  'rounded-full p-3',
                  importStatus === 'failed' && 'bg-red-100 dark:bg-red-900',
                  importStatus === 'partial' &&
                    'bg-yellow-100 dark:bg-yellow-900',
                  importStatus === 'success' && 'bg-green-100 dark:bg-green-900'
                )}
              >
                {importStatus === 'failed' ? (
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-300" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-300" />
                )}
              </div>
            </div>

            {bulkResult ? (
              // Bulk Result Table (existing logic)
              <div className="space-y-2 text-center">
                <p className="text-lg font-semibold">
                  {importStatus === 'failed' ? t.importFailed : t.importSuccess}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-green-50 dark:bg-green-950/30">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {bulkResult.successCount}
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">
                          {t.importedLabel || 'Imported'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {bulkResult.failedCount > 0 && (
                    <Card className="bg-red-50 dark:bg-red-950/30">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                            {bulkResult.failedCount}
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-300">
                            {t.failedLabel || 'Failed'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                {bulkResult.failedCount > 0 && (
                  <Card className="mt-4 border-red-200 bg-red-50 text-left dark:border-red-900 dark:bg-red-950/20">
                    <CardContent className="space-y-1 pt-4 text-xs text-red-800 dark:text-red-200">
                      {bulkResult.results
                        .filter((r) => !r.success)
                        .slice(0, 5)
                        .map((r, i) => (
                          <p key={i}>
                            Row {r.itemNumber}: {r.message}
                          </p>
                        ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : pdfResult ? (
              // PDF AI Result
              <div className="space-y-4 text-center">
                <p className="text-lg font-semibold">
                  {pdfResult.status === 'COMPLETED'
                    ? pdfResult.metadata?.confidenceScore &&
                      pdfResult.metadata.confidenceScore < 0.7
                      ? t.pdfImportPendingReview
                      : t.pdfImportSuccess
                    : t.pdfImportFailed}
                </p>
                <Card
                  className={cn(
                    'border-2',
                    pdfResult.status === 'COMPLETED'
                      ? 'border-green-200 bg-green-50/50'
                      : 'border-red-200 bg-red-50/50'
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-muted-foreground text-sm">
                        {t.invoiceNumber || 'Invoice #'}
                      </span>
                      <span className="text-2xl font-bold">
                        {pdfResult.invoiceId || '---'}
                      </span>
                      {pdfResult.metadata?.confidenceScore && (
                        <div className="mt-2 text-xs">
                          Confidence:{' '}
                          <span
                            className={cn(
                              'font-bold',
                              pdfResult.metadata.confidenceScore > 0.8
                                ? 'text-green-600'
                                : 'text-yellow-600'
                            )}
                          >
                            {Math.round(
                              pdfResult.metadata.confidenceScore * 100
                            )}
                            %
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : undefined}
          </div>
        ) : workflowState === 'PROCESSING' ? (
          // Processing/Polling State
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="relative">
              <div className="border-primary h-16 w-16 animate-spin rounded-full border-4 border-t-transparent"></div>
              <Loader2 className="text-primary absolute inset-0 h-16 w-16 animate-pulse opacity-20" />
            </div>
            <div className="text-center">
              <p className="animate-pulse text-lg font-medium">
                {t.processingPdf || 'Analyzing Invoice...'}
              </p>
              <p className="text-muted-foreground text-sm">
                Our AI is extracting data from your document.
              </p>
            </div>
          </div>
        ) : (
          // File Upload Form (IDLE/UPLOADING)
          <div className="space-y-4 py-4">
            <FileUpload
              accept=".csv,.xls,.xlsx,.pdf"
              maxSize={10}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              onFileClear={handleFileClear}
              disabled={isImporting}
              isUploading={workflowState === 'UPLOADING'}
              error={fileError}
              dictionary={dictionary}
            />

            <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="mb-2 font-medium">
                      {t.fileFormatTitle || 'Supported Formats'}
                    </p>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <li>• {t.csvFormat || 'CSV (.csv)'}</li>
                      <li>• {t.excelFormat || 'Excel (.xls, .xlsx)'}</li>
                      <li className="text-primary font-bold">
                        • AI Import (.pdf)
                      </li>
                    </ul>
                    <p className="mt-4 text-xs font-semibold">
                      {t.importPdfDescription}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isImporting}
          >
            {workflowState === 'DONE' || workflowState === 'FAILED'
              ? t.closeLabel || 'Close'
              : t.cancelLabel || 'Cancel'}
          </Button>
          {(workflowState === 'IDLE' || workflowState === 'UPLOADING') && (
            <Button
              type="button"
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="min-w-24"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.importingLabel || 'Importing...'}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t.importButton || 'Import'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
