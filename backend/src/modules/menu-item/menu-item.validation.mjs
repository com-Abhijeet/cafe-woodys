import { z } from 'zod';

export const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').trim(),
  description: z.string().optional().nullable(),
  price: z.number().int().min(0, 'Price in paise must be positive'),
  category: z.string().min(1, 'Category is required').trim(),
  isAvailable: z.boolean().default(true)
});

export const updateMenuItemSchema = createMenuItemSchema.partial();
