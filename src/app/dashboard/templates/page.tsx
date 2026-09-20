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
        setError(data.error || 'Erreur de chargement')
        return
      }
      setTemplates(data.templates ?? [])
    } catch {
      setError('Erreur réseau')
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
          setFormError(data.error || 'Erreur de mise à jour')
          return
        }
        setFormSuccess('Template mis à jour avec succès.')
      } else {
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
          setFormError(data.error || 'Erreur de création')
          return
        }
        setFormSuccess('Template soumis avec succès.')
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
    if (!confirm(`Supprimer le template "${templateName}" ?`)) return

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
        throw new Error(data.error || "Échec de l'envoi")
      }

      setTestResult({ success: true })
    } catch (err) {
      setTestResult({ error: err instanceof Error ? err.message : "Erreur lors de l'envoi" })
    } finally {
      setSendingTest(false)
    }
  }

  function statusBadge(status: string) {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" /> Approuvé
          </span>
        )
      case 'PENDING':
      case 'IN_APPEAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
            <Clock className="h-3 w-3" /> En attente
          </span>
        )
      case 'REJECTED':
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
            <XCircle className="h-3 w-3" /> Rejeté
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading">
            Modèles
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Gérez vos modèles de messages WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTemplates(true)}
            disabled={syncing || loading}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3 w-3', syncing && 'animate-spin')} />
            Sync
          </button>
          <button
            onClick={() => {
              if (showForm) setShowForm(false)
              else openCreateModal()
            }}
            className="flex items-center gap-1.5 rounded-full bg-[#fe5105] hover:bg-[#e04602] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-transform active:scale-95"
          >
            {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showForm ? 'Fermer' : 'Nouveau modèle'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-3">
            {editingTemplateId ? 'Modifier le modèle' : 'Nouveau modèle'}
          </h2>

          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-foreground">Identifiant *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="confirmation_commande"
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Langue *</label>
                <select
                  value={formLanguage}
                  onChange={(e) => setFormLanguage(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="en_US">English US</option>
                  <option value="ar">Arabe</option>
                  <option value="pt_BR">Portugais</option>
                  <option value="es">Espagnol</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Catégorie *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
                >
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utilitaire</option>
                  <option value="AUTHENTICATION">Authentification</option>
                </select>
              </div>
            </div>

            {/* Header */}
            <div>
              <label className="text-xs font-medium text-foreground">En-tête (Optionnel)</label>
              <div className="flex gap-2 mt-1">
                {(['none', 'TEXT', 'IMAGE'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setHeaderType(type)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs transition-colors',
                      headerType === type
                        ? 'border-[#fe5105] bg-[#fe5105]/10 text-[#fe5105]'
                        : 'border-border text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    {type === 'none' && 'Aucun'}
                    {type === 'TEXT' && 'Texte'}
                    {type === 'IMAGE' && 'Image'}
                  </button>
                ))}
              </div>
              {headerType === 'TEXT' && (
                <input
                  type="text"
                  value={formHeaderText}
                  onChange={(e) => setFormHeaderText(e.target.value)}
                  placeholder="Titre de l'en-tête"
                  maxLength={60}
                  className="mt-2 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
                />
              )}
              {headerType === 'IMAGE' && (
                <input
                  type="url"
                  value={formHeaderImageUrl}
                  onChange={(e) => setFormHeaderImageUrl(e.target.value)}
                  placeholder="URL de l'image HTTPS"
                  className="mt-2 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
                />
              )}
            </div>

            {/* Body */}
            <div>
              <label className="text-xs font-medium text-foreground">Corps du message *</label>
              <textarea
                value={formBodyText}
                onChange={(e) => setFormBodyText(e.target.value)}
                placeholder={"Bonjour {{1}},\n\nVotre commande {{2}} est confirmée."}
                required
                rows={3}
                maxLength={1024}
                className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
              />
            </div>

            {/* Footer */}
            <div>
              <label className="text-xs font-medium text-foreground">Pied de page (Optionnel)</label>
              <input
                type="text"
                value={formFooterText}
                onChange={(e) => setFormFooterText(e.target.value)}
                placeholder="Répondez STOP pour vous désabonner"
                maxLength={60}
                className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
              />
            </div>

            {/* Button */}
            <div>
              <label className="text-xs font-medium text-foreground">Bouton (Optionnel)</label>
              <div className="flex gap-2 mt-1">
                {(['none', 'QUICK_REPLY', 'URL'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setButtonType(type)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs transition-colors',
                      buttonType === type
                        ? 'border-[#fe5105] bg-[#fe5105]/10 text-[#fe5105]'
                        : 'border-border text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    {type === 'none' && 'Aucun'}
                    {type === 'QUICK_REPLY' && 'Réponse rapide'}
                    {type === 'URL' && 'Lien URL'}
                  </button>
                ))}
              </div>
              {buttonType !== 'none' && (
                <div className="grid gap-2 mt-2 sm:grid-cols-2">
                  <input
                    type="text"
                    placeholder="Texte du bouton"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    maxLength={25}
                    className="w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none"
                  />
                  {buttonType === 'URL' && (
                    <input
                      type="url"
                      placeholder="https://..."
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      className="w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none"
                    />
                  )}
                </div>
              )}
            </div>

            {formError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{formError}</div>
            )}
            {formSuccess && (
              <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-500">{formSuccess}</div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-1.5 rounded-full bg-[#fe5105] px-5 py-2 text-xs font-bold text-white hover:bg-[#e04602] disabled:opacity-50"
              >
                {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingTemplateId ? 'Enregistrer' : 'Soumettre'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Templates List (Simple cards) ─── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-[#fe5105]" />
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <FileText className="mx-auto h-7 w-7 text-muted-foreground/50 mb-2" />
          <p className="text-sm font-medium text-foreground">Aucun modèle</p>
          <p className="text-xs text-muted-foreground mt-1">
            Créez votre premier modèle de message
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 rounded-full bg-[#fe5105] text-white px-4 py-1.5 text-xs font-bold shadow-xs hover:bg-[#e04602]"
          >
            + Nouveau modèle
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((tpl) => {
            const isApproved = tpl.status?.toUpperCase() === 'APPROVED'
            const bodyComp = tpl.components?.find((c) => c.type === 'BODY')

            return (
              <div
                key={tpl.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-secondary/30 transition-colors"
              >
                {/* Left: name + info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fe5105]/10 text-[#fe5105] shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{tpl.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {tpl.category} · {tpl.language}
                    </p>
                  </div>
                </div>

                {/* Center: status */}
                <div className="hidden sm:block">
                  {statusBadge(tpl.status)}
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isApproved && (
                    <button
                      onClick={() => {
                        setTestTemplate(tpl)
                        setTestPhone('')
                        setTestResult(null)
                        const hasImg = tpl.components?.some((c) => c.type === 'HEADER' && c.format === 'IMAGE')
                        setTestHeaderImageUrl(
                          hasImg ? 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80' : ''
                        )
                        const body = tpl.components?.find((c) => c.type === 'BODY')
                        const varMatches = body?.text?.match(/\{\{(\d+)\}\}/g) || []
                        setTestVariables(new Array(varMatches.length).fill(''))
                      }}
                      className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-[#fe5105] hover:bg-[#fe5105]/10 transition-colors"
                      title="Tester"
                    >
                      <Send className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    onClick={() => openEditTemplate(tpl)}
                    className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Modifier"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDuplicateTemplate(tpl)}
                    className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Dupliquer"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(tpl.name)}
                    className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Test Modal */}
      {testTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Tester le modèle</h3>
                <p className="text-xs text-muted-foreground">{testTemplate.name}</p>
              </div>
              <button
                onClick={() => setTestTemplate(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSendTest} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground">Numéro destinataire</label>
                <input
                  type="text"
                  required
                  placeholder="2376XXXXXXXX"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                />
              </div>

              {testTemplate.components?.some((c) => c.type === 'HEADER' && c.format === 'IMAGE') && (
                <div>
                  <label className="text-xs font-medium text-foreground">URL image d&apos;en-tête</label>
                  <input
                    type="url"
                    required
                    value={testHeaderImageUrl}
                    onChange={(e) => setTestHeaderImageUrl(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
                  />
                </div>
              )}

              {testVariables.map((val, idx) => (
                <div key={idx}>
                  <label className="text-xs font-medium text-foreground">
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
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none"
                  />
                </div>
              ))}

              {testResult?.error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{testResult.error}</div>
              )}
              {testResult?.success && (
                <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-500">
                  ✅ Envoyé avec succès !
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTestTemplate(null)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="flex items-center gap-1.5 rounded-full bg-[#fe5105] px-4 py-2 text-xs font-bold text-white hover:bg-[#e04602] disabled:opacity-50"
                >
                  {sendingTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
