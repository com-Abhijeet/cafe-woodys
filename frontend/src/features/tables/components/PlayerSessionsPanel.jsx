import { useState } from 'react';
import { useGamingSession } from '../../gaming-sessions/hooks/useGamingSession';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { Gamepad2, Plus, Clock, AlertCircle, Check, X } from 'lucide-react';
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

  // End Session Backdate Modal / Active Selection State
  const [closingSession, setClosingSession] = useState(null); // session object
  const [backdateMinutes, setBackdateMinutes] = useState(0);

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

  const handleConfirmCloseSession = async () => {
    if (!closingSession) return;
    setActionError('');
    setIsSubmitting(true);

    try {
      let endTimeIso = null;
      if (backdateMinutes > 0) {
        const d = new Date();
        d.setMinutes(d.getMinutes() - backdateMinutes);
        endTimeIso = d.toISOString();
      }

      const closed = await closeSession(closingSession.id, endTimeIso);
      alert(
        `Session ended for ${closingSession.playerLabel}.\nElapsed: ${closed.elapsedMinutes} mins\nCharge: ₹${(closed.calculatedCharge / 100).toFixed(2)}`
      );
      setClosingSession(null);
      setBackdateMinutes(0);
      if (onRefreshTable) onRefreshTable();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
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
                  <Button
                    variant="danger"
                    onClick={() => { setClosingSession(session); setBackdateMinutes(0); }}
                    style={{ padding: '2px 8px', fontSize: 'var(--text-xs)', minHeight: '28px' }}
                  >
                    End Session
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual End-Time / Backdate Dialog Modal */}
      {closingSession && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            maxWidth: '400px',
            width: '90%',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-brand)' }}>
              End Session for {closingSession.playerLabel}
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Select session stop time. Default is now, or back-date up to 60 minutes if checkout was delayed.
            </p>

            <div style={{ margin: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>Adjust Stop Time:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[0, 5, 10, 15].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setBackdateMinutes(m)}
                    style={{
                      padding: '6px',
                      borderRadius: '6px',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                      border: '1px solid var(--color-border)',
                      backgroundColor: backdateMinutes === m ? 'var(--color-brand)' : 'var(--color-bg)',
                      color: backdateMinutes === m ? '#ffffff' : 'var(--color-text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    {m === 0 ? 'Now' : `-${m}m`}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Custom back-date (mins):</span>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={backdateMinutes}
                  onChange={(e) => setBackdateMinutes(Math.min(60, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                  style={{ width: '70px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: 'var(--text-xs)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="secondary" onClick={() => setClosingSession(null)}>Cancel</Button>
              <Button onClick={handleConfirmCloseSession} disabled={isSubmitting}>
                {isSubmitting ? 'Closing...' : 'Confirm & End Session'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
