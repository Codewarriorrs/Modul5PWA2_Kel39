// ---------------------------------------------------------------------------
// archiveStorage.js — Soft delete / archive storage for firearms.
// Soft-deleted guns are hidden from the primary catalog and placed in the
// archive section, allowing restoration or permanent deletion.
// ---------------------------------------------------------------------------

const ARCHIVE_KEY = 'bore_barrel_archived_guns'

export const getArchivedGuns = () => {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const isArchived = (gunId) => {
  if (!gunId) return false
  const list = getArchivedGuns()
  return list.some((g) => String(g.id) === String(gunId))
}

export const archiveGun = (gun) => {
  if (!gun || !gun.id) return false
  try {
    const list = getArchivedGuns()
    if (!list.some((g) => String(g.id) === String(gun.id))) {
      list.unshift({
        ...gun,
        archivedAt: new Date().toISOString(),
      })
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(list))
    }
    window.dispatchEvent(new CustomEvent('archive_updated'))
    return true
  } catch {
    return false
  }
}

export const unarchiveGun = (gunId) => {
  if (!gunId) return false
  try {
    const list = getArchivedGuns()
    const updated = list.filter((g) => String(g.id) !== String(gunId))
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('archive_updated'))
    return true
  } catch {
    return false
  }
}

export const removeArchivedPermanently = (gunId) => {
  return unarchiveGun(gunId)
}

export default {
  getArchivedGuns,
  isArchived,
  archiveGun,
  unarchiveGun,
  removeArchivedPermanently,
}

