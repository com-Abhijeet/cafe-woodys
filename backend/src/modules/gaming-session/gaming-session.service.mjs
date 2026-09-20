import { gamingSessionRepository } from './gaming-session.repository.mjs';
import { tableService } from '../table/table.service.mjs';
import { tableRepository } from '../table/table.repository.mjs';
import { businessProfileService } from '../business-profile/business-profile.service.mjs';
import { taxSettingsService } from '../tax-settings/tax-settings.service.mjs';
import { gamingSettingsService } from '../gaming-settings/gaming-settings.service.mjs';
import { broadcastGamingSessionUpdate, broadcastTableUpdate } from '../../realtime/broadcast.mjs';
import { NotFoundError } from '../../shared/errors/not-found-error.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';
import { ConflictError } from '../../shared/errors/conflict-error.mjs';

/**
 * Applies a grace window at each 30-minute slab boundary.
 * e.g. 32 mins with 5m grace -> 30 mins (1 half-hour slab)
 * e.g. 63 mins with 5m grace -> 60 mins (1 hour slab)
 * e.g. 95 mins with 5m grace -> 90 mins (1 hr + 30m)
 */
export function applyGracePeriod(elapsedMinutes, graceMinutes = 5) {
  if (elapsedMinutes <= 0) return 0;
  const remainderInto30 = elapsedMinutes % 30;
  if (remainderInto30 > 0 && remainderInto30 <= graceMinutes) {
    return elapsedMinutes - remainderInto30;
  }
  return elapsedMinutes;
}

/**
 * Slab Pricing Calculator with Grace Period:
 * 0-30 min -> halfHourRate
 * 31-60 min -> hourlyRate
 * 61-90 min -> hourlyRate + halfHourRate
 * 91-120 min -> 2 * hourlyRate
 * Clamped by maxChargeCap if defined.
 */
