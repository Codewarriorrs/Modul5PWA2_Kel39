import { apiClient, IS_SUPABASE } from '../config/api'

// ---------------------------------------------------------------------------
// ReviewService — product reviews & ratings.
// Supports Supabase (public.reviews), university API, and localStorage fallback
// for resilient offline-first full CRUD operations.
// ---------------------------------------------------------------------------

const LOCAL_REVIEWS_PREFIX = 'bore_barrel_reviews_'

const getLocalReviews = (gunId) => {
  try {
    const raw = localStorage.getItem(`${LOCAL_REVIEWS_PREFIX}${gunId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveLocalReviews = (gunId, reviews) => {
  try {
    localStorage.setItem(`${LOCAL_REVIEWS_PREFIX}${gunId}`, JSON.stringify(reviews))
  } catch {
    // Ignore storage issues
  }
}

class ReviewService {
  /**
   * Fetch all reviews for a given product.
   */
  async getReviews(gunId) {
    const localList = getLocalReviews(gunId)

    try {
      if (IS_SUPABASE) {
        const data = await apiClient.get(
          `/rest/v1/reviews?product_id=eq.${gunId}&select=*&order=created_at.desc`,
        )
        const serverList = Array.isArray(data)
          ? data.map((r) => ({
              id: r.id,
              product_id: r.product_id,
              user_identifier: r.user_id
                ? `Operator ${String(r.user_id).substring(0, 8)}`
                : 'Anonymous',
              user_id: r.user_id,
              rating: r.rating,
              comment: r.comment || '',
              created_at: r.created_at,
            }))
          : []

        // Merge server and local reviews (avoid duplicates)
        const serverIds = new Set(serverList.map((r) => String(r.id)))
        const uniqueLocal = localList.filter((r) => !serverIds.has(String(r.id)))
        const combined = [...serverList, ...uniqueLocal]
        saveLocalReviews(gunId, combined)
        return { success: true, data: combined }
      }

      const res = await apiClient.get(`/api/v1/recipes/${gunId}/reviews`)
      return res
    } catch {
      // Fallback to local storage when server is unreachable
      return { success: true, data: localList }
    }
  }

  /**
   * Submit a new review.
   * @param {string|number} gunId
   * @param {Object} reviewData  { user_identifier, rating, comment }
   */
  async createReview(gunId, reviewData) {
    const syntheticId = `rev-${Date.now()}`
    const newReview = {
      id: syntheticId,
      product_id: gunId,
      user_identifier: reviewData.user_identifier || 'Operator',
      user_id: reviewData.user_id || reviewData.user_identifier,
      rating: Number(reviewData.rating),
      comment: reviewData.comment || '',
      created_at: new Date().toISOString(),
    }

    // Always persist to local cache first
    const localList = getLocalReviews(gunId)
    localList.unshift(newReview)
    saveLocalReviews(gunId, localList)

    try {
      if (IS_SUPABASE) {
        const payload = {
          product_id: Number(gunId),
          user_id: reviewData.user_id || reviewData.user_identifier,
          rating: Number(reviewData.rating),
          comment: reviewData.comment || '',
        }

        const res = await apiClient.post('/rest/v1/reviews', payload, {
          headers: { Prefer: 'return=representation' },
        })
        const created = Array.isArray(res) ? res[0] : res
        return { success: true, data: created || newReview }
      }

      return apiClient.post(`/api/v1/recipes/${gunId}/reviews`, reviewData)
    } catch {
      // Return local fallback on error
      return { success: true, data: newReview }
    }
  }

  /**
   * Edit an existing review.
   */
  async updateReview(gunId, reviewId, reviewData) {
    // Update in local cache
    const localList = getLocalReviews(gunId)
    const updatedLocal = localList.map((r) =>
      String(r.id) === String(reviewId)
        ? {
            ...r,
            rating: Number(reviewData.rating),
            comment: reviewData.comment,
            updated_at: new Date().toISOString(),
          }
        : r,
    )
    saveLocalReviews(gunId, updatedLocal)

    try {
      if (IS_SUPABASE) {
        const res = await apiClient.patch(
          `/rest/v1/reviews?id=eq.${reviewId}`,
          {
            rating: Number(reviewData.rating),
            comment: reviewData.comment,
          },
          { headers: { Prefer: 'return=representation' } },
        )
        return { success: true, data: Array.isArray(res) ? res[0] : res }
      }

      return apiClient.put(`/api/v1/reviews/${reviewId}`, reviewData)
    } catch {
      return { success: true, data: reviewData }
    }
  }

  /**
   * Delete a review.
   */
  async deleteReview(gunId, reviewId) {
    // Remove from local cache
    const localList = getLocalReviews(gunId)
    const filtered = localList.filter((r) => String(r.id) !== String(reviewId))
    saveLocalReviews(gunId, filtered)

    try {
      if (IS_SUPABASE) {
        await apiClient.delete(`/rest/v1/reviews?id=eq.${reviewId}`)
        return { success: true }
      }

      return apiClient.delete(`/api/v1/reviews/${reviewId}`)
    } catch {
      return { success: true }
    }
  }
}

export default new ReviewService()
