import { printerService } from './printer.service.mjs';
import { createPrinterSchema, updatePrinterSchema } from './printer.validation.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';

export const printerController = {
  async listPrinters(req, res, next) {
    try {
      const printers = await printerService.listPrinters();
      return res.json({ data: printers });
    } catch (err) {
      next(err);
    }
  },

  async getPrinterById(req, res, next) {
    try {
      const printer = await printerService.getPrinterById(req.params.id);
      return res.json({ data: printer });
    } catch (err) {
      next(err);
    }
  },

  async createPrinter(req, res, next) {
    try {
      const parseResult = createPrinterSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid printer config payload', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }

      const created = await printerService.createPrinter(parseResult.data);
      return res.status(201).json({ data: created });
    } catch (err) {
      next(err);
    }
  },

  async updatePrinter(req, res, next) {
    try {
      const parseResult = updatePrinterSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid printer config update', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }

      const updated = await printerService.updatePrinter(req.params.id, parseResult.data);
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deletePrinter(req, res, next) {
    try {
      await printerService.deletePrinter(req.params.id);
      return res.json({ success: true, message: 'Printer configuration deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
};
