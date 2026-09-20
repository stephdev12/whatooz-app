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
} from 'lucide-react'
import { MetaEmbeddedSignupButton } from '@/components/whatsapp/meta-embedded-signup-button'


interface WhatsAppConfig {
  phone_number_id: string
  waba_id: string
  display_phone_number: string
  verified_name: string
  has_token: boolean
  connected: boolean
}

export default function SettingsPage() {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [wabaId, setWabaId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    try {
      const res = await fetch('/api/whatsapp/config')
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, phoneNumberId, wabaId }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur de sauvegarde')
        return
      }

      setSuccess(
        `✅ Connecté : ${data.phoneInfo.display_phone_number} (${data.phoneInfo.verified_name || 'N/A'})`
      )
      setAccessToken('')
      await loadConfig()
    } catch {
      setError('Erreur réseau')
    } finally {
      setSaving(false)
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
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
      {/* Page header */}
      <div>
        <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          <SettingsIcon className="h-6 w-6 text-[#fe5105]" />
          Paramètres WhatsApp
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Configurez votre connexion officielle Meta WhatsApp Cloud API v7.3
        </p>
      </div>

      {/* Current status */}
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

      {/* 1-Click Embedded Signup (Recommended) */}
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

      {/* Configuration form (Manual Fallback) */}
      <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-card/80 p-6 backdrop-blur-md shadow-xs">
        <h2 className="mb-1 text-base sm:text-lg font-bold text-foreground">
          Configuration manuelle (Optionnelle)
        </h2>
        <p className="mb-6 text-xs text-muted-foreground">
          Entrez vos clés d&apos;API manuellement si vous disposez d&apos;un jeton système créé sur{' '}
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

        <form onSubmit={handleSave} className="space-y-4">
          {/* Phone Number ID */}
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

          {/* WABA ID */}
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

          {/* Access Token */}
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
            <p className="text-[10px] text-muted-foreground">
              Le token est chiffré de bout en bout en AES-256-GCM.
            </p>
          </div>

          {/* Error / Success */}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-[#fe5105] hover:bg-[#e04602] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-transform active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Vérification...' : 'Connecter & Sauvegarder'}
          </button>
        </form>
      </div>
    </div>
  )
}
