import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { token, logout } = useAuth();
  const [status, setStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected'
  const wsRef = useRef(null);
  const listenersRef = useRef(new Map());
  const reconnectTimerRef = useRef(null);
  const logoutRef = useRef(logout);

  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const connect = useCallback(() => {
    if (!token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setStatus('disconnected');
      return;
    }

    // Prevent duplicate connections if socket is already open or connecting
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        setStatus('connected');
        return;
      }
      if (wsRef.current.readyState === WebSocket.CONNECTING) {
        setStatus('connecting');
        return;
      }
    }

    let wsBaseUrl = import.meta.env.VITE_WS_URL;
    if (!wsBaseUrl) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
      wsBaseUrl = `${protocol}//${host}`;
    }

    // Remove trailing slash if present
    const cleanBaseUrl = wsBaseUrl.replace(/\/$/, '');
    const wsUrl = `${cleanBaseUrl}?token=${token}`;

    setStatus('connecting');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('📡 Single Shared WebSocket Connected to Café Woody\'s POS Stream');
        setStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { event: eventType, payload } = data;

          if (listenersRef.current.has(eventType)) {
            const callbacks = listenersRef.current.get(eventType);
            callbacks.forEach((cb) => cb(payload));
          }
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      ws.onclose = (event) => {
        setStatus('disconnected');
        wsRef.current = null;

        // Unauthorized / invalid token
        if (event.code === 4001 || event.code === 4002) {
          console.warn(`🔌 WebSocket auth failed (code ${event.code}: ${event.reason || 'Invalid JWT'}). Signing out...`);
          if (logoutRef.current) logoutRef.current();
          return;
        }

        // Retry connection after 3s for network drops
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
      };
    } catch (err) {
      console.error('Failed to initiate WebSocket:', err);
      setStatus('disconnected');
      wsRef.current = null;
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [token, connect]);

  const subscribe = useCallback((eventType, callback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType).add(callback);

    return () => {
      if (listenersRef.current.has(eventType)) {
        listenersRef.current.get(eventType).delete(callback);
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ status, subscribe, reconnect: connect }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}
