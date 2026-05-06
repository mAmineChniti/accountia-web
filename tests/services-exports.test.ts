import { describe, it, expect } from 'vitest';

/**
 * Comprehensive test suite validating all service exports.
 * These tests verify that each service module exports the expected API surface.
 */

describe('Service Exports', () => {
  describe('Auth Service', () => {
    it('should export AuthService', async () => {
      const serviceModule = await import('@/lib/services/auth');
      expect(serviceModule.AuthService).toBeDefined();
    });

    it('should expose auth methods', async () => {
      const { AuthService } = await import('@/lib/services/auth');
      expect(Object.keys(AuthService).length).toBeGreaterThan(0);
    });
  });

  describe('Business Service', () => {
    it('should export BusinessService', async () => {
      const serviceModule = await import('@/lib/services/business');
      expect(serviceModule.BusinessService).toBeDefined();
    });

    it('should have applyForBusiness', async () => {
      const { BusinessService } = await import('@/lib/services/business');
      expect(typeof BusinessService.applyForBusiness).toBe('function');
    });

    it('should have getApplications', async () => {
      const { BusinessService } = await import('@/lib/services/business');
      expect(typeof BusinessService.getApplications).toBe('function');
    });
  });

  describe('Invoices Service', () => {
    it('should export InvoicesService', async () => {
      const serviceModule = await import('@/lib/services/invoices');
      expect(serviceModule.InvoicesService).toBeDefined();
    });

    it('should have createInvoice', async () => {
      const { InvoicesService } = await import('@/lib/services/invoices');
      expect(typeof InvoicesService.createInvoice).toBe('function');
    });

    it('should have listIssuedInvoices', async () => {
      const { InvoicesService } = await import('@/lib/services/invoices');
      expect(typeof InvoicesService.listIssuedInvoices).toBe('function');
    });

    it('should have getReceivedInvoicesByBusiness', async () => {
      const { InvoicesService } = await import('@/lib/services/invoices');
      expect(typeof InvoicesService.getReceivedInvoicesByBusiness).toBe(
        'function'
      );
    });
  });

  describe('Analytics Service', () => {
    it('should export AnalyticsService', async () => {
      const serviceModule = await import('@/lib/services/analytics');
      expect(serviceModule.AnalyticsService).toBeDefined();
    });

    it('should have getDashboard', async () => {
      const { AnalyticsService } = await import('@/lib/services/analytics');
      expect(typeof AnalyticsService.getDashboard).toBe('function');
    });
  });

  describe('Expenses Service', () => {
    it('should export ExpensesService', async () => {
      const serviceModule = await import('@/lib/services/expenses');
      expect(serviceModule.ExpensesService).toBeDefined();
    });

    it('should have getExpenses', async () => {
      const { ExpensesService } = await import('@/lib/services/expenses');
      expect(typeof ExpensesService.getExpenses).toBe('function');
    });

    it('should have getSummary', async () => {
      const { ExpensesService } = await import('@/lib/services/expenses');
      expect(typeof ExpensesService.getSummary).toBe('function');
    });

    it('should have getExpenseById', async () => {
      const { ExpensesService } = await import('@/lib/services/expenses');
      expect(typeof ExpensesService.getExpenseById).toBe('function');
    });
  });

  describe('Products Service', () => {
    it('should export ProductsService', async () => {
      const serviceModule = await import('@/lib/services/products');
      expect(serviceModule.ProductsService).toBeDefined();
    });

    it('should have getProducts', async () => {
      const { ProductsService } = await import('@/lib/services/products');
      expect(typeof ProductsService.getProducts).toBe('function');
    });

    it('should have createProduct', async () => {
      const { ProductsService } = await import('@/lib/services/products');
      expect(typeof ProductsService.createProduct).toBe('function');
    });
  });

  describe('Vendors Service', () => {
    it('should export VendorsService', async () => {
      const serviceModule = await import('@/lib/services/vendors');
      expect(serviceModule.VendorsService).toBeDefined();
    });

    it('should have getVendors', async () => {
      const { VendorsService } = await import('@/lib/services/vendors');
      expect(typeof VendorsService.getVendors).toBe('function');
    });

    it('should have createVendor', async () => {
      const { VendorsService } = await import('@/lib/services/vendors');
      expect(typeof VendorsService.createVendor).toBe('function');
    });

    it('should have getVendorById', async () => {
      const { VendorsService } = await import('@/lib/services/vendors');
      expect(typeof VendorsService.getVendorById).toBe('function');
    });
  });

  describe('Reports Service', () => {
    it('should export ReportsService', async () => {
      const serviceModule = await import('@/lib/services/reports');
      expect(serviceModule.ReportsService).toBeDefined();
    });

    it('should have getVatReport', async () => {
      const { ReportsService } = await import('@/lib/services/reports');
      expect(typeof ReportsService.getVatReport).toBe('function');
    });
  });

  describe('Notifications Service', () => {
    it('should export NotificationsService', async () => {
      const serviceModule = await import('@/lib/services/notifications');
      expect(serviceModule.NotificationsService).toBeDefined();
    });

    it('should have getNotifications', async () => {
      const { NotificationsService } =
        await import('@/lib/services/notifications');
      expect(typeof NotificationsService.getNotifications).toBe('function');
    });

    it('should have markAsRead', async () => {
      const { NotificationsService } =
        await import('@/lib/services/notifications');
      expect(typeof NotificationsService.markAsRead).toBe('function');
    });
  });

  describe('Comments Service', () => {
    it('should export CommentsService', async () => {
      const serviceModule = await import('@/lib/services/comments');
      expect(serviceModule.CommentsService).toBeDefined();
    });

    it('should have getComments', async () => {
      const { CommentsService } = await import('@/lib/services/comments');
      expect(typeof CommentsService.getComments).toBe('function');
    });

    it('should have createComment', async () => {
      const { CommentsService } = await import('@/lib/services/comments');
      expect(typeof CommentsService.createComment).toBe('function');
    });
  });

  describe('Audit Service', () => {
    it('should export AuditService', async () => {
      const serviceModule = await import('@/lib/services/audit');
      expect(serviceModule.AuditService).toBeDefined();
    });

    it('should have getAuditLogs', async () => {
      const { AuditService } = await import('@/lib/services/audit');
      expect(typeof AuditService.getAuditLogs).toBe('function');
    });
  });

  describe('Collections Service', () => {
    it('should export CollectionsService', async () => {
      const serviceModule = await import('@/lib/services/collections');
      expect(serviceModule.CollectionsService).toBeDefined();
    });

    it('should have getDashboard', async () => {
      const { CollectionsService } = await import('@/lib/services/collections');
      expect(typeof CollectionsService.getDashboard).toBe('function');
    });

    it('should have getRiskScores', async () => {
      const { CollectionsService } = await import('@/lib/services/collections');
      expect(typeof CollectionsService.getRiskScores).toBe('function');
    });

    it('should have generateReminder', async () => {
      const { CollectionsService } = await import('@/lib/services/collections');
      expect(typeof CollectionsService.generateReminder).toBe('function');
    });
  });

  describe('Purchase Orders Service', () => {
    it('should export PurchaseOrdersService', async () => {
      const serviceModule = await import('@/lib/services/purchase-orders');
      expect(serviceModule.PurchaseOrdersService).toBeDefined();
    });

    it('should have getPurchaseOrders', async () => {
      const { PurchaseOrdersService } =
        await import('@/lib/services/purchase-orders');
      expect(typeof PurchaseOrdersService.getPurchaseOrders).toBe('function');
    });

    it('should have createPurchaseOrder', async () => {
      const { PurchaseOrdersService } =
        await import('@/lib/services/purchase-orders');
      expect(typeof PurchaseOrdersService.createPurchaseOrder).toBe('function');
    });
  });

  describe('Recurring Invoices Service', () => {
    it('should export RecurringInvoicesService', async () => {
      const serviceModule = await import('@/lib/services/recurring-invoices');
      expect(serviceModule.RecurringInvoicesService).toBeDefined();
    });

    it('should have getSchedules', async () => {
      const { RecurringInvoicesService } =
        await import('@/lib/services/recurring-invoices');
      expect(typeof RecurringInvoicesService.getSchedules).toBe('function');
    });

    it('should have create', async () => {
      const { RecurringInvoicesService } =
        await import('@/lib/services/recurring-invoices');
      expect(typeof RecurringInvoicesService.create).toBe('function');
    });

    it('should have update', async () => {
      const { RecurringInvoicesService } =
        await import('@/lib/services/recurring-invoices');
      expect(typeof RecurringInvoicesService.update).toBe('function');
    });

    it('should have delete', async () => {
      const { RecurringInvoicesService } =
        await import('@/lib/services/recurring-invoices');
      expect(typeof RecurringInvoicesService.delete).toBe('function');
    });
  });

  describe('Chat Service', () => {
    it('should export ChatService', async () => {
      const serviceModule = await import('@/lib/services/chat');
      expect(serviceModule.ChatService).toBeDefined();
    });

    it('should have createClient', async () => {
      const { ChatService } = await import('@/lib/services/chat');
      expect(typeof ChatService.createClient).toBe('function');
    });

    it('should have getGlobalClient', async () => {
      const { ChatService } = await import('@/lib/services/chat');
      expect(typeof ChatService.getGlobalClient).toBe('function');
    });

    it('should have setGlobalClient', async () => {
      const { ChatService } = await import('@/lib/services/chat');
      expect(typeof ChatService.setGlobalClient).toBe('function');
    });
  });

  describe('Client Portal Admin Service', () => {
    it('should export ClientPortalAdminService', async () => {
      const serviceModule = await import('@/lib/services/client-portal-admin');
      expect(serviceModule.ClientPortalAdminService).toBeDefined();
    });

    it('should have generateToken', async () => {
      const { ClientPortalAdminService } =
        await import('@/lib/services/client-portal-admin');
      expect(typeof ClientPortalAdminService.generateToken).toBe('function');
    });
  });
});
