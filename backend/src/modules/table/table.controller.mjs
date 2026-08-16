import { tableService } from './table.service.mjs';
import { createTableSchema, updateTableSchema } from './table.validation.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';

export const tableController = {
  async listTables(req, res, next) {
    try {
      const { zoneId } = req.query;
      const tables = await tableService.listTables(zoneId);
      return res.json({ data: tables });
    } catch (err) {
      next(err);
    }
  },

  async getTableById(req, res, next) {
    try {
      const table = await tableService.getTableById(req.params.id);
      return res.json({ data: table });
    } catch (err) {
      next(err);
    }
  },

  async createTable(req, res, next) {
    try {
      const parseResult = createTableSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid table data', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }
      const newTable = await tableService.createTable(parseResult.data);
      return res.status(201).json({ data: newTable });
    } catch (err) {
      next(err);
    }
  },

  async updateTable(req, res, next) {
    try {
      const parseResult = updateTableSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid table update data', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }
      const updated = await tableService.updateTable(req.params.id, parseResult.data);
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteTable(req, res, next) {
    try {
      await tableService.deleteTable(req.params.id);
      return res.json({ data: { message: 'Table deleted successfully' } });
    } catch (err) {
      next(err);
    }
  }
};
