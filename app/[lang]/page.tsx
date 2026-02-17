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

export default async function IndexPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;

  const dictionary = await getDictionary(lang);

  return (
    <>
      <section className="container mx-auto max-w-7xl px-6 py-24 lg:px-8 xl:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 px-3 py-1 text-sm">
            <Zap className="mr-2 h-4 w-4" />
            {dictionary.pages.home.hero.badge}
          </Badge>

          <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {dictionary.pages.home.hero.title}
            <span className="text-primary block">
              {dictionary.pages.home.hero.subtitle}
            </span>
          </h1>

          <p className="text-muted-foreground mx-auto mt-6 max-w-3xl text-lg leading-8 sm:text-xl">
            {dictionary.pages.home.hero.description}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 px-8 text-lg">
              {dictionary.pages.home.hero.startTrial}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
              {dictionary.pages.home.hero.watchDemo}
            </Button>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-primary text-3xl font-bold sm:text-4xl">
                10K+
              </div>
              <div className="text-muted-foreground text-sm">
                {dictionary.pages.home.stats.businesses}
              </div>
            </div>
            <div className="text-center">
              <div className="text-primary text-3xl font-bold sm:text-4xl">
                $50M+
              </div>
              <div className="text-muted-foreground text-sm">
                {dictionary.pages.home.stats.transactions}
              </div>
            </div>
            <div className="text-center">
              <div className="text-primary text-3xl font-bold sm:text-4xl">
                99.9%
              </div>
              <div className="text-muted-foreground text-sm">
                {dictionary.pages.home.stats.accuracy}
              </div>
            </div>
            <div className="text-center">
              <div className="text-primary text-3xl font-bold sm:text-4xl">
                24/7
              </div>
              <div className="text-muted-foreground text-sm">
                {dictionary.pages.home.stats.support}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-muted/30 py-24">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-20 max-w-3xl text-center">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              {dictionary.pages.home.features.title}
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg leading-relaxed">
              {dictionary.pages.home.features.description}
            </p>
          </div>

          <div className="grid-auto-rows-fr grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="group hover:border-primary/20 hover:shadow-primary/5 h-full cursor-pointer border p-6 transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="p-0">
                    <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                      <Bot className="text-primary h-6 w-6" />
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
                <Card className="group hover:border-primary/20 hover:shadow-primary/5 h-full cursor-pointer border p-6 transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="p-0">
                    <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                      <Calculator className="text-primary h-6 w-6" />
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
                <Card className="group hover:border-primary/20 hover:shadow-primary/5 h-full cursor-pointer border p-6 transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="p-0">
                    <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                      <BarChart3 className="text-primary h-6 w-6" />
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
                <Card className="group hover:border-primary/20 hover:shadow-primary/5 h-full cursor-pointer border p-6 transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="p-0">
                    <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                      <FileText className="text-primary h-6 w-6" />
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
                <Card className="group hover:border-primary/20 hover:shadow-primary/5 h-full cursor-pointer border p-6 transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="p-0">
                    <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                      <PieChart className="text-primary h-6 w-6" />
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
                <Card className="group hover:border-primary/20 hover:shadow-primary/5 h-full cursor-pointer border p-6 transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="p-0">
                    <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                      <Shield className="text-primary h-6 w-6" />
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

      <section id="solutions" className="py-24">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-20 max-w-3xl text-center">
            <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
              {dictionary.pages.home.solutions.title}
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg leading-relaxed">
              {dictionary.pages.home.solutions.description}
            </p>
          </div>

          <Tabs defaultValue="startups" className="mx-auto max-w-4xl">
            <TabsList className="bg-muted/50 grid w-full grid-cols-3 p-1">
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
              <Card className="bg-background border-2 p-8 transition-all duration-300">
                <CardHeader className="p-0 pb-6 text-center">
                  <CardTitle className="flex items-center justify-center gap-3 text-2xl font-semibold">
                    {dictionary.pages.home.solutions.startups.title}
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="text-muted-foreground h-5 w-5" />
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
                          <CheckCircle className="text-primary mr-3 h-5 w-5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="small-business" className="mt-8">
              <Card className="border-primary/20 bg-primary/5 border-2 p-8 transition-all duration-300">
                <CardHeader className="p-0 pb-6 text-center">
                  <Badge className="mx-auto mb-4 w-fit px-3 py-1 text-sm font-medium">
                    {dictionary.pages.home.solutions.mostPopular}
                  </Badge>
                  <CardTitle className="flex items-center justify-center gap-3 text-2xl font-semibold">
                    {dictionary.pages.home.solutions.smallBusiness.title}
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="text-muted-foreground h-5 w-5" />
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
                          <CheckCircle className="text-primary mr-3 h-5 w-5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="enterprise" className="mt-8">
              <Card className="bg-background border-2 p-8 transition-all duration-300">
                <CardHeader className="p-0 pb-6 text-center">
                  <CardTitle className="flex items-center justify-center gap-3 text-2xl font-semibold">
                    {dictionary.pages.home.solutions.enterprise.title}
                    <Tooltip>
                      <TooltipTrigger>
                        <Shield className="text-muted-foreground h-5 w-5" />
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
                          <CheckCircle className="text-primary mr-3 h-5 w-5 flex-shrink-0" />
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

      <section className="bg-primary text-primary-foreground py-24">
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
                className="h-12 px-8 text-lg"
              >
                {dictionary.pages.home.cta.startTrial}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground bg-primary/10 text-primary-foreground hover:bg-primary-foreground hover:text-primary h-12 px-8 text-lg"
              >
                {dictionary.pages.home.cta.scheduleDemo}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
