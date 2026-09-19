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
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
          <SettingsIcon className="h-6 w-6 text-[#fe5105]" />
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configurez votre connexion WhatsApp Business API
        </p>
      </div>

      {/* Current status */}
      {config?.connected && (
        <div className="flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
          <div>
            <p className="text-sm font-medium text-foreground">
              WhatsApp connecté
            </p>
            <p className="text-sm text-muted-foreground">
              {config.display_phone_number}
              {config.verified_name && ` • ${config.verified_name}`}
            </p>
          </div>
        </div>
      )}

      {/* 1-Click Embedded Signup (Recommended) */}
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#fe5105]">
          <Sparkles className="h-4 w-4" />
          Méthode Recommandée
        </div>
        <h2 className="mt-2 text-lg font-semibold text-card-foreground">
          Connexion officielle Meta en 1 clic
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connectez votre compte WhatsApp Business directement via Meta. Aucun token ni identifiant à copier manuellement.
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
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-2 text-lg font-semibold text-card-foreground">
          Configuration manuelle (Avancée)
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Ou entrez manuellement vos identifiants si vous utilisez un jeton système personnalisé de{' '}
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
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-card-foreground">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Phone Number ID
            </label>
            <input
              type="text"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="123456789012345"
              required
              className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[#fe5105] focus:ring-1 focus:ring-[#fe5105]"
            />
          </div>

          {/* WABA ID */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-card-foreground">
              <Hash className="h-4 w-4 text-muted-foreground" />
              WhatsApp Business Account ID (WABA ID)
            </label>
            <input
              type="text"
              value={wabaId}
              onChange={(e) => setWabaId(e.target.value)}
              placeholder="123456789012345"
              required
              className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[#fe5105] focus:ring-1 focus:ring-[#fe5105]"
            />
          </div>

          {/* Access Token */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-card-foreground">
              <Key className="h-4 w-4 text-muted-foreground" />
              Access Token
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={config?.has_token ? '••••••••• (déjà configuré)' : 'EAAxxxxxxx...'}
              required={!config?.has_token}
              className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[#fe5105] focus:ring-1 focus:ring-[#fe5105]"
            />
            <p className="text-xs text-muted-foreground">
              Le token est chiffré AES-256-GCM avant stockage.
            </p>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-500">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#fe5105] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#e04602] disabled:opacity-50"
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
