import { useWebSocket } from '../../hooks/useWebSocket';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function WebSocketStatusIndicator() {
  const { status, reconnect } = useWebSocket();

  if (status === 'connected') {
    return (
      <div
        title="Live Realtime WiFi Sync Active"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(46, 125, 79, 0.12)',
          color: 'var(--color-success)',
          fontSize: 'var(--text-xs)',
          fontWeight: 700
        }}
      >
        <Wifi size={14} /> Live Sync
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div
        title="Connecting to Realtime Stream..."
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(201, 139, 31, 0.12)',
          color: 'var(--color-warning)',
          fontSize: 'var(--text-xs)',
          fontWeight: 700
        }}
      >
        <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Syncing...
      </div>
    );
  }

  return (
    <button
      onClick={reconnect}
      title="Disconnected. Tap to retry connection."
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'rgba(196, 57, 43, 0.12)',
        color: 'var(--color-danger)',
        fontSize: 'var(--text-xs)',
        fontWeight: 700,
        border: 'none',
        cursor: 'pointer'
      }}
    >
      <WifiOff size={14} /> Offline (Retry)
    </button>
  );
}
