export type InvoiceStatus =
  | 'PAID'
  | 'PENDING'
  | 'OVERDUE'
  | 'DRAFT'
  | 'CANCELLED';

export interface StaticInvoice {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  notes?: string;
  clientName?: string;
  clientAddress?: string;
}

export const STATIC_INVOICES: StaticInvoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2025-001',
    description: 'Web Development Services – Q1 2025',
    amount: 3200,
    currency: 'USD',
    status: 'PAID',
    dueDate: '2025-01-31',
    createdAt: '2025-01-10',
    paidAt: '2025-01-28',
    clientName: 'Tech Innovators Inc.',
    clientAddress: '456 Tech Park\nSilicon Valley, CA 94088',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2025-002',
    description: 'UI/UX Design – Dashboard Redesign',
    amount: 1750.5,
    currency: 'USD',
    status: 'PENDING',
    dueDate: '2025-03-15',
    createdAt: '2025-02-20',
    notes: 'Awaiting client approval',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2025-003',
    description: 'Monthly SaaS Subscription – February',
    amount: 499,
    currency: 'USD',
    status: 'OVERDUE',
    dueDate: '2025-02-28',
    createdAt: '2025-02-01',
  },
  {
    id: '4',
    invoiceNumber: 'INV-2025-004',
    description: 'Logo & Branding Package',
    amount: 850,
    currency: 'USD',
    status: 'PAID',
    dueDate: '2025-02-10',
    createdAt: '2025-01-25',
    paidAt: '2025-02-08',
  },
  {
    id: '5',
    invoiceNumber: 'INV-2025-005',
    description: 'API Integration – Payment Gateway',
    amount: 2100,
    currency: 'USD',
    status: 'DRAFT',
    dueDate: '2025-04-01',
    createdAt: '2025-03-01',
    notes: 'Draft – pending final scope confirmation',
  },
];
