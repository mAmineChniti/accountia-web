'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { type Locale } from '@/i18n-config';
import { BusinessService } from '@/lib/requests';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface BusinessStatisticsData {
  businessId: string;
  businessName: string;
  products: {
    totalProducts: number;
    totalValue: number;
    lowStockProducts: number;
  };
  invoices: {
    totalInvoices: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    paidInvoices: number;
    pendingInvoices: number;
    overdueInvoices: number;
  };
  lastUpdated: string;
}

const formatMoney = (amount: number) => `TND ${amount.toFixed(2)}`;

const textByLocale = {
  en: {
    fetchError: 'Failed to fetch statistics',
    noStatistics: 'No statistics data available',
    noData: 'No data yet. Create products and invoices to populate statistics.',
    productStats: 'Product Statistics',
    totalProducts: 'Total Products',
    totalValue: 'Total Value',
    lowStockProducts: 'Low Stock Products',
    lowStockHint: 'Products with less than 10 units',
    allInStockHint: 'All products in stock',
    invoiceStats: 'Invoice Statistics',
    totalInvoices: 'Total Invoices',
    paidInvoices: 'Paid Invoices',
    pendingInvoices: 'Pending Invoices',
    overdueInvoices: 'Overdue Invoices',
    businessOverview: 'Business Overview',
    productsVsInvoices: 'Products vs Invoices Comparison',
    count: 'Count',
    invoiceDistribution: 'Invoice Status Distribution',
    paidVsPendingVsOverdue: 'Paid vs Pending vs Overdue',
    paid: 'Paid',
    pending: 'Pending',
    overdue: 'Overdue',
    revenueSummary: 'Revenue Summary',
    byInvoiceStatus: 'By Invoice Status',
    lastUpdated: 'Last updated',
  },
  fr: {
    fetchError: 'Echec du chargement des statistiques',
    noStatistics: 'Aucune donnee statistique disponible',
    noData:
      'Aucune donnee pour le moment. Creez des produits et des factures pour alimenter les statistiques.',
    productStats: 'Statistiques des produits',
    totalProducts: 'Total des produits',
    totalValue: 'Valeur totale',
    lowStockProducts: 'Produits en stock faible',
    lowStockHint: 'Produits avec moins de 10 unites',
    allInStockHint: 'Tous les produits sont en stock',
    invoiceStats: 'Statistiques des factures',
    totalInvoices: 'Total des factures',
    paidInvoices: 'Factures payees',
    pendingInvoices: 'Factures en attente',
    overdueInvoices: 'Factures en retard',
    businessOverview: 'Vue d ensemble de l entreprise',
    productsVsInvoices: 'Comparaison Produits vs Factures',
    count: 'Nombre',
    invoiceDistribution: 'Repartition des statuts des factures',
    paidVsPendingVsOverdue: 'Payees vs En attente vs En retard',
    paid: 'Payees',
    pending: 'En attente',
    overdue: 'En retard',
    revenueSummary: 'Resume des revenus',
    byInvoiceStatus: 'Par statut de facture',
    lastUpdated: 'Derniere mise a jour',
  },
  ar: {
    fetchError: 'فشل تحميل الإحصائيات',
    noStatistics: 'لا توجد بيانات إحصائية متاحة',
    noData: 'لا توجد بيانات حاليا. قم بإنشاء منتجات وفواتير لعرض الإحصائيات.',
    productStats: 'إحصائيات المنتجات',
    totalProducts: 'إجمالي المنتجات',
    totalValue: 'القيمة الإجمالية',
    lowStockProducts: 'منتجات منخفضة المخزون',
    lowStockHint: 'منتجات أقل من 10 وحدات',
    allInStockHint: 'كل المنتجات متوفرة',
    invoiceStats: 'إحصائيات الفواتير',
    totalInvoices: 'إجمالي الفواتير',
    paidInvoices: 'الفواتير المدفوعة',
    pendingInvoices: 'الفواتير المعلقة',
    overdueInvoices: 'الفواتير المتأخرة',
    businessOverview: 'نظرة عامة على النشاط',
    productsVsInvoices: 'مقارنة المنتجات مقابل الفواتير',
    count: 'العدد',
    invoiceDistribution: 'توزيع حالات الفواتير',
    paidVsPendingVsOverdue: 'مدفوعة مقابل معلقة مقابل متأخرة',
    paid: 'مدفوعة',
    pending: 'معلقة',
    overdue: 'متأخرة',
    revenueSummary: 'ملخص الإيرادات',
    byInvoiceStatus: 'حسب حالة الفاتورة',
    lastUpdated: 'آخر تحديث',
  },
} as const;

