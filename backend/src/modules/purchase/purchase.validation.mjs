import { z } from 'zod';

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier ID is required'),
  items: z.array(
    z.object({
      inventoryItemId: z.string().min(1, 'Inventory Item ID is required'),
      quantity: z.number().gt(0, 'Quantity must be greater than 0'),
      costPerUnit: z.number().int().min(0, 'Cost per unit in paise must be non-negative')
    })
  ).min(1, 'Purchase order must contain at least one line item')
});

export const addPurchasePaymentSchema = z.object({
  amount: z.number().int().min(1, 'Payment amount must be greater than 0 paise'),
  method: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']),
  reference: z.string().optional().nullable()
});
