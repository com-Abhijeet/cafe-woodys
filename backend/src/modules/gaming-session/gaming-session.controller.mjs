import { gamingSessionService } from './gaming-session.service.mjs';
import { createGamingSessionSchema } from './gaming-session.validation.mjs';
import { ValidationError } from '../../shared/errors/validation-error.mjs';

export const gamingSessionController = {
  async getActiveSessions(req, res, next) {
    try {
      const { tableId } = req.params;
      const sessions = await gamingSessionService.getActiveSessions(tableId);
      return res.json({ data: sessions });
    } catch (err) {
      next(err);
    }
  },

  async startPlayerSession(req, res, next) {
    try {
      const { tableId } = req.params;
      const parseResult = createGamingSessionSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new ValidationError('Invalid session input', 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
      }

      const session = await gamingSessionService.startPlayerSession(tableId, parseResult.data);
      return res.status(201).json({ data: session });
    } catch (err) {
      next(err);
    }
  },

  async closePlayerSession(req, res, next) {
    try {
      const { tableId, id } = req.params;
      const { endTime } = req.body || {};
      const closedSession = await gamingSessionService.closePlayerSession(tableId, id, { endTime });
      return res.json({ data: closedSession });
    } catch (err) {
      next(err);
    }
  },

  async quickAddPlayerSessions(req, res, next) {
    try {
      const { tableId } = req.params;
      const { playerCount, durationMinutes, flatAmountOverride } = req.body || {};
      const sessions = await gamingSessionService.quickAddPlayerSessions(tableId, {
        playerCount,
        durationMinutes,
        flatAmountOverride
      });
      return res.status(201).json({ data: sessions });
    } catch (err) {
      next(err);
    }
  }
};
