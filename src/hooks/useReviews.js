import { useState, useEffect, useCallback } from 'react'
import reviewService from '../services/reviewService'

const safeString = (val, fallback = 'An error occurred.') => {
  if (!val) return fallback
  if (typeof val === 'string') return val
  if (typeof val.message === 'string') return val.message
  if (typeof val.msg === 'string') return val.msg
  if (typeof val.error === 'string') return val.error
  try {
    return JSON.stringify(val)
  } catch {
    return fallback
  }
}

// ---------------------------------------------------------------------------
// useReviews — fetch reviews for a specific product and provide CRUD operations.
// ---------------------------------------------------------------------------

export function useReviews(gunId) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReviews = useCallback(async () => {
    if (!gunId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)

      const response = await reviewService.getReviews(gunId)

      if (response && response.success) {
        setReviews(response.data || [])
      } else {
        setError(safeString(response?.message, 'Failed to fetch reviews.'))
      }
    } catch (err) {
      setError(
        safeString(err?.message, 'An error occurred while fetching reviews.'),
      )
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [gunId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const editReview = async (reviewId, reviewData) => {
    const res = await reviewService.updateReview(gunId, reviewId, reviewData)
    fetchReviews()
    return res
  }

  const removeReview = async (reviewId) => {
    const res = await reviewService.deleteReview(gunId, reviewId)
    fetchReviews()
    return res
  }

  return {
    reviews,
    loading,
    error,
    refetch: fetchReviews,
    editReview,
    removeReview,
  }
}

// ---------------------------------------------------------------------------
// useCreateReview — submit a new review for a product.
// ---------------------------------------------------------------------------

export function useCreateReview() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const createReview = async (gunId, reviewData) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await reviewService.createReview(gunId, reviewData)

      if (response && response.success) {
        setSuccess(true)
        return response.data
      } else {
        setError(safeString(response?.message, 'Failed to submit review.'))
        return null
      }
    } catch (err) {
      setError(
        safeString(err?.message, 'An error occurred while submitting review.'),
      )
      return null
    } finally {
      setLoading(false)
    }
  }

  return { createReview, loading, error, success }
}
