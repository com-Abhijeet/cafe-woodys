import { z } from 'zod';

export const createTableSchema = z.object({
  zoneId: z.string().min(1, 'Zone ID is required'),
  name: z.string().min(1, 'Table name is required').trim(),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  halfHourRate: z.number().int().min(0).nullable().optional(),
  hourlyRate: z.number().int().min(0).nullable().optional(),
  maxPlayers: z.number().int().min(1).nullable().optional(),
  status: z.enum(['FREE', 'OCCUPIED', 'RESERVED']).optional()
});

export const updateTableSchema = createTableSchema.partial();
