'use client';

import { type ChangeEvent, type ReactNode, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { type Dictionary } from '@/get-dictionary';
import { ProductsService } from '@/lib/requests';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImportProductsDialogProps {
  businessId: string;
  dictionary: Dictionary;
  trigger?: ReactNode;
}

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
  const queryClient = useQueryClient();
  const t = dictionary.pages.businessProducts;

  const mutation = useMutation({
    mutationFn: (file: File) =>
      ProductsService.importProducts(file, businessId),
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({
        queryKey: ['business-products', businessId],
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
    setSelectedFile(file);
    setImportResult(undefined);
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast.error(t.importSelectFile || 'Please select a file to import');
      return;
    }

    mutation.mutate(selectedFile);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <DialogTitle>{t.importProducts || 'Import Products'}</DialogTitle>
          <DialogDescription>
            {t.importProductsDescription ||
              'Upload a CSV or Excel file with columns: name, description, unitPrice, cost, quantity.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="product-import-file">
              {t.fileLabel || 'Product file'}
            </Label>
            <Input
              id="product-import-file"
              type="file"
              accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleFileChange}
            />
            <p className="text-muted-foreground text-sm">
              {t.importFileHint ||
                'Supported formats: CSV, XLSX, XLS. Required columns: name, description, unitPrice, cost, quantity.'}
            </p>
          </div>

          {importResult && (
            <div className="border-border bg-muted rounded-lg border p-4 text-sm">
              <p className="font-semibold">
                {t.importResult || 'Import result'}
              </p>
              <p>
                {t.importedCount || 'Imported'}: {importResult.imported}
              </p>
              <p>
                {t.failedCount || 'Failed'}: {importResult.failed}
              </p>
              {importResult.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="font-semibold">{t.importErrors || 'Errors'}:</p>
                  <ul className="text-destructive list-disc pl-5 text-xs">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={mutation.isPending}
          >
            {dictionary.common.cancel}
          </Button>
          <Button onClick={handleImport} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.importing || 'Importing...'}
              </>
            ) : (
              t.import || 'Import'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
