import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { XenditService } from './xendit.service';

describe('XenditService', () => {
  let service: XenditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XenditService,
        { provide: ConfigService, useValue: { get: jest.fn(() => 'test-secret') } },
      ],
    }).compile();
    service = module.get<XenditService>(XenditService);
  });

  describe('verifyWebhookSignature', () => {
    it('returns true for matching tokens', () => {
      expect(service.verifyWebhookSignature('abc123', 'abc123')).toBe(true);
    });

    it('returns false for non-matching tokens', () => {
      expect(service.verifyWebhookSignature('wrong', 'abc123')).toBe(false);
    });

    it('returns false when received token is empty', () => {
      expect(service.verifyWebhookSignature('', 'abc123')).toBe(false);
    });
  });

  describe('createInvoice', () => {
    it('returns a mock invoice with PENDING status', async () => {
      const result = await service.createInvoice({
        externalId: 'inv-1',
        amount: 50000,
        description: 'Test',
      });
      expect(result.status).toBe('PENDING');
      expect(result.external_id).toBe('inv-1');
      expect(result.amount).toBe(50000);
    });
  });
});
