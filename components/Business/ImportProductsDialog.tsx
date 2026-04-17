'use client';

import { type ReactNode, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import FileUpload from '@/components/reusable/file-upload';
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
  const [importResult, setImportResult] = useState<
    | {
        imported: number;
        failed: number;
        errors: string[];
      }
    | undefined
  >();
  const [fileError, setFileError] = useState<string | undefined>();
  const queryClient = useQueryClient();
  const t = dictionary.pages.businessProducts;

  // Handle dialog open/close to reset state when closing
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset file and import state when dialog closes
      setSelectedFile(undefined);
      setImportResult(undefined);
      setFileError(undefined);
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
      toast.error(err.message || t.importError);
    },
  });

  const handleFileSelect = (file: File) => {
    if (isValidFile(file)) {
      setSelectedFile(file);
      setImportResult(undefined);
      setFileError(undefined);
    } else {
      setSelectedFile(undefined);
      setFileError(t.importInvalidType);
      toast.error(t.importInvalidType);
    }
  };

  const handleFileClear = () => {
    setSelectedFile(undefined);
    setFileError(undefined);
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast.error(t.importSelectFile);
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
            {t.importProducts}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {importResult ? t.importCompleteTitle : t.importProducts}
          </DialogTitle>
          <DialogDescription>
            {importResult
              ? t.importCompleteDescription
              : t.importProductsDescription}
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
              <p className="text-lg font-semibold">{t.importResult}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Card className="bg-green-50 dark:bg-green-950/30">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {importResult.imported}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        {t.importedCount}
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
                        {t.failedCount}
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
                    {t.importErrors}
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
            <FileUpload
              accept=".csv,.xls,.xlsx"
              maxSize={10}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              onFileClear={handleFileClear}
              disabled={mutation.isPending}
              isUploading={mutation.isPending}
              error={fileError}
              dictionary={dictionary}
            />

            <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
              <CardContent className="pt-5">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="mb-2 font-medium">{t.importFormatTitle}</p>
                    <ul className="space-y-1 text-xs">
                      <li>• CSV (.csv)</li>
                      <li>• Excel (.xls, .xlsx)</li>
                    </ul>
                    <p className="mt-2 text-xs font-semibold">
                      {t.importRequiredColumnsTitle}
                    </p>
                    <p className="text-xs">{t.importRequiredColumnsList}</p>
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
            {importResult ? t.closeLabel : dictionary.common.cancel}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={mutation.isPending || !selectedFile}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.importing}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t.import}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
