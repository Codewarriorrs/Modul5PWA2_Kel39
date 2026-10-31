import { useState } from 'react'
import { ArrowLeft, Save, Check, Camera, Shield } from 'lucide-react'
import userService from '../services/userService'

export default function EditProfilePage({ onBack, onSuccess }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setFeedback('Avatar image must be under 2MB.')
      setTimeout(() => setFeedback(''), 3000)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setAvatar(base64)
      userService.updateAvatar(base64)
      setFeedback('Avatar image updated.')
      setTimeout(() => setFeedback(''), 2500)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSaving(true)

    const updated = {
      ...profile,
      username: username.trim() || 'Shooter',
      bio: bio.trim(),
      avatar,
    }

    const result = userService.saveUserProfile(updated)
    setSaving(false)

    if (result.success) {
      setProfile(result.data)
      setFeedback('Profil berhasil disimpan!')
      setTimeout(() => {
        setFeedback('')
        if (onSuccess) onSuccess()
        else if (onBack) onBack()
      }, 1000)
    } else {
      setFeedback('Gagal menyimpan profil.')
    }
  }

  return (
    <div className="page edit-profile-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        {onBack && (
          <button type="button" className="btn btn--outline btn--sm" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Profile
          </button>
        )}
        <h1 className="display" style={{ margin: 0 }}>
          Edit Operator Profile
        </h1>
      </div>

      {feedback && (
        <div className="toast toast--success" style={{ marginBottom: '20px' }}>
          <Check size={18} /> {feedback}
        </div>
      )}

      <div
        className="profile-card"
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '680px',
        }}
      >
        <form onSubmit={handleSave}>
          {/* Avatar Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div className="avatar-wrap" style={{ position: 'relative', width: '84px', height: '84px' }}>
              {avatar ? (
                <img
                  src={avatar}
                  alt={username}
                  className="avatar-img"
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="avatar-placeholder"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'var(--panel)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Shield size={40} stroke="var(--brass)" />
                </div>
              )}
              <label
                htmlFor="edit-avatar-input"
                className="avatar-upload-btn"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: 'var(--brass)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Ganti Foto Avatar"
              >
                <Camera size={14} />
                <input
                  id="edit-avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Operator Avatar</div>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--steel)' }}>
                Format didukung: PNG, JPG, WebP. Ukuran maks 2MB.
              </p>
            </div>
          </div>

          {/* Callsign / Username */}
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <label htmlFor="prof-name" className="form-label" style={{ fontWeight: 'bold' }}>
              Callsign / Operator Alias
            </label>
            <input
              id="prof-name"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Operator Delta, Master Gunsmith"
              className="form-input"
              required
            />
          </div>

          {/* Bio / Armory Notes */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="prof-bio" className="form-label" style={{ fontWeight: 'bold' }}>
              Armory Notes / Station Bio
            </label>
            <textarea
              id="prof-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Qualifications, preferred calibers, unit assignment..."
              rows={4}
              className="form-textarea"
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              <Save size={16} /> Simpan Perubahan
            </button>
            {onBack && (
              <button type="button" className="btn btn--outline" onClick={onBack}>
                Batal
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

