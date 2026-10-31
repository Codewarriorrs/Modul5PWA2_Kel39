// ---------------------------------------------------------------------------
// queryCache.js — Lightweight in-memory and sessionStorage query caching.
// Provides TTL (time-to-live) caching, colored dev logs, and invalidation.
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
        const remainingSec = Math.round((entry.expiresAt - now) / 1000)
        console.log(
          `%c[QueryCache HIT - Memory]%c ${key} (Sisa TTL: ${remainingSec}s)`,
          'background: #2e7d32; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
          'color: #4CAF50; font-weight: bold;',
        )
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
          const remainingSec = Math.round((entry.expiresAt - now) / 1000)
          console.log(
            `%c[QueryCache HIT - SessionStorage]%c ${key} (Sisa TTL: ${remainingSec}s)`,
            'background: #1565c0; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
            'color: #2196F3; font-weight: bold;',
          )
          return entry.data
        }
        sessionStorage.removeItem(`qc_${key}`)
      }
    } catch {
      // Ignore storage errors
    }

    console.log(
      `%c[QueryCache MISS]%c ${key} ➔ Mengambil data segar dari server`,
      'background: #e65100; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      'color: #FF9800;',
    )
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

    console.log(
      `%c[QueryCache SET]%c ${key} (Disimpan selama ${ttlMs / 1000} detik)`,
      'background: #455a64; color: #fff; padding: 2px 6px; border-radius: 4px;',
      'color: #90a4ae;',
    )
  },

  /**
   * Invalidate specific key or all keys matching a prefix.
   * @param {string} prefixOrKey
   */
  invalidate(prefixOrKey) {
    let count = 0
    // Memory cache
    for (const k of Array.from(memoryCache.keys())) {
      if (k.startsWith(prefixOrKey)) {
        memoryCache.delete(k)
        count++
      }
    }

    // Session storage
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const sKey = sessionStorage.key(i)
        if (sKey && sKey.startsWith(`qc_${prefixOrKey}`)) {
          sessionStorage.removeItem(sKey)
          count++
        }
      }
    } catch {
      // Ignore
    }

    console.log(
      `%c[QueryCache INVALIDATE]%c Dihapus ${count} entri berawalan "${prefixOrKey}"`,
      'background: #c62828; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      'color: #f44336;',
    )
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
    console.log('%c[QueryCache CLEAR] Seluruh cache dibersihkan.', 'color: #f44336;')
  },
}

export default queryCache
