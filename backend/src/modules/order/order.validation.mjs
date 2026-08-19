import { z } from 'zod';

export const createOrderSchema = z.object({
  tableId: z.string().optional().nullable(),
  orderType: z.enum(['DINE_IN', 'PARCEL']).default('DINE_IN'),
  customerId: z.string().optional().nullable(),
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1')
  })).min(1, 'Order must contain at least one item')
});

export const updateKitchenStatusSchema = z.object({
  kitchenStatus: z.enum(['PENDING', 'PREPARING', 'READY', 'SERVED'])
});

export const voidOrderItemSchema = z.object({
  reason: z.string().min(1, 'Reason for voiding item is mandatory')
});
