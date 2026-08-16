import { authService } from './auth.service.mjs';
import { loginSchema, createStaffSchema } from './auth.validation.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';

export const authController = {
  async login(req, res, next) {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed for login', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }

      const result = await authService.login(parseResult.data);
      return res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const staff = await authService.getStaffById(req.user.id);
      return res.json({ data: staff });
    } catch (err) {
      next(err);
    }
  },

  async createStaff(req, res, next) {
    try {
      const parseResult = createStaffSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Validation failed for staff creation', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }

      const newStaff = await authService.createStaff(parseResult.data);
      return res.status(201).json({ data: newStaff });
    } catch (err) {
      next(err);
    }
  },

  async listStaff(req, res, next) {
    try {
      const staffList = await authService.listStaff();
      return res.json({ data: staffList });
    } catch (err) {
      next(err);
    }
  },

  async updateStaff(req, res, next) {
    try {
      const { id } = req.params;
      const { role, isActive } = req.body;
      const updated = await authService.updateStaff(id, { role, isActive });
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { password } = req.body;
      if (!password || password.length < 4) {
        throw new ValidationError('New password must be at least 4 characters long', 'INVALID_PASSWORD');
      }

      const updated = await authService.resetPassword(id, password);
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async toggleStaffStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const updated = await authService.toggleStaffStatus(id, Boolean(isActive));
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
};
