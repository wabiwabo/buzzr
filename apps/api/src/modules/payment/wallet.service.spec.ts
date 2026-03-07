import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { DataSource } from 'typeorm';

describe('WalletService', () => {
  let service: WalletService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<WalletService>(WalletService);
  });

  describe('getOrCreateWallet', () => {
    it('should return existing wallet', async () => {
      dataSource.query.mockResolvedValue([{ id: 'w-1', user_id: 'u-1', balance: 50000 }]);
      const result = await service.getOrCreateWallet('dlh_demo', 'u-1');
      expect(result.balance).toBe(50000);
    });

    it('should create wallet if not exists', async () => {
      dataSource.query
        .mockResolvedValueOnce([]) // no existing wallet
        .mockResolvedValueOnce([{ id: 'w-new', user_id: 'u-1', balance: 0 }]); // insert

      const result = await service.getOrCreateWallet('dlh_demo', 'u-1');
      expect(result.balance).toBe(0);
    });
  });

  describe('creditWallet', () => {
    it('should increase wallet balance and create transaction', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ balance: 55000 }]) // update wallet
        .mockResolvedValueOnce([{ id: 'tx-1' }]); // insert transaction

      const result = await service.creditWallet('dlh_demo', 'u-1', 5000, 'Jual plastik 5kg');
      expect(result.balance).toBe(55000);
    });
  });

  describe('requestPayout', () => {
    it('should decrease wallet balance for valid payout', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ balance: 50000 }]) // check balance
        .mockResolvedValueOnce([{ balance: 0 }]) // update wallet
        .mockResolvedValueOnce([{ id: 'tx-1', type: 'payout' }]); // insert transaction

      const result = await service.requestPayout('dlh_demo', 'u-1', 50000);
      expect(result.type).toBe('payout');
    });

    it('should throw if insufficient balance', async () => {
      dataSource.query.mockResolvedValueOnce([{ balance: 10000 }]);

      await expect(
        service.requestPayout('dlh_demo', 'u-1', 50000),
      ).rejects.toThrow('Saldo tidak mencukupi');
    });
  });
});
