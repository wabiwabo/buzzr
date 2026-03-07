import { Test, TestingModule } from '@nestjs/testing';
import { RewardService } from './reward.service';
import { DataSource } from 'typeorm';

describe('RewardService', () => {
  let service: RewardService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<RewardService>(RewardService);
  });

  describe('awardPoints', () => {
    it('should add points to user', async () => {
      dataSource.query.mockResolvedValue([{ reward_points: 110 }]);

      const result = await service.awardPoints('dlh_demo', 'u-1', 'complaint_resolved');

      expect(result.reward_points).toBe(110);
      expect(dataSource.query).toHaveBeenCalled();
    });
  });

  describe('redeemPoints', () => {
    it('should convert points to wallet balance', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ reward_points: 500 }]) // check points
        .mockResolvedValueOnce([{ reward_points: 0 }]) // deduct points
        .mockResolvedValueOnce([{ balance: 5000 }]) // credit wallet
        .mockResolvedValueOnce([{ id: 'tx-1' }]); // insert transaction

      const result = await service.redeemPoints('dlh_demo', 'u-1', 500);

      expect(result.pointsRedeemed).toBe(500);
      expect(result.amountCredited).toBe(5000);
    });

    it('should throw if insufficient points', async () => {
      dataSource.query.mockResolvedValueOnce([{ reward_points: 10 }]);

      await expect(
        service.redeemPoints('dlh_demo', 'u-1', 500),
      ).rejects.toThrow('Poin tidak mencukupi');
    });
  });

  describe('getPointsConfig', () => {
    it('should return point values per action', () => {
      const config = service.getPointsConfig();
      expect(config).toHaveProperty('complaint_resolved');
      expect(config).toHaveProperty('waste_bank_transaction');
      expect(config).toHaveProperty('on_time_payment');
    });
  });
});
