// Cafe Woody's — Plain-Language Terminology Centralization Table
// Maps internal database/enum values to client-friendly display labels

export const KITCHEN_STATUS_LABELS = {
  PENDING: 'Waiting',
  PREPARING: 'Cooking',
  READY: 'Ready',
  SERVED: 'Served',
  CANCELLED: 'Cancelled'
};

export const KITCHEN_STATUS_COLUMN_TITLES = {
  PENDING: 'Waiting for Prep',
  PREPARING: 'Currently Cooking',
  READY: 'Ready to Serve',
  SERVED: 'Served to Table'
};

export const PAYMENT_STATUS_LABELS = {
  UNPAID: 'Unpaid',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid'
};

export const GAMING_STATUS_LABELS = {
  ACTIVE: 'Playing',
  CLOSED: 'Ended'
};

export const DISCOUNT_SCOPE_LABELS = {
  ALL: 'Entire Bill (Food + Gaming)',
  CAFE_ONLY: 'Food & Drinks Total Only',
  GAMING_ONLY: 'Gaming Charges Only',
  ZONE: 'Specific Station Zone Only'
};

export const TABLE_STATUS_LABELS = {
  FREE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved'
};

export function formatKitchenStatus(status) {
  return KITCHEN_STATUS_LABELS[status] || status || 'Waiting';
}

export function formatPaymentStatus(status) {
  return PAYMENT_STATUS_LABELS[status] || status || 'Unpaid';
}

export function formatGamingStatus(status) {
  return GAMING_STATUS_LABELS[status] || status || 'Playing';
}

export function formatTableStatus(status) {
  return TABLE_STATUS_LABELS[status] || status || 'Available';
}

export function formatDiscountScope(scope) {
  return DISCOUNT_SCOPE_LABELS[scope] || scope || 'Entire Bill';
}