export function calculateSlotCharge(elapsedMinutesRaw, halfHourRate, hourlyRate, maxChargeCap = null, graceMinutes = 5) {
  if (elapsedMinutesRaw <= 0) return 0;

  const elapsedMinutes = applyGracePeriod(elapsedMinutesRaw, graceMinutes);

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

    const gamingSettings = await gamingSettingsService.getSettings();
    const graceMinutes = gamingSettings?.gamingGracePeriodMinutes ?? 5;

    const sessions = await gamingSessionRepository.findActiveByTableId(tableId);
    const now = new Date();

    return sessions.map((session) => {
      const elapsedMinutes = Math.max(1, Math.ceil((now - new Date(session.startTime)) / (1000 * 60)));
      const estimatedCharge = calculateSlotCharge(
        elapsedMinutes,
        session.halfHourRateSnapshot,
        session.hourlyRateSnapshot,
        session.maxChargeCap,
        graceMinutes
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

    const taxSettings = await taxSettingsService.getSettings();
    const defaultGst = taxSettings ? Number(taxSettings.defaultGstPercent) : 5;
    const gstPercentSnapshot = table.zone?.gstPercent != null ? Number(table.zone.gstPercent) : defaultGst;

    const halfHourRateSnapshot = table.effectiveHalfHourRate || 0;
    const hourlyRateSnapshot = table.effectiveHourlyRate || 0;
    const label = playerLabel?.trim() || `Player ${activeCount + 1}`;

    const newSession = await gamingSessionRepository.create({
      tableId,
      playerLabel: label,
      halfHourRateSnapshot,
      hourlyRateSnapshot,
      maxChargeCap: table.maxChargeCap || null,
      gstPercentSnapshot,
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

  async closePlayerSession(tableId, sessionId, options = {}) {
    const session = await gamingSessionRepository.findById(sessionId);
    if (!session || session.tableId !== tableId) {
      throw new NotFoundError('Gaming session not found for this table', 'SESSION_NOT_FOUND');
    }

    if (session.status === 'CLOSED') {
      throw new ConflictError('Gaming session is already closed', 'SESSION_ALREADY_CLOSED');
    }

    const now = new Date();
    let targetEndTime = now;

    if (options.endTime) {
      const parsedEndTime = new Date(options.endTime);
      if (isNaN(parsedEndTime.getTime())) {
        throw new ValidationError('Invalid session end time format', 'INVALID_END_TIME');
      }
      if (parsedEndTime < new Date(session.startTime)) {
        throw new ValidationError('Session end time cannot be before start time', 'END_BEFORE_START');
      }
      if (parsedEndTime > now) {
        throw new ValidationError('Session end time cannot be in the future', 'FUTURE_END_TIME');
      }

      const diffMs = now.getTime() - parsedEndTime.getTime();
      const maxBackdateMs = 60 * 60 * 1000; // 60 minutes
      if (diffMs > maxBackdateMs) {
        throw new ValidationError('Session end time cannot be backdated by more than 60 minutes', 'EXCESSIVE_BACKDATE');
      }

      targetEndTime = parsedEndTime;
    }

    const profile = await businessProfileService.getProfile();
    const graceMinutes = profile?.gamingGracePeriodMinutes ?? 5;

    const elapsedMinutes = Math.max(1, Math.ceil((targetEndTime - new Date(session.startTime)) / (1000 * 60)));
    const calculatedCharge = calculateSlotCharge(
      elapsedMinutes,
      session.halfHourRateSnapshot,
      session.hourlyRateSnapshot,
      session.maxChargeCap,
      graceMinutes
    );

    const closed = await gamingSessionRepository.closeSession(sessionId, targetEndTime);
    const updatedTable = await tableService.getTableById(tableId);
    broadcastGamingSessionUpdate(closed);
    broadcastTableUpdate(updatedTable);

    return {
      ...closed,
      elapsedMinutes,
      calculatedCharge
    };
  },

  async quickAddPlayerSessions(tableId, { playerCount = 1, durationMinutes = 60, flatAmountOverride = null }) {
    const table = await tableService.getTableById(tableId);
    if (!table) {
      throw new NotFoundError('Table not found', 'TABLE_NOT_FOUND');
    }

    if (table.zone?.type !== 'GAMING') {
      throw new ValidationError('Quick-add gaming charges can only be added to Gaming Zone tables', 'NOT_GAMING_TABLE');
    }

    const count = parseInt(playerCount, 10);
    const duration = parseInt(durationMinutes, 10);

    if (isNaN(count) || count < 1) {
      throw new ValidationError('Player count must be at least 1', 'INVALID_PLAYER_COUNT');
    }
    if (isNaN(duration) || duration < 1) {
      throw new ValidationError('Duration minutes must be greater than 0', 'INVALID_DURATION');
    }

    const taxSettings = await taxSettingsService.getSettings();
    const defaultGst = taxSettings ? Number(taxSettings.defaultGstPercent) : 5;
    const gstPercentSnapshot = table.zone?.gstPercent != null ? Number(table.zone.gstPercent) : defaultGst;

    const halfHourRateSnapshot = table.effectiveHalfHourRate || 0;
    const hourlyRateSnapshot = table.effectiveHourlyRate || 0;

    const now = new Date();
    const startTime = new Date(now.getTime() - duration * 60 * 1000);
    const endTime = now;

    const sessionsToCreate = [];
    for (let i = 1; i <= count; i++) {
      sessionsToCreate.push({
        tableId,
        playerLabel: `Quick Add P${i}`,
        halfHourRateSnapshot,
        hourlyRateSnapshot,
        maxChargeCap: flatAmountOverride ? Math.round(flatAmountOverride / count) : (table.maxChargeCap || null),
        gstPercentSnapshot,
        status: 'CLOSED',
        startTime,
        endTime
      });
    }

    const createdSessions = await Promise.all(
      sessionsToCreate.map((sessionData) => gamingSessionRepository.create(sessionData))
    );

    if (table.status === 'FREE') {
      await tableRepository.update(tableId, { status: 'OCCUPIED' });
    }

    const updatedTable = await tableService.getTableById(tableId);
    broadcastTableUpdate(updatedTable);

    return createdSessions;
  }
};
