import { supplierService } from './supplier.service.mjs';
import { createSupplierSchema, updateSupplierSchema } from './supplier.validation.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';

export const supplierController = {
  async listSuppliers(req, res, next) {
    try {
      const suppliers = await supplierService.listSuppliers();
      return res.json({ data: suppliers });
    } catch (err) {
      next(err);
    }
  },

  async getSupplierById(req, res, next) {
    try {
      const supplier = await supplierService.getSupplierById(req.params.id);
      return res.json({ data: supplier });
    } catch (err) {
      next(err);
    }
  },

  async createSupplier(req, res, next) {
    try {
      const parseResult = createSupplierSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid supplier input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }
      const newSupplier = await supplierService.createSupplier(parseResult.data);
      return res.status(201).json({ data: newSupplier });
    } catch (err) {
      next(err);
    }
  },

  async updateSupplier(req, res, next) {
    try {
      const parseResult = updateSupplierSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid supplier update input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }
      const updated = await supplierService.updateSupplier(req.params.id, parseResult.data);
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteSupplier(req, res, next) {
    try {
      await supplierService.deleteSupplier(req.params.id);
      return res.json({ data: { message: 'Supplier deleted successfully' } });
    } catch (err) {
      next(err);
    }
  }
};
