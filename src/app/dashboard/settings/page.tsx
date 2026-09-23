'use client'

import { useEffect, useState } from 'react'
import {
  Settings as SettingsIcon,
  Phone,
  Key,
  Hash,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Sparkles,
  Palette,
  Image as ImageIcon,
  Type,
  ExternalLink
} from 'lucide-react'
import { MetaEmbeddedSignupButton } from '@/components/whatsapp/meta-embedded-signup-button'
import { useOrganization } from '@/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface WhatsAppConfig {
  phone_number_id: string
  waba_id: string
  display_phone_number: string
  verified_name: string
  has_token: boolean
  connected: boolean
}

export default function SettingsPage() {
  const { activeOrganization } = useOrganization()
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  
  // WhatsApp State
  const [accessToken, setAccessToken] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [wabaId, setWabaId] = useState('')
  
  // Mini Site State
  const [logoUrl, setLogoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [themeColor, setThemeColor] = useState('#4f46e5')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [savingMiniSite, setSavingMiniSite] = useState(false)
  const [miniSiteSuccess, setMiniSiteSuccess] = useState('')

  useEffect(() => {
    if (activeOrganization) {
      loadConfig()
      loadOrgDetails()
    }
  }, [activeOrganization])

  async function loadOrgDetails() {
    if (!activeOrganization) return
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
  }

  async function loadConfig() {
    if (!activeOrganization) return
    try {
      const res = await fetch('/api/whatsapp/config', {
        headers: {
          'x-organization-id': activeOrganization.id
        }
      })
      const data = await res.json()
      if (data.config) {
        setConfig(data.config)
        setPhoneNumberId(data.config.phone_number_id || '')
        setWabaId(data.config.waba_id || '')
      }
    } catch {
      // No config yet
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveWhatsApp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization?.id || ''
        },
        body: JSON.stringify({ accessToken, phoneNumberId, wabaId }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur de sauvegarde')
        return
      }

      setSuccess(`✅ Connecté : ${data.phoneInfo.display_phone_number} (${data.phoneInfo.verified_name || 'N/A'})`)
      setAccessToken('')
      await loadConfig()
    } catch {
      setError('Erreur réseau')
    } finally {
      setSaving(false)
    }
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

      {/* WHATSAPP CONFIGURATION */}
      {config?.connected && (
        <div className="flex items-start gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5 backdrop-blur-md">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <p className="text-sm font-bold text-foreground">
              WhatsApp Business Officiel Connecté
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Numéro actif : <span className="font-mono text-foreground font-semibold">{config.display_phone_number}</span>
              {config.verified_name && ` • Nom vérifié : ${config.verified_name}`}
            </p>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-[#fe5105]/20 bg-gradient-to-br from-[#fe5105]/10 via-card/80 to-card p-6 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#fe5105]">
          <Sparkles className="h-4 w-4" />
          Connexion Meta Officielle
        </div>
        <h2 className="mt-2 text-base sm:text-lg font-bold text-foreground">
          Liaison WhatsApp Business en 1 clic
        </h2>
        <p className="mt-1 text-xs text-muted-foreground max-w-xl">
          Connectez votre compte WhatsApp Business directement via la fenêtre sécurisée Meta. Les numéros et tokens sont synchronisés automatiquement.
        </p>

        <div className="mt-5 max-w-sm">
          <MetaEmbeddedSignupButton
            label={config?.connected ? 'Reconnecter via Meta' : 'Connecter avec Meta WhatsApp'}
            onSuccess={() => {
              loadConfig()
              setSuccess('Compte WhatsApp lié avec succès via Meta !')
            }}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-card/80 p-6 backdrop-blur-md shadow-xs">
        <h2 className="mb-1 text-base sm:text-lg font-bold text-foreground">
          Configuration manuelle (Optionnelle)
        </h2>
        <p className="mb-6 text-xs text-muted-foreground">
          Entrez vos clés d'API manuellement si vous disposez d'un jeton système créé sur{' '}
          <a
            href="https://developers.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#fe5105] hover:underline"
          >
            Meta for Developers
          </a>
          .
        </p>

        <form onSubmit={handleSaveWhatsApp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone Number ID
            </label>
            <input
              type="text"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="123456789012345"
              required
              className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-[#fe5105]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Hash className="h-4 w-4 text-muted-foreground" />
              WhatsApp Business Account ID (WABA ID)
            </label>
            <input
              type="text"
              value={wabaId}
              onChange={(e) => setWabaId(e.target.value)}
              placeholder="123456789012345"
              required
              className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-[#fe5105]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Key className="h-4 w-4 text-muted-foreground" />
              Access Token Système
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={config?.has_token ? '••••••••• (déjà configuré)' : 'EAAxxxxxxx...'}
              required={!config?.has_token}
              className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-[#fe5105]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-500">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-[#fe5105] hover:bg-[#e04602] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-transform active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Vérification...' : 'Connecter & Sauvegarder'}
          </button>
        </form>
      </div>
    </div>
  )
}
