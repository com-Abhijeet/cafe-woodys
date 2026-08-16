import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
  password: z.string().min(1, 'Password is required')
});

export const createStaffSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'WAITER', 'KITCHEN', 'COUNTER'], {
    errorMap: () => ({ message: 'Role must be ADMIN, WAITER, KITCHEN, or COUNTER' })
  })
});
