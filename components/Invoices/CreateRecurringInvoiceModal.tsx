'use client';

import { useState, useEffect } from 'react';
import { type Locale } from '@/i18n-config';
import { type Dictionary } from '@/get-dictionary';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Coins,
  Loader2,
  Plus,
  Calendar,
  Settings2,
  Trash2,
  Repeat,
} from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  _id: string;
  name: string;
}

export default function CreateRecurringInvoiceModal({
  _lang,
  _dictionary,
  open,
  setOpen,
  onSuccess,
}: {
  lang: Locale;
  dictionary: Dictionary;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Form State
  const [clientId, setClientId] = useState('cli_' + Date.now()); // Mocked client ID picker for now
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [templateId, setTemplateId] = useState('');
  const [generateFirstImmediately, setGenerateFirstImmediately] =
    useState(true);
  const [autoSend, setAutoSend] = useState(false);

  const [items, setItems] = useState([
    { description: '', quantity: 1, price: 1 },
  ]);

  useEffect(() => {
    if (open) {
      // Fetch available templates
      const fetchTemplates = async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4789'}/api/templates/my`
          );
          if (res.ok) {
            const data = await res.json();
            setTemplates(data.templates || []);
            if (data.templates && data.templates.length > 0) {
              setTemplateId(data.templates[0]._id);
            }
          }
        } catch (error) {
          console.error(error);
        }
      };
      fetchTemplates();
    }
  }, [open]);

  const totalAmount = items.reduce(
    (acc, curr) => acc + curr.quantity * curr.price,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !clientName ||
      !templateId ||
      items.some((i) => !i.description || i.price <= 0)
    ) {
      toast.error(
        'Please fill in all required fields and ensure items have prices.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('accessToken');
      const body = {
        clientId,
        clientName,
        clientEmail,
        items,
        totalAmount,
        frequency,
        templateId,
        startDate: new Date().toISOString(),
        generateFirstImmediately,
        autoSend,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4789'}/api/recurring-invoices`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) throw new Error('Failed to create recurring invoice');

      toast.success('Recurring Invoice Schedule Created!');
      setOpen(false);
      onSuccess();
    } catch {
      toast.error('Error creating recurring invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () =>
    setItems([...items, { description: '', quantity: 1, price: 1 }]);
  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Repeat className="text-primary h-5 w-5" />
            Create Recurring Invoice
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client Name *</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Acme Corp"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Client Email (Optional)</Label>
              <Input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="billing@acme.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Invoice Template *</Label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="" disabled>
                Select a template
              </option>
              {templates.length === 0 ? (
                <option value="" disabled>
                  No templates available - Create one first
                </option>
              ) : (
                templates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))
              )}
            </select>
            {templates.length === 0 && (
              <p className="text-destructive mt-1 text-xs">
                Please ensure you have created invoice templates before
                scheduling recurring invoices.
              </p>
            )}
          </div>

          {/* Line Items */}
          <div className="bg-muted/20 space-y-4 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Services / Items
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <Input
                  className="flex-1"
                  placeholder="Item Description"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, 'description', e.target.value)
                  }
                  required
                />
                <Input
                  type="number"
                  min="1"
                  className="w-24"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(
                      index,
                      'quantity',
                      Number.parseInt(e.target.value) || 1
                    )
                  }
                  required
                />
                <div className="relative w-32">
                  <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                    $
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-7"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) =>
                      updateItem(
                        index,
                        'price',
                        Number.parseFloat(e.target.value) || 0
                      )
                    }
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <div className="mt-4 flex justify-end border-t pt-2">
              <div className="text-xl font-bold">
                Total: $
                {totalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequency *</Label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                required
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>

          <div className="bg-primary/5 space-y-4 rounded-xl border p-4">
            <h4 className="flex items-center gap-2 font-semibold">
              <Settings2 className="h-4 w-4" /> Automation Settings
            </h4>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Generate first invoice immediately</Label>
                <p className="text-muted-foreground text-sm">
                  Creates the first invoice now instead of waiting for the next
                  cycle.
                </p>
              </div>
              <Switch
                checked={generateFirstImmediately}
                onCheckedChange={setGenerateFirstImmediately}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-send to client</Label>
                <p className="text-muted-foreground text-sm">
                  Automatically emails generated invoices to the client if email
                  is provided.
                </p>
              </div>
              <Switch checked={autoSend} onCheckedChange={setAutoSend} />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="mr-2 h-4 w-4" />
              )}
              Create Schedule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
