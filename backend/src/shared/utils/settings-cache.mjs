/**
 * High-performance In-Memory TTL Cache for Singleton Settings.
 * Completely eliminates repetitive database queries for singleton configuration
 * (TaxSettings, PaymentSettings, GamingSettings, OrderSettings, KitchenPrintSettings).
 */

const cacheStore = new Map();
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours TTL (updated in-memory instantly whenever Admin updates settings)

export const settingsCache = {
  get(key) {
    const entry = cacheStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      cacheStore.delete(key);
      return null;
    }
    return entry.value;
  },

  set(key, value, ttlMs = DEFAULT_TTL_MS) {
    cacheStore.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  },

  invalidate(key) {
    cacheStore.delete(key);
  },

  clearAll() {
    cacheStore.clear();
  },

  /**
   * Helper that returns cached value if valid, or calls fetcher, caches, and returns.
   */
  async getOrFetch(key, fetcherFn, ttlMs = DEFAULT_TTL_MS) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }
    const freshValue = await fetcherFn();
    this.set(key, freshValue, ttlMs);
    return freshValue;
  }
};
