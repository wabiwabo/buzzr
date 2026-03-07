import { z } from 'zod';
import { TpsType, TpsStatus, WasteCategory } from '@buzzr/shared-types';

export const createTpsSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.nativeEnum(TpsType),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(5).max(500),
  areaId: z.string().uuid(),
  capacityTons: z.number().positive(),
});

export const recordWasteSchema = z.object({
  tpsId: z.string().uuid(),
  category: z.nativeEnum(WasteCategory),
  volumeKg: z.number().positive(),
  notes: z.string().max(500).optional(),
});

export type CreateTpsRequest = z.infer<typeof createTpsSchema>;
export type RecordWasteRequest = z.infer<typeof recordWasteSchema>;
