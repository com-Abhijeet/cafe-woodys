import { zoneService } from './zone.service.mjs';
import { createZoneSchema, updateZoneSchema } from './zone.validation.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';

export const zoneController = {
  async listZones(req, res, next) {
    try {
      const zones = await zoneService.listZones();
      return res.json({ data: zones });
    } catch (err) {
      next(err);
    }
  },

  async getZoneById(req, res, next) {
    try {
      const zone = await zoneService.getZoneById(req.params.id);
      return res.json({ data: zone });
    } catch (err) {
      next(err);
    }
  },

  async createZone(req, res, next) {
    try {
      const parseResult = createZoneSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid zone data', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }
      const newZone = await zoneService.createZone(parseResult.data);
      return res.status(201).json({ data: newZone });
    } catch (err) {
      next(err);
    }
  },

  async updateZone(req, res, next) {
    try {
      const parseResult = updateZoneSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid zone update data', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }
      const updated = await zoneService.updateZone(req.params.id, parseResult.data);
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteZone(req, res, next) {
    try {
      await zoneService.deleteZone(req.params.id);
      return res.json({ data: { message: 'Zone deleted successfully' } });
    } catch (err) {
      next(err);
    }
  }
};
