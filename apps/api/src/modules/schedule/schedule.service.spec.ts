import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { DataSource } from 'typeorm';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<ScheduleService>(ScheduleService);
  });

  describe('createSchedule', () => {
    it('should create a recurring schedule', async () => {
      dataSource.query.mockResolvedValue([{
        id: 'sch-1', vehicle_id: 'v-1', driver_id: 'd-1',
        route_name: 'Rute Menteng', schedule_type: 'recurring',
        recurring_days: [1,3,5],
      }]);

      const result = await service.createSchedule('dlh_demo', {
        vehicleId: 'v-1',
        driverId: 'd-1',
        routeName: 'Rute Menteng',
        scheduleType: 'recurring',
        recurringDays: [1,3,5],
        startTime: '06:00',
      });

      expect(result.schedule_type).toBe('recurring');
      expect(result.recurring_days).toEqual([1,3,5]);
    });

    it('should create an on-demand schedule', async () => {
      dataSource.query.mockResolvedValue([{
        id: 'sch-2', schedule_type: 'on_demand', scheduled_date: '2026-03-07',
      }]);

      const result = await service.createSchedule('dlh_demo', {
        vehicleId: 'v-1',
        driverId: 'd-1',
        routeName: 'Rute Darurat',
        scheduleType: 'on_demand',
        scheduledDate: '2026-03-07',
        startTime: '08:00',
      });

      expect(result.schedule_type).toBe('on_demand');
    });
  });

  describe('addStop', () => {
    it('should add a TPS stop to a schedule', async () => {
      dataSource.query.mockResolvedValue([{
        id: 'stop-1', schedule_id: 'sch-1', tps_id: 'tps-1', stop_order: 1,
      }]);

      const result = await service.addStop('dlh_demo', 'sch-1', { tpsId: 'tps-1', stopOrder: 1 });

      expect(result.stop_order).toBe(1);
    });
  });

  describe('getTodaySchedules', () => {
    it('should return schedules for today for a driver', async () => {
      dataSource.query.mockResolvedValue([
        { id: 'sch-1', route_name: 'Rute Menteng', status: 'pending' },
      ]);

      const result = await service.getTodaySchedules('dlh_demo', 'd-1');

      expect(result).toHaveLength(1);
    });
  });
});
