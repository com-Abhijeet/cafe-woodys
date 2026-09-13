import { printerRepository } from './printer.repository.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';
import { broadcastSettingsUpdated } from '../../realtime/broadcast.mjs';

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
    const created = await printerRepository.create(data);
    broadcastSettingsUpdated('PRINTERS', created);
    return created;
  },

  async updatePrinter(id, data) {
    await this.getPrinterById(id);
    const updated = await printerRepository.update(id, data);
    broadcastSettingsUpdated('PRINTERS', updated);
    return updated;
  },

  async deletePrinter(id) {
    await this.getPrinterById(id);
    const deleted = await printerRepository.delete(id);
    broadcastSettingsUpdated('PRINTERS', deleted);
    return deleted;
  }
};
