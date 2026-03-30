'use client';

import { useState, useEffect } from 'react';
import { 
  Palette, 
  Image as ImageIcon, 
  Type, 
  AlignLeft, 
  Building2, 
  Phone, 
  Mail, 
  FileSignature, 
  CreditCard, 
  Info,
  CheckCircle,
  Save,
  Eye,
  LayoutTemplate
} from 'lucide-react';
import { type Dictionary } from '@/get-dictionary';
import { type Locale } from '@/i18n-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { AuthService, BusinessService, AdminStatsRequests } from '@/lib/requests';
import { type StaticInvoice } from '@/lib/data/invoices';
import { Loader2, Globe } from 'lucide-react';

interface TemplateConfig {
  name: string;
  themeColor: string;
  fontFamily: string;
  logo: string | null;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  legalMentions: string;
  iban: string;
  thankYouMessage: string;
  paymentTerms: string;
  enableSignature: boolean;
  signaturePosition: 'left' | 'center' | 'right';
  currency: 'USD' | 'EUR' | 'TND';
  isDefault: boolean;
}

export default function TemplatesContent({
  dictionary,
  lang,
}: {
  dictionary: Dictionary;
  lang: Locale;
}) {
  const [config, setConfig] = useState<TemplateConfig>({
    name: 'Standard Theme',
    themeColor: '#7f1d1d', // Bordeaux/Dark Red
    fontFamily: 'font-sans',
    logo: null,
    companyName: '',
    address: '',
    phone: '',
    email: '',
    legalMentions: '',
    iban: '',
    thankYouMessage: '',
    paymentTerms: '',
    enableSignature: true,
    signaturePosition: 'right',
    currency: 'USD',
    isDefault: true,
  });

  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await AuthService.fetchUser();
      return res.user;
    },
  });

  const { data: businessesData } = useQuery({
    queryKey: ['my-businesses'],
    queryFn: async () => {
      const res = await BusinessService.getMyBusinesses();
      return res.businesses;
    },
  });

  const { data: realInvoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['invoices-real', 50],
    queryFn: async () => {
      const transactions = await AdminStatsRequests.getFilteredTransactions({ limit: 50 });
      return transactions.map((t: any): StaticInvoice => ({
        id: t.id,
        invoiceNumber: `INV-${t.id.toString().slice(-6).toUpperCase()}`,
        description: t.accountType || 'Transaction',
        amount: t.amount || 0,
        currency: 'USD',
        status: t.type === 'income' ? 'PAID' : 'PENDING',
        dueDate: t.date,
        createdAt: t.date,
        paidAt: t.type === 'income' ? t.date : undefined,
        clientName: 'Client Transaction'
      }));
    },
  });

  useEffect(() => {
    if (!hasInitialized && (userData !== undefined || businessesData !== undefined)) {
      if (!userData && !businessesData) return; // Wait until at least one resolves
      
      const activeBusiness = businessesData?.find(b => b.status === 'approved' && b.isActive) || businessesData?.[0];
      const settings = (activeBusiness as any)?.templateSettings || {};

      setConfig(prev => ({
        ...prev,
        companyName: settings.companyName || activeBusiness?.name || '',
        email: settings.email || userData?.email || '',
        phone: settings.phone || activeBusiness?.phone || userData?.phoneNumber || '',
        address: settings.address || prev.address,
        themeColor: settings.themeColor || prev.themeColor,
        fontFamily: settings.fontFamily || prev.fontFamily,
        logo: settings.logo || activeBusiness?.logo || null,
        currency: settings.currency || 'USD',
      }));
      setHasInitialized(true);
    }
  }, [userData, businessesData, hasInitialized]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const activeBusiness = businessesData?.find(b => b.status === 'approved' && b.isActive) || businessesData?.[0];
    if (!activeBusiness) {
      alert('No active business found to save settings.');
      return;
    }

    try {
      await BusinessService.updateBusiness(activeBusiness.id, {
        templateSettings: {
          currency: config.currency,
          themeColor: config.themeColor,
          fontFamily: config.fontFamily,
          companyName: config.companyName,
          address: config.address,
          phone: config.phone,
          email: config.email,
          logo: config.logo as any,
        }
      });
      alert('Template settings saved successfully!');
    } catch (err) {
      console.error('Failed to save template', err);
      alert('Failed to save template settings.');
    }
  };

  const [previewInvoiceId, setPreviewInvoiceId] = useState<string>('');

  // Update selection if realInvoices changes and no selection made
  useEffect(() => {
    if (realInvoices.length > 0 && !previewInvoiceId) {
      setPreviewInvoiceId(realInvoices[0].id);
    }
  }, [realInvoices, previewInvoiceId]);

  // Fetch exchange rates for preview
  const { data: exchangeRates } = useQuery({
    queryKey: ['exchange-rates', config.currency],
    queryFn: async () => {
      if (config.currency === 'USD') return 1;
      // Hardcoded fallbacks for currencies not supported by Frankfurter (ECB)
      if (config.currency === 'TND') return 3.12; 
      
      try {
        const response = await fetch(`https://api.frankfurter.app/latest?from=USD&to=${config.currency}`);
        if (!response.ok) {
          const fallbacks: Record<string, number> = { EUR: 0.92, TND: 3.12 };
          return fallbacks[config.currency] || 1;
        }
        const data = await response.json();
        return data.rates[config.currency] || 1;
      } catch (err) {
        console.error('Failed to fetch exchange rate', err);
        const fallbacks: Record<string, number> = { EUR: 0.92, TND: 3.12 };
        return fallbacks[config.currency] || 1;
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const rate = exchangeRates || 1;

  const previewInvoice = realInvoices.find(inv => inv.id === previewInvoiceId) || (realInvoices[0] || {
    id: 'placeholder',
    invoiceNumber: 'INV-000000',
    description: 'Service Description',
    amount: 0,
    currency: 'USD',
    status: 'PAID',
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });
  
  const currencyIcons: Record<string, string> = {
    USD: '$',
    EUR: '€',
    TND: 'DT',
  };

  const taxRate = 0.20;
  const originalSubtotal = previewInvoice.amount;
  const subtotal = originalSubtotal * rate;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const fonts = [
    { value: 'font-sans', label: 'Sans Serif (Modern)' },
    { value: 'font-serif', label: 'Serif (Classic)' },
    { value: 'font-mono', label: 'Monospace (Technical)' }
  ];

  const colors = [
    { value: '#7f1d1d', label: 'Bordeaux (Red-900)' },
    { value: '#991b1b', label: 'Crimson (Red-800)' },
    { value: '#b91c1c', label: 'Ruby (Red-700)' },
    { value: '#0f172a', label: 'Slate (Slate-900)' },
    { value: '#1e3a8a', label: 'Navy (Blue-900)' },
    { value: '#14532d', label: 'Forest (Green-900)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutTemplate className="h-8 w-8 text-primary" />
            Invoice Templates
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create and manage your branded invoice templates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
            className="gap-2"
          >
            {previewMode ? <Palette className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {previewMode ? 'Edit Template' : 'Full Preview'}
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT PANEL: CONFIGURATION */}
        <div className={`space-y-6 ${previewMode ? 'hidden lg:block lg:col-span-4' : 'lg:col-span-5'}`}>
          
          <Card className="glass-card border-0 shadow-sm">
            <CardHeader className="pb-3 border-b mb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  Look & Feel
                </CardTitle>
                {config.isDefault && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" /> Default
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Name</label>
                <Input 
                  value={config.name} 
                  onChange={e => setConfig({...config, name: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Type className="h-4 w-4 text-muted-foreground" /> Font
                  </label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={config.fontFamily}
                    onChange={e => setConfig({...config, fontFamily: e.target.value})}
                  >
                    {fonts.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: config.themeColor }} />
                    Color
                  </label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={config.themeColor}
                    onChange={e => setConfig({...config, themeColor: e.target.value})}
                  >
                    {colors.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t mt-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Globe className="h-4 w-4 text-muted-foreground" /> 
                  Currency (Automatic Conversion)
                </label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={config.currency}
                  onChange={e => setConfig({...config, currency: e.target.value as any})}
                >
                  <option value="USD">USD ($) - Base</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="TND">TND (DT)</option>
                </select>
                <p className="text-[10px] text-muted-foreground italic">
                  * Invoice amounts will be automatically converted using real-time rates.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t mt-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  Company Logo
                </label>
                <div className="flex items-center gap-4">
                  {config.logo && (
                    <div className="h-12 w-12 rounded border bg-white flex items-center justify-center overflow-hidden shrink-0">
                      <img src={config.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="cursor-pointer"
                      onChange={handleLogoUpload}
                    />
                  </div>
                  {config.logo && (
                    <Button variant="ghost" size="sm" onClick={() => setConfig({...config, logo: null})} className="text-red-500 hover:text-red-600">
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              {!config.isDefault && (
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => setConfig({...config, isDefault: true})}
                >
                  Set as Default Template
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-sm">
            <CardHeader className="pb-3 border-b mb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                Header details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Name</label>
                <Input 
                  value={config.companyName} 
                  onChange={e => setConfig({...config, companyName: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <textarea 
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={config.address} 
                  rows={2}
                  onChange={e => setConfig({...config, address: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground" /> Phone
                  </label>
                  <Input 
                    value={config.phone} 
                    onChange={e => setConfig({...config, phone: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Mail className="h-3 w-3 text-muted-foreground" /> Email
                  </label>
                  <Input 
                    value={config.email} 
                    onChange={e => setConfig({...config, email: e.target.value})} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-sm">
            <CardHeader className="pb-3 border-b mb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                Payment & Footer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Terms</label>
                <Input 
                  value={config.paymentTerms} 
                  onChange={e => setConfig({...config, paymentTerms: e.target.value})} 
                  placeholder="e.g. Payment due within 30 days"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bank IBAN</label>
                <Input 
                  value={config.iban} 
                  onChange={e => setConfig({...config, iban: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Info className="h-3 w-3 text-muted-foreground" /> Legal Mentions
                </label>
                <Input 
                  value={config.legalMentions} 
                  onChange={e => setConfig({...config, legalMentions: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Thank You Message</label>
                <Input 
                  value={config.thankYouMessage} 
                  onChange={e => setConfig({...config, thankYouMessage: e.target.value})} 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-sm">
            <CardHeader className="pb-3 border-b mb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-muted-foreground" />
                Signature Option
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Signature Block</label>
                <input 
                  type="checkbox" 
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={config.enableSignature}
                  onChange={e => setConfig({...config, enableSignature: e.target.checked})}
                />
              </div>
              {config.enableSignature && (
                <div className="space-y-2 pt-2 border-t">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <AlignLeft className="h-3 w-3 text-muted-foreground" /> Signature Position
                  </label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={config.signaturePosition}
                    onChange={e => setConfig({...config, signaturePosition: e.target.value as 'left'|'center'|'right'})}
                  >
                    <option value="left">Left Aligned</option>
                    <option value="center">Center Aligned</option>
                    <option value="right">Right Aligned</option>
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* RIGHT PANEL: LIVE PREVIEW */}
        <div className={`transition-all duration-300 ${previewMode ? 'lg:col-span-8' : 'lg:col-span-7'}`}>
          <div className="sticky top-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Preview</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline-block">Data:</span>
                <select 
                  className="flex h-8 w-[180px] sm:w-[220px] rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={previewInvoiceId}
                  onChange={e => setPreviewInvoiceId(e.target.value)}
                  disabled={isLoadingInvoices}
                >
                  {isLoadingInvoices ? (
                    <option>Loading...</option>
                  ) : realInvoices.length > 0 ? (
                    realInvoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - ${inv.amount.toFixed(2)}
                      </option>
                    ))
                  ) : (
                    <option>No real data found</option>
                  )}
                </select>
              </div>
            </div>
            
            {/* INVOICE SHEET */}
            <div className={`bg-[#fdfaf6] ring-1 ring-border/50 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 aspect-[1/1.4] w-full flex flex-col ${config.fontFamily} dark:bg-[#e6e2db] dark:text-gray-900`}>
              
              {/* Colored Top Bar */}
              <div className="h-3 w-full" style={{ backgroundColor: config.themeColor }} />

              <div className="p-8 md:p-12 flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                  <div className="max-w-[50%]">
                    {config.logo ? (
                      <img src={config.logo} alt="Logo" className="h-16 w-auto object-contain mb-4" />
                    ) : (
                      <div className="h-16 w-16 mb-4 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                    <h2 className="text-xl font-bold" style={{ color: config.themeColor }}>
                      {config.companyName || 'Company Name'}
                    </h2>
                    <div className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                      {config.address || 'Company Address'}
                    </div>
                    {(config.phone || config.email) && (
                      <div className="text-sm text-gray-600 mt-1">
                        {[config.phone, config.email].filter(Boolean).join(' • ')}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <h1 className="text-4xl font-light text-gray-300 tracking-widest uppercase mb-2">Invoice</h1>
                    <div className="text-gray-900 font-semibold">{previewInvoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-500 mt-1">Date: {new Date(previewInvoice.createdAt).toLocaleDateString()}</div>
                    <div className="text-sm font-medium mt-4">
                      <span className="text-gray-500 block text-xs uppercase tracking-wide">Billed To</span>
                      {previewInvoice.clientName || 'Acme Corp Ltd.'}<br/>
                      <span className="whitespace-pre-line text-xs font-normal text-muted-foreground">{previewInvoice.clientAddress || '124 Buyer Street'}</span>
                    </div>
                  </div>
                </div>

                {/* Table Mockup */}
                <div className="mb-8 overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100/50 text-gray-600 font-medium">
                      <tr>
                        <th className="px-4 py-3 border-b">Description</th>
                        <th className="px-4 py-3 border-b text-right">Qty</th>
                        <th className="px-4 py-3 border-b text-right">Rate</th>
                        <th className="px-4 py-3 border-b text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-3">{previewInvoice.description}</td>
                        <td className="px-4 py-3 text-right">1</td>
                        <td className="px-4 py-3 text-right">{currencyIcons[config.currency]}{subtotal.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium">{currencyIcons[config.currency]}{subtotal.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="bg-white p-4 flex justify-end">
                    <div className="w-1/2 md:w-1/3">
                      <div className="flex justify-between py-1 text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>{currencyIcons[config.currency]}{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1 text-sm text-gray-600">
                        <span>Tax (20%)</span>
                        <span>{currencyIcons[config.currency]}{tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 mt-2 border-t border-gray-200 text-lg font-bold" style={{ color: config.themeColor }}>
                        <span>Total</span>
                        <span>{currencyIcons[config.currency]}{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Terms & Signature Layout */}
                <div className="flex flex-col md:flex-row gap-8 justify-between mt-auto pt-8">
                  <div className="flex-1 space-y-4">
                    {/* Payment details */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Payment Info</h4>
                      <p className="text-sm font-medium text-gray-900">{config.paymentTerms}</p>
                      <p className="text-sm text-gray-600 font-mono mt-1">{config.iban}</p>
                    </div>
                  </div>

                  {/* Signature block */}
                  {config.enableSignature && (
                    <div className={`flex shrink-0 w-48 flex-col ${
                      config.signaturePosition === 'center' ? 'mx-auto md:mx-0 text-center' :
                      config.signaturePosition === 'right' ? 'items-end text-right' : 'items-start text-left'
                    }`}>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-8">Authorized Signature</h4>
                      <div className="border-b border-gray-400 w-full mb-2"></div>
                      <p className="text-xs text-gray-500">{config.companyName}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500 space-y-2 pb-4">
                  <p className="font-medium text-gray-800 italic">{config.thankYouMessage}</p>
                  <p>{config.legalMentions}</p>
                </div>

              </div>
              
              {/* Colored Bottom Bar */}
              <div className="h-2 w-full" style={{ backgroundColor: config.themeColor }} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
