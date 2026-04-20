'use client';

import {
  Calculator,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import { formatDate } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { AccountingJobResults } from '@/types/services';

interface JobResultsViewProps {
  results: AccountingJobResults;
  t: Dictionary['pages']['businessAccountant'];
  lang: Locale;
  formatCurrency: (amount: number, currency?: string) => string;
  onClose: () => void;
}

export function JobResultsView({
  results,
  t,
  lang,
  formatCurrency,
  onClose,
}: JobResultsViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {formatDate(results.period_start, lang)} -{' '}
          {formatDate(results.period_end, lang)}
        </h2>
        <Button variant="outline" size="sm" onClick={onClose}>
          {t.close}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              {t.totalRevenue}
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(results.total_revenue)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              {t.totalExpenses}
            </CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(results.total_expenses)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-blue-500" />
              {t.netProfit}
            </CardDescription>
            <CardTitle
              className={`text-2xl ${results.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatCurrency(results.net_profit)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      {results.ai_insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {t.aiInsights}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {results.ai_insights}
            </p>
          </CardContent>
        </Card>
      )}
      {results.recommendations && results.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.recommendations}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
