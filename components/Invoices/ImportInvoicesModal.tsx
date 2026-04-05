'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Upload,
  FileIcon,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
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
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { InvoicesService } from '@/lib/requests';
import { localizeErrorMessage } from '@/lib/error-localization';
import type { InvoiceImportResponse } from '@/types/ResponseInterfaces';

interface ImportInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  dictionary: Dictionary;
  _lang: Locale;
}

const ACCEPTED_FILE_TYPES = new Set([
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export function ImportInvoicesModal({
  isOpen,
  onClose,
  onSuccess,
  dictionary,
  _lang,
}: ImportInvoicesModalProps) {
  const t = dictionary.pages.invoices;
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<InvoiceImportResponse | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: importInvoices, isPending: isImporting } = useMutation({
    mutationFn: (file: File): Promise<InvoiceImportResponse> =>
      InvoicesService.importInvoices(file),
    onSuccess: (data: InvoiceImportResponse) => {
      // Invalidate all invoice queries (both issued and received) across all scopes
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return (
            (Array.isArray(queryKey) &&
              (queryKey[0] === 'invoices-issued' ||
                queryKey[0] === 'invoices-received-business')) ||
            false
          );
        },
      });

      setResult(data);
      const successMessage =
        t.importSuccessMessage ||
        `Successfully imported ${data.successCount} invoices${data.failedCount > 0 ? ` (${data.failedCount} failed)` : ''}`;
      toast.success(successMessage);
    },
    onError: (error: unknown) => {
      const errorMessage = localizeErrorMessage(
        error,
        dictionary,
        t.importErrorMessage || 'Failed to import invoices'
      );
      toast.error(errorMessage);
    },
  });

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (ACCEPTED_FILE_TYPES.has(file.type)) {
        setSelectedFile(file);
      } else {
        toast.error(t.invalidFileType || 'Please upload a CSV or Excel file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (ACCEPTED_FILE_TYPES.has(file.type)) {
        setSelectedFile(file);
      } else {
        toast.error(t.invalidFileType || 'Please upload a CSV or Excel file');
      }
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importInvoices(selectedFile);
    }
  };

  const handleClose = () => {
    if (result) {
      setResult(undefined);
      setSelectedFile(undefined);
      onClose();
      onSuccess?.();
    } else {
      setSelectedFile(undefined);
      onClose();
    }
  };

  if (!isOpen) return;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {result
              ? (t.importCompleteTitle ?? 'Import Complete')
              : (t.importInvoicesTitle ?? 'Import Invoices')}
          </DialogTitle>
          <DialogDescription>
            {result
              ? t.importCompleteDescription ||
                'Your invoices have been imported successfully'
              : t.importInvoicesDescription ||
                'Upload a CSV or Excel file to import invoices'}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          // Success Result
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
            </div>

            <div className="space-y-2 text-center">
              <p className="text-lg font-semibold">
                {t.importSuccess || 'Import Completed'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50 dark:bg-green-950/30">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {result.successCount}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        {t.importedLabel || 'Imported'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {result.failedCount > 0 && (
                  <Card className="bg-red-50 dark:bg-red-950/30">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                          {result.failedCount}
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300">
                          {t.failedLabel || 'Failed'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        ) : (
          // File Upload Form
          <div className="space-y-4 py-4">
            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`rounded-lg border-2 border-dashed p-8 transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="bg-muted rounded-lg p-3">
                  <Upload className="text-muted-foreground h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-medium">
                    {t.dragDropText || 'Drag and drop your file here'}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t.dragDropSubText || 'or click to browse'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  {t.browseButton || 'Browse Files'}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileChange}
                className="hidden"
                disabled={isImporting}
              />
            </div>

            {/* Selected File Display */}
            {selectedFile && (
              <Card className="bg-muted/30">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <FileIcon className="text-muted-foreground h-5 w-5" />
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(undefined)}
                    disabled={isImporting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* File Format Info */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="mb-2 font-medium">
                      {t.fileFormatTitle || 'Supported Formats'}
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>• {t.csvFormat || 'CSV (.csv)'}</li>
                      <li>• {t.excelFormat || 'Excel (.xls, .xlsx)'}</li>
                    </ul>
                    <p className="mt-2 text-xs font-semibold">
                      Required columns:
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>
                        • invoiceNumber, recipientType, issuedDate, dueDate
                      </li>
                    </ul>
                    <p className="mt-2 text-xs font-semibold">
                      Optional columns:
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>
                        • recipientPlatformId, recipientEmail,
                        recipientDisplayName
                      </li>
                      <li>
                        • productIds, productNames, quantities, unitPrices
                      </li>
                      <li>• description, paymentTerms, currency</li>
                    </ul>
                    <p className="mt-2 text-xs">
                      {t.fileRequirements ||
                        'Recipient type rules: PLATFORM_BUSINESS requires platformId, PLATFORM_INDIVIDUAL/EXTERNAL requires email. EXTERNAL also requires displayName.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dialog Footer */}
        <DialogFooter className="gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isImporting}
          >
            {result ? t.closeLabel || 'Close' : t.cancelLabel || 'Cancel'}
          </Button>
          {!result && (
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
