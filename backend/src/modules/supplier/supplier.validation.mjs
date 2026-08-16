import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').trim(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable()
});

export const updateSupplierSchema = createSupplierSchema.partial();
