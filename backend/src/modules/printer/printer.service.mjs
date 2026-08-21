import { printerRepository } from './printer.repository.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';

export const printerService = {
  async listPrinters() {
    return printerRepository.findAll();
  },

  async getPrinterById(id) {
    const config = await printerRepository.findById(id);
    if (!config) {
      throw new NotFoundError('Printer configuration not found', 'PRINTER_NOT_FOUND');
    }
    return config;
  },

  async getDefaultPrinter(purpose = 'BILLING') {
    return printerRepository.findByDefault(purpose);
  },

  async createPrinter(data) {
    return printerRepository.create(data);
  },

  async updatePrinter(id, data) {
    await this.getPrinterById(id);
    return printerRepository.update(id, data);
  },

  async deletePrinter(id) {
    await this.getPrinterById(id);
    return printerRepository.delete(id);
  }
};
