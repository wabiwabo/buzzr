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

  describe('listSchedulesPaginated', () => {
    it('should return paginated schedules with meta', async () => {
      dataSource.query
        .mockResolvedValueOnce([{ id: 'sch-1', route_name: 'Rute Menteng', status: 'pending' }])
        .mockResolvedValueOnce([{ count: '20' }]);

      const result = await service.listSchedulesPaginated('dlh_demo', {
        page: 1, limit: 25, order: 'desc',
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(20);
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

  describe('getActiveSchedules', () => {
    it('should return today active schedules for all drivers with stops', async () => {
      dataSource.query.mockResolvedValue([
        {
          id: 's-1',
          route_name: 'Rute Selatan',
          schedule_type: 'recurring',
          status: 'in_progress',
          start_time: '07:00:00',
          driver_id: 'd-1',
          driver_name: 'Ahmad',
          vehicle_id: 'v-1',
          vehicle_plate: 'B 1234 CD',
          stops: [
            { id: 'st-1', tps_id: 't-1', tps_name: 'TPS Merdeka', stop_order: 1, estimated_arrival: '07:30:00' },
          ],
        },
      ]);

      const result = await service.getActiveSchedules('dlh_demo');

      expect(result).toHaveLength(1);
      expect(result[0].driver_name).toBe('Ahmad');
      expect(result[0].vehicle_plate).toBe('B 1234 CD');
      expect(result[0].stops).toHaveLength(1);
    });
  });

  describe('reassignSchedule', () => {
    it('should reassign schedule to new driver and vehicle', async () => {
      dataSource.query.mockResolvedValue([{
        id: 's-1',
        driver_id: 'd-2',
        vehicle_id: 'v-2',
      }]);

      const result = await service.reassignSchedule('dlh_demo', 's-1', {
        driverId: 'd-2',
        vehicleId: 'v-2',
      });

      expect(result.driver_id).toBe('d-2');
      expect(result.vehicle_id).toBe('v-2');
    });

    it('should throw if schedule not found', async () => {
      dataSource.query.mockResolvedValue([]);

      await expect(
        service.reassignSchedule('dlh_demo', 's-999', { driverId: 'd-2', vehicleId: 'v-2' }),
      ).rejects.toThrow('Jadwal tidak ditemukan');
    });
  });
});
