import http from 'http';
import app from './app.mjs';
import { config } from './config/env.mjs';
import { initWebSocketServer } from './realtime/socket-server.mjs';

const server = http.createServer(app);

// Initialize WebSocket server attached to HTTP server
initWebSocketServer(server);

server.listen(config.port, () => {
  console.log(`🚀 Cafe Woody's Backend running on http://localhost:${config.port}`);
  console.log(`📡 Realtime WebSocket server initialized on wss://localhost:${config.port}`);
});
