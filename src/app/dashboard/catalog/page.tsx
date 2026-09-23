'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/use-organization'
import { Layers, RefreshCw, ShoppingBag, ExternalLink, Loader2 } from 'lucide-react'

export default function CatalogPage() {
  const { activeOrganization } = useOrganization()
  const supabase = createClient()
  const [catalogs, setCatalogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  const loadCatalogs = async () => {
    if (!activeOrganization) return
    setIsLoading(true)
    
    const { data } = await supabase
      .from('meta_catalogs')
      .select('*')
      .eq('organization_id', activeOrganization.id)
      .order('created_at', { ascending: false })

    if (data) {
      setCatalogs(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadCatalogs()
  }, [activeOrganization, supabase])

  const handleSync = async () => {
    if (!activeOrganization) return
    setIsSyncing(true)
    
    try {
      // Simuler le délai de synchro ou appeler l'API de synchronisation
      await new Promise(resolve => setTimeout(resolve, 1500))
      await loadCatalogs()
      alert('Catalogue synchronisé avec succès ! (Simulation)')
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la synchronisation.')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catalogue Meta</h1>
          <p className="text-sm text-muted-foreground">Gérez vos catalogues de produits synchronisés depuis Meta Commerce.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Synchroniser
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
          </div>
        ) : catalogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">Aucun catalogue trouvé</h3>
            <p className="text-muted-foreground max-w-sm mb-6">Assurez-vous que votre compte WhatsApp Business est bien lié à un catalogue Meta Commerce. Cliquez sur "Synchroniser" pour rafraîchir.</p>
            <button
              onClick={handleSync}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Forcer la synchronisation
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {catalogs.map((catalog) => (
              <div key={catalog.id} className="bg-background rounded-xl border border-border p-5 shadow-sm flex flex-col hover:border-indigo-500/50 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <a href={`https://business.facebook.com/commerce/catalogs/${catalog.meta_catalog_id}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors p-1" title="Voir sur Meta">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                
                <h3 className="font-semibold text-foreground text-lg mb-1">{catalog.name || 'Catalogue Sans Nom'}</h3>
                <p className="text-xs text-muted-foreground mb-4">ID: {catalog.meta_catalog_id}</p>
                
                <div className="mt-auto pt-4 border-t border-border flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Dernière synchro</span>
                  <span className="font-medium text-foreground">
                    {new Date(catalog.last_synced_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
