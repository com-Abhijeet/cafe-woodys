import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.mjs';

let wss = null;
const clients = new Set();

export function initWebSocketServer(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(4001, 'Unauthorized: Missing JWT Token');
        return;
      }

      const decoded = jwt.verify(token, config.jwtSecret);
      ws.user = decoded;
      ws.isAlive = true;

      clients.add(ws);
      console.log(`📡 WebSocket client connected: ${decoded.username} (${clients.size} connected)`);

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('close', () => {
        clients.delete(ws);
        console.log(`🔌 WebSocket client disconnected: ${decoded.username} (${clients.size} remaining)`);
      });

      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        clients.delete(ws);
      });

      // Send initial connection ACK
      ws.send(JSON.stringify({ event: 'CONNECTED', payload: { message: 'Realtime POS stream active' } }));

    } catch (err) {
      console.error('WebSocket auth failed:', err.message);
      ws.close(4002, 'Unauthorized: Invalid JWT Token');
    }
  });

  // Heartbeat ping interval every 30s
  const interval = setInterval(() => {
    for (const ws of clients) {
      if (ws.isAlive === false) {
        clients.delete(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

export function broadcastMessage(eventType, payload) {
  const message = JSON.stringify({
    event: eventType,
    payload,
    timestamp: new Date().toISOString()
  });

  let sentCount = 0;
  for (const client of clients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
      sentCount++;
    }
  }

  if (sentCount > 0) {
    console.log(`📢 Realtime Broadcast [${eventType}] sent to ${sentCount} clients`);
  }
}
