'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Phone,
  Plus,
  Star,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Key,
  Hash,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardPanel,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { MetaEmbeddedSignupButton } from '@/components/whatsapp/meta-embedded-signup-button'
import { useOrganization } from '@/hooks/use-organization'

export interface ConnectedNumber {
  id: string
  phone_number_id: string
  waba_id: string
  display_phone_number: string
  verified_name: string
  phone_label: string
  is_default: boolean
  status: string
  quality_rating: string
  conversations_count: number
  created_at: string
}

export interface NumbersQuota {
  used: number
  max: number
  remaining: number
}

export function NumbersManager() {
  const { activeOrganization } = useOrganization()
  const [numbers, setNumbers] = useState<ConnectedNumber[]>([])
  const [quota, setQuota] = useState<NumbersQuota | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Label edition state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabelValue, setEditLabelValue] = useState('')

  // Add number modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [manualPhoneId, setManualPhoneId] = useState('')
  const [manualWabaId, setManualWabaId] = useState('')
  const [manualAccessToken, setManualAccessToken] = useState('')
  const [manualLabel, setManualLabel] = useState('Support')
  const [manualSetDefault, setManualSetDefault] = useState(false)
  const [submittingManual, setSubmittingManual] = useState(false)

  // Delete modal state
  const [deletingNumber, setDeletingNumber] = useState<ConnectedNumber | null>(null)

  const loadNumbers = useCallback(async () => {
    if (!activeOrganization) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/whatsapp/numbers', {
        headers: {
          'x-organization-id': activeOrganization.id,
        },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des numéros')
      }
      setNumbers(data.numbers || [])
      setQuota(data.quota || null)
    } catch (err: any) {
      setError(err.message || 'Impossible de récupérer la liste des numéros')
    } finally {
      setLoading(false)
    }
  }, [activeOrganization])

  useEffect(() => {
    loadNumbers()
  }, [loadNumbers])

  async function handleSetDefault(num: ConnectedNumber) {
    if (!activeOrganization || num.is_default) return
    setActionLoading(num.id)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/whatsapp/numbers/${num.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization.id,
        },
        body: JSON.stringify({ is_default: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour')
      setSuccess(`${num.display_phone_number} est désormais le numéro principal.`)
      await loadNumbers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleSaveLabel(num: ConnectedNumber) {
    if (!activeOrganization) return
    const trimmed = editLabelValue.trim()
    if (!trimmed) {
      setEditingId(null)
      return
    }
    setActionLoading(num.id)
    try {
      const res = await fetch(`/api/whatsapp/numbers/${num.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization.id,
        },
        body: JSON.stringify({ phone_label: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors du renommage')
      setEditingId(null)
      await loadNumbers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDeleteConfirm() {
    if (!activeOrganization || !deletingNumber) return
    setActionLoading(deletingNumber.id)
    setError(null)
    try {
      const res = await fetch(`/api/whatsapp/numbers/${deletingNumber.id}`, {
        method: 'DELETE',
        headers: {
          'x-organization-id': activeOrganization.id,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur de déconnexion')
      setSuccess(`Numéro ${deletingNumber.display_phone_number} déconnecté avec succès.`)
      setDeletingNumber(null)
      await loadNumbers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault()
    if (!activeOrganization) return
    setSubmittingManual(true)
    setError(null)
    try {
      const res = await fetch('/api/whatsapp/numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization.id,
        },
        body: JSON.stringify({
          phoneNumberId: manualPhoneId.trim(),
          wabaId: manualWabaId.trim(),
          accessToken: manualAccessToken.trim(),
          phoneLabel: manualLabel.trim() || 'Numéro',
          isDefault: manualSetDefault,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec de connexion du numéro')
      setSuccess(`Numéro ${data.phoneInfo.display_phone_number} ajouté avec succès !`)
      setShowAddModal(false)
      setManualPhoneId('')
      setManualWabaId('')
      setManualAccessToken('')
      setManualLabel('Support')
      setManualSetDefault(false)
      await loadNumbers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmittingManual(false)
    }
  }

  async function handleResyncWebhooks() {
    if (!activeOrganization) return
    setActionLoading('resync')
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization.id,
        },
        body: JSON.stringify({ action: 'resync' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec de synchronisation')
      setSuccess(data.message || 'Webhooks WhatsApp vérifiés et réactivés avec succès !')
      await loadNumbers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  function getQualityBadge(rating?: string) {
    switch (rating?.toUpperCase()) {
      case 'GREEN':
        return (
          <Badge variant="success" size="sm" dot>
            Qualité Haute
          </Badge>
        )
      case 'YELLOW':
        return (
          <Badge variant="warning" size="sm" dot>
            Qualité Moyenne
          </Badge>
        )
      case 'RED':
        return (
          <Badge variant="destructive" size="sm" dot>
            Qualité Faible
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" size="sm">
            Statut : Actif
          </Badge>
        )
    }
  }

  const isQuotaReached = quota ? quota.used >= quota.max : false

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Quota bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Phone className="size-5 text-[#fe5105]" />
              Numéros WhatsApp Connectés
            </h2>
            {quota && (
              <Badge variant="whatooz" size="sm">
                {quota.used} / {quota.max} connecté{quota.used > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Gérez plusieurs lignes WhatsApp pour votre organisation (Ventes, Support, SAV, etc.).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResyncWebhooks}
            disabled={actionLoading === 'resync'}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            title="Vérifier les webhooks pour tous les numéros"
          >
            {actionLoading === 'resync' ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Synchroniser
          </button>

          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger
              render={
                <button
                  type="button"
                  disabled={isQuotaReached}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#fe5105] hover:bg-[#e04602] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                />
              }
            >
              <Plus className="size-4" />
              Ajouter un numéro
            </DialogTrigger>

            <DialogPopup>
              <DialogHeader>
                <DialogTitle>Connecter un nouveau numéro WhatsApp</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle ligne officielle WhatsApp Business à votre organisation.
                </DialogDescription>
              </DialogHeader>

              <DialogPanel className="flex flex-col gap-5 py-4">
                {/* Method 1: Embedded Signup */}
                <div className="rounded-2xl border border-[#fe5105]/20 bg-[#fe5105]/5 p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#fe5105]">
                    <Sparkles className="size-4" />
                    Méthode recommandée
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Connectez votre compte en 1 clic via la fenêtre officielle Meta.
                  </p>
                  <div className="mt-1">
                    <MetaEmbeddedSignupButton
                      label="Connecter via Meta WhatsApp"
                      onSuccess={() => {
                        setShowAddModal(false)
                        setSuccess('Numéro WhatsApp connecté avec succès via Meta !')
                        loadNumbers()
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Ou configuration manuelle
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Method 2: Manual Form */}
                <form onSubmit={handleAddManual} className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Libellé du numéro (ex: Support, Ventes Abidjan)
                    </label>
                    <input
                      type="text"
                      value={manualLabel}
                      onChange={(e) => setManualLabel(e.target.value)}
                      placeholder="Nom d'usage"
                      required
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Phone Number ID</label>
                    <input
                      type="text"
                      value={manualPhoneId}
                      onChange={(e) => setManualPhoneId(e.target.value)}
                      placeholder="123456789012345"
                      required
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">WABA ID (WhatsApp Business ID)</label>
                    <input
                      type="text"
                      value={manualWabaId}
                      onChange={(e) => setManualWabaId(e.target.value)}
                      placeholder="123456789012345"
                      required
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Access Token Système Meta</label>
                    <input
                      type="password"
                      value={manualAccessToken}
                      onChange={(e) => setManualAccessToken(e.target.value)}
                      placeholder="EAA..."
                      required
                      className="w-full rounded-xl border border-border bg-input px-3.5 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={manualSetDefault}
                      onChange={(e) => setManualSetDefault(e.target.checked)}
                      className="rounded border-border text-[#fe5105] focus:ring-[#fe5105]"
                    />
                    Définir immédiatement comme numéro principal
                  </label>

                  <div className="flex justify-end gap-2 pt-2">
                    <DialogClose render={<button type="button" className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted" />}>
                      Annuler
                    </DialogClose>
                    <button
                      type="submit"
                      disabled={submittingManual}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#fe5105] hover:bg-[#e04602] px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50"
                    >
                      {submittingManual ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      {submittingManual ? 'Vérification...' : 'Connecter ce numéro'}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </DialogPopup>
          </Dialog>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-destructive/10 border border-destructive/20 p-3.5 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto hover:opacity-75">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto hover:opacity-75">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {isQuotaReached && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>
              Limite de votre forfait atteinte ({quota?.max} numéro{quota?.max! > 1 ? 's' : ''}). Passez au plan supérieur pour en connecter davantage.
            </span>
          </div>
          <a
            href="/dashboard/settings/billing"
            className="rounded-lg bg-amber-500 text-white font-bold px-3 py-1 text-[11px] hover:bg-amber-600 shrink-0"
          >
            Mettre à niveau
          </a>
        </div>
      )}

      {/* Numbers Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-[#fe5105]" />
        </div>
      ) : numbers.length === 0 ? (
        <Card className="border-dashed border-2 p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[#fe5105]/10 text-[#fe5105]">
            <Phone className="size-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Aucun numéro connecté</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Connectez votre premier compte WhatsApp Business pour commencer à recevoir des messages et automatiser vos flux.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#fe5105] hover:bg-[#e04602] px-5 py-2.5 text-xs font-bold text-white shadow-xs mt-2"
          >
            <Plus className="size-4" />
            Connecter mon premier numéro
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {numbers.map((num) => {
            const isEditing = editingId === num.id
            const isBusy = actionLoading === num.id

            return (
              <Card
                key={num.id}
                className={num.is_default ? 'border-[#fe5105]/40 shadow-xs relative overflow-hidden' : ''}
              >
                {num.is_default && (
                  <div className="absolute top-0 right-0 h-10 w-10 overflow-hidden pointer-events-none">
                    <div className="absolute transform rotate-45 bg-[#fe5105] text-white text-[8px] font-bold py-0.5 right-[-24px] top-[10px] w-[80px] text-center shadow-xs">
                      DÉFAUT
                    </div>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    {/* Editable Label */}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editLabelValue}
                          onChange={(e) => setEditLabelValue(e.target.value)}
                          className="h-7 rounded-lg border border-input bg-background px-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[#fe5105] flex-1"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveLabel(num)}
                          disabled={isBusy}
                          className="text-emerald-500 hover:text-emerald-600 p-1"
                        >
                          <Check className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-muted-foreground hover:text-foreground p-1"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group flex-1">
                        <CardTitle className="text-base truncate">{num.phone_label || 'Ligne WhatsApp'}</CardTitle>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(num.id)
                            setEditLabelValue(num.phone_label || '')
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-0.5"
                          title="Modifier le libellé"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      {num.is_default ? (
                        <Badge variant="whatooz" size="sm">
                          Principal
                        </Badge>
                      ) : null}
                      {getQualityBadge(num.quality_rating)}
                    </div>
                  </div>

                  <CardDescription className="font-mono text-xs text-foreground font-semibold mt-1 flex items-center gap-2">
                    <Phone className="size-3 text-muted-foreground" />
                    <span>{num.display_phone_number || num.phone_number_id}</span>
                  </CardDescription>
                </CardHeader>

                <CardPanel className="flex flex-col gap-2.5 text-xs text-muted-foreground pt-0">
                  {num.verified_name && (
                    <div className="flex items-center justify-between">
                      <span>Nom vérifié :</span>
                      <span className="font-medium text-foreground">{num.verified_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>Discussions associées :</span>
                    <Badge variant="secondary" size="sm">
                      <MessageSquare className="size-3" />
                      {num.conversations_count}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono opacity-70">
                    <span>Phone ID :</span>
                    <span>{num.phone_number_id}</span>
                  </div>
                </CardPanel>

                <CardFooter className="flex items-center justify-between gap-2 border-t border-border pt-3 mt-1">
                  <div>
                    {!num.is_default && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(num)}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <Star className="size-3.5 text-amber-500" />
                        Définir par défaut
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeletingNumber(num)}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg px-2 py-1 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                    Déconnecter
                  </button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingNumber} onOpenChange={(open) => !open && setDeletingNumber(null)}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="size-5" />
              Déconnecter le numéro
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir déconnecter{' '}
              <strong className="text-foreground">{deletingNumber?.display_phone_number}</strong> ({deletingNumber?.phone_label}) ?
              Les conversations existantes seront conservées, mais les messages entrants ne seront plus traités pour ce numéro.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<button type="button" className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted" />}>
              Annuler
            </DialogClose>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-destructive hover:bg-destructive/90 px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Confirmer la déconnexion
            </button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  )
}
