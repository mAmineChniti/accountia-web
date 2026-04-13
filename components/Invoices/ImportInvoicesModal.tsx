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
import { type Dictionary } from '@/get-dictionary';
import { InvoicesService } from '@/lib/requests';
import { localizeErrorMessage } from '@/lib/error-localization';
import type { BulkImportInvoicesResponseDto } from '@/types/services';

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
]);

const ACCEPTED_EXTENSIONS = ['.csv', '.xls', '.xlsx'];

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
  const tAny = t as Record<string, string | undefined>;
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState<
    BulkImportInvoicesResponseDto | undefined
  >();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importStatus = result
    ? result.successCount === 0 && result.failedCount > 0
      ? 'failed'
      : result.failedCount > 0 || result.warningCount > 0
        ? 'partial'
        : 'success'
    : 'idle';

  const { mutate: importInvoices, isPending: isImporting } = useMutation({
    mutationFn: (file: File): Promise<BulkImportInvoicesResponseDto> =>
      InvoicesService.importInvoices(file, businessId),
    onSuccess: (data: BulkImportInvoicesResponseDto) => {
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

      // Handle warnings: keep modal open for review
      if (data.warningCount > 0) {
        const warningMessage = (
          tAny.importWarningMessage ||
          'Import completed with {count} warning(s). Review details below.'
        ).replace('{count}', data.warningCount.toString());
        toast.warning(warningMessage);
        return;
      }

      // Handle failures: show error if all rows failed
      if (data.successCount === 0 && data.failedCount > 0) {
        const failureMessage = (
          tAny.importFailureMessage ||
          'Import failed: {count} invoice(s) could not be imported.'
        ).replace('{count}', data.failedCount.toString());
        toast.error(failureMessage);
        return;
      }

      // Success: show success toast with failed count if applicable
      const successMessage =
        data.failedCount > 0
          ? `Successfully imported ${data.successCount} invoices (${data.failedCount} failed)`
          : tAny.importSuccessMessage ||
            `Successfully imported ${data.successCount} invoices`;
      toast.success(successMessage);
    },
    onError: (error: unknown) => {
      const errorMessage = localizeErrorMessage(
        error,
        dictionary,
        tAny.importErrorMessage || 'Failed to import invoices'
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
      if (isValidFile(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(undefined);
        toast.error(t.invalidFileType || 'Please upload a CSV or Excel file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
      } else {
        setSelectedFile(undefined);
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
      // Only call onSuccess if no warnings and some records succeeded
      if (result.warningCount === 0 && result.successCount > 0) {
        onSuccess?.();
      }
      setResult(undefined);
      setSelectedFile(undefined);
      onClose();
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
              ? importStatus === 'failed'
                ? 'Import Failed'
                : 'Import Complete'
              : (t.importInvoicesTitle ?? 'Import Invoices')}
          </DialogTitle>
          <DialogDescription>
            {result
              ? importStatus === 'failed'
                ? 'No invoices were imported. Review the failed rows and try again.'
                : 'Your invoices have been imported successfully'
              : t.importInvoicesDescription ||
                'Upload a CSV or Excel file to import invoices'}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          // Success Result
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <div
                className={`rounded-full p-3 ${
                  importStatus === 'failed'
                    ? 'bg-red-100 dark:bg-red-900'
                    : importStatus === 'partial'
                      ? 'bg-yellow-100 dark:bg-yellow-900'
                      : 'bg-green-100 dark:bg-green-900'
                }`}
              >
                {importStatus === 'failed' ? (
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-300" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-300" />
                )}
              </div>
            </div>

            <div className="space-y-2 text-center">
              <p className="text-lg font-semibold">
                {importStatus === 'failed'
                  ? tAny.importFailed || 'Import Failed'
                  : tAny.importSuccess || 'Import Completed'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-green-50 dark:bg-green-950/30">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {result.successCount}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        {tAny.importedLabel || 'Imported'}
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
                          {tAny.failedLabel || 'Failed'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result.warningCount > 0 && (
                  <Card className="bg-yellow-50 dark:bg-yellow-950/30">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                          {result.warningCount}
                        </div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300">
                          {tAny.warningsLabel || 'Warnings'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {result.failedCount > 0 && (
                <Card className="border-red-200 bg-red-50 text-left dark:border-red-900 dark:bg-red-950/20">
                  <CardContent className="space-y-2 pt-4">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                      {tAny.importFailedDetailsTitle ||
                        'Failed rows details (first 5)'}
                    </p>
                    <div className="space-y-1 text-xs text-red-800 dark:text-red-200">
                      {result.results
                        .filter(
                          (item) =>
                            item.success === false ||
                            ((item as unknown as Record<string, unknown>)
                              .status as string | undefined) === 'error'
                        )
                        .slice(0, 5)
                        .map((item, index) => {
                          const fallbackMessage = item.message?.trim();
                          const combinedErrors = item.errors?.join(', ');
                          const detail =
                            combinedErrors && combinedErrors.length > 0
                              ? combinedErrors
                              : fallbackMessage ||
                                'Validation failed for this row';
                          const legacyInvoiceNumber = (
                            item as unknown as Record<string, unknown>
                          ).invoiceNumber;
                          const rowLabel =
                            item.itemNumber ??
                            (typeof legacyInvoiceNumber === 'string'
                              ? legacyInvoiceNumber
                              : undefined) ??
                            index + 1;
                          return (
                            <p key={`${rowLabel}-${detail}`}>
                              {`Row ${rowLabel}: ${detail}`}
                            </p>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}
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
                      {t.requiredColumnsLabel || 'Required columns:'}
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>
                        •{' '}
                        {t.requiredColumnsList ||
                          'invoiceNumber, recipientType, issuedDate, dueDate'}
                      </li>
                    </ul>
                    <p className="mt-2 text-xs font-semibold">
                      {t.optionalColumnsLabel || 'Optional columns:'}
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>
                        •{' '}
                        {t.optionalColumnsLine1 ||
                          'recipientPlatformId, recipientEmail, recipientDisplayName'}
                      </li>
                      <li>
                        •{' '}
                        {t.optionalColumnsLine2 ||
                          'productIds, productNames, quantities, unitPrices'}
                      </li>
                      <li>
                        •{' '}
                        {t.optionalColumnsLine3 ||
                          'description, paymentTerms, currency'}
                      </li>
                    </ul>
                    <p className="mt-2 text-xs">
                      {t.fileRequirements ||
                        'Recipient type rules: PLATFORM_BUSINESS requires platformId, PLATFORM_INDIVIDUAL/EXTERNAL requires email. EXTERNAL also requires displayName.'}
                    </p>
                    <p className="mt-2 text-xs text-blue-700 dark:text-blue-200">
                      {tAny.productIdsRequiredNote ||
                        'For invoice import, fill productIds with valid product IDs. productNames alone may not be enough for the importer to match line items.'}
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
                  {tAny.importingLabel || 'Importing...'}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {tAny.importButton || 'Import'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
