import { z } from 'zod';

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').trim(),
  unit: z.enum(['KG', 'G', 'L', 'ML', 'PCS']),
  stockQuantity: z.number().min(0, 'Initial stock quantity cannot be negative').default(0),
  reorderThreshold: z.number().min(0, 'Reorder threshold cannot be negative').default(0),
  costPerUnit: z.number().int().min(0, 'Cost per unit in paise must be non-negative')
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export const createAdjustmentSchema = z.object({
  delta: z.number().refine((val) => val !== 0, 'Adjustment delta cannot be zero'),
  reason: z.enum(['WASTAGE', 'DAMAGE', 'CORRECTION', 'OTHER']),
  note: z.string().optional().nullable()
});
