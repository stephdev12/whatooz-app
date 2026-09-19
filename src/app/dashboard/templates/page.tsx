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
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
            <FileText className="h-6 w-6 text-[#fe5105]" />
            Templates WhatsApp
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez, synchronisez et créez vos modèles de messages Meta WhatsApp Cloud API
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTemplates(true)}
            disabled={syncing || loading}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
            title="Synchroniser les statuts avec Meta"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
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
            className="flex items-center gap-2 rounded-lg bg-[#fe5105] px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-[#fe5105]/90"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Fermer' : 'Nouveau Template'}
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

      {/* Templates List */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            {templates.length} modèle{templates.length !== 1 ? 's' : ''} enregistré{templates.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#fe5105]" />
          </div>
        ) : templates.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Aucun template trouvé sur votre compte WhatsApp Business. Cliquez sur &quot;Nouveau Template&quot; pour en créer un.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {templates.map((tpl) => {
              const isExpanded = expandedId === tpl.id
              const isApproved = tpl.status?.toUpperCase() === 'APPROVED'
              const bodyComp = tpl.components?.find((c) => c.type === 'BODY')
              const headerComp = tpl.components?.find((c) => c.type === 'HEADER')
              const footerComp = tpl.components?.find((c) => c.type === 'FOOTER')
              const buttonsComp = tpl.components?.find((c) => c.type === 'BUTTONS')

              return (
                <div key={tpl.id} className="transition-colors hover:bg-secondary/20">
                  <div className="flex items-center justify-between px-6 py-4">
                    <div
                      className="flex flex-1 cursor-pointer items-center gap-3"
                      onClick={() => setExpandedId(isExpanded ? null : tpl.id)}
                    >
                      <button className="text-muted-foreground">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{tpl.name}</p>
                          {statusBadge(tpl.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tpl.language} • {tpl.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditTemplate(tpl)}
                        className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                        title="Modifier le texte ou les boutons de ce template"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-foreground" />
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(tpl)}
                        className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                        title="Dupliquer ce template pour en créer une variante"
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        Dupliquer
                      </button>
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
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Tester
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(tpl.name)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Supprimer ce template chez Meta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail & preview */}
                  {isExpanded && (
                    <div className="border-t border-border/50 bg-secondary/10 px-6 py-4">
                      <div className="max-w-md rounded-xl border border-border bg-card p-4 shadow-sm">
                        {headerComp?.format === 'IMAGE' && (
                          <div className="mb-2 flex items-center gap-2 rounded-lg border border-border/80 bg-secondary/30 p-2 text-xs text-muted-foreground">
                            <ImageIcon className="h-4 w-4 text-[#fe5105]" />
                            <span>En-tête avec Image multimédia</span>
                          </div>
                        )}
                        {headerComp?.text && (
                          <p className="mb-1 text-xs font-bold text-foreground">{headerComp.text}</p>
                        )}
                        <p className="whitespace-pre-wrap text-xs text-foreground">
                          {bodyComp?.text || '(Corps du message non disponible)'}
                        </p>
                        {footerComp?.text && (
                          <p className="mt-2 text-[10px] text-muted-foreground">{footerComp.text}</p>
                        )}
                        {buttonsComp?.buttons && buttonsComp.buttons.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/60 pt-2">
                            {buttonsComp.buttons.map((btn, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[11px] font-medium text-foreground"
                              >
                                {btn.type === 'URL' && <ExternalLink className="h-3 w-3 text-[#fe5105]" />}
                                {btn.text}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
