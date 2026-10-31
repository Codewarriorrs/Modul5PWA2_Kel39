// ---------------------------------------------------------------------------
// reviewVotes.js — Local persistence for thumbs up / thumbs down reactions.
// Allows users to vote on review quality with persistent count tracking.
// ---------------------------------------------------------------------------

const VOTES_STORAGE_KEY = 'bore_barrel_review_votes'

const getStoredVotes = () => {
  try {
    const raw = localStorage.getItem(VOTES_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Get voting data for a given review ID.
 * Returns { upCount, downCount, userVote: 'up' | 'down' | null }
 */
export const getReviewVotes = (reviewId) => {
  if (!reviewId) return { upCount: 0, downCount: 0, userVote: null }
  const store = getStoredVotes()
  const entry = store[reviewId] || {}
  return {
    upCount: entry.upCount || 0,
    downCount: entry.downCount || 0,
    userVote: entry.userVote || null,
  }
}

/**
 * Toggle or cast a vote for a review.
 * @param {string|number} reviewId
 * @param {'up'|'down'} type
 */
export const voteReview = (reviewId, type) => {
  if (!reviewId || (type !== 'up' && type !== 'down')) return null
  const store = getStoredVotes()
  const current = store[reviewId] || { upCount: 0, downCount: 0, userVote: null }

  let newUp = current.upCount || 0
  let newDown = current.downCount || 0
  let newUserVote = null

  if (current.userVote === type) {
    // Un-vote
    if (type === 'up') newUp = Math.max(0, newUp - 1)
    if (type === 'down') newDown = Math.max(0, newDown - 1)
    newUserVote = null
  } else {
    // Switching vote or voting for first time
    if (current.userVote === 'up') newUp = Math.max(0, newUp - 1)
    if (current.userVote === 'down') newDown = Math.max(0, newDown - 1)

    if (type === 'up') newUp++
    if (type === 'down') newDown++
    newUserVote = type
  }

  const updatedEntry = {
    upCount: newUp,
    downCount: newDown,
    userVote: newUserVote,
  }

  store[reviewId] = updatedEntry
  try {
    localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(store))
    window.dispatchEvent(new CustomEvent('review_votes_updated', { detail: { reviewId } }))
  } catch {
    // Ignore storage issues
  }

  return updatedEntry
}

export default {
  getReviewVotes,
  voteReview,
}

