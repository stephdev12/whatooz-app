'use client'

import { useState, useEffect } from 'react'
import { Package, ExternalLink, RefreshCw, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'

interface MetaProduct {
  id: string
  meta_product_id: string
  retailer_id: string
  name: string
  description: string
  price: number
  currency: string
  image_url: string
  availability: string
  url: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<MetaProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { activeOrganization } = useOrganization()

  useEffect(() => {
    if (activeOrganization) {
      loadProducts()
    }
  }, [activeOrganization])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('meta_catalog_products')
        .select('*')
        .eq('organization_id', activeOrganization?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    if (!activeOrganization) return
    try {
      setIsSyncing(true)
      const res = await fetch('/api/whatsapp/catalog/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: activeOrganization.id })
      })
      const data = await res.json()
      if (data.success) {
        await loadProducts()
      } else {
        alert(data.error || 'Erreur lors de la synchronisation')
      }
    } catch (error) {
      console.error('Error syncing:', error)
      alert('Erreur lors de la synchronisation')
    } finally {
      setIsSyncing(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.retailer_id && p.retailer_id.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (isLoading) {
    return <div className="p-8 animate-pulse flex space-x-4">Chargement des produits...</div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Catalogue WhatsApp</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez les produits synchronisés depuis votre compte Meta.</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-card"
            />
          </div>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisation...' : 'Synchroniser Meta'}
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <div className="mx-auto w-12 h-12 bg-secondary rounded-full flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">Aucun produit synchronisé</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Cliquez sur le bouton de synchronisation pour récupérer les produits de votre catalogue WhatsApp Business.
          </p>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Synchroniser maintenant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="aspect-square relative bg-secondary overflow-hidden group">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
                {product.availability === 'out_of_stock' && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-600/90 text-white text-xs font-bold rounded-md backdrop-blur-sm">
                    Rupture
                  </div>
                )}
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  <span className="font-bold text-indigo-600 whitespace-nowrap">
                    {product.price > 0 ? `${product.price} ${product.currency}` : 'Prix sur dmd'}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                  {product.description || 'Aucune description disponible.'}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                  <div className="text-xs text-muted-foreground font-mono bg-secondary px-2 py-1 rounded">
                    ID: {product.retailer_id || product.meta_product_id.slice(-6)}
                  </div>
                  {product.url && (
                    <a 
                      href={product.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 p-1"
                      title="Voir sur le site"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