function StatCard({
  title,
  value,
  subtitle,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const variantClasses = {
    default: 'bg-card border-border',
    success: 'bg-emerald-500/10 border-emerald-500/30',
    warning: 'bg-amber-500/10 border-amber-500/30',
    danger: 'bg-destructive/10 border-destructive/30',
  };

  return (
    <Card className={variantClasses[variant]}>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-foreground text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function BusinessStatistics({
  businessId,
  lang,
}: {
  businessId: string;
  lang: Locale;
}) {
  const [statistics, setStatistics] = useState<
    BusinessStatisticsData | undefined
  >();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const text = textByLocale[lang];

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(undefined);
        const data = await BusinessService.getBusinessStatistics(businessId);
        setStatistics(data);
      } catch (error_) {
        setError(error_ instanceof Error ? error_.message : text.fetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [businessId, text.fetchError]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!statistics) {
    return (
      <Alert>
        <AlertDescription>{text.noStatistics}</AlertDescription>
      </Alert>
    );
  }

  const hasNoData =
    statistics.products.totalProducts === 0 &&
    statistics.products.totalValue === 0 &&
    statistics.invoices.totalInvoices === 0;

  return (
    <div className="space-y-6">
      {hasNoData && (
        <Alert>
          <AlertDescription>{text.noData}</AlertDescription>
        </Alert>
      )}

      <div>
        <h2 className="mb-4 text-lg font-bold">{text.productStats}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            title={text.totalProducts}
            value={statistics.products.totalProducts}
          />
          <StatCard
            title={text.totalValue}
            value={formatMoney(statistics.products.totalValue)}
          />
          <StatCard
            title={text.lowStockProducts}
            value={statistics.products.lowStockProducts}
            variant={
              statistics.products.lowStockProducts > 0 ? 'warning' : 'default'
            }
            subtitle={
              statistics.products.lowStockProducts > 0
                ? text.lowStockHint
                : text.allInStockHint
            }
          />
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold">{text.invoiceStats}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={text.totalInvoices}
            value={statistics.invoices.totalInvoices}
          />
          <StatCard
            title={text.paidInvoices}
            value={statistics.invoices.paidInvoices}
            subtitle={formatMoney(statistics.invoices.paidAmount)}
            variant="success"
          />
          <StatCard
            title={text.pendingInvoices}
            value={statistics.invoices.pendingInvoices}
            subtitle={formatMoney(statistics.invoices.pendingAmount)}
          />
          <StatCard
            title={text.overdueInvoices}
            value={statistics.invoices.overdueInvoices}
            subtitle={formatMoney(statistics.invoices.overdueAmount)}
            variant={
              statistics.invoices.overdueInvoices > 0 ? 'danger' : 'default'
            }
          />
        </div>
      </div>

      {!hasNoData && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">
                {text.businessOverview}
              </CardTitle>
              <CardDescription>{text.productsVsInvoices}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: text.count,
                      products: statistics.products.totalProducts,
                      invoices: statistics.invoices.totalInvoices,
                    },
                  ]}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="products"
                    name={text.totalProducts}
                    fill="#10b981"
                  />
                  <Bar
                    dataKey="invoices"
                    name={text.totalInvoices}
                    fill="#3b82f6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">
                {text.invoiceDistribution}
              </CardTitle>
              <CardDescription>{text.paidVsPendingVsOverdue}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: text.paid,
                        value: statistics.invoices.paidInvoices,
                        fill: '#10b981',
                      },
                      {
                        name: text.pending,
                        value: statistics.invoices.pendingInvoices,
                        fill: '#f59e0b',
                      },
                      {
                        name: text.overdue,
                        value: statistics.invoices.overdueInvoices,
                        fill: '#ef4444',
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    dataKey="value"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{text.revenueSummary}</CardTitle>
              <CardDescription>{text.byInvoiceStatus}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      status: text.paid,
                      amount: statistics.invoices.paidAmount,
                    },
                    {
                      status: text.pending,
                      amount: statistics.invoices.pendingAmount,
                    },
                    {
                      status: text.overdue,
                      amount: statistics.invoices.overdueAmount,
                    },
                  ]}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="status"
                    stroke="var(--color-muted-foreground)"
                  />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value) => formatMoney(value as number)}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#3b82f6"
                    isAnimationActive={true}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="text-xs text-gray-500">
        {text.lastUpdated}:{' '}
        {new Date(statistics.lastUpdated).toLocaleString(lang)}
      </div>
    </div>
  );
}
