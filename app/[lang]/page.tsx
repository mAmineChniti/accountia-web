import { getDictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Bot,
  BarChart3,
  Shield,
  Zap,
  Calculator,
  FileText,
  PieChart,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import Image from 'next/image';

export default async function IndexPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;

  const dictionary = await getDictionary(lang);

  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-6 py-24 lg:px-8 xl:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 px-3 py-1 text-sm">
            <Zap className="mr-2 h-4 w-4" />
            {dictionary.pages.home.hero.badge}
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            {dictionary.pages.home.hero.title}
            <span className="block text-primary">
              {dictionary.pages.home.hero.subtitle}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
            {dictionary.pages.home.hero.description}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-12 px-8 text-lg transition-all hover:scale-105"
            >
              {dictionary.pages.home.hero.startTrial}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-lg transition-all hover:scale-105"
            >
              {dictionary.pages.home.hero.watchDemo}
            </Button>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary sm:text-4xl">
                10K+
              </div>
              <div className="text-sm text-muted-foreground">
                {dictionary.pages.home.stats.businesses}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary sm:text-4xl">
                $50M+
              </div>
              <div className="text-sm text-muted-foreground">
                {dictionary.pages.home.stats.transactions}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary sm:text-4xl">
                99.9%
              </div>
              <div className="text-sm text-muted-foreground">
                {dictionary.pages.home.stats.accuracy}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary sm:text-4xl">
                24/7
              </div>
              <div className="text-sm text-muted-foreground">
                {dictionary.pages.home.stats.support}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-20">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {dictionary.pages.home.features.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {dictionary.pages.home.features.description}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 grid-auto-rows-fr">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="group cursor-pointer border bg-background p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 h-full">
                  <CardHeader className="p-0">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">
                      {dictionary.pages.home.features.aiInsights.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {dictionary.pages.home.features.aiInsights.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>{dictionary.pages.home.features.aiInsights.description}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="group cursor-pointer border bg-background p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 h-full">
                  <CardHeader className="p-0">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Calculator className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">
                      {
                        dictionary.pages.home.features.automatedBookkeeping
                          .title
                      }
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {
                        dictionary.pages.home.features.automatedBookkeeping
                          .description
                      }
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {
                    dictionary.pages.home.features.automatedBookkeeping
                      .description
                  }
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="group cursor-pointer border bg-background p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 h-full">
                  <CardHeader className="p-0">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">
                      {dictionary.pages.home.features.realtimeAnalytics.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {
                        dictionary.pages.home.features.realtimeAnalytics
                          .description
                      }
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {dictionary.pages.home.features.realtimeAnalytics.description}
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="group cursor-pointer border bg-background p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 h-full">
                  <CardHeader className="p-0">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">
                      {dictionary.pages.home.features.smartInvoicing.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {
                        dictionary.pages.home.features.smartInvoicing
                          .description
                      }
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {dictionary.pages.home.features.smartInvoicing.description}
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="group cursor-pointer border bg-background p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 h-full">
                  <CardHeader className="p-0">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <PieChart className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">
                      {dictionary.pages.home.features.taxOptimization.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {
                        dictionary.pages.home.features.taxOptimization
                          .description
                      }
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {dictionary.pages.home.features.taxOptimization.description}
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="group cursor-pointer border bg-background p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 h-full">
                  <CardHeader className="p-0">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">
                      {dictionary.pages.home.features.security.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {dictionary.pages.home.features.security.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>{dictionary.pages.home.features.security.description}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-24">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-20">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {dictionary.pages.home.solutions.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {dictionary.pages.home.solutions.description}
            </p>
          </div>

          <Tabs defaultValue="startups" className="mx-auto max-w-4xl">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
              <TabsTrigger
                value="startups"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {dictionary.pages.home.solutions.startups.title}
              </TabsTrigger>
              <TabsTrigger
                value="small-business"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {dictionary.pages.home.solutions.smallBusiness.title}
              </TabsTrigger>
              <TabsTrigger
                value="enterprise"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {dictionary.pages.home.solutions.enterprise.title}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="startups" className="mt-8">
              <Card className="border-2 bg-background p-8 transition-all duration-300">
                <CardHeader className="p-0 text-center pb-6">
                  <CardTitle className="text-2xl font-semibold flex items-center justify-center gap-3">
                    {dictionary.pages.home.solutions.startups.title}
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-5 w-5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{dictionary.tooltips.perfectForNewBusinesses}</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <CardDescription className="mt-3 text-lg leading-relaxed">
                    {dictionary.pages.home.solutions.startups.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-4">
                    {dictionary.pages.home.solutions.startups.features.map(
                      (feature: string, index: number) => (
                        <li key={index} className="flex items-center text-base">
                          <CheckCircle className="mr-3 h-5 w-5 flex-shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="small-business" className="mt-8">
              <Card className="border-2 border-primary/20 bg-primary/5 p-8 transition-all duration-300">
                <CardHeader className="p-0 text-center pb-6">
                  <Badge className="mb-4 mx-auto w-fit px-3 py-1 text-sm font-medium">
                    {dictionary.pages.home.solutions.mostPopular}
                  </Badge>
                  <CardTitle className="text-2xl font-semibold flex items-center justify-center gap-3">
                    {dictionary.pages.home.solutions.smallBusiness.title}
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-5 w-5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{dictionary.tooltips.mostPopularChoice}</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <CardDescription className="mt-3 text-lg leading-relaxed">
                    {dictionary.pages.home.solutions.smallBusiness.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-4">
                    {dictionary.pages.home.solutions.smallBusiness.features.map(
                      (feature: string, index: number) => (
                        <li key={index} className="flex items-center text-base">
                          <CheckCircle className="mr-3 h-5 w-5 flex-shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="enterprise" className="mt-8">
              <Card className="border-2 bg-background p-8 transition-all duration-300">
                <CardHeader className="p-0 text-center pb-6">
                  <CardTitle className="text-2xl font-semibold flex items-center justify-center gap-3">
                    {dictionary.pages.home.solutions.enterprise.title}
                    <Tooltip>
                      <TooltipTrigger>
                        <Shield className="h-5 w-5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{dictionary.tooltips.advancedFeatures}</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <CardDescription className="mt-3 text-lg leading-relaxed">
                    {dictionary.pages.home.solutions.enterprise.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-4">
                    {dictionary.pages.home.solutions.enterprise.features.map(
                      (feature: string, index: number) => (
                        <li key={index} className="flex items-center text-base">
                          <CheckCircle className="mr-3 h-5 w-5 flex-shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {dictionary.pages.home.cta.title}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed opacity-90">
              {dictionary.pages.home.cta.description}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 px-8 text-lg transition-all hover:scale-105"
              >
                {dictionary.pages.home.cta.startTrial}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-lg border-primary-foreground bg-primary/10 text-primary-foreground transition-all hover:bg-primary-foreground hover:text-primary hover:scale-105"
              >
                {dictionary.pages.home.cta.scheduleDemo}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="relative h-8 w-8 flex-shrink-0">
                  <Image
                    src="/logo.png"
                    alt={dictionary.brand.logoAlt}
                    fill
                    className="object-contain"
                    sizes="32px"
                  />
                </div>
                <span className="text-xl font-bold">
                  {dictionary.brand.name}
                </span>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground">
                {dictionary.pages.home.footer.tagline}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">
                {dictionary.pages.home.footer.product}
              </h3>
              <ul className="space-y-3 text-base">
                <li>
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {dictionary.pages.home.footer.features}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {dictionary.pages.home.footer.pricing}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {dictionary.pages.home.footer.security}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">
                {dictionary.pages.home.footer.company}
              </h3>
              <ul className="space-y-3 text-base">
                <li>
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {dictionary.pages.home.footer.about}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {dictionary.pages.home.footer.blog}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {dictionary.pages.home.footer.careers}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6">
                {dictionary.pages.home.footer.support}
              </h3>
              <ul className="space-y-3 text-base">
                <li>
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {dictionary.pages.home.footer.helpCenter}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {dictionary.pages.home.footer.contact}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {dictionary.pages.home.footer.status}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-12" />

          <div className="text-center text-base text-muted-foreground">
            <p>{dictionary.pages.home.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
