import { zoneRepository } from './zone.repository.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';
import { ConflictError } from '../../shared/errors/conflict-error.mjs';

// In-Memory Cache (60-second TTL) for Zone Configuration
let cachedZones = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60000;

function invalidateZoneCache() {
  cachedZones = null;
  cacheExpiry = 0;
}

export const zoneService = {
  async listZones() {
    if (cachedZones && Date.now() < cacheExpiry) {
      return cachedZones;
    }
    const zones = await zoneRepository.findAll();
    cachedZones = zones;
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return zones;
  },

  async getZoneById(id) {
    const zone = await zoneRepository.findById(id);
    if (!zone) {
      throw new NotFoundError('Zone not found', 'ZONE_NOT_FOUND');
    }
    return zone;
  },

  async createZone(data) {
    invalidateZoneCache();
    const cleanData = { ...data };
    if (cleanData.type === 'CAFE') {
      cleanData.defaultHalfHourRate = null;
      cleanData.defaultHourlyRate = null;
      cleanData.defaultMaxPlayers = null;
    }
    return zoneRepository.create(cleanData);
  },

  async updateZone(id, data) {
    invalidateZoneCache();
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
    invalidateZoneCache();
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
