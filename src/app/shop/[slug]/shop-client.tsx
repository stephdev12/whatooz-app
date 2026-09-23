'use client'

import { useState } from 'react'
import { ShoppingCart, X, Plus, Minus, CreditCard, MessageCircle, Package } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  image_url: string
}

interface CartItem extends Product {
  quantity: number
}

interface ShopClientProps {
  organization: {
    id: string
    name: string
    slug: string
    logo_url?: string
    description?: string
    theme_color?: string
  }
  initialProducts: Product[]
}

export default function ShopClient({ organization, initialProducts }: ShopClientProps) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutMode, setCheckoutMode] = useState<'saspay' | 'whatsapp' | null>(null)
  
  // Checkout form
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const themeColor = organization.theme_color || '#4f46e5' // Default indigo-600

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setIsCartOpen(true)
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta
        return newQ > 0 ? { ...item, quantity: newQ } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const currency = cart[0]?.currency || 'XOF'

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) return

    setIsCheckingOut(true)
    try {
      if (checkoutMode === 'saspay') {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: organization.id,
            items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
            customer: { name: customerName, email: customerEmail, phone: customerPhone },
            return_url: `${window.location.origin}/shop/${organization.slug}/success`
          })
        })

        const data = await response.json()
        if (data.checkout_url) {
          window.location.href = data.checkout_url
        } else {
          alert('Erreur lors de la création du paiement: ' + (data.error || 'Inconnue'))
        }
      } else if (checkoutMode === 'whatsapp') {
        // Create an order via API but marked as pending WhatsApp confirmation, or just format a message.
        // For simplicity, we format a message and redirect to WhatsApp.
        const orderText = cart.map(item => `${item.quantity}x ${item.name} (${item.price * item.quantity} ${item.currency})`).join('%0A')
        const totalText = `*Total: ${totalAmount} ${currency}*`
        const msg = `Bonjour ${organization.name}, je souhaite commander :%0A%0A${orderText}%0A%0A${totalText}%0A%0AMes informations :%0ANom : ${customerName}%0ATéléphone : ${customerPhone}`
        
        // Save order as pending in DB first
        await fetch('/api/checkout/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: organization.id,
            items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
            customer: { name: customerName, email: customerEmail, phone: customerPhone },
          })
        })

        // Redirect to wa.me (Assumes organization has a phone number, but we don't have it in schema, so we just use a generic share link for now)
        // Ideally we fetch the phone number from `whatsapp_config`
        window.location.href = `https://wa.me/?text=${msg}`
      }
    } catch (err) {
      console.error(err)
      alert('Une erreur est survenue.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {organization.logo_url ? (
              <img src={organization.logo_url} alt={organization.name} className="h-8 w-auto" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                {organization.name.charAt(0)}
              </div>
            )}
            <h1 className="text-xl font-bold text-slate-900">{organization.name}</h1>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <span 
                className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white rounded-full"
                style={{ backgroundColor: themeColor }}
              >
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* HERO */}
      {organization.description && (
        <div className="bg-white border-b border-slate-200 py-12 text-center px-4">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">{organization.name}</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">{organization.description}</p>
        </div>
      )}

      {/* PRODUCTS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {initialProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Aucun produit disponible</h3>
            <p className="text-slate-500 mt-1">Revenez plus tard pour découvrir nos nouveautés.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {initialProducts.map(product => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="aspect-w-1 aspect-h-1 w-full bg-slate-100 flex items-center justify-center p-8">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="object-contain w-full h-full mix-blend-multiply" />
                  ) : (
                    <Package className="w-16 h-16 text-slate-300" />
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{product.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold text-lg text-slate-900">{product.price} {product.currency}</span>
                    <button
                      onClick={() => addToCart(product)}
                      className="p-2 rounded-full text-white transition-transform hover:scale-105 active:scale-95"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => !isCheckingOut && setIsCartOpen(false)} />
          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-xl flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Votre panier</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Votre panier est vide.</p>
                  </div>
                ) : (
                  <>
                    <ul className="space-y-4">
                      {cart.map(item => (
                        <li key={item.id} className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-12 h-12 object-contain" />
                            ) : (
                              <Package className="w-6 h-6 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 truncate">{item.name}</h4>
                            <p className="text-sm text-slate-500">{item.price} {item.currency}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex justify-between text-base font-bold text-slate-900 mb-6">
                        <p>Total</p>
                        <p>{totalAmount} {currency}</p>
                      </div>

                      {!checkoutMode ? (
                        <div className="space-y-3">
                          <button
                            onClick={() => setCheckoutMode('saspay')}
                            className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white transition-colors"
                            style={{ backgroundColor: themeColor }}
                          >
                            <CreditCard className="w-5 h-5 mr-2" />
                            Payer en ligne
                          </button>
                          <button
                            onClick={() => setCheckoutMode('whatsapp')}
                            className="w-full flex items-center justify-center px-6 py-3 border border-slate-300 rounded-xl shadow-sm text-base font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                          >
                            <MessageCircle className="w-5 h-5 mr-2 text-green-500" />
                            Commander sur WhatsApp
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleCheckout} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-slate-900">Vos informations</h3>
                            <button type="button" onClick={() => setCheckoutMode(null)} className="text-xs text-slate-500 hover:text-slate-800 underline">Retour</button>
                          </div>
                          <div>
                            <input type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nom complet" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                          </div>
                          <div>
                            <input type="email" required value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Adresse email" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                          </div>
                          <div>
                            <input type="tel" required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Numéro WhatsApp" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                          </div>
                          <button
                            type="submit"
                            disabled={isCheckingOut}
                            className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white transition-opacity disabled:opacity-50"
                            style={{ backgroundColor: checkoutMode === 'whatsapp' ? '#22c55e' : themeColor }}
                          >
                            {isCheckingOut ? 'Traitement...' : checkoutMode === 'whatsapp' ? 'Envoyer sur WhatsApp' : 'Procéder au paiement'}
                          </button>
                        </form>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
