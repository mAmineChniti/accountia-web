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
  FileText,
  ChevronDown,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { ProductsService } from '@/lib/requests';
import { Chatbot } from '@/components/Business/Chatbot';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import {
  type Product,
  type ProductListResponse,
  type StockInsightsResponse,
} from '@/types/services';
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
const sanitizeCsvValue = (value: string | number): string => {
  if (typeof value === 'number') return value.toString();
  let sanitized = String(value);
  // Escape formula injection
  if (/^[+=@\-]/.test(sanitized)) {
    sanitized = "'" + sanitized;
  }
  // Escape quotes by doubling them and wrap in quotes
  sanitized = '"' + sanitized.replaceAll('"', '""') + '"';
  return sanitized;
};

export function BusinessProducts({
  businessId,
  lang,
  dictionary,
}: {
  businessId: string;
  lang: Locale;
  dictionary: Dictionary;
}) {
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

  const {
    data: stockInsightsData,
    isLoading: isStockInsightsLoading,
    isError: isStockInsightsError,
  } = useQuery({
    queryKey: ['product-stock-insights', businessId],
    queryFn: () => ProductsService.getStockInsights(businessId),
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: Boolean(businessId),
  });

  const stockInsights = stockInsightsData as StockInsightsResponse | undefined;

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      ProductsService.deleteProduct(
        id,
        businessId || productToDelete!.businessId
      ),
    onSuccess: () => {
      toast.success(t.deleteSuccess);
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
      toast.error(err.message || t.deleteError);
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

  const prioritizedInsights = useMemo(() => {
    if (!stockInsights?.items) {
      return [];
    }

    const rank: Record<'LOW' | 'MEDIUM' | 'HIGH', number> = {
      HIGH: 0,
      MEDIUM: 1,
      LOW: 2,
    };

    return [...stockInsights.items]
      .toSorted((a, b) => {
        const riskOrder = rank[a.riskLevel] - rank[b.riskLevel];
        if (riskOrder !== 0) {
          return riskOrder;
        }

        const aDays = a.estimatedDaysUntilStockout ?? Number.POSITIVE_INFINITY;
        const bDays = b.estimatedDaysUntilStockout ?? Number.POSITIVE_INFINITY;
        return aDays - bDays;
      })
      .slice(0, 8);
  }, [stockInsights]);

  const urgentReorders = useMemo(
    () =>
      prioritizedInsights.filter(
        (item) =>
          item.riskLevel === 'HIGH' ||
          (item.estimatedDaysUntilStockout ?? Number.POSITIVE_INFINITY) <= 7
      ),
    [prioritizedInsights]
  );

  const riskExposurePercent =
    stockInsights && stockInsights.summary.totalProducts > 0
      ? ((stockInsights.summary.highRiskCount +
          stockInsights.summary.mediumRiskCount) /
          stockInsights.summary.totalProducts) *
        100
      : 0;

  // Export to CSV
  const exportToCSV = () => {
    if (products.length === 0) return;

    const headers = [
      t.columnId,
      t.columnName,
      t.columnDescription,
      t.columnUnitPrice,
      t.columnCost,
      t.columnQuantity,
      t.columnCreatedAt,
    ].map((h) => sanitizeCsvValue(h));

    const rows = filteredProducts.map((p) => [
      sanitizeCsvValue(String(p.id)),
      sanitizeCsvValue(p.name),
      sanitizeCsvValue(p.description),
      sanitizeCsvValue(String(p.unitPrice)),
      sanitizeCsvValue(String(p.cost)),
      sanitizeCsvValue(String(p.quantity)),
      sanitizeCsvValue(String(p.createdAt)),
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `products_${businessId || 'global'}_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.append(link);
    link.click();
    link.remove();
  };

  // Export to PDF
  const exportToPDF = () => {
    if (products.length === 0) return;

    const doc = new jsPDF();
    const tableColumn = [
      t.productNameLabel,
      t.descriptionLabel,
      t.unitPriceLabel,
      t.costPriceLabel,
      t.initialQuantityLabel,
    ];
    const tableRows: Array<string | number>[] = [];

    for (const p of filteredProducts) {
      const productData = [
        p.name,
        p.description.length > 50
          ? p.description.slice(0, 50) + '...'
          : p.description,
        `${p.unitPrice.toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${p.currency}`,
        `${p.cost.toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${p.currency}`,
        p.quantity.toString(),
      ];
      tableRows.push(productData);
    }

    // Brand Header
    doc.setFontSize(22);
    doc.setTextColor(138, 34, 34); // Primary Maroon color from Accountia theme
    doc.text('Accountia', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    const reportTitle = businessId ? `${t.title} - Business Rapport` : t.title;
    doc.text(reportTitle, 14, 28);

    doc.setDrawColor(230, 230, 230);
    doc.line(14, 32, 196, 32);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: {
        fontSize: 10,
        cellPadding: 4,
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [138, 34, 34], // Primary color
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      margin: { top: 40 },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(9);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const footerText = `Page ${i} of ${pageCount}`;
      const dateText = `Generated on ${new Date().toLocaleString()}`;
      doc.text(footerText, 196 - doc.getTextWidth(footerText), 285);
      doc.text(dateText, 14, 285);
    }

    doc.save(
      `products_${businessId || 'global'}_${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  if (error) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg p-4">
          <AlertCircle className="h-5 w-5" />
          <div className="text-sm">{t.errorLoading}</div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {dictionary.common.retry}
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
            {businessId ? t.description : t.adminSubtitle}
          </p>
        </div>
        {businessId && (
          <CreateProductDialog
            businessId={businessId}
            dictionary={dictionary}
          />
        )}
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list">{t.tabs?.list || 'List'}</TabsTrigger>
          <TabsTrigger value="ai-insights">
            {t.tabs?.insights || 'AI Insights'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
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
                    onClick={exportToCSV}
                    className="cursor-pointer gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    {t.exportCSV}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={exportToPDF}
                    className="cursor-pointer gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    {t.exportPDF}
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
          <Card className="dark:bg-card/90 mt-6 border-0 bg-white/90 shadow-sm">
            <CardHeader className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{t.title}</h2>
                <p className="text-muted-foreground text-sm">
                  {isLoading
                    ? '...'
                    : `${productsData?.total ?? filteredProducts.length} ${t.productsList}`}
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
                            {product.unitPrice.toLocaleString(lang, {
                              minimumFractionDigits: 2,
                            })}{' '}
                            {product.currency}
                          </TableCell>
                          <TableCell className="text-right font-medium text-orange-600 dark:text-orange-400">
                            {product.cost.toLocaleString(lang, {
                              minimumFractionDigits: 2,
                            })}{' '}
                            {product.currency}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={cn(
                                'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                                product.quantity > 10
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              )}
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
                                  {t.deleteProduct}
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
        </TabsContent>

        <TabsContent value="ai-insights">
          {/* Dashboard IA déplacé ici */}
          <Card className="dark:bg-card/90 border-0 bg-white/90 shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">
                  {t.stockInsights?.title || 'AI Stock Insights'}
                </h2>
                {stockInsights && (
                  <span className="text-muted-foreground text-xs">
                    {t.stockInsights?.lastUpdated?.replace(
                      '{date}',
                      new Date(stockInsights.generatedAt).toLocaleString(lang)
                    ) ||
                      `Updated: ${new Date(stockInsights.generatedAt).toLocaleString()}`}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {t.stockInsights?.description ||
                  'Local AI operational board for stockout risk, reorder planning, and weekly purchasing priorities.'}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {isStockInsightsLoading ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : isStockInsightsError ? (
                <div className="bg-destructive/10 text-destructive flex items-center gap-3 rounded-lg p-4">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">
                    {t.stockInsights?.errorState ||
                      'Failed to load stock insights.'}
                  </p>
                </div>
              ) : !stockInsights || prioritizedInsights.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t.stockInsights?.emptyState ||
                    'No stock insights available for this business yet.'}
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="rounded-xl border bg-red-500/5 p-4">
                      <p className="text-muted-foreground text-xs">
                        {t.stockInsights?.criticalReorders ||
                          'Critical reorders'}
                      </p>
                      <p className="text-2xl font-semibold">
                        {stockInsights.summary.highRiskCount}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {t.stockInsights?.immediateAction || 'Immediate action'}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-amber-500/5 p-4">
                      <p className="text-muted-foreground text-xs">
                        {t.stockInsights?.thisWeekQueue || 'This week queue'}
                      </p>
                      <p className="text-2xl font-semibold">
                        {urgentReorders.length}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {t.stockInsights?.planPurchasing ||
                          'Plan purchasing cycle'}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-emerald-500/5 p-4">
                      <p className="text-muted-foreground text-xs">
                        {t.stockInsights?.healthyProducts || 'Healthy products'}
                      </p>
                      <p className="text-2xl font-semibold">
                        {stockInsights.summary.lowRiskCount}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {t.stockInsights?.noUrgentReorder ||
                          'No urgent reorder'}
                      </p>
                    </div>
                    <div className="bg-primary/5 rounded-xl border p-4">
                      <p className="text-muted-foreground text-xs">
                        {t.stockInsights?.riskExposure || 'Risk exposure'}
                      </p>
                      <p className="text-2xl font-semibold">
                        {riskExposurePercent.toFixed(1)}%
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {t.stockInsights?.unitsToReorder?.replace(
                          '{count}',
                          stockInsights.summary.totalRecommendedUnits.toString()
                        ) ||
                          `+ ${stockInsights.summary.totalRecommendedUnits} units to reorder`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <div className="space-y-3 rounded-xl border p-4 xl:col-span-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">
                          {t.stockInsights?.stockoutTimeline ||
                            'Stockout timeline'}
                        </h3>
                        <span className="text-muted-foreground text-xs">
                          {t.stockInsights?.horizon?.replace(
                            '{days}',
                            stockInsights.planningHorizonDays.toString()
                          ) || `horizon ${stockInsights.planningHorizonDays}d`}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {prioritizedInsights.slice(0, 5).map((item) => {
                          const rawDays =
                            item.estimatedDaysUntilStockout ??
                            stockInsights.planningHorizonDays;
                          const progress = Math.max(
                            0,
                            Math.min(
                              100,
                              (rawDays / stockInsights.planningHorizonDays) *
                                100
                            )
                          );

                          return (
                            <div key={item.productId} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">
                                  {item.productName}
                                </span>
                                <span className="text-muted-foreground">
                                  {item.estimatedDaysUntilStockout === null
                                    ? t.stockInsights?.noStockoutTrend ||
                                      'No stockout trend'
                                    : t.stockInsights?.days?.replace(
                                        '{days}',
                                        item.estimatedDaysUntilStockout.toString()
                                      ) ||
                                      `${item.estimatedDaysUntilStockout} days`}
                                </span>
                              </div>
                              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                                <div
                                  className={cn(
                                    'h-2 rounded-full',
                                    item.riskLevel === 'HIGH' && 'bg-red-500',
                                    item.riskLevel === 'MEDIUM' &&
                                      'bg-yellow-500',
                                    item.riskLevel === 'LOW' && 'bg-green-500'
                                  )}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border p-4 xl:col-span-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">
                          {t.stockInsights?.actionQueue || 'Action queue'}
                        </h3>
                        <span className="text-muted-foreground text-xs">
                          {t.stockInsights?.prioritizedByAi ||
                            'Prioritized by AI'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {prioritizedInsights.slice(0, 5).map((item) => (
                          <div
                            key={`${item.productId}-action`}
                            className="flex items-start justify-between gap-3 rounded-lg border p-3"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {item.productName}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {item.reason}
                              </p>
                              <p className="mt-1 text-xs font-medium">
                                {item.recommendation}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-xs font-medium',
                                  item.riskLevel === 'HIGH' &&
                                    'bg-red-500/15 text-red-700 dark:text-red-300',
                                  item.riskLevel === 'MEDIUM' &&
                                    'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300',
                                  item.riskLevel === 'LOW' &&
                                    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                )}
                              >
                                {item.riskLevel}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                Reorder {item.recommendedReorderQuantity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                t.confirmDelete
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Chat Assistant - Business Mode */}
      <Chatbot businessId={businessId} dictionary={dictionary} />
    </div>
  );
}
