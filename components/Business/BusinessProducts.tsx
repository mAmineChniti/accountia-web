'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Search,
  Loader2,
  AlertCircle,
  MoreVertical,
  Trash2,
  Download,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
// These were removed because they were unused according to ESLint: FileText, jsPDF, autoTable
import * as XLSX from 'xlsx';

import { type Dictionary } from '@/get-dictionary';
import { ProductsService } from '@/lib/requests';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { type Product, type ProductListResponse } from '@/types/services';
import { CreateProductDialog } from './CreateProductDialog';
import { EditProductDialog } from './EditProductDialog';
import { ImportProductsDialog } from './ImportProductsDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Sanitize CSV values to prevent formula injection and escape quotes

// Utility to strip markdown characters - Moved to outer scope to satisfy unicorn/consistent-function-scoping
const cleanMarkdown = (text: string): string => {
  return text
    .replaceAll(/[#*`~]/g, '') // Remove basic markdown symbols
    .replaceAll(/\[([^\]]+)]\([^)]+\)/g, '$1') // Extract text from links
    .replaceAll(/^[*+-]\s+/gm, '• ') // Standardize bullets
    .trim();
};

export function BusinessProducts({
  businessId,
  dictionary,
  lang,
}: {
  businessId: string;
  dictionary: Dictionary;
  lang: string;
}) {
  console.log('[BusinessProducts] Lang:', lang);
  console.log(
    '[BusinessProducts] Title Key:',
    dictionary.pages.businessProducts.aiAnalysisSectionTitle
  );
  const queryClient = useQueryClient();
  const t = dictionary.pages.businessProducts;
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [productToDelete, setProductToDelete] = useState<Product | undefined>();
  const pageSize = 10;

  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'business-products',
      businessId,
      currentPage,
      pageSize,
      searchQuery,
    ],
    queryFn: () =>
      ProductsService.getProducts(
        currentPage,
        pageSize,
        businessId,
        searchQuery
      ),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      ProductsService.deleteProduct(
        id,
        businessId || productToDelete!.businessId
      ),
    onSuccess: () => {
      toast.success(t.deleteSuccess || 'Product deleted successfully');
      queryClient.invalidateQueries({
        queryKey: [
          'business-products',
          businessId || productToDelete!.businessId,
        ],
      });
      if (!businessId) {
        queryClient.invalidateQueries({ queryKey: ['business-products', ''] });
      }
      setProductToDelete(undefined);
    },
    onError: (error: unknown) => {
      const err = error as Error;
      toast.error(err.message || t.deleteError || 'Failed to delete product');
    },
  });

  const products = useMemo(
    () => (productsData as ProductListResponse)?.products ?? [],
    [productsData]
  );

  const totalPages = productsData
    ? Math.ceil((productsData as ProductListResponse).total / pageSize)
    : 1;

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p: Product) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Export to AI Report (Excel/CSV)
  const exportToAiCSV = async () => {
    if (products.length === 0) return;

    const loadingToast = toast.loading('Generating AI analysis for report...');

    try {
      // Fetch all products (bypass the 10-item pagination constraint) for the export
      const allProductsRes = await ProductsService.getProducts(
        1,
        10_000,
        businessId,
        searchQuery
      );
      const allProductsList = allProductsRes.products || [];

      const { summary } = await ProductsService.generateAiReport(
        businessId,
        lang
      );
      const cleanedSummary = cleanMarkdown(summary);

      // Prepare data for Excel using ALL products
      const rows = allProductsList.map((p) => ({
        [t.columnName || 'Name']: p.name,
        [t.columnDescription || 'Description']: p.description,
        [t.columnUnitPrice || 'Unit Price']:
          `${p.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND`,
        [t.columnCost || 'Cost']:
          `${p.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND`,
        [t.columnQuantity || 'Quantity']: p.quantity,
      }));

      // Create a worksheet
      const wb = XLSX.utils.book_new();

      // We'll create a single sheet with the summary at the top and table below
      const headerSection = [
        ['ACCOUNTIA - IA BUSINESS REPORT'],
        [`Generated on: ${new Date().toLocaleString()}`],
        [],
        ['STRATEGIC ANALYSIS SUMMARY'],
        [cleanedSummary],
        [],
        ['PRODUCT INVENTORY DETAILS'],
      ];

      const ws = XLSX.utils.aoa_to_sheet(headerSection);

      // Append products data starting after the header section
      XLSX.utils.sheet_add_json(ws, rows, { origin: 'A8', skipHeader: false });

      // Apply some basic column width styling
      ws['!cols'] = [
        { wch: 30 }, // Name
        { wch: 50 }, // Description
        { wch: 15 }, // Unit Price
        { wch: 15 }, // Cost
        { wch: 10 }, // Quantity
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'IA Report');

      // Export to XLSX (opens perfectly in Excel)
      XLSX.writeFile(
        wb,
        `IA_Report_${businessId}_${new Date().toISOString().split('T')[0]}.xlsx`
      );

      toast.dismiss(loadingToast);
      toast.success('AI Report generated successfully!');
    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate AI report';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  // Export to AI Report
  const exportToAiPDF = async () => {
    if (products.length === 0) return;

    const loadingToast = toast.loading('Generating AI analysis...');

    try {
      const { summary } = await ProductsService.generateAiReport(
        businessId,
        lang
      );

      const isArabic = lang === 'ar';

      // 1. Process Markdown smartly into HTML
      const mdLines = summary.split('\n');
      let renderedMarkdown = '';
      let inList = false;

      for (const rawLine of mdLines) {
        let line = rawLine.trim();
        if (!line) {
          if (inList) {
            renderedMarkdown += '</ul>';
            inList = false;
          }
          renderedMarkdown += '<div style="height: 12px;"></div>';
          continue;
        }

        // Fix bold tags
        line = line.replaceAll(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Lists
        if (line.startsWith('* ') || line.startsWith('- ')) {
          if (!inList) {
            renderedMarkdown += `<ul style="margin-top: 8px; margin-bottom: 8px; padding-inline-start: 24px; list-style-type: disc;">`;
            inList = true;
          }
          renderedMarkdown += `<li>${line.slice(2)}</li>`;
        } else {
          if (inList) {
            renderedMarkdown += '</ul>';
            inList = false;
          }
          renderedMarkdown += `<p style="margin: 0 0 8px 0;">${line}</p>`;
        }
      }
      if (inList) renderedMarkdown += '</ul>';

      // Fetch all products (bypass the 10-item pagination constraint) for the export
      const allProductsRes = await ProductsService.getProducts(
        1,
        10_000,
        businessId,
        searchQuery
      );
      const allProductsList = allProductsRes.products || [];

      // 2. Build the table rows HTML dynamically
      const tableHeadersHtml = `
         <tr>
           <th>${t.columnName || 'Name'}</th>
           <th>${t.columnDescription || 'Description'}</th>
           <th style="text-align: end;">${t.columnUnitPrice || 'Unit Price'}</th>
           <th style="text-align: end;">${t.columnCost || 'Cost Price'}</th>
           <th style="text-align: end;">${t.columnQuantity || 'Quantity'}</th>
         </tr>
      `;

      const tableBodyHtml = allProductsList
        .map(
          (p: Product, i: number) => `
         <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#fafafa'};">
           <td>${p.name}</td>
           <td>${p.description.length > 50 ? p.description.slice(0, 50) + '...' : p.description}</td>
           <td style="text-align: end;">${p.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND</td>
           <td style="text-align: end;">${p.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })} TND</td>
           <td style="text-align: end;">${p.quantity}</td>
         </tr>
      `
        )
        .join('');

      // 3. Build the final beautiful HTML document
      const htmlContent = `
         <!DOCTYPE html>
         <html lang="${isArabic ? 'ar' : lang || 'en'}" dir="${isArabic ? 'rtl' : 'ltr'}">
         <head>
           <meta charset="UTF-8">
           <title>Accountia - IA Report</title>
           <style>
             @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap');
             body { 
               font-family: ${isArabic ? "'Cairo', sans-serif" : "'Inter', sans-serif"}; 
               color: #222; 
               margin: 0; 
               padding: 40px; 
               line-height: 1.6;
             }
             .header-title { color: #8a2222; font-size: 28px; font-weight: 700; margin-bottom: 5px; }
             .sub-title { color: #555; font-size: 16px; margin-top: 0; padding-bottom: 15px; border-bottom: 2px solid #eaeaea; }
             
             table { 
               width: 100%; 
               border-collapse: collapse; 
               margin-top: 25px; 
               margin-bottom: 40px; 
               font-size: 13px; 
             }
             th, td { 
               border: 1px solid #e0e0e0; 
               padding: 10px 14px; 
               text-align: start; 
             }
             th { 
               background-color: #fcebeb; 
               color: #8a2222; 
               font-weight: 700; 
             }
             
             .ai-section { 
               background-color: #fdfafb; 
               padding: 25px 30px; 
               border-radius: 8px; 
               border-${isArabic ? 'right' : 'left'}: 5px solid #8a2222; 
               margin-top: 30px;
               page-break-inside: avoid;
             }
             .ai-title { 
               color: #8a2222; 
               font-size: 20px; 
               font-weight: 700; 
               margin-top: 0; 
               margin-bottom: 16px;
             }
             strong { color: #111; font-weight: 700; }
             
             @media print {
                body { padding: 0; }
                .ai-section { border: 1px solid #f0f0f0; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                thead { display: table-header-group; }
             }
           </style>
         </head>
         <body>
           <div class="header-title">Accountia</div>
           <div class="sub-title">${t.aiReportPdfHeader || 'IA Business Report & Inventory Analysis'}</div>
           
           <table>
             <thead>${tableHeadersHtml}</thead>
             <tbody>${tableBodyHtml}</tbody>
           </table>

           <div class="ai-section">
              <h3 class="ai-title">${t.aiAnalysisSectionTitle || 'Intelligence Artificielle - Analyse'}</h3>
              <div style="font-size: 14px; color: #444;">
                 ${renderedMarkdown}
              </div>
           </div>
           
           <${'script'}>
             window.onload = function() {
                // Wait briefly for the web fonts (Cairo/Inter) to load before triggering print
                setTimeout(function() {
                  window.print();
                }, 800);
             }
           </${'script'}>
         </body>
         </html>
      `;

      toast.dismiss(loadingToast);

      // 4. Open an invisible (or visible new tab) to render HTML and ask user to Save as PDF
      const printWindow = window.open('', '', 'width=900,height=800');
      if (printWindow) {
        printWindow.document.open();
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        toast.error('Veuillez autoriser les pop-ups pour afficher le rapport.');
      }

      toast.success('AI Report generated successfully!');
      toast.success('AI Report generated successfully!');
    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate AI report';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg p-4">
          <AlertCircle className="h-5 w-5" />
          <div className="text-sm">{t.errorLoading}</div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-muted-foreground">
            {businessId
              ? t.description
              : t.adminSubtitle || 'Manage products across all businesses'}
          </p>
        </div>
        {businessId && (
          <CreateProductDialog
            businessId={businessId}
            dictionary={dictionary}
          />
        )}
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t.searchPlaceholder}
            className="pl-9"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                {t.export}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={exportToAiCSV}
                className="text-primary cursor-pointer gap-2 font-semibold"
              >
                <Sparkles className="text-primary h-4 w-4" />
                {t.aiReportCSV || 'IA Report (CSV)'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportToAiPDF}
                className="text-primary cursor-pointer gap-2 font-semibold"
              >
                <Sparkles className="text-primary h-4 w-4" />
                {t.aiReportPDF || 'IA Report (PDF)'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {businessId && (
            <ImportProductsDialog
              businessId={businessId}
              dictionary={dictionary}
            />
          )}
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
        <CardHeader className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{t.title || 'Products'}</h2>
            <p className="text-muted-foreground text-sm">
              {isLoading
                ? '...'
                : `${productsData?.total ?? filteredProducts.length} ${t.productsList || 'products'}`}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 border-b hover:bg-transparent">
                    <TableHead className="text-foreground font-semibold">
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                    <TableHead className="text-foreground font-semibold">
                      <Skeleton className="h-4 w-24" />
                    </TableHead>
                    <TableHead className="text-foreground text-right font-semibold">
                      <Skeleton className="ml-auto h-4 w-20" />
                    </TableHead>
                    <TableHead className="text-foreground text-right font-semibold">
                      <Skeleton className="ml-auto h-4 w-20" />
                    </TableHead>
                    <TableHead className="text-foreground text-right font-semibold">
                      <Skeleton className="ml-auto h-4 w-16" />
                    </TableHead>
                    <TableHead className="text-destructive w-12 text-right font-semibold">
                      <Skeleton className="ml-auto h-4 w-8" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="group hover:bg-muted/50">
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-12" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-8" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Package className="text-muted-foreground h-12 w-12 opacity-50" />
              <div>
                <p className="text-lg font-medium">{t.noProducts}</p>
                <p className="text-muted-foreground text-sm">
                  {t.noProductsHint}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 border-b hover:bg-transparent">
                    <TableHead className="text-foreground font-semibold">
                      {t.columnName}
                    </TableHead>
                    <TableHead className="text-foreground hidden font-semibold md:table-cell">
                      {t.columnDescription}
                    </TableHead>
                    <TableHead className="text-foreground text-right font-semibold">
                      {t.columnUnitPrice}
                    </TableHead>
                    <TableHead className="text-foreground text-right font-semibold">
                      {t.columnCost}
                    </TableHead>
                    <TableHead className="text-foreground text-right font-semibold">
                      {t.columnQuantity}
                    </TableHead>
                    <TableHead className="w-[50px] font-semibold"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: Product) => (
                    <TableRow
                      key={product.id}
                      className="group hover:bg-primary/5 border-border/30 border-b transition-colors"
                    >
                      <TableCell className="text-foreground font-semibold">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden max-w-xs truncate md:table-cell">
                        {product.description}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {product.unitPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}{' '}
                        TND
                      </TableCell>
                      <TableCell className="text-right font-medium text-orange-600 dark:text-orange-400">
                        {product.cost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}{' '}
                        TND
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                            product.quantity > 10
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {product.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-100 transition-opacity group-focus-within:opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              aria-label={`More actions for ${product.name}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <EditProductDialog
                              businessId={businessId}
                              product={product}
                              dictionary={dictionary}
                            />
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer gap-2"
                              onClick={() => setProductToDelete(product)}
                            >
                              <Trash2 className="h-4 w-4" />{' '}
                              {t.deleteProduct || 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    {t.previous}
                  </Button>
                  <span className="text-sm">
                    {t.page
                      .replace('{page}', currentPage.toString())
                      .replace('{totalPages}', totalPages.toString())}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    {t.next}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={productToDelete !== undefined}
        onOpenChange={(open) => !open && setProductToDelete(undefined)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              {t.deleteConfirmTitle}
            </DialogTitle>
            <DialogDescription className="py-4">
              {t.deleteConfirmDescriptionWithName.replace(
                '{name}',
                productToDelete?.name || ''
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setProductToDelete(undefined)}
              disabled={deleteMutation.isPending}
            >
              {dictionary.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                productToDelete && deleteMutation.mutate(productToDelete.id)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t.confirmDelete || 'Delete Product'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
