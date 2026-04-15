'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { type Locale } from '@/i18n-config';

// Define the shape of statistics we need
interface InsightProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  statistics: any;
  lang: Locale;
}

// Handle parsing markdown bold tags
const renderText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

export function AccountantInsight({ statistics, lang }: InsightProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [insightText, setInsightText] = useState<string | undefined>();
  const [displayedText, setDisplayedText] = useState<string>('');

  const formatMoney = (amount: number, currency: string = 'TND') =>
    new Intl.NumberFormat(lang, {
      style: 'currency',
      currency: currency,
    }).format(amount);

  // The algorithmic brain pretending to be an AI Accountant
  const generateAccountantInsight = () => {
    setIsGenerating(true);
    setInsightText(undefined);
    setDisplayedText('');

    const kpis = statistics.kpis;
    const invStats = statistics.invoiceStatistics;
    const salesTrend = statistics.salesAnalytics.salesTrend;
    const topProducts = statistics.salesAnalytics.topProducts;
    const underperformingProducts =
      statistics.salesAnalytics.underperformingProducts;

    const overdueAmount = invStats.overdueAmount;
    const pendingAmount = invStats.pendingAmount;
    const margin = kpis.profitMarginPercent;

    // Taxes simulation (Assuming 19% standard VAT for TND)
    const estimatedVatToPay = kpis.totalRevenue * 0.19;
    const estimatedVatDeductible = kpis.totalCOGS * 0.19;
    const netVatLiability = Math.max(
      0,
      estimatedVatToPay - estimatedVatDeductible
    );

    const isFrench = lang === 'fr';
    const isArabic = lang === 'ar';

    // Greeting
    let report = isFrench
      ? "👨‍💼 **Rapport de votre Comptable Approuvé**\n\nJ'ai analysé en détail vos registres financiers en temps réel. Voici mon bilan comptable et stratégique :\n\n"
      : isArabic
        ? '👨‍💼 **تقرير المحاسب المعتمد**\n\nلقد قمت بتحليل سجلاتك المالية بالتفصيل. إليك تقييمي المحاسبي والاستراتيجي:\n\n'
        : '👨‍💼 **Certified Accountant Report**\n\nI have thoroughly analyzed your real-time financial ledgers. Here is my accounting and strategic assessment:\n\n';

    // 1. Health & Margin
    let healthStatus = '';
    if (margin > 40) {
      healthStatus = isFrench
        ? '✅ Votre rentabilité opérationnelle est **excellente**.'
        : isArabic
          ? '✅ ربحيتك التشغيلية **ممتازة**.'
          : '✅ Your operational profitability is **excellent**.';
    } else if (margin > 20) {
      healthStatus = isFrench
        ? '✅ Votre rentabilité est **stable**.'
        : isArabic
          ? '✅ ربحيتك **مستقرة**.'
          : '✅ Your profitability is **stable**.';
    } else {
      healthStatus = isFrench
        ? '⚠️ Vos marges sont **critiques** et nécessitent un audit de vos coûts de production.'
        : isArabic
          ? '⚠️ هوامش الربح **حرجة** وتتطلب مراجعة تكاليف الإنتاج.'
          : '⚠️ Your margins are **critical** and require an audit of production costs.';
    }

    const tndSalesTrend =
      salesTrend === 'growth'
        ? isFrench
          ? 'croissance'
          : 'growth'
        : salesTrend === 'decline'
          ? isFrench
            ? 'baisse'
            : 'decline'
          : isFrench
            ? 'stagnation'
            : 'stagnation';

    report += isFrench
      ? `**1. Santé Financière & Rentabilité**\n${healthStatus} Le chiffre d'affaires s'établit à ${formatMoney(kpis.totalRevenue)} avec une marge brute pondérée de ${margin.toFixed(1)}%. Le volume de facturation montre une tendance de **${tndSalesTrend}**.\n\n`
      : isArabic
        ? `**1. الصحة المالية والربحية**\n${healthStatus} إجمالي الإيرادات يبلغ ${formatMoney(kpis.totalRevenue)} بهامش ربح ${margin.toFixed(1)}%. حجم الفواتير يظهر اتجاه **${tndSalesTrend}**.\n\n`
        : `**1. Financial Health & Profitability**\n${healthStatus} Total revenue stands at ${formatMoney(kpis.totalRevenue)} with a weighted gross margin of ${margin.toFixed(1)}%. Invoicing volume shows a trend of **${tndSalesTrend}**.\n\n`;

    // 2. Cash Flow & Invoices
    const atRisk = overdueAmount > 0;
    report += isFrench
      ? '**2. Trésorerie & BFR (Besoin en Fonds de Roulement)**\n'
      : isArabic
        ? '**2. التدفق النقدي ورأس المال العامل**\n'
        : '**2. Cash Flow & Working Capital**\n';

    if (atRisk) {
      const riskRatio = (
        (overdueAmount / (kpis.totalRevenue || 1)) *
        100
      ).toFixed(1);
      report += isFrench
        ? `🚨 **Alerte liquidité :** Créances douteuses de **${formatMoney(overdueAmount)}** (${riskRatio}% des revenus). Je vous conseille le déclenchement immédiat du processus de recouvrement.`
        : isArabic
          ? `🚨 **تنبيه السيولة:** فواتير متأخرة بقيمة **${formatMoney(overdueAmount)}** (${riskRatio}% من الإيرادات). أنصح بالبدء فوراً في إجراءات التحصيل.`
          : `🚨 **Liquidity Alert:** Doubtful receivables of **${formatMoney(overdueAmount)}** (${riskRatio}% of revenues). I strongly advise immediate initiation of the collection process.`;
    } else {
      report += isFrench
        ? `✅ **Couverture optimale :** Aucune créance en souffrance. Vos encours clients s'élèvent sainement à ${formatMoney(pendingAmount)}.`
        : isArabic
          ? `✅ **تغطية مثالية:** لا توجد ديون مستحقة. الحسابات المدينة تبلغ ${formatMoney(pendingAmount)}.`
          : `✅ **Optimal Leverage:** Zero overdue receivables. Your pending accounts receivable stand healthily at ${formatMoney(pendingAmount)}.`;
    }
    report += '\n\n';

    // 3. Fiscality (Taxes)
    report += isFrench
      ? '**3. Bilan Fiscal Estimatif (TVA)**\n'
      : isArabic
        ? '**3. التقدير الضريبي (ضريبة القيمة المضافة)**\n'
        : '**3. Estimated Fiscal & Tax Liability (VAT)**\n';
    report += isFrench
      ? `🏛 Basé sur les normes fiscales courantes (19%), vous devez anticiper environ **${formatMoney(netVatLiability)}** de déclaration de TVA nette, après déduction des charges (${formatMoney(estimatedVatDeductible)} de TVA récupérable). Provisionnez ce montant.`
      : isArabic
        ? `🏛 بناءً على المعايير الضريبية (19٪)، يجب أن تتوقع حوالي **${formatMoney(netVatLiability)}** من ضريبة القيمة المضافة الصافية، بعد خصم المصروفات (${formatMoney(estimatedVatDeductible)} ضريبة القيمة المضافة القابلة للاسترداد). خصص هذا المبلغ.`
        : `🏛 Based on standard tax brackets (19%), you should forecast approximately **${formatMoney(netVatLiability)}** in net VAT liability, after deduction of expenses (${formatMoney(estimatedVatDeductible)} recoverable VAT). Provision this amount immediately.`;
    report += '\n\n';

    // 4. Action Items
    report += isFrench
      ? '**4. Interventions Conseillées par votre Comptable**\n'
      : isArabic
        ? '**4. الإجراءات الموصى بها**\n'
        : "**4. Accountant's Recommended Actions**\n";

    // Action 1
    if (topProducts && topProducts.length > 0) {
      report += isFrench
        ? `- 📌 **Optimisation :** Réinvestissez 15% de vos bénéfices dans la promotion du produit *${topProducts[0].productName}* qui tire l'entreprise vers le haut.\n`
        : isArabic
          ? `- 📌 **التحسين:** أعد استثمار 15٪ من أرباحك في الترويج لـ *${topProducts[0].productName}* الذي يرفع مستوى الشركة.\n`
          : `- 📌 **Optimization:** Reinvest 15% of your retained earnings into marketing *${topProducts[0].productName}* which drives maximum ROI.\n`;
    }

    // Action 2
    if (underperformingProducts && underperformingProducts.length > 0) {
      report += isFrench
        ? `- ✂️ **Réduction des coûts :** Renégociez d'urgence les coûts fournisseurs pour l'article *${underperformingProducts[0].productName}*, sa marge pèse lourdement sur vos bilans.\n`
        : isArabic
          ? `- ✂️ **خفض التكاليف:** أعد التفاوض فوراً على تكاليف الموردين لـ *${underperformingProducts[0].productName}*.\n`
          : `- ✂️ **Cost Cutting:** Urgently negotiate supplier costs for *${underperformingProducts[0].productName}*, its margin is creating a bottleneck on the balance sheets.\n`;
    }

    // Action 3
    if (pendingAmount > 0) {
      report += isFrench
        ? `- 💸 **Trésorerie :** Préparez un e-mail de rappel amical pour vos ${formatMoney(pendingAmount)} de factures en cours (non-échues).`
        : isArabic
          ? `- 💸 **السيولة:** قم بتجهيز بريد تذكيري ودي لفواتيرك المعلقة بقيمة ${formatMoney(pendingAmount)}.`
          : `- 💸 **Liquidity:** Prepare polite automated reminders for the ${formatMoney(pendingAmount)} of pending unmatured invoices.`;
    }

    // Simulate thinking delay
    setTimeout(() => {
      setInsightText(report);
      setIsGenerating(false);
    }, 1500);
  };

  // Simulate typing effect
  useEffect(() => {
    if (insightText) {
      setDisplayedText('');
      let currentText = '';
      let currentIndex = 0;

      const interval = setInterval(() => {
        if (currentIndex < insightText.length) {
          currentText += insightText[currentIndex];
          setDisplayedText(currentText);
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 15); // Typings speed

      return () => clearInterval(interval);
    }
  }, [insightText]);

  return (
    <Card className="bg-card/90 overflow-hidden border-0 shadow-sm xl:col-span-12">
      <CardHeader className="bg-amber-500/5 pb-4 dark:bg-amber-900/10">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-amber-700 dark:text-amber-500">
              <FileText className="h-5 w-5" />
              {lang === 'fr'
                ? 'AI Comptable & Analyse Stratégique'
                : 'AI Accountant Strategy & Analysis'}
            </CardTitle>
            <CardDescription className="mt-1">
              {lang === 'fr'
                ? 'Générez un rapport financier expert interactif basé sur toutes vos statistiques (Comptabilité, Trésorerie, Ventes) de façon entièrement automatisée et privée.'
                : 'Generate an expert interactive financial report based on all your statistics (Accounting, Cash Flow, Sales) entirely locally and privately.'}
            </CardDescription>
          </div>

          <Button
            onClick={generateAccountantInsight}
            disabled={isGenerating || !!insightText}
            variant="default"
            className="flex-shrink-0 bg-amber-600 hover:bg-amber-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {lang === 'fr' ? 'Analyse en cours...' : 'Analyzing books...'}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {lang === 'fr'
                  ? 'Générer le rapport'
                  : 'Generate Accountant Report'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {(isGenerating || insightText) && (
        <CardContent className="p-6">
          <div className="rounded-xl border border-amber-500/20 bg-amber-50/50 p-6 dark:bg-amber-900/10">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                <p className="animate-pulse text-sm font-medium text-amber-600">
                  {lang === 'fr'
                    ? 'Le comptable examine vos factures, marges et livres de comptes...'
                    : 'Accountant is calculating invoices, margins, and ledgers...'}
                </p>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 leading-relaxed text-slate-700 dark:text-slate-300">
                {displayedText.split('\n').map((line, i) => (
                  <p key={i} className="m-0">
                    {renderText(line)}
                  </p>
                ))}

                {displayedText.length === insightText?.length && (
                  <div className="mt-6 flex items-center justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInsightText(undefined)}
                      className="text-amber-700"
                    >
                      {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
