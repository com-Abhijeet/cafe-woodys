import { supplierRepository } from './supplier.repository.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';

export const supplierService = {
  async listSuppliers() {
    return supplierRepository.findAll();
  },

  async getSupplierById(id) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw new NotFoundError('Supplier not found', 'SUPPLIER_NOT_FOUND');
    }
    return supplier;
  },

  async createSupplier(data) {
    return supplierRepository.create(data);
  },

  async updateSupplier(id, data) {
    const existing = await supplierRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Supplier not found', 'SUPPLIER_NOT_FOUND');
    }
    return supplierRepository.update(id, data);
  },

  async deleteSupplier(id) {
    const existing = await supplierRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Supplier not found', 'SUPPLIER_NOT_FOUND');
    }
    return supplierRepository.delete(id);
  }
};
