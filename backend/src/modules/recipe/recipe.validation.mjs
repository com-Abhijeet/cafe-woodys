import { z } from 'zod';

export const addIngredientSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory Item ID is required'),
  quantity: z.number().gt(0, 'Quantity must be greater than 0')
});

export const updateIngredientSchema = z.object({
  quantity: z.number().gt(0, 'Quantity must be greater than 0')
});
