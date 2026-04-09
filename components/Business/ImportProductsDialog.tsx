'use client';

import { type ChangeEvent, type ReactNode, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  Loader2,
  FileIcon,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { type Dictionary } from '@/get-dictionary';
import { ProductsService } from '@/lib/requests';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ImportProductsDialogProps {
  businessId: string;
  dictionary: Dictionary;
  trigger?: ReactNode;
}

const ACCEPTED_FILE_TYPES = new Set([
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const ACCEPTED_EXTENSIONS = ['.csv', '.xls', '.xlsx'];

const isValidFile = (file: File): boolean => {
  if (ACCEPTED_FILE_TYPES.has(file.type)) {
    return true;
  }

  const fileName = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
};

export function ImportProductsDialog({
  businessId,
  dictionary,
  trigger,
}: ImportProductsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<
    | {
        imported: number;
        failed: number;
        errors: string[];
      }
    | undefined
  >();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const t = dictionary.pages.businessProducts;

  // Handle dialog open/close to reset state when closing
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset file and import state when dialog closes
      setSelectedFile(undefined);
      setImportResult(undefined);
      setDragActive(false);
    }
    setOpen(newOpen);
  };

  const mutation = useMutation({
    mutationFn: (file: File) =>
      ProductsService.importProducts(file, businessId),
    onSuccess: (result) => {
      setImportResult(result);
      // Invalidate all product queries for this business to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['business-products', businessId],
      });
      // Also invalidate products query used in invoice creation
      queryClient.invalidateQueries({
        queryKey: ['products', businessId],
      });
      toast.success(
        t.importSuccess
          ? t.importSuccess.replace('{count}', String(result.imported))
          : `${result.imported} product${result.imported === 1 ? '' : 's'} imported successfully`
      );
    },
    onError: (error: unknown) => {
      const err = error as Error;
      toast.error(err.message || t.importError || 'Failed to import products');
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Always reset input value so re-selecting same file triggers onChange
    event.target.value = '';
    if (!file) {
      return;
    }

    if (isValidFile(file)) {
      setSelectedFile(file);
      setImportResult(undefined);
    } else {
      setSelectedFile(undefined);
      toast.error(t.importInvalidType || 'Please upload a CSV or Excel file');
      setImportResult(undefined);
    }
  };

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

    const file = e.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    if (isValidFile(file)) {
      setSelectedFile(file);
      setImportResult(undefined);
    } else {
      setSelectedFile(undefined);
      toast.error(t.importInvalidType || 'Please upload a CSV or Excel file');
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast.error(t.importSelectFile || 'Please select a file to import');
      return;
    }

    mutation.mutate(selectedFile);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            {t.importProducts || 'Import Products'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {importResult
              ? t.importCompleteTitle || 'Import Complete'
              : t.importProducts || 'Import Products'}
          </DialogTitle>
          <DialogDescription>
            {importResult
              ? t.importCompleteDescription ||
                'Your products have been imported. Review the summary below.'
              : t.importProductsDescription ||
                'Upload a CSV or Excel file with columns: name, description, unitPrice, cost, quantity.'}
          </DialogDescription>
        </DialogHeader>

        {importResult ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
            </div>

            <div className="space-y-2 text-center">
              <p className="text-lg font-semibold">
                {t.importResult || 'Import result'}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Card className="bg-green-50 dark:bg-green-950/30">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {importResult.imported}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        {t.importedCount || 'Imported'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-red-50 dark:bg-red-950/30">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {importResult.failed}
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        {t.failedCount || 'Failed'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
                <CardContent className="pt-4">
                  <p className="mb-2 text-sm font-semibold text-red-700 dark:text-red-300">
                    {t.importErrors || 'Errors'}
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-xs text-red-700 dark:text-red-300">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => {
                if (mutation.isPending) return;
                fileInputRef.current?.click();
              }}
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
                    {t.importDragDrop || 'Drag and drop your file here'}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t.importDragDropSub || 'or click to browse'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={mutation.isPending}
                >
                  {t.importBrowse || 'Browse Files'}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileChange}
                className="hidden"
                disabled={mutation.isPending}
              />
            </div>

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
                    disabled={mutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
              <CardContent className="pt-5">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="mb-2 font-medium">
                      {t.importFormatTitle || 'Supported formats'}
                    </p>
                    <ul className="space-y-1 text-xs">
                      <li>• CSV (.csv)</li>
                      <li>• Excel (.xls, .xlsx)</li>
                    </ul>
                    <p className="mt-2 text-xs font-semibold">
                      {t.importRequiredColumnsTitle || 'Required columns'}
                    </p>
                    <p className="text-xs">
                      {t.importRequiredColumnsList ||
                        'name, description, unitPrice, cost, quantity'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            {importResult ? t.closeLabel || 'Close' : dictionary.common.cancel}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={mutation.isPending || !selectedFile}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.importing || 'Importing...'}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t.import || 'Import'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
