import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      menuItemId: z.string().min(1, 'Menu Item ID is required'),
      quantity: z.number().int().min(1, 'Quantity must be at least 1')
    })
  ).min(1, 'Order must contain at least one item'),
  customerId: z.string().optional().nullable()
});

export const updateKitchenStatusSchema = z.object({
  kitchenStatus: z.enum(['PREPARING', 'READY', 'SERVED'], {
    errorMap: () => ({ message: "kitchenStatus must be one of 'PREPARING', 'READY', or 'SERVED'" })
  })
});
