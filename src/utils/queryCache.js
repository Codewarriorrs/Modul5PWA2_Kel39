// ---------------------------------------------------------------------------
// queryCache.js — Lightweight in-memory and sessionStorage query caching.
// Provides TTL (time-to-live) caching and pattern-based cache invalidation.
// ---------------------------------------------------------------------------

const memoryCache = new Map()
const DEFAULT_TTL_MS = 3 * 60 * 1000 // 3 minutes

export const queryCache = {
  /**
   * Retrieve cached data if valid and not expired.
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const now = Date.now()

    // 1. Check memory cache first
    if (memoryCache.has(key)) {
      const entry = memoryCache.get(key)
      if (entry.expiresAt > now) {
        return entry.data
      }
      memoryCache.delete(key)
    }

    // 2. Check sessionStorage fallback
    try {
      const raw = sessionStorage.getItem(`qc_${key}`)
      if (raw) {
        const entry = JSON.parse(raw)
        if (entry.expiresAt > now) {
          memoryCache.set(key, entry)
          return entry.data
        }
        sessionStorage.removeItem(`qc_${key}`)
      }
    } catch {
      // Ignore storage errors
    }

    return null
  },

  /**
   * Store data in cache with TTL.
   * @param {string} key
   * @param {any} data
   * @param {number} [ttlMs]
   */
  set(key, data, ttlMs = DEFAULT_TTL_MS) {
    const expiresAt = Date.now() + ttlMs
    const entry = { data, expiresAt }

    memoryCache.set(key, entry)

    try {
      sessionStorage.setItem(`qc_${key}`, JSON.stringify(entry))
    } catch {
      // Storage might be full or disabled, memory cache still works
    }
  },

  /**
   * Invalidate specific key or all keys matching a prefix.
   * @param {string} prefixOrKey
   */
  invalidate(prefixOrKey) {
    // Memory cache
    for (const k of Array.from(memoryCache.keys())) {
      if (k.startsWith(prefixOrKey)) {
        memoryCache.delete(k)
      }
    }

    // Session storage
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const sKey = sessionStorage.key(i)
        if (sKey && sKey.startsWith(`qc_${prefixOrKey}`)) {
          sessionStorage.removeItem(sKey)
        }
      }
    } catch {
      // Ignore
    }
  },

  /**
   * Clear all cached queries.
   */
  clear() {
    memoryCache.clear()
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const sKey = sessionStorage.key(i)
        if (sKey && sKey.startsWith('qc_')) {
          sessionStorage.removeItem(sKey)
        }
      }
    } catch {
      // Ignore
    }
  },
}

export default queryCache

