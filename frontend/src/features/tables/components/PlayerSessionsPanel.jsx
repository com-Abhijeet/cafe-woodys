import { useState } from 'react';
import { useGamingSession } from '../../gaming-sessions/hooks/useGamingSession';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { Gamepad2, Plus, Clock, AlertCircle } from 'lucide-react';
import styles from './TableWorkspaceModal.module.css';

export function PlayerSessionsPanel({ table, onRefreshTable }) {
  const {
    sessions,
    isLoading,
    error,
    startSession,
    closeSession,
    getFormattedDuration,
    getEstimatedCharge
  } = useGamingSession(table.id);

  const [playerLabel, setPlayerLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const maxPlayers = table.effectiveMaxPlayers || 4;
  const activeCount = sessions.length;
  const isTableFull = activeCount >= maxPlayers;

  const handleStartSession = async (e) => {
    e.preventDefault();
    setActionError('');
    setIsSubmitting(true);
    try {
      await startSession(playerLabel);
      setPlayerLabel('');
      if (onRefreshTable) onRefreshTable();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSession = async (sessionId, name) => {
    if (!confirm(`End gaming session for ${name}?`)) return;
    setActionError('');
    try {
      const closed = await closeSession(sessionId);
      alert(`Session ended for ${name}.\nElapsed: ${closed.elapsedMinutes} mins\nCharge: ₹${(closed.calculatedCharge / 100).toFixed(2)}`);
      if (onRefreshTable) onRefreshTable();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className={styles.gamingPanel}>
      <div className={styles.gamingHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Gamepad2 size={18} color="var(--color-gaming-zone)" />
          <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--color-gaming-zone)' }}>
            Active Seated Players ({activeCount} / {maxPlayers})
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
          Rates: ₹{(table.effectiveHalfHourRate || 0) / 100}/30m • ₹{(table.effectiveHourlyRate || 0) / 100}/hr
        </span>
      </div>

      {actionError && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', marginBottom: '8px' }}>{actionError}</div>}

      {!isTableFull ? (
        <form onSubmit={handleStartSession} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <Input
            placeholder={`Player ${activeCount + 1} Name / Label`}
            value={playerLabel}
            onChange={(e) => setPlayerLabel(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button type="submit" disabled={isSubmitting}>
            <Plus size={14} /> Seat Player
          </Button>
        </form>
      ) : (
        <div className={styles.fullWarning}>
          <AlertCircle size={14} /> Station capacity reached ({maxPlayers}/{maxPlayers}). End a session to seat a new player.
        </div>
      )}

      {isLoading ? (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Loading gaming sessions...</div>
      ) : error ? (
        <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{error}</div>
      ) : sessions.length === 0 ? (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
          No active players seated at this gaming station.
        </div>
      ) : (
        <div className={styles.playerRows}>
          {sessions.map((session) => {
            const estCharge = getEstimatedCharge(session);
            return (
              <div key={session.id} className={styles.playerRow}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-xs)' }}>{session.playerLabel}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Clock size={10} /> {getFormattedDuration(session.startTime)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: 'var(--text-xs)', color: 'var(--color-brand)' }}>
                    Est. ₹{(estCharge / 100).toFixed(2)}
                  </span>
                  <Button variant="danger" onClick={() => handleCloseSession(session.id, session.playerLabel)} style={{ padding: '2px 8px', fontSize: 'var(--text-xs)', minHeight: '28px' }}>
                    End
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
