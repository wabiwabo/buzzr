import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { DataSource } from 'typeorm';
import { PaymentType } from '@buzzr/shared-types';

describe('PaymentService', () => {
  let service: PaymentService;
  let dataSource: { query: jest.Mock };
  let xenditService: { createInvoice: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    xenditService = {
      createInvoice: jest.fn().mockResolvedValue({
        id: 'xendit-inv-1',
        invoice_url: 'https://checkout.xendit.co/xxx',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: DataSource, useValue: dataSource },
        { provide: 'XENDIT_SERVICE', useValue: xenditService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  describe('createInvoice', () => {
    it('should create a transaction and Xendit invoice', async () => {
      dataSource.query.mockResolvedValue([{
        id: 'tx-1', type: 'retribution', amount: 50000, status: 'pending',
        external_id: 'xendit-inv-1',
      }]);

      const result = await service.createInvoice('dlh_demo', {
        userId: 'user-1',
        amount: 50000,
        description: 'Retribusi sampah Maret 2026',
        type: PaymentType.RETRIBUTION,
      });

      expect(result.external_id).toBe('xendit-inv-1');
      expect(xenditService.createInvoice).toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    it('should update transaction status to paid', async () => {
      dataSource.query.mockResolvedValue([{
        id: 'tx-1', status: 'paid',
      }]);

      const result = await service.handleWebhook({
        external_id: 'xendit-inv-1',
        status: 'PAID',
        paid_at: '2026-03-07T10:00:00Z',
      });

      expect(result.status).toBe('paid');
    });
  });

  describe('listPaymentsPaginated', () => {
    it('should return paginated payments with meta', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ id: 'tx-1', type: 'retribution', amount: 50000 }])
        .mockResolvedValueOnce([{ count: '200' }]);

      const result = await service.listPaymentsPaginated('dlh_demo', {
        page: 1, limit: 25, order: 'desc',
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(200);
      expect(result.meta.totalPages).toBe(8);
    });
  });

  describe('listPayments', () => {
    it('should return filtered payments', async () => {
      dataSource.query.mockResolvedValue([
        { id: 'tx-1', type: 'retribution', status: 'pending', amount: 50000 },
      ]);

      const result = await service.listPayments('dlh_demo', { type: 'retribution', status: 'pending' });

      expect(result).toHaveLength(1);
    });
  });
});
