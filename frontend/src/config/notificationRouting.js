// Role-Based Live Notification Routing Config

export const NOTIFICATION_ROUTING = {
  ORDER_CREATED: {
    roles: ['KITCHEN', 'ADMIN'],
    sound: 'chime',
    message: (data) => `New order — ${data.table?.name || 'Table'} ticket received`,
    targetTab: 'ORDERS_BOARD'
  },
  ORDER_KITCHEN_STATUS_UPDATED_READY: {
    roles: ['WAITER', 'COUNTER', 'ADMIN'],
    sound: 'ping',
    message: (data) => `Ready to serve — ${data.table?.name || 'Table'} order is ready`,
    targetTab: 'ORDERS_BOARD'
  },
  INVENTORY_LOW_STOCK: {
    roles: ['ADMIN'],
    sound: 'ping',
    message: (data) => `Low stock alert: ${data.itemName || 'Raw Material'} below threshold`,
    targetTab: 'INVENTORY'
  }
};

export function shouldNotifyUser(eventType, userRole) {
  const route = NOTIFICATION_ROUTING[eventType];
  if (!route) return false;
  return route.roles.includes(userRole);
}
