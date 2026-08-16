import { gamingSessionRepository } from './gaming-session.repository.mjs';
import { tableService } from '../table/table.service.mjs';
import { tableRepository } from '../table/table.repository.mjs';
import { broadcastGamingSessionUpdate, broadcastTableUpdate } from '../../realtime/broadcast.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';
import { ConflictError } from '../../shared/errors/conflict-error.mjs';

/**
 * Slab Pricing Calculator:
 * 0-30 min -> halfHourRate
 * 31-60 min -> hourlyRate
 * 61-90 min -> hourlyRate + halfHourRate
 * 91-120 min -> 2 * hourlyRate
 * Clamped by maxChargeCap if defined.
 */
export function calculateSlotCharge(elapsedMinutes, halfHourRate, hourlyRate, maxChargeCap = null) {
  if (elapsedMinutes <= 0) return 0;

  const fullHours = Math.floor(elapsedMinutes / 60);
  const remainder = elapsedMinutes % 60;

  let charge = fullHours * (hourlyRate || 0);
  if (remainder > 0) {
    charge += remainder <= 30 ? (halfHourRate || 0) : (hourlyRate || 0);
  }

  if (maxChargeCap && maxChargeCap > 0) {
    charge = Math.min(charge, maxChargeCap);
  }

  return charge;
}

export const gamingSessionService = {
  async getActiveSessions(tableId) {
    const table = await tableService.getTableById(tableId);
    if (!table) {
      throw new NotFoundError('Table not found', 'TABLE_NOT_FOUND');
    }

    const sessions = await gamingSessionRepository.findActiveByTableId(tableId);
    const now = new Date();

    return sessions.map((session) => {
      const elapsedMinutes = Math.max(1, Math.ceil((now - new Date(session.startTime)) / (1000 * 60)));
      const estimatedCharge = calculateSlotCharge(
        elapsedMinutes,
        session.halfHourRateSnapshot,
        session.hourlyRateSnapshot,
        session.maxChargeCap
      );

      return {
        ...session,
        elapsedMinutes,
        estimatedCharge
      };
    });
  },

  async startPlayerSession(tableId, { playerLabel }) {
    const table = await tableService.getTableById(tableId);
    if (!table) {
      throw new NotFoundError('Table not found', 'TABLE_NOT_FOUND');
    }

    if (table.zone?.type !== 'GAMING') {
      throw new ValidationError('Gaming sessions can only be created on Gaming Zone tables', 'NOT_GAMING_TABLE');
    }

    const activeCount = await gamingSessionRepository.countActiveByTableId(tableId);
    const maxAllowed = table.effectiveMaxPlayers || 4;

    if (activeCount >= maxAllowed) {
      throw new ConflictError(
        `Table '${table.name}' is full (${activeCount}/${maxAllowed} players). Cannot add more players.`,
        'TABLE_FULL'
      );
    }

    const halfHourRateSnapshot = table.effectiveHalfHourRate || 0;
    const hourlyRateSnapshot = table.effectiveHourlyRate || 0;
    const label = playerLabel?.trim() || `Player ${activeCount + 1}`;

    const newSession = await gamingSessionRepository.create({
      tableId,
      playerLabel: label,
      halfHourRateSnapshot,
      hourlyRateSnapshot,
      maxChargeCap: table.maxChargeCap || null,
      status: 'ACTIVE',
      startTime: new Date()
    });

    // Automatically set table status to OCCUPIED if it was FREE
    if (table.status === 'FREE') {
      await tableRepository.update(tableId, { status: 'OCCUPIED' });
    }

    const updatedTable = await tableService.getTableById(tableId);
    broadcastGamingSessionUpdate(newSession);
    broadcastTableUpdate(updatedTable);

    return {
      ...newSession,
      elapsedMinutes: 0,
      estimatedCharge: 0
    };
  },

  async closePlayerSession(tableId, sessionId) {
    const session = await gamingSessionRepository.findById(sessionId);
    if (!session || session.tableId !== tableId) {
      throw new NotFoundError('Gaming session not found for this table', 'SESSION_NOT_FOUND');
    }

    if (session.status === 'CLOSED') {
      throw new ConflictError('Gaming session is already closed', 'SESSION_ALREADY_CLOSED');
    }

    const endTime = new Date();
    const elapsedMinutes = Math.max(1, Math.ceil((endTime - new Date(session.startTime)) / (1000 * 60)));
    const calculatedCharge = calculateSlotCharge(
      elapsedMinutes,
      session.halfHourRateSnapshot,
      session.hourlyRateSnapshot,
      session.maxChargeCap
    );

    const closed = await gamingSessionRepository.closeSession(sessionId, endTime);
    const updatedTable = await tableService.getTableById(tableId);
    broadcastGamingSessionUpdate(closed);
    broadcastTableUpdate(updatedTable);

    return {
      ...closed,
      elapsedMinutes,
      calculatedCharge
    };
  }
};
