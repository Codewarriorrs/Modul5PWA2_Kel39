import { useState, useEffect } from 'react'
import {
  Shield,
  Copy,
  Check,
  Heart,
  FileText,
  Play,
  Edit3,
  Archive,
  RotateCcw,
  Trash2,
  ExternalLink,
  MapPin,
  Phone,
  Clock,
  Info,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import { getAllDrafts, deleteDraft } from '../utils/draftStorage'
import { getArchivedGuns, unarchiveGun, removeArchivedPermanently } from '../utils/archiveStorage'
import gunService from '../services/gunService'
import { formatPrice } from '../utils/helpers'

/**
 * ProfilePage — User identity, Armory settings, Drafts, Archive, About, & Contact.
 */
export default function ProfilePage({
  onReplaySplash,
  onNavigateEditProfile,
  onOpenDraft,
}) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')

  const { favorites } = useFavorites()
  const [drafts, setDrafts] = useState(() => getAllDrafts())
  const [archivedGuns, setArchivedGuns] = useState(() => getArchivedGuns())

  // Refresh profile & drafts & archives on update events
  useEffect(() => {
    const handleDraftUpdate = () => setDrafts(getAllDrafts())
    const handleArchiveUpdate = () => setArchivedGuns(getArchivedGuns())
    const handleProfileUpdate = () => setProfile(userService.getUserProfile())

    window.addEventListener('drafts_updated', handleDraftUpdate)
    window.addEventListener('archive_updated', handleArchiveUpdate)
    window.addEventListener('profile_updated', handleProfileUpdate)
    window.addEventListener('focus', handleProfileUpdate)

    return () => {
      window.removeEventListener('drafts_updated', handleDraftUpdate)
      window.removeEventListener('archive_updated', handleArchiveUpdate)
      window.removeEventListener('profile_updated', handleProfileUpdate)
      window.removeEventListener('focus', handleProfileUpdate)
    }
  }, [])

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Handle draft deletion
  const handleDeleteDraft = (draftId) => {
    deleteDraft(draftId)
    setDrafts(getAllDrafts())
    setFeedback('Draft berhasil dihapus.')
    setTimeout(() => setFeedback(''), 2500)
  }

  // Handle restoring archived gun
  const handleRestoreGun = (gunId) => {
    unarchiveGun(gunId)
    setArchivedGuns(getArchivedGuns())
    setFeedback('Hardware berhasil dipulihkan ke katalog!')
    setTimeout(() => setFeedback(''), 2500)
  }

  // Handle permanent deletion of archived gun
  const handlePermanentDelete = async (gunId, gunName) => {
    if (!window.confirm(`Yakin ingin menghapus permanen "${gunName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }
    try {
      await gunService.deleteGun(gunId)
      removeArchivedPermanently(gunId)
      setArchivedGuns(getArchivedGuns())
      setFeedback('Hardware berhasil dihapus secara permanen.')
      setTimeout(() => setFeedback(''), 2500)
    } catch {
      removeArchivedPermanently(gunId)
      setArchivedGuns(getArchivedGuns())
      setFeedback('Hardware dihapus dari arsip lokal.')
      setTimeout(() => setFeedback(''), 2500)
    }
  }

  return (
    <div className="profile-page">
      {/* Masthead */}
      <section
        className="masthead"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 className="display">Operator Profile &amp; Armory Station</h1>
          <p className="lede">
            Operator credentials, procurement statistics, offline drafts, archive, and shop info.
          </p>
        </div>
        {onReplaySplash && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onReplaySplash}
            title="Replay introductory splash animation"
          >
            <Play size={14} /> Replay Intro
          </button>
        )}
      </section>

      {feedback && (
        <div className="toast toast--success">
          <Check size={18} /> {feedback}
        </div>
      )}

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
          </div>

          <div className="profile-identity" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h2 className="display" style={{ margin: 0 }}>
                {profile.username || 'Shooter'}
              </h2>
              {onNavigateEditProfile && (
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={onNavigateEditProfile}
                  title="Edit Nama dan Bio di Halaman Khusus"
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
              )}
            </div>

            <div className="profile-id-row" style={{ marginTop: '6px' }}>
              <span className="mono-badge">{profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Copy User ID to clipboard"
              >
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>

            {profile.bio ? (
              <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--steel)' }}>
                {profile.bio}
              </p>
            ) : (
              <p style={{ marginTop: '8px', fontSize: '13px', fontStyle: 'italic', color: 'var(--steel)' }}>
                Belum ada bio atau catatan station armorer. Klik tombol Edit Profile di atas untuk menambahkan.
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Procurement Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{drafts.length}</div>
            <div className="stat-label">Saved Offline Drafts</div>
          </div>
          <div className="stat-item">
            <Archive size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{archivedGuns.length}</div>
            <div className="stat-label">Archived Hardware</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Offline Form Drafts */}
      <section className="profile-section" style={{ marginTop: '36px' }}>
        <div className="list-head" style={{ marginBottom: '16px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} /> Saved Offline Form Drafts
          </h2>
          <span className="count">{drafts.length} draft{drafts.length !== 1 ? 's' : ''}</span>
        </div>

        {drafts.length === 0 ? (
          <p style={{ color: 'var(--steel)', fontStyle: 'italic', padding: '16px 0' }}>
            Belum ada draft formulir yang tersimpan secara offline. Saat Anda mengisi form Tambah/Edit Hardware, perubahan akan otomatis disimpan di sini.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {drafts.map((d) => (
              <li
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
                    {d.name} {d.caliber ? `· ${d.caliber}` : ''}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--steel)', marginTop: '2px' }}>
                    ID: {d.id} · Disimpan: {d.timeAgo || 'Baru saja'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {onOpenDraft && (
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => onOpenDraft(d)}
                      title="Buka dan lanjutkan form draft ini"
                    >
                      <ExternalLink size={14} /> Lanjutkan Draft
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ color: '#d32f2f' }}
                    onClick={() => handleDeleteDraft(d.id)}
                    title="Hapus draft ini"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* SECTION 2: Soft Delete / Archive */}
      <section className="profile-section" style={{ marginTop: '36px' }}>
        <div className="list-head" style={{ marginBottom: '16px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Archive size={20} /> Hardware Terarsip (Soft Delete)
          </h2>
          <span className="count">{archivedGuns.length} diarsipkan</span>
        </div>

        {archivedGuns.length === 0 ? (
          <p style={{ color: 'var(--steel)', fontStyle: 'italic', padding: '16px 0' }}>
            Tidak ada hardware yang diarsipkan. Gunakan tombol &quot;Arsipkan&quot; di halaman detail hardware untuk menyembunyikannya dari katalog utama tanpa menghapus permanen.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {archivedGuns.map((g) => (
              <li
                key={g.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={g.image_url || g.image || '/guns/pistol.svg'}
                    alt={g.name}
                    style={{ width: '48px', height: '36px', objectFit: 'contain', background: '#000', borderRadius: '4px', padding: '2px' }}
                    loading="lazy"
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{g.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--steel)' }}>
                      {g.type || g.category} {g.caliber ? `· ${g.caliber}` : ''} · {formatPrice(g.price)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={() => handleRestoreGun(g.id)}
                    title="Pulihkan hardware kembali ke katalog utama"
                  >
                    <RotateCcw size={14} /> Pulihkan (Restore)
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => handlePermanentDelete(g.id, g.name)}
                    title="Hapus secara permanen"
                  >
                    <Trash2 size={14} /> Hapus Permanen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* SECTION 3: About Bore & Barrel */}
      <section
        className="profile-section"
        id="about-section"
        style={{
          marginTop: '40px',
          padding: '24px',
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
        }}
      >
        <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px' }}>
          <Info size={18} /> About Bore &amp; Barrel Armory
        </h3>
        <p className="lede" style={{ margin: '0 0 12px', fontSize: '15px', lineHeight: 1.6 }}>
          Bore &amp; Barrel sells a short, honest list of firearms. Each piece is priced from the bench — no markup theatre, no filler. We believe in precision, mechanical reliability, and transparent specifications.
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--steel)' }}>
          Version 2.0.0 PWA &bull; Built with React 19, Vite PWA, and Supabase RESTful Integration.
        </p>
      </section>

      {/* SECTION 4: Contact & Range Shop */}
      <section
        className="profile-section"
        id="contact-section"
        style={{
          marginTop: '20px',
          padding: '24px',
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
        }}
      >
        <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px' }}>
          <MapPin size={18} /> Come by the Shop &amp; Range
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
              <MapPin size={15} color="var(--brass)" /> Location Address
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--steel)' }}>
              123 Range Road, Armory District
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
              <Clock size={15} color="var(--brass)" /> Operational Hours
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--steel)' }}>
              Tuesday to Saturday, 10:00 AM – 6:00 PM
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
              <Phone size={15} color="var(--brass)" /> Direct Communications
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--steel)' }}>
              Hotline: (555) 010-0100 &bull; armory@borebarrel.local
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
