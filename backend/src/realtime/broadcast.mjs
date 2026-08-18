import { WS_EVENTS } from './events.mjs';
import { broadcastMessage } from './socket-server.mjs';

export function broadcastTableUpdate(table) {
  broadcastMessage(WS_EVENTS.TABLE_UPDATED, { table });
}

export function broadcastOrderCreated(order) {
  broadcastMessage(WS_EVENTS.ORDER_CREATED, { order });
}

export function broadcastKitchenStatusUpdated(order) {
  broadcastMessage(WS_EVENTS.ORDER_KITCHEN_STATUS_UPDATED, { order });
}

export function broadcastOrderBoardCleared(data) {
  broadcastMessage(WS_EVENTS.ORDER_BOARD_CLEARED, data);
}

export function broadcastGamingSessionUpdate(session) {
  broadcastMessage(WS_EVENTS.GAMING_SESSION_UPDATED, { session });
}

export function broadcastBillCreated(bill) {
  broadcastMessage(WS_EVENTS.BILL_CREATED, { bill });
}

export function broadcastInventoryLowStock({ itemId, itemName, currentStock, reorderThreshold }) {
  broadcastMessage(WS_EVENTS.INVENTORY_LOW_STOCK, { itemId, itemName, currentStock, reorderThreshold });
}
