import { z } from 'zod';

export const createPrinterSchema = z.object({
  name: z.string().min(1, 'Printer name is required'),
  purpose: z.enum(['BILLING', 'KITCHEN']),
  connectionType: z.enum(['TCP', 'USB', 'BLUETOOTH', 'SYSTEM_DEFAULT']).default('TCP'),
  ipAddress: z.string().optional().nullable(),
  paperWidthMm: z.number().int().min(40).max(120).default(80),
  charsPerLineOverride: z.number().int().optional().nullable(),
  isEnabled: z.boolean().default(true),
  isDefault: z.boolean().default(false)
});

export const updatePrinterSchema = createPrinterSchema.partial();
