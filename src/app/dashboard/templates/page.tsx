'use client'

import { useEffect, useState } from 'react'
import {
  FileText,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  AlertCircle,
  X,
  RefreshCw,
  Send,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Image as ImageIcon,
  Edit3,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplateComponent {
  type: string
  format?: string
  text?: string
  buttons?: Array<{
    type: string
    text: string
    url?: string
    phone_number?: string
  }>
  [key: string]: unknown
}

interface Template {
  id: string
  name: string
  language: string
  status: string
  category: string
  components?: TemplateComponent[]
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Edit / Duplicate state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formLanguage, setFormLanguage] = useState('fr')
  const [formCategory, setFormCategory] = useState('MARKETING')
  const [headerType, setHeaderType] = useState<'none' | 'TEXT' | 'IMAGE'>('none')
  const [formHeaderText, setFormHeaderText] = useState('')
  const [formHeaderImageUrl, setFormHeaderImageUrl] = useState('')
  const [formBodyText, setFormBodyText] = useState('')
  const [formFooterText, setFormFooterText] = useState('')
  const [buttonType, setButtonType] = useState<'none' | 'QUICK_REPLY' | 'URL'>('none')
  const [buttonText, setButtonText] = useState('')
  const [buttonUrl, setButtonUrl] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  // Quick test modal
  const [testTemplate, setTestTemplate] = useState<Template | null>(null)
  const [testPhone, setTestPhone] = useState('')
  const [testHeaderImageUrl, setTestHeaderImageUrl] = useState('')
  const [testVariables, setTestVariables] = useState<string[]>([])
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string } | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates(isSync = false) {
    if (isSync) setSyncing(true)
    else setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/whatsapp/templates')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors du chargement des templates Meta')
        return
      }
      setTemplates(data.templates ?? [])
    } catch {
      setError('Erreur réseau lors de la communication avec le serveur')
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }

  function openCreateModal() {
    setEditingTemplateId(null)
    setFormName('')
    setFormLanguage('fr')
    setFormCategory('MARKETING')
    setHeaderType('none')
    setFormHeaderText('')
    setFormHeaderImageUrl('')
    setFormBodyText('')
    setFormFooterText('')
    setButtonType('none')
    setButtonText('')
    setButtonUrl('')
    setFormError('')
    setFormSuccess('')
    setShowForm(true)
  }

  function openEditTemplate(tpl: Template) {
    setEditingTemplateId(tpl.id)
    setFormName(tpl.name)
    setFormLanguage(tpl.language || 'fr')
    setFormCategory(tpl.category || 'MARKETING')

    const header = tpl.components?.find((c) => c.type === 'HEADER')
    if (header) {
      if (header.format === 'IMAGE') {
        setHeaderType('IMAGE')
        setFormHeaderImageUrl('')
      } else if (header.format === 'TEXT' || header.text) {
        setHeaderType('TEXT')
        setFormHeaderText(header.text || '')
      } else {
        setHeaderType('none')
      }
    } else {
      setHeaderType('none')
      setFormHeaderText('')
      setFormHeaderImageUrl('')
    }

    const body = tpl.components?.find((c) => c.type === 'BODY')
    setFormBodyText(body?.text || '')

    const footer = tpl.components?.find((c) => c.type === 'FOOTER')
    setFormFooterText(footer?.text || '')

    const btns = tpl.components?.find((c) => c.type === 'BUTTONS')
    const firstBtn = btns?.buttons?.[0]
    if (firstBtn) {
      if (firstBtn.type === 'URL') {
        setButtonType('URL')
        setButtonText(firstBtn.text || '')
        setButtonUrl(firstBtn.url || '')
      } else {
        setButtonType('QUICK_REPLY')
        setButtonText(firstBtn.text || '')
        setButtonUrl('')
      }
    } else {
      setButtonType('none')
      setButtonText('')
      setButtonUrl('')
    }

    setFormError('')
    setFormSuccess('')
    setShowForm(true)
  }

  function handleDuplicateTemplate(tpl: Template) {
    openEditTemplate(tpl)
    setEditingTemplateId(null)
    const baseName = tpl.name.replace(/_[0-9]+$/, '')
    setFormName(`${baseName}_copie_${Date.now().toString().slice(-4)}`)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    const cleanName = formName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
    if (!cleanName) {
      setFormError('Le nom du template est invalide (uniquement a-z, 0-9 et _).')
      return
    }

    const buttons = []
    if (buttonType === 'QUICK_REPLY' && buttonText.trim()) {
      buttons.push({ type: 'QUICK_REPLY', text: buttonText.trim() })
    } else if (buttonType === 'URL' && buttonText.trim() && buttonUrl.trim()) {
      buttons.push({ type: 'URL', text: buttonText.trim(), url: buttonUrl.trim() })
    }

    setCreating(true)

    try {
      if (editingTemplateId) {
        // UPDATE template via PATCH
        const res = await fetch('/api/whatsapp/templates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: editingTemplateId,
            templateName: cleanName,
            headerType: headerType !== 'none' ? headerType : undefined,
            headerText: headerType === 'TEXT' ? formHeaderText.trim() : undefined,
            headerImageUrl: headerType === 'IMAGE' ? formHeaderImageUrl.trim() : undefined,
            bodyText: formBodyText.trim(),
            footerText: formFooterText.trim() || undefined,
            buttons: buttons.length > 0 ? buttons : undefined,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          setFormError(data.error || 'Erreur de mise à jour du template auprès de Meta')
          return
        }

        setFormSuccess('✅ Template mis à jour auprès de Meta avec succès ! Examen en cours.')
      } else {
        // CREATE new template via POST
        const res = await fetch('/api/whatsapp/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cleanName,
            language: formLanguage,
            category: formCategory,
            headerType: headerType !== 'none' ? headerType : undefined,
            headerText: headerType === 'TEXT' ? formHeaderText.trim() : undefined,
            headerImageUrl: headerType === 'IMAGE' ? formHeaderImageUrl.trim() : undefined,
            bodyText: formBodyText.trim(),
            footerText: formFooterText.trim() || undefined,
            buttons: buttons.length > 0 ? buttons : undefined,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          setFormError(data.error || 'Erreur de création du template auprès de Meta')
          return
        }

        setFormSuccess('✅ Template soumis à Meta avec succès ! Examen en cours (statut PENDING).')
      }

      setEditingTemplateId(null)
      setFormName('')
      setHeaderType('none')
      setFormHeaderText('')
      setFormHeaderImageUrl('')
      setFormBodyText('')
      setFormFooterText('')
      setButtonType('none')
      setButtonText('')
      setButtonUrl('')
      await loadTemplates(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(templateName: string) {
    if (!confirm(`Confirmez-vous la suppression du template "${templateName}" auprès de Meta ?`)) return

    try {
      const res = await fetch('/api/whatsapp/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateName }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Échec de suppression')
        return
      }
      await loadTemplates(true)
    } catch {
      alert('Erreur réseau')
    }
  }

  async function handleSendTest(e: React.FormEvent) {
    e.preventDefault()
    if (!testTemplate) return

    setSendingTest(true)
    setTestResult(null)

    const cleanPhone = testPhone.replace(/[\s+-]/g, '')
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cleanPhone,
          type: 'template',
          templateName: testTemplate.name,
          languageCode: testTemplate.language,
          headerImageUrl: testHeaderImageUrl.trim() || undefined,
          bodyVariables: testVariables.filter((v) => v.trim().length > 0),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Échec de l’envoi')
      }

      setTestResult({ success: true })
    } catch (err) {
      setTestResult({ error: err instanceof Error ? err.message : 'Erreur lors de l’envoi' })
    } finally {
      setSendingTest(false)
    }
  }

  function statusBadge(status: string) {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
            <CheckCircle2 className="h-3.5 w-3.5" /> Approuvé
          </span>
        )
      case 'PENDING':
      case 'IN_APPEAL':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
            <Clock className="h-3.5 w-3.5" /> En attente Meta
          </span>
        )
      case 'REJECTED':
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-500">
            <XCircle className="h-3.5 w-3.5" /> Rejeté
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            <FileText className="h-6 w-6 text-[#fe5105]" />
            Modèles de Messages WhatsApp
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Gérez vos modèles officiels Meta WhatsApp Cloud API pour les relances et confirmations
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => loadTemplates(true)}
            disabled={syncing || loading}
            className="flex items-center gap-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary disabled:opacity-50 shadow-xs"
            title="Synchroniser les statuts avec Meta"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-[#fe5105]', syncing && 'animate-spin')} />
            Synchroniser
          </button>
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false)
              } else {
                openCreateModal()
              }
            }}
            className="flex items-center gap-1.5 rounded-full bg-[#fe5105] hover:bg-[#e04602] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-transform active:scale-95"
          >
            {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showForm ? 'Fermer' : 'Nouveau Modèle'}
          </button>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-semibold text-card-foreground">
              {editingTemplateId ? 'Modifier le Template WhatsApp' : 'Créer un nouveau Template WhatsApp'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {editingTemplateId
                ? 'Les modifications apportées au template seront renvoyées à Meta pour réexamen.'
                : 'Le template sera soumis directement aux serveurs Meta pour approbation automatique ou manuelle.'}
            </p>
          </div>

          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-card-foreground">
                  Identifiant du template *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ex: confirmation_commande"
                  required
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                />
                <p className="text-[10px] text-muted-foreground">Minuscules et underscores uniquement.</p>
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-card-foreground">
                  Langue *
                </label>
                <select
                  value={formLanguage}
                  onChange={(e) => setFormLanguage(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                >
                  <option value="fr">Français (fr)</option>
                  <option value="en">English (en)</option>
                  <option value="en_US">English US (en_US)</option>
                  <option value="ar">Arabe (ar)</option>
                  <option value="pt_BR">Portugais (pt_BR)</option>
                  <option value="es">Espagnol (es)</option>
                </select>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-card-foreground">
                  Catégorie *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                >
                  <option value="MARKETING">Marketing (Promotions, offres)</option>
                  <option value="UTILITY">Utilitaire (Confirmations, alertes)</option>
                  <option value="AUTHENTICATION">Authentification (Codes OTP)</option>
                </select>
              </div>
            </div>

            {/* Header Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-card-foreground">
                En-tête du message (Optionnel)
              </label>
              <div className="flex gap-2">
                {(['none', 'TEXT', 'IMAGE'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setHeaderType(type)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                      headerType === type
                        ? 'border-[#fe5105] bg-[#fe5105]/10 text-[#fe5105]'
                        : 'border-border bg-input text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {type === 'none' && 'Aucun'}
                    {type === 'TEXT' && 'Texte'}
                    {type === 'IMAGE' && (
                      <>
                        <ImageIcon className="h-3.5 w-3.5" />
                        Image
                      </>
                    )}
                  </button>
                ))}
              </div>

              {headerType === 'TEXT' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={formHeaderText}
                    onChange={(e) => setFormHeaderText(e.target.value)}
                    placeholder="Ex: Votre commande est prête !"
                    maxLength={60}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                  />
                </div>
              )}

              {headerType === 'IMAGE' && (
                <div className="mt-2 space-y-1">
                  <input
                    type="url"
                    value={formHeaderImageUrl}
                    onChange={(e) => setFormHeaderImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... (URL d’exemple HTTPS requise par Meta)"
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Meta exige une URL d’image publique d’exemple pour valider le format de l’en-tête.
                  </p>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-card-foreground">
                Corps du message (Body) *
              </label>
              <textarea
                value={formBodyText}
                onChange={(e) => setFormBodyText(e.target.value)}
                placeholder={"Bonjour {{1}},\n\nNous confirmons votre commande {{2}} d'un montant de {{3}} FCFA.\n\nMerci de votre fidélité !"}
                required
                rows={4}
                maxLength={1024}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
              />
              <p className="text-[11px] text-muted-foreground">
                Insérez des variables dynamiques en écrivant <code className="text-[#fe5105]">{'{{1}}'}</code>, <code className="text-[#fe5105]">{'{{2}}'}</code>, etc.
              </p>
            </div>

            {/* Footer */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-card-foreground">
                Pied de page (Optionnel)
              </label>
              <input
                type="text"
                value={formFooterText}
                onChange={(e) => setFormFooterText(e.target.value)}
                placeholder="Ex: Répondez STOP pour vous désabonner"
                maxLength={60}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
              />
            </div>

            {/* Buttons */}
            <div className="space-y-2 rounded-xl border border-border bg-secondary/20 p-3">
              <label className="text-xs font-medium text-card-foreground">
                Bouton d&apos;action (Optionnel)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setButtonType('none')}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs transition-colors',
                    buttonType === 'none'
                      ? 'border-[#fe5105] bg-[#fe5105]/10 font-medium text-[#fe5105]'
                      : 'border-border text-muted-foreground hover:bg-secondary'
                  )}
                >
                  Aucun bouton
                </button>
                <button
                  type="button"
                  onClick={() => setButtonType('QUICK_REPLY')}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs transition-colors',
                    buttonType === 'QUICK_REPLY'
                      ? 'border-[#fe5105] bg-[#fe5105]/10 font-medium text-[#fe5105]'
                      : 'border-border text-muted-foreground hover:bg-secondary'
                  )}
                >
                  Réponse rapide (Quick Reply)
                </button>
                <button
                  type="button"
                  onClick={() => setButtonType('URL')}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs transition-colors',
                    buttonType === 'URL'
                      ? 'border-[#fe5105] bg-[#fe5105]/10 font-medium text-[#fe5105]'
                      : 'border-border text-muted-foreground hover:bg-secondary'
                  )}
                >
                  Lien Web (URL)
                </button>
              </div>

              {buttonType !== 'none' && (
                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-medium text-card-foreground">
                      Texte du bouton
                    </label>
                    <input
                      type="text"
                      placeholder={buttonType === 'URL' ? 'Visiter le site' : 'Confirmer'}
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      maxLength={25}
                      className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                    />
                  </div>
                  {buttonType === 'URL' && (
                    <div>
                      <label className="text-[11px] font-medium text-card-foreground">
                        Adresse URL (HTTPS)
                      </label>
                      <input
                        type="url"
                        placeholder="https://whatooz.space"
                        value={buttonUrl}
                        onChange={(e) => setButtonUrl(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Live WhatsApp Preview */}
            <div className="rounded-xl border border-border bg-[#0b141a]/5 p-4 dark:bg-black/20">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Aperçu du rendu WhatsApp
              </p>
              <div className="mx-auto max-w-sm rounded-xl border border-border/80 bg-card p-3 shadow-md">
                {headerType === 'IMAGE' && (
                  <div className="mb-2 overflow-hidden rounded-lg border border-border bg-secondary/30">
                    {formHeaderImageUrl ? (
                      <img
                        src={formHeaderImageUrl}
                        alt="Aperçu Header"
                        className="h-32 w-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="flex h-24 flex-col items-center justify-center gap-1 text-muted-foreground">
                        <ImageIcon className="h-6 w-6 text-[#fe5105]" />
                        <span className="text-[10px]">Image d’en-tête (Aperçu)</span>
                      </div>
                    )}
                  </div>
                )}
                {headerType === 'TEXT' && formHeaderText && (
                  <p className="mb-1 text-xs font-bold text-foreground">{formHeaderText}</p>
                )}
                <p className="whitespace-pre-wrap text-xs text-foreground">
                  {formBodyText || 'Texte du template...'}
                </p>
                {formFooterText && (
                  <p className="mt-2 text-[10px] text-muted-foreground">{formFooterText}</p>
                )}
                {buttonType !== 'none' && buttonText && (
                  <div className="mt-3 border-t border-border/60 pt-2 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#fe5105]">
                      {buttonType === 'URL' && <ExternalLink className="h-3 w-3" />}
                      {buttonText}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-500">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {formSuccess}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={creating}
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 rounded-lg bg-[#fe5105] px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-[#fe5105]/90 disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingTemplateId ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {creating
                  ? 'Envoi à Meta...'
                  : editingTemplateId
                  ? 'Enregistrer les modifications'
                  : 'Soumettre le Template à Meta'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates Cards Grid (Inspiré Référence Image 5 - Olivia Rhye) */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-[#fe5105]" />
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
            <p className="text-sm font-semibold text-foreground">Aucun modèle trouvé sur votre compte</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Créez un nouveau modèle de message pour envoyer des confirmations de commandes et alertes à vos clients.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 rounded-full bg-[#fe5105] text-white px-4 py-2 text-xs font-bold shadow-xs hover:bg-[#e04602]"
            >
              + Nouveau Modèle
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((tpl) => {
              const isApproved = tpl.status?.toUpperCase() === 'APPROVED'
              const bodyComp = tpl.components?.find((c) => c.type === 'BODY')
              const headerComp = tpl.components?.find((c) => c.type === 'HEADER')

              return (
                <div
                  key={tpl.id}
                  className="group relative overflow-hidden rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-card/80 backdrop-blur-md shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Noisy Gradient Header Banner (Olivia Rhye Style) */}
                  <div className="relative h-24 w-full bg-gradient-to-r from-blue-600/35 via-[#fe5105]/25 to-violet-600/35 overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
                    <div className="absolute top-3 right-3">
                      {statusBadge(tpl.status)}
                    </div>
                  </div>

                  {/* Floating Avatar & Actions */}
                  <div className="relative px-5 pt-0 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="-mt-10 mb-3 flex items-center justify-between">
                        <div className="h-16 w-16 rounded-2xl border-4 border-card bg-foreground text-background flex items-center justify-center shadow-md">
                          <FileText className="h-7 w-7 text-[#fe5105]" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDuplicateTemplate(tpl)}
                            title="Dupliquer"
                            className="h-8 w-8 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-card hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tpl.name)}
                            title="Supprimer"
                            className="h-8 w-8 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-card hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Category */}
                      <div>
                        <h3 className="text-base font-bold text-foreground leading-tight truncate">{tpl.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tpl.category} • {tpl.language}
                        </p>
                      </div>

                      {/* 3 Metrics Row (Olivia Rhye style) */}
                      <div className="grid grid-cols-3 divide-x divide-black/[0.04] dark:divide-white/[0.06] my-4 py-2 border-y border-black/[0.04] dark:border-white/[0.06] text-center">
                        <div>
                          <p className="text-xs font-bold text-foreground">{tpl.language.toUpperCase()}</p>
                          <p className="text-[10px] text-muted-foreground">Langue</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-500">
                            {isApproved ? 'Meta OK' : 'En cours'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Validation</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {headerComp?.format === 'IMAGE' ? 'Image' : 'Texte'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Format</p>
                        </div>
                      </div>

                      {/* Message Preview Snippet */}
                      <p className="text-xs text-muted-foreground line-clamp-2 italic bg-secondary/30 p-2.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] mb-4">
                        &quot;{bodyComp?.text || 'Message WhatsApp...'}&quot;
                      </p>
                    </div>

                    {/* Bottom Full-Width Pill Action Buttons */}
                    <div className="pb-5 pt-1 flex items-center gap-2">
                      {isApproved && (
                        <button
                          onClick={() => {
                            setTestTemplate(tpl)
                            setTestPhone('')
                            setTestResult(null)
                            const hasImg = tpl.components?.some(
                              (c) => c.type === 'HEADER' && c.format === 'IMAGE'
                            )
                            setTestHeaderImageUrl(
                              hasImg
                                ? 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80'
                                : ''
                            )
                            const body = tpl.components?.find((c) => c.type === 'BODY')
                            const varMatches = body?.text?.match(/\{\{(\d+)\}\}/g) || []
                            setTestVariables(new Array(varMatches.length).fill(''))
                          }}
                          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#fe5105] hover:bg-[#e04602] py-2.5 text-xs font-bold text-white shadow-xs transition-transform active:scale-95"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Tester</span>
                        </button>
                      )}
                      <button
                        onClick={() => openEditTemplate(tpl)}
                        className={cn(
                          'rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-secondary hover:bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground transition-all',
                          !isApproved && 'w-full'
                        )}
                      >
                        Modifier
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Test Modal */}
      {testTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Tester le template WhatsApp
                </h3>
                <p className="text-xs text-[#fe5105] font-medium">
                  {testTemplate.name} ({testTemplate.language})
                </p>
              </div>
              <button
                onClick={() => setTestTemplate(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendTest} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground">
                  Numéro de téléphone destinataire (avec indicatif)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 2376XXXXXXXX"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none focus:border-[#fe5105]"
                />
              </div>

              {/* If template has image header */}
              {testTemplate.components?.some(
                (c) => c.type === 'HEADER' && c.format === 'IMAGE'
              ) && (
                <div>
                  <label className="block text-xs font-medium text-foreground">
                    URL de l’image d’en-tête (HTTPS requise)
                  </label>
                  <input
                    type="url"
                    required
                    value={testHeaderImageUrl}
                    onChange={(e) => setTestHeaderImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                  />
                </div>
              )}

              {/* Dynamic Variables input */}
              {testVariables.map((val, idx) => (
                <div key={idx}>
                  <label className="block text-xs font-medium text-foreground">
                    Variable <code className="text-[#fe5105]">{`{{${idx + 1}}}`}</code>
                  </label>
                  <input
                    type="text"
                    required
                    value={val}
                    onChange={(e) => {
                      const next = [...testVariables]
                      next[idx] = e.target.value
                      setTestVariables(next)
                    }}
                    placeholder={`Valeur pour {{${idx + 1}}}`}
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                  />
                </div>
              ))}

              {testResult?.error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  {testResult.error}
                </div>
              )}
              {testResult?.success && (
                <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-500">
                  ✅ Template envoyé avec succès sur WhatsApp !
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTestTemplate(null)}
                  disabled={sendingTest}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="flex items-center gap-2 rounded-lg bg-[#fe5105] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#fe5105]/90 disabled:opacity-50"
                >
                  {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Envoyer le test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
