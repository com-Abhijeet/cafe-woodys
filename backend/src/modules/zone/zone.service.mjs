import { zoneRepository } from './zone.repository.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';
import { ConflictError } from '../../shared/errors/conflict-error.mjs';

export const zoneService = {
  async listZones() {
    return zoneRepository.findAll();
  },

  async getZoneById(id) {
    const zone = await zoneRepository.findById(id);
    if (!zone) {
      throw new NotFoundError('Zone not found', 'ZONE_NOT_FOUND');
    }
    return zone;
  },

  async createZone(data) {
    const cleanData = { ...data };
    if (cleanData.type === 'CAFE') {
      cleanData.defaultHalfHourRate = null;
      cleanData.defaultHourlyRate = null;
      cleanData.defaultMaxPlayers = null;
    }
    return zoneRepository.create(cleanData);
  },

  async updateZone(id, data) {
    const existing = await zoneRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Zone not found', 'ZONE_NOT_FOUND');
    }

    const cleanData = { ...data };
    const targetType = cleanData.type || existing.type;

    if (targetType === 'CAFE') {
      cleanData.defaultHalfHourRate = null;
      cleanData.defaultHourlyRate = null;
      cleanData.defaultMaxPlayers = null;
    }

    return zoneRepository.update(id, cleanData);
  },

  async deleteZone(id) {
    const existing = await zoneRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Zone not found', 'ZONE_NOT_FOUND');
    }

    const tableCount = await zoneRepository.countTables(id);
    if (tableCount > 0) {
      throw new ConflictError(`Cannot delete zone '${existing.name}' because it contains ${tableCount} table(s). Remove or reassign tables first.`, 'ZONE_HAS_TABLES');
    }

    return zoneRepository.delete(id);
  }
};
