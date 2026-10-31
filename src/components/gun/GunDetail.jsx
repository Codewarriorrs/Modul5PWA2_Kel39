import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Star,
  Send,
  Loader,
  Share2,
  ShoppingCart,
  Archive,
  Edit2,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Check,
  CheckCircle,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import { getUserIdentifier } from '../../services/userService'
import { formatPrice, averageRating } from '../../utils/helpers'
import { archiveGun } from '../../utils/archiveStorage'
import { useCart } from '../../hooks/useCart'
import { getReviewVotes, voteReview } from '../../utils/reviewVotes'

/**
 * Full-screen product detail view.
 * Enhanced with Share Link, Add to Cart, Soft Delete (Archive),
 * Review CRUD, and Thumbs Up / Down voting.
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Cart
  const { addToCart } = useCart()

  // Reviews CRUD
  const {
    reviews,
    loading: reviewsLoading,
    refetch: refetchReviews,
    editReview,
    removeReview,
  } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()

  // New review form
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Inline editing review state
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [updatingReview, setUpdatingReview] = useState(false)

  // Feedback toast for Share / Cart / Archive
  const [toast, setToast] = useState('')

  // Local voting state version to force re-render on vote
  const [, setVoteVersion] = useState(0)

  useEffect(() => {
    const handleVotesUpdated = () => setVoteVersion((v) => v + 1)
    window.addEventListener('review_votes_updated', handleVotesUpdated)
    return () => window.removeEventListener('review_votes_updated', handleVotesUpdated)
  }, [])

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  // 1. Share Link Handler
  const handleShareLink = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?gun=${encodeURIComponent(
      gun.id,
    )}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bore & Barrel - ${gun.name}`,
          text: `Cek spesifikasi ${gun.name} (${caliber || category}) di Bore & Barrel Armory:`,
          url: shareUrl,
        })
        return
      } catch (err) {
        if (err.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setToast('Tautan unik produk berhasil disalin ke clipboard!')
      setTimeout(() => setToast(''), 3000)
    } catch {
      window.prompt('Salin tautan unik produk berikut:', shareUrl)
    }
  }

  // 2. Add to Cart Handler
  const handleAddToCart = () => {
    addToCart(gun, 1)
    setToast(`"${gun.name}" berhasil ditambahkan ke keranjang!`)
    setTimeout(() => setToast(''), 3000)
  }

  // 3. Soft Delete (Archive) Handler
  const handleArchive = () => {
    const success = archiveGun(gun)
    if (success) {
      setToast(`"${gun.name}" berhasil diarsipkan (soft delete).`)
      setTimeout(() => {
        setToast('')
        if (onBack) onBack()
      }, 1200)
    }
  }

  // 4. Create Review
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }

    const result = await createReview(gun.id, {
      user_identifier: getUserIdentifier(),
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setReviewSuccess('Review submitted successfully!')
      setComment('')
      setRating(5)
      refetchReviews()
      setTimeout(() => setReviewSuccess(''), 3000)
    } else {
      setReviewError('Could not submit review. Please try again.')
    }
  }

  // 5. Update Review
  const handleStartEditReview = (rev) => {
    setEditingReviewId(rev.id)
    setEditRating(rev.rating || 5)
    setEditComment(rev.comment || '')
  }

  const handleSaveEditReview = async (reviewId) => {
    try {
      setUpdatingReview(true)
      await editReview(reviewId, {
        rating: editRating,
        comment: editComment.trim(),
      })
      setEditingReviewId(null)
      setToast('Review berhasil diperbarui!')
      setTimeout(() => setToast(''), 2500)
    } catch (err) {
      alert(err.message || 'Gagal memperbarui review.')
    } finally {
      setUpdatingReview(false)
    }
  }

  // 6. Delete Review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Yakin ingin menghapus review ini?')) return
    try {
      await removeReview(reviewId)
      setToast('Review berhasil dihapus.')
      setTimeout(() => setToast(''), 2500)
    } catch (err) {
      alert(err.message || 'Gagal menghapus review.')
    }
  }

  // 7. Thumbs Up / Down Voting
  const handleVote = (reviewId, type) => {
    voteReview(reviewId, type)
    setVoteVersion((v) => v + 1)
  }

  return (
    <div className="detail">
      {/* Toast notification */}
      {toast && (
        <div className="toast toast--success" style={{ position: 'sticky', top: '70px', zIndex: 30 }}>
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <img className="detail-img" src={imgSrc} alt={gun.name} loading="lazy" />
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          {/* Action buttons row */}
          <div className="detail-actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleAddToCart}
              title="Tambahkan ke Keranjang"
            >
              <ShoppingCart size={16} /> Add to Cart
            </button>

            <button
              type="button"
              className="btn btn--outline"
              onClick={handleShareLink}
              title="Bagikan tautan unik produk ini"
            >
              <Share2 size={16} /> Share Link
            </button>

            <FavoriteButton gunId={gun.id || gun.name} />

            <button
              type="button"
              className="btn btn--outline"
              onClick={handleArchive}
              title="Arsipkan (Soft Delete) hardware ini"
            >
              <Archive size={16} /> Arsipkan
            </button>

            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                Edit
              </button>
            )}

            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Maintenance steps */}
      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>{step.instruction || step}</li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section with CRUD & Thumbs Up/Down */}
      <section className="detail-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Reviews &amp; Field Reports</h2>
          <span className="count">{reviews.length} feedback</span>
        </div>

        {/* Submit review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write an armory review or performance report…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> Submit Review</>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
        </form>

        {/* Existing reviews list */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => {
              const votes = getReviewVotes(rev.id)
              const isEditing = editingReviewId === rev.id

              return (
                <li key={rev.id} className="review-item" style={{ position: 'relative' }}>
                  {isEditing ? (
                    // Inline Edit Mode
                    <div style={{ width: '100%' }}>
                      <div className="review-stars" style={{ marginBottom: '8px' }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className="star-btn"
                            onClick={() => setEditRating(n)}
                          >
                            <Star
                              size={18}
                              fill={n <= editRating ? 'var(--brass)' : 'none'}
                              stroke={n <= editRating ? 'var(--brass)' : 'var(--steel)'}
                            />
                          </button>
                        ))}
                      </div>

                      <textarea
                        className="form-textarea"
                        rows="2"
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        style={{ marginBottom: '8px', width: '100%' }}
                      />

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          disabled={updatingReview}
                          onClick={() => handleSaveEditReview(rev.id)}
                        >
                          <Check size={14} /> Simpan
                        </button>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() => setEditingReviewId(null)}
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Read Mode
                    <>
                      <div className="review-head">
                        <span className="review-user">{rev.user_identifier || 'Anonymous'}</span>
                        <span className="review-stars-display">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < rev.rating ? 'var(--brass)' : 'none'}
                              stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                            />
                          ))}
                        </span>
                      </div>

                      {rev.comment && <p className="review-comment">{rev.comment}</p>}

                      {/* Bottom action row: Thumbs Up / Down & Edit/Delete */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '10px',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--line)',
                          fontSize: '13px',
                        }}
                      >
                        {/* Reaction buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <button
                            type="button"
                            onClick={() => handleVote(rev.id, 'up')}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: votes.userVote === 'up' ? 'var(--brass)' : 'var(--steel)',
                              fontWeight: votes.userVote === 'up' ? 'bold' : 'normal',
                            }}
                            title="Helpful (Thumbs up)"
                          >
                            <ThumbsUp size={15} />
                            <span>{votes.upCount}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleVote(rev.id, 'down')}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: votes.userVote === 'down' ? '#d32f2f' : 'var(--steel)',
                              fontWeight: votes.userVote === 'down' ? 'bold' : 'normal',
                            }}
                            title="Not helpful (Thumbs down)"
                          >
                            <ThumbsDown size={15} />
                            <span>{votes.downCount}</span>
                          </button>
                        </div>

                        {/* Edit & Delete Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => handleStartEditReview(rev)}
                            title="Edit ulasan ini"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            style={{ color: '#d32f2f' }}
                            onClick={() => handleDeleteReview(rev.id)}
                            title="Hapus ulasan ini"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  )
}
