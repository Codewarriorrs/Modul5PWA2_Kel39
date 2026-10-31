import { useState, useEffect, useCallback } from 'react'

const CART_KEY = 'bore_barrel_cart'

const getStoredCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useCart() {
  const [cart, setCart] = useState(getStoredCart)

  const syncCart = useCallback(() => {
    setCart(getStoredCart())
  }, [])

  useEffect(() => {
    window.addEventListener('cart_updated', syncCart)
    window.addEventListener('storage', syncCart)
    return () => {
      window.removeEventListener('cart_updated', syncCart)
      window.removeEventListener('storage', syncCart)
    }
  }, [syncCart])

  const saveCart = (newCart) => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(newCart))
      setCart(newCart)
      window.dispatchEvent(new CustomEvent('cart_updated'))
    } catch {
      // storage quota or error
    }
  }

  const addToCart = (gun, quantity = 1) => {
    if (!gun) return
    const id = gun.id || gun.name
    const current = getStoredCart()
    const index = current.findIndex((item) => String(item.id) === String(id))

    let updated
    if (index > -1) {
      updated = current.map((item, i) =>
        i === index ? { ...item, quantity: item.quantity + quantity } : item,
      )
    } else {
      updated = [
        ...current,
        {
          id,
          name: gun.name || 'Hardware Piece',
          price: Number(gun.price ?? gun.cook_time ?? 0),
          caliber: gun.caliber || '',
          category: gun.type || gun.category || 'Hardware',
          image_url: gun.image_url || gun.image || '/guns/pistol.svg',
          quantity: Math.max(1, quantity),
        },
      ]
    }
    saveCart(updated)
  }

  const removeFromCart = (id) => {
    const current = getStoredCart()
    const updated = current.filter((item) => String(item.id) !== String(id))
    saveCart(updated)
  }

  const updateQuantity = (id, newQty) => {
    const current = getStoredCart()
    if (newQty <= 0) {
      removeFromCart(id)
      return
    }
    const updated = current.map((item) =>
      String(item.id) === String(id) ? { ...item, quantity: newQty } : item,
    )
    saveCart(updated)
  }

  const clearCart = () => {
    saveCart([])
  }

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const totalPrice = cart.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
    0,
  )

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  }
}

export default useCart

