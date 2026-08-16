import { z } from 'zod';

export const createZoneSchema = z.object({
  name: z.string().min(1, 'Zone name is required').trim(),
  type: z.enum(['CAFE', 'GAMING']),
  defaultHalfHourRate: z.number().int().min(0).nullable().optional(),
  defaultHourlyRate: z.number().int().min(0).nullable().optional(),
  defaultMaxPlayers: z.number().int().min(1).nullable().optional()
});

export const updateZoneSchema = createZoneSchema.partial();
