import { useState } from 'react'
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
} from 'lucide-react'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../utils/helpers'
import userService from '../services/userService'

export default function CartPage({ onBack, onNavigateCatalog }) {
  const { cart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } =
    useCart()

  const profile = userService.getUserProfile()
  const [buyerName, setBuyerName] = useState(profile.username || 'Shooter')
  const [waNumber, setWaNumber] = useState('6281234567890')
  const [notes, setNotes] = useState('')
  const [checkedOut, setCheckedOut] = useState(false)

  const handleCheckout = () => {
    if (cart.length === 0) return

    // Clean phone number (remove non-digits, ensure country code)
    let cleanPhone = waNumber.replace(/\D/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1)
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone
    }

    // Compose formatted WhatsApp order message
    const itemsList = cart
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.name} (${item.quantity}x) - ${formatPrice(
            (Number(item.price) || 0) * item.quantity,
          )}`,
      )
      .join('\n')

    const message =
      `Hi aku mau pesan:\n` +
      `--------------------------------\n` +
      `${itemsList}\n` +
      `--------------------------------\n` +
      `Total Pembayaran: ${formatPrice(totalPrice)}\n` +
      `Jumlah Unit: ${totalItems} piece${totalItems !== 1 ? 's' : ''}\n` +
      `Nama Pemesan: ${buyerName.trim() || 'Shooter'}\n` +
      (notes.trim() ? `Catatan: ${notes.trim()}\n` : '') +
      `\nMohon konfirmasi ketersediaan unit dan prosedur transaksinya. Terima kasih!`

    const encoded = encodeURIComponent(message)
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`

    // Open WhatsApp link in new tab
    window.open(waUrl, '_blank')
    setCheckedOut(true)
  }

  return (
    <div className="cart-page page">
      {/* Top navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        {onBack && (
          <button type="button" className="btn btn--outline btn--sm" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
        )}
        <h1 className="display" style={{ margin: 0 }}>
          Armory Procurement Cart
        </h1>
      </div>

      {checkedOut && (
        <div className="toast toast--success" style={{ marginBottom: '20px' }}>
          <CheckCircle size={18} />
          <span>
            Pengalihan ke WhatsApp berhasil dibuka! Ingin mengosongkan keranjang?
          </span>
          <button
            type="button"
            className="btn btn--sm btn--primary"
            style={{ marginLeft: 'auto' }}
            onClick={() => {
              clearCart()
              setCheckedOut(false)
            }}
          >
            Kosongkan Keranjang
          </button>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="empty-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <ShoppingCart size={48} stroke="var(--steel)" style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h2 className="display">Keranjang Anda Masih Kosong</h2>
          <p className="lede" style={{ marginBottom: '24px' }}>
            Belum ada hardware atau firearm yang ditambahkan ke daftar pemesanan.
          </p>
          {onNavigateCatalog && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={onNavigateCatalog}
            >
              Jelajahi Stock Catalog
            </button>
          )}
        </div>
      ) : (
        <div className="cart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }}>
          {/* Cart items list */}
          <div className="cart-items">
            <div className="list-head" style={{ marginBottom: '12px' }}>
              <h2>Daftar Pesanan ({totalItems} item)</h2>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={clearCart}
                title="Hapus semua barang di keranjang"
              >
                <Trash2 size={14} /> Clear All
              </button>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px',
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={{
                      width: '64px',
                      height: '48px',
                      objectFit: 'contain',
                      background: '#000',
                      borderRadius: '6px',
                      padding: '4px',
                    }}
                    loading="lazy"
                  />

                  <div style={{ flex: '1 1 180px' }}>
                    <div className="display" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {item.name}
                    </div>
                    <div className="type" style={{ fontSize: '13px', color: 'var(--steel)' }}>
                      {item.category} {item.caliber ? `· ${item.caliber}` : ''}
                    </div>
                    <div className="price" style={{ marginTop: '4px' }}>
                      {formatPrice(item.price)}
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      style={{ padding: '4px 8px' }}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      title="Kurangi kuantitas"
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold' }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      style={{ padding: '4px 8px' }}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      title="Tambah kuantitas"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Item subtotal & delete */}
                  <div style={{ textAlign: 'right', minWidth: '80px' }}>
                    <div className="display" style={{ fontWeight: 'bold' }}>
                      {formatPrice((Number(item.price) || 0) * item.quantity)}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="icon-btn"
                    style={{ color: '#d32f2f' }}
                    onClick={() => removeFromCart(item.id)}
                    title="Hapus dari keranjang"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Checkout section */}
          <div
            className="checkout-panel"
            style={{
              padding: '20px',
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
            }}
          >
            <h3 className="section-title">Informasi Checkout &amp; WhatsApp</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="cart-name">
                  Nama Pemesan
                </label>
                <input
                  id="cart-name"
                  type="text"
                  className="form-input"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Nama pemesan"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cart-wa">
                  Nomor WhatsApp Tujuan (Toko / Pribadi)
                </label>
                <input
                  id="cart-wa"
                  type="text"
                  className="form-input"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  placeholder="Contoh: 081234567890 atau 6281234567890"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" htmlFor="cart-notes">
                Catatan Tambahan (Opsional)
              </label>
              <textarea
                id="cart-notes"
                className="form-textarea"
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Permintaan serial number, aksesoris tambahan, atau waktu pengiriman..."
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid var(--line)',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <span style={{ color: 'var(--steel)', fontSize: '14px' }}>
                  Total ({totalItems} item):
                </span>
                <div className="display" style={{ fontSize: '26px', color: 'var(--brass)' }}>
                  {formatPrice(totalPrice)}
                </div>
              </div>

              <button
                type="button"
                className="btn btn--primary"
                style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#25D366', borderColor: '#25D366', color: '#fff' }}
                onClick={handleCheckout}
              >
                <ExternalLink size={18} /> Checkout via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

