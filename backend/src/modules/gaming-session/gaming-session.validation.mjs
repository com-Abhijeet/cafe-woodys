import { z } from 'zod';

export const createGamingSessionSchema = z.object({
  playerLabel: z.string().max(50).optional().nullable()
});
