import { tableRepository } from './table.repository.mjs';
import { zoneRepository } from '../zone/zone.repository.mjs';
import { broadcastTableUpdate } from '../../realtime/broadcast.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';
import { ConflictError } from '../../shared/errors/conflict-error.mjs';

function enrichTable(table) {
  if (!table) return null;
  const isGaming = table.zone?.type === 'GAMING';

  return {
    ...table,
    effectiveHalfHourRate: isGaming ? (table.halfHourRate ?? table.zone?.defaultHalfHourRate ?? null) : null,
    effectiveHourlyRate: isGaming ? (table.hourlyRate ?? table.zone?.defaultHourlyRate ?? null) : null,
    effectiveMaxPlayers: isGaming ? (table.maxPlayers ?? table.zone?.defaultMaxPlayers ?? null) : null,
    activePlayersCount: table.gamingSessions?.length || 0,
    hasOpenOrders: (table.orders?.length || 0) > 0
  };
}

export const tableService = {
  async listTables(zoneId) {
    const tables = await tableRepository.findAll(zoneId);
    return tables.map(enrichTable);
  },

  async getTableById(id) {
    const table = await tableRepository.findById(id);
    if (!table) {
      throw new NotFoundError('Table not found', 'TABLE_NOT_FOUND');
    }
    return enrichTable(table);
  },

  async createTable(data) {
    const zone = await zoneRepository.findById(data.zoneId);
    if (!zone) {
      throw new ValidationError('Specified Zone does not exist', 'ZONE_NOT_FOUND');
    }

    const cleanData = { ...data };
    if (zone.type === 'CAFE') {
      cleanData.halfHourRate = null;
      cleanData.hourlyRate = null;
      cleanData.maxPlayers = null;
    }

    const created = await tableRepository.create(cleanData);
    const enriched = enrichTable(created);
    broadcastTableUpdate(enriched);
    return enriched;
  },

  async updateTable(id, data) {
    const existing = await tableRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Table not found', 'TABLE_NOT_FOUND');
    }

    const cleanData = { ...data };
    const targetZoneId = cleanData.zoneId || existing.zoneId;
    const zone = await zoneRepository.findById(targetZoneId);

    if (zone && zone.type === 'CAFE') {
      cleanData.halfHourRate = null;
      cleanData.hourlyRate = null;
      cleanData.maxPlayers = null;
    }

    const updated = await tableRepository.update(id, cleanData);
    const enriched = enrichTable(updated);
    broadcastTableUpdate(enriched);
    return enriched;
  },

  async deleteTable(id) {
    const existing = await tableRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Table not found', 'TABLE_NOT_FOUND');
    }

    const historyCount = await tableRepository.countHistory(id);
    if (historyCount > 0) {
      throw new ConflictError(
        `Cannot delete table '${existing.name}' because it has existing orders or session history.`,
        'TABLE_HAS_HISTORY'
      );
    }

    return tableRepository.delete(id);
  }
};
