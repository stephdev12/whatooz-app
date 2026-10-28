'use client'

import { useEffect, useState } from 'react'
import {
  Settings as SettingsIcon,
  CheckCircle2,
  Loader2,
  Save,
  Palette,
  Image as ImageIcon,
  Type,
  ExternalLink,
} from 'lucide-react'
import { NumbersManager } from '@/components/whatsapp/numbers-manager'
import { useOrganization } from '@/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SettingsPage() {
  const { activeOrganization } = useOrganization()
  
  // Mini Site State
  const [logoUrl, setLogoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [themeColor, setThemeColor] = useState('#4f46e5')
  
  const [loading, setLoading] = useState(true)
  const [savingMiniSite, setSavingMiniSite] = useState(false)
  const [miniSiteSuccess, setMiniSiteSuccess] = useState('')

  useEffect(() => {
    if (activeOrganization) {
      loadOrgDetails()
    }
  }, [activeOrganization])

  async function loadOrgDetails() {
    if (!activeOrganization) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('organizations')
      .select('logo_url, description, theme_color')
      .eq('id', activeOrganization.id)
      .single()
    
    if (data) {
      setLogoUrl(data.logo_url || '')
      setDescription(data.description || '')
      setThemeColor(data.theme_color || '#4f46e5')
    }
    setLoading(false)
  }

  async function handleSaveMiniSite(e: React.FormEvent) {
    e.preventDefault()
    if (!activeOrganization) return
    
    setSavingMiniSite(true)
    setMiniSiteSuccess('')
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('organizations')
        .update({
          logo_url: logoUrl,
          description: description,
          theme_color: themeColor
        })
        .eq('id', activeOrganization.id)
      
      if (error) throw error
      setMiniSiteSuccess('Design sauvegardé avec succès')
      setTimeout(() => setMiniSiteSuccess(''), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingMiniSite(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#fe5105]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8 pb-12">
      {/* Page header */}
      <div>
        <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          <SettingsIcon className="h-6 w-6 text-[#fe5105]" />
          Paramètres
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Configurez votre connexion WhatsApp et le design de votre mini-site.
        </p>
      </div>

      {/* MINI SITE CONFIGURATION */}
      <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-card/80 p-6 backdrop-blur-md shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">Design du Mini-Site</h2>
            <p className="text-xs text-muted-foreground mt-1">Personnalisez l'apparence de votre boutique publique.</p>
          </div>
          {activeOrganization && (
            <Link 
              href={`/shop/${activeOrganization.slug}`} 
              target="_blank"
              className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"
            >
              Voir la boutique <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>

        <form onSubmit={handleSaveMiniSite} className="space-y-5">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              URL du Logo
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://exemple.com/mon-logo.png"
              className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Type className="h-4 w-4 text-muted-foreground" />
              Description (Slogan)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Découvrez nos meilleurs produits..."
              rows={2}
              className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Palette className="h-4 w-4 text-muted-foreground" />
              Couleur Principale (Thème)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-9 w-12 rounded cursor-pointer border-0 p-0"
              />
              <span className="text-xs font-mono text-muted-foreground uppercase">{themeColor}</span>
            </div>
          </div>

          {miniSiteSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-500">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {miniSiteSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={savingMiniSite}
            className="flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-transform active:scale-95 disabled:opacity-50"
          >
            {savingMiniSite ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savingMiniSite ? 'Enregistrement...' : 'Sauvegarder le design'}
          </button>
        </form>
      </div>

      <hr className="border-border" />

      {/* WHATSAPP MULTI-NUMBERS CONFIGURATION */}
      <NumbersManager />
    </div>
  )
}
