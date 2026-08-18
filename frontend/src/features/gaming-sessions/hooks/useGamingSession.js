import { useState, useEffect, useCallback } from 'react';
import {
  fetchActiveGamingSessionsApi,
  startPlayerSessionApi,
  closePlayerSessionApi
} from '../api/gaming-sessions.api';

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

export function useGamingSession(tableId) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [, setTick] = useState(0);

  const fetchSessions = useCallback(async () => {
    if (!tableId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchActiveGamingSessionsApi(tableId);
      setSessions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Live timer tick every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const startSession = async (playerLabel) => {
    const newSession = await startPlayerSessionApi(tableId, playerLabel);
    await fetchSessions();
    return newSession;
  };

  const closeSession = async (sessionId, endTime) => {
    const closed = await closePlayerSessionApi(tableId, sessionId, endTime);
    await fetchSessions();
    return closed;
  };

  // Helper to format live duration string (e.g. 01h 24m 05s)
  const getFormattedDuration = (startTime) => {
    const elapsedMs = Math.max(0, new Date() - new Date(startTime));
    const secondsTotal = Math.floor(elapsedMs / 1000);
    const hrs = Math.floor(secondsTotal / 3600);
    const mins = Math.floor((secondsTotal % 3600) / 60);
    const secs = secondsTotal % 60;

    const pad = (n) => String(n).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}h ${pad(mins)}m ${pad(secs)}s`;
    }
    return `${pad(mins)}m ${pad(secs)}s`;
  };

  const getEstimatedCharge = (session) => {
    const elapsedMs = Math.max(0, new Date() - new Date(session.startTime));
    const elapsedMinutes = Math.max(1, Math.ceil(elapsedMs / (1000 * 60)));
    return calculateSlotCharge(
      elapsedMinutes,
      session.halfHourRateSnapshot,
      session.hourlyRateSnapshot,
      session.maxChargeCap
    );
  };

  return {
    sessions,
    isLoading,
    error,
    refreshSessions: fetchSessions,
    startSession,
    closeSession,
    getFormattedDuration,
    getEstimatedCharge
  };
}
