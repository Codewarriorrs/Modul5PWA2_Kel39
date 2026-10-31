import { useState, useEffect, useCallback } from 'react'
import gunService from '../services/gunService'

// ---------------------------------------------------------------------------
// useGuns — fetch the paginated / filtered product list from the API.
// Returns { guns, loading, error, pagination, refetch, fromCache }.
// ---------------------------------------------------------------------------

export function useGuns(params = {}) {
  const [guns, setGuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [fromCache, setFromCache] = useState(false)

  // Serialise params so the effect re-runs when they change.
  const paramKey = JSON.stringify(params)

  const fetchGuns = useCallback(
    async (options = {}) => {
      try {
        setLoading(true)
        setError(null)

        const response = await gunService.getGuns(params, options)

        if (response.success) {
          setGuns(response.data || [])
          setPagination(response.pagination || null)
          setFromCache(Boolean(response.fromCache))
        } else {
          setError(response.message || 'Failed to fetch products.')
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching products.')
        setGuns([])
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paramKey],
  )

  useEffect(() => {
    fetchGuns()
  }, [fetchGuns])

  return {
    guns,
    loading,
    error,
    pagination,
    fromCache,
    refetch: (opts) => fetchGuns(opts || { bypassCache: true }),
  }
}

// ---------------------------------------------------------------------------
// useGunById — fetch a single product by its UUID.
// Returns { gun, loading, error, refetch }.
// ---------------------------------------------------------------------------

export function useGunById(id) {
  const [gun, setGun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGun = useCallback(
    async (options = {}) => {
      if (!id) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)

        const response = await gunService.getGunById(id, options)

        if (response.success) {
          setGun(response.data)
        } else {
          setError(response.message || 'Product not found.')
        }
      } catch (err) {
        setError(err.message || 'Failed to load product details.')
        setGun(null)
      } finally {
        setLoading(false)
      }
    },
    [id],
  )

  useEffect(() => {
    fetchGun()
  }, [fetchGun])

  return {
    gun,
    loading,
    error,
    refetch: (opts) => fetchGun(opts || { bypassCache: true }),
  }
}
