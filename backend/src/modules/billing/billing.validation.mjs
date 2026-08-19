import { z } from 'zod';

export const generateBillSchema = z.object({
  discountAmount: z.number().int().min(0).default(0), // paise
  discountReason: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  autoPayMethod: z.enum(['CASH', 'UPI', 'CARD', 'OTHER']).optional().nullable(),
  ignoreKitchenWarning: z.boolean().optional().default(false),
  correctionOfBillId: z.string().optional().nullable()
});

export const addPaymentSchema = z.object({
  amount: z.number().int().min(1, 'Payment amount must be greater than 0 paise'),
  method: z.enum(['CASH', 'UPI', 'CARD', 'OTHER']),
  reference: z.string().optional().nullable()
});

export const voidBillSchema = z.object({
  reason: z.string().min(1, 'Reason for voiding bill is mandatory')
});

export const recordRefundSchema = z.object({
  amount: z.number().int().min(1, 'Refund amount must be greater than 0 paise'),
  reason: z.string().min(1, 'Reason for refund is mandatory'),
  method: z.enum(['CASH', 'UPI', 'CARD', 'OTHER'])
});
