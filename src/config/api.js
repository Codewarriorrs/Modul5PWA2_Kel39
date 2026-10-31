import axios from 'axios'

// ---------------------------------------------------------------------------
// Base URL & Supabase Key Configuration
// Read from environment variables (.env), with safe default fallback
// ---------------------------------------------------------------------------
const DEFAULT_FALLBACK_URL = 'https://sxunubxupdxyupnebuid.supabase.co'
const DEFAULT_FALLBACK_KEY =
  'sb_publishable_TXg9-r3ZVI8YZMzE90nwsQ_PU9GAmzg'

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  DEFAULT_FALLBACK_URL
).replace(/\/$/, '')

const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_FALLBACK_KEY

const IS_SUPABASE =
  BASE_URL.includes('supabase.co') || Boolean(SUPABASE_KEY)

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
})

// ---------------------------------------------------------------------------
// Request interceptor — attach Supabase headers (apikey & Bearer auth)
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    if (IS_SUPABASE && SUPABASE_KEY) {
      config.headers['apikey'] = SUPABASE_KEY
      if (!config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${SUPABASE_KEY}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ---------------------------------------------------------------------------
// Helper to extract a clean string message from any error payload
// ---------------------------------------------------------------------------
const stringifyError = (val) => {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    if (typeof val.message === 'string') return val.message
    if (typeof val.msg === 'string') return val.msg
    if (typeof val.error === 'string') return val.error
    if (typeof val.error_description === 'string') return val.error_description
    try {
      return JSON.stringify(val)
    } catch {
      return 'Unexpected error'
    }
  }
  return String(val)
}

// ---------------------------------------------------------------------------
// Response interceptor — unwrap response and normalise errors
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'An unexpected error occurred'
    let status = null

    if (error.response) {
      status = error.response.status
      const data = error.response.data

      const extracted =
        stringifyError(data?.message) ||
        stringifyError(data?.msg) ||
        stringifyError(data?.error) ||
        stringifyError(data?.error_description) ||
        stringifyError(data)

      message = extracted || `Server error (${status})`
    } else if (error.request) {
      message =
        'Unable to reach the server. Check your connection and try again.'
    } else {
      message = stringifyError(error.message) || message
    }

    return Promise.reject({
      message: String(message),
      status,
      code: error.response?.data?.code,
      raw: error.response?.data,
    })
  },
)

export { apiClient, BASE_URL, SUPABASE_KEY, IS_SUPABASE }
