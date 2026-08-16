import { z } from 'zod';

export const generateBillSchema = z.object({
  discountAmount: z.number().int().min(0).default(0), // paise
  taxAmount: z.number().int().min(0).default(0),      // paise
  customerId: z.string().optional().nullable()
});

export const addPaymentSchema = z.object({
  amount: z.number().int().min(1, 'Payment amount must be greater than 0 paise'),
  method: z.enum(['CASH', 'UPI', 'CARD', 'OTHER']),
  reference: z.string().optional().nullable()
});
