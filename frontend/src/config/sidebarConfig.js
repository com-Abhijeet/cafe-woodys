// Centralized Role-Based Navigation Configuration

export const ROLE_SIDEBAR_PERMISSIONS = {
  ADMIN: ['FLOOR', 'ORDERS_BOARD', 'ACTIVE_BILLS', 'MENU', 'INVENTORY', 'PURCHASES', 'CUSTOMERS', 'DAYBOOK', 'PAYMENTS', 'BILLS', 'REPORTS', 'SETTINGS', 'PRINT_LOGS'],
  WAITER: ['FLOOR', 'ORDERS_BOARD', 'ACTIVE_BILLS', 'CUSTOMERS', 'BILLS'],
  COUNTER: ['FLOOR', 'ORDERS_BOARD', 'ACTIVE_BILLS', 'CUSTOMERS', 'DAYBOOK', 'PAYMENTS', 'BILLS', 'PRINT_LOGS'],
  KITCHEN: ['ORDERS_BOARD']
};

export const ROLE_MOBILE_PRIMARY_PERMISSIONS = {
  ADMIN: ['FLOOR', 'ORDERS_BOARD', 'CUSTOMERS', 'PAYMENTS'],
  COUNTER: ['FLOOR', 'ORDERS_BOARD', 'CUSTOMERS', 'PAYMENTS'],
  WAITER: ['FLOOR', 'ORDERS_BOARD', 'CUSTOMERS', 'BILLS'],
  KITCHEN: ['ORDERS_BOARD']
};

export const DEFAULT_ROLE_HOME_TAB = {
  ADMIN: 'FLOOR',
  WAITER: 'FLOOR',
  COUNTER: 'FLOOR',
  KITCHEN: 'ORDERS_BOARD'
};

export function isSectionVisibleForRole(sectionKey, role = 'ADMIN') {
  const allowed = ROLE_SIDEBAR_PERMISSIONS[role] || ROLE_SIDEBAR_PERMISSIONS.ADMIN;
  return allowed.includes(sectionKey);
}

export function getMobilePrimarySections(role = 'ADMIN') {
  return ROLE_MOBILE_PRIMARY_PERMISSIONS[role] || ROLE_MOBILE_PRIMARY_PERMISSIONS.ADMIN;
}

export function getMobileMoreSections(role = 'ADMIN') {
  const allAllowed = ROLE_SIDEBAR_PERMISSIONS[role] || ROLE_SIDEBAR_PERMISSIONS.ADMIN;
  const primary = getMobilePrimarySections(role);
  return allAllowed.filter((key) => !primary.includes(key));
}

export function getDefaultTabForRole(role = 'ADMIN') {
  return DEFAULT_ROLE_HOME_TAB[role] || 'FLOOR';
}
