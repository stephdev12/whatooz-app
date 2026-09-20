'use client'

import { useEffect, useState } from 'react'
import {
  Layers,
  Plus,
  Loader2,
  Trash2,
  AlertCircle,
  X,
  Send,
  CheckCircle2,
  Smartphone,
  Calendar,
  ListFilter,
  CheckSquare,
  Type,
  AlignLeft,
  ChevronRight,
  ClipboardList,
  Sparkles,
  RefreshCw,
  Code2,
  MessageSquare,
  Edit3,
  Copy,
  Image as ImageIcon,
  BookOpen,
  ShoppingBag,
  ShieldCheck,
  HeartHandshake,
  Award,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PREBUILT_FLOW_TEMPLATES,
  PrebuiltFlowTemplate,
  FlowTemplateScreen,
  FlowScreenField,
  buildMetaFlowJsonFromScreens,
  FlowCategory,
} from '@/lib/whatsapp/flow-templates'

interface WhatsAppFlow {
  id: string
  meta_flow_id?: string
  name: string
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED'
  categories?: string[]
  flow_json?: any
  validation_errors?: Array<{ error: string }>
  created_at: string
}

interface FlowResponse {
  id: string
  meta_flow_id?: string
  contact_phone: string
  contact_name?: string
  response_data: Record<string, any>
  created_at: string
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<WhatsAppFlow[]>([])
  const [responses, setResponses] = useState<FlowResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'flows' | 'responses'>('flows')

  useEffect(() => {
    loadFlows()
  }, [])

  async function loadFlows() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/whatsapp/flows')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors du chargement des WhatsApp Flows')
        return
      }
      setFlows(data.flows ?? [])
      setResponses(data.responses ?? [])
    } catch {
      setError('Erreur de communication avec le serveur')
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    await loadFlows()
    setSyncing(false)
  }

  // Flow Builder Modal / Drawer State
  const [showBuilder, setShowBuilder] = useState(false)
  const [flowName, setFlowName] = useState('')
  const [flowCategory, setFlowCategory] = useState<FlowCategory>('LEAD_GENERATION')

  // Multi-Screen Builder State
  const [screens, setScreens] = useState<FlowTemplateScreen[]>([
    {
      id: 'STEP_1',
      title: 'Type & Budget',
      heading: 'Sélectionnez votre besoin',
      subheading: 'Étape 1 • Vos préférences',
      imageBannerUrl: '',
      bodyText: '',
      ctaLabel: 'Suivant ➔',
      actionType: 'navigate',
      targetScreenId: 'STEP_2',
      fields: [
        {
          id: 'f1',
          name: 'type_besoin',
          label: 'Type de produit recherché',
          type: 'RadioButtons',
          required: true,
          options: [
            { id: 'opt_smartphones', title: '📱 Smartphones & Mobiles' },
            { id: 'opt_audio', title: '🎧 Casques & Écouteurs sans fil' },
            { id: 'opt_laptops', title: '💻 Ordinateurs & Tablettes' },
          ],
        },
        {
          id: 'f2',
          name: 'budget',
          label: 'Fourchette de budget',
          type: 'Dropdown',
          required: true,
          options: [
            { id: 'b1', title: 'Moins de 100 000 FCFA' },
            { id: 'b2', title: '100 000 à 250 000 FCFA' },
            { id: 'b3', title: 'Plus de 250 000 FCFA' },
          ],
        },
      ],
    },
    {
      id: 'STEP_2',
      title: 'Détails & Achat',
      terminal: true,
      heading: 'Fiche Produit & Commande',
      subheading: 'Étape 2 • Coordonnées de livraison',
      imageBannerUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
      bodyText: 'Remplissez vos coordonnées ci-dessous pour recevoir immédiatement votre lien de paiement WhatsApp sécurisé.',
      ctaLabel: '💳 Payer et Commander',
      actionType: 'complete',
      fields: [
        {
          id: 'f3',
          name: 'nom_client',
          label: 'Votre prénom et nom complet',
          type: 'TextInput',
          required: true,
          placeholder: 'Ex: Jean Dupont',
        },
        {
          id: 'f4',
          name: 'adresse_livraison',
          label: 'Ville et quartier de livraison',
          type: 'TextArea',
          required: true,
          placeholder: 'Ex: Abidjan Cocody Angré',
        },
      ],
    },
  ])
  const [activeScreenIndex, setActiveScreenIndex] = useState<number>(0)
  const [previewScreenIndex, setPreviewScreenIndex] = useState<number>(0)

  // WhatsApp Message & Button texts for the Flow (Chat Bubble)
  const [flowCta, setFlowCta] = useState('Ouvrir le formulaire')
  const [flowBodyText, setFlowBodyText] = useState('Bonjour ! Veuillez remplir le formulaire ci-dessous :')
  const [flowHeaderText, setFlowHeaderText] = useState('')
  const [flowHeaderImageUrl, setFlowHeaderImageUrl] = useState('')
  const [flowFooterText, setFlowFooterText] = useState('')

  // Edit Existing Flow state
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null)
  const [showGallery, setShowGallery] = useState(false)

  // New field input temp state for current screen
  const [newFieldType, setNewFieldType] = useState<FlowScreenField['type']>('TextInput')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldRequired, setNewFieldRequired] = useState(true)
  const [newFieldOptions, setNewFieldOptions] = useState('Option 1, Option 2, Option 3')

  const [saving, setSaving] = useState(false)
  const [builderError, setBuilderError] = useState('')
  const [builderMode, setBuilderMode] = useState<'visual' | 'json'>('visual')
  const [mobileBuilderTab, setMobileBuilderTab] = useState<'editor' | 'preview'>('editor')
  const [rawJsonInput, setRawJsonInput] = useState('')
  const [syncing, setSyncing] = useState(false)

  // Test Modal
  const [testFlow, setTestFlow] = useState<WhatsAppFlow | null>(null)
  const [testPhone, setTestPhone] = useState('')
  const [testCta, setTestCta] = useState('Ouvrir le formulaire')
  const [testBody, setTestBody] = useState('')
  const [testHeader, setTestHeader] = useState('')
  const [testHeaderImageUrl, setTestHeaderImageUrl] = useState('')
  const [testFooter, setTestFooter] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string } | null>(null)

  // Edit Flow Message Modal
  const [editFlow, setEditFlow] = useState<WhatsAppFlow | null>(null)
  const [editCta, setEditCta] = useState('Ouvrir le formulaire')
  const [editBody, setEditBody] = useState('')
  const [editHeader, setEditHeader] = useState('')
  const [editHeaderImageUrl, setEditHeaderImageUrl] = useState('')
  const [editFooter, setEditFooter] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Screen Helper functions
  const currentScreen = screens[activeScreenIndex] || screens[0]

  function updateCurrentScreen(patch: Partial<FlowTemplateScreen>) {
    setScreens((prev) =>
      prev.map((s, idx) => (idx === activeScreenIndex ? { ...s, ...patch } : s))
    )
  }

  function handleAddScreen() {
    const newIdx = screens.length + 1
    const newScreenId = `STEP_${newIdx}`
    const newScreen: FlowTemplateScreen = {
      id: newScreenId,
      title: `Écran ${newIdx}`,
      heading: `Écran ${newIdx}`,
      subheading: `Étape ${newIdx}`,
      imageBannerUrl: '',
      bodyText: '',
      ctaLabel: 'Valider',
      actionType: 'complete',
      terminal: true,
      fields: [
        {
          id: `f_${Date.now()}`,
          name: `champ_${newIdx}`,
          label: `Information ${newIdx}`,
          type: 'TextInput',
          required: true,
          placeholder: 'Saisissez votre réponse...',
        },
      ],
    }

    // Automatically connect previous screen to this new screen if it had navigate
    const updatedScreens = [...screens]
    if (updatedScreens.length > 0) {
      const prevScreen = updatedScreens[updatedScreens.length - 1]
      if (prevScreen.actionType === 'navigate' && !prevScreen.targetScreenId) {
        prevScreen.targetScreenId = newScreenId
      }
    }

    setScreens([...updatedScreens, newScreen])
    setActiveScreenIndex(screens.length)
    setPreviewScreenIndex(screens.length)
  }

  function handleRemoveScreen(indexToRemove: number) {
    if (screens.length <= 1) return
    const filtered = screens.filter((_, idx) => idx !== indexToRemove)
    setScreens(filtered)
    const nextActive = Math.min(activeScreenIndex, filtered.length - 1)
    setActiveScreenIndex(nextActive)
    setPreviewScreenIndex(nextActive)
  }

  function handleDuplicateScreen(indexToDuplicate: number) {
    const src = screens[indexToDuplicate]
    if (!src) return
    const newIdx = screens.length + 1
    const newScreenId = `STEP_${newIdx}`
    const duplicated: FlowTemplateScreen = {
      ...JSON.parse(JSON.stringify(src)),
      id: newScreenId,
      title: `${src.title} (Copie)`,
      terminal: true,
      actionType: 'complete',
      targetScreenId: undefined,
    }
    const updated = [...screens, duplicated]
    setScreens(updated)
    setActiveScreenIndex(updated.length - 1)
    setPreviewScreenIndex(updated.length - 1)
  }

  function handleMoveScreen(index: number, direction: 'left' | 'right') {
    const targetIndex = direction === 'left' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= screens.length) return
    const updated = [...screens]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    setScreens(updated)
    setActiveScreenIndex(targetIndex)
    setPreviewScreenIndex(targetIndex)
  }

  function handleAddField() {
    if (!newFieldLabel.trim()) return

    const cleanKey =
      newFieldName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') ||
      `field_${Date.now()}`

    let opts: Array<{ id: string; title: string }> | undefined
    if (['Dropdown', 'RadioButtons', 'CheckboxGroup'].includes(newFieldType)) {
      opts = newFieldOptions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((opt, i) => ({
          id: `opt_${i + 1}_${opt.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          title: opt,
        }))
    }

    const field: FlowScreenField = {
      id: `field_${Date.now()}`,
      name: cleanKey,
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      options: opts,
    }

    const currentFields = currentScreen?.fields || []
    updateCurrentScreen({ fields: [...currentFields, field] })

    setNewFieldLabel('')
    setNewFieldName('')
    setNewFieldOptions('Option 1, Option 2, Option 3')
  }

  function handleRemoveField(id: string) {
    const currentFields = currentScreen?.fields || []
    updateCurrentScreen({ fields: currentFields.filter((f) => f.id !== id) })
  }

  /**
   * Build Meta Flow v7.3 JSON specification with Multi-Screen support
   */
  function buildMetaFlowJson() {
    return buildMetaFlowJsonFromScreens(screens)
  }
  function openCreateModal() {
    setEditingFlowId(null)
    setFlowName('')
    setFlowCategory('LEAD_GENERATION')
    setFlowCta('Ouvrir le formulaire')
    setFlowBodyText('Bonjour ! Veuillez remplir le formulaire ci-dessous :')
    setFlowHeaderText('')
    setFlowHeaderImageUrl('')
    setFlowFooterText('')
    setBuilderMode('visual')
    setScreens([
      {
        id: 'STEP_1',
        title: 'Écran 1 : Critères',
        heading: 'Vos Préférences',
        subheading: 'Étape 1 • Sélection',
        imageBannerUrl: '',
        bodyText: '',
        ctaLabel: 'Suivant ➔',
        actionType: 'navigate',
        targetScreenId: 'STEP_2',
        fields: [
          {
            id: 'f1',
            name: 'type_besoin',
            label: 'Que recherchez-vous ?',
            type: 'RadioButtons',
            required: true,
            options: [
              { id: 'opt_1', title: 'Option 1' },
              { id: 'opt_2', title: 'Option 2' },
            ],
          },
        ],
      },
      {
        id: 'STEP_2',
        title: 'Écran 2 : Coordonnées',
        terminal: true,
        heading: 'Finalisation',
        subheading: 'Étape 2 • Vos coordonnées',
        imageBannerUrl: '',
        bodyText: 'Saisissez vos informations pour finaliser votre demande.',
        ctaLabel: 'Envoyer ma demande',
        actionType: 'complete',
        fields: [
          {
            id: 'f2',
            name: 'nom_client',
            label: 'Votre nom complet',
            type: 'TextInput',
            required: true,
            placeholder: 'Jean Dupont',
          },
        ],
      },
    ])
    setActiveScreenIndex(0)
    setPreviewScreenIndex(0)
    setShowGallery(false)
    setShowBuilder(true)
  }

  function loadPrebuiltTemplate(tpl: PrebuiltFlowTemplate) {
    setEditingFlowId(null)
    setFlowName(tpl.name)
    setFlowCategory(tpl.category)
    setFlowCta(tpl.flowCta)
    setFlowBodyText(tpl.flowBodyText)
    setFlowHeaderText(tpl.headerText || '')
    setFlowHeaderImageUrl(tpl.headerImageUrl || '')
    setFlowFooterText(tpl.flowFooterText || '')

    if (tpl.screens && tpl.screens.length > 0) {
      setScreens(JSON.parse(JSON.stringify(tpl.screens)))
      setActiveScreenIndex(0)
      setPreviewScreenIndex(0)
    }

    setBuilderMode('visual')
    setShowGallery(false)
    setShowBuilder(true)
  }

  function openEditFlowBuilder(flow: WhatsAppFlow) {
    setEditingFlowId(flow.id)
    setFlowName(flow.name)
    setFlowCategory((flow.categories?.[0] as FlowCategory) || 'LEAD_GENERATION')
    setFlowCta(flow.flow_json?._ui_meta?.flow_cta || 'Ouvrir le formulaire')
    setFlowBodyText(flow.flow_json?._ui_meta?.body_text || `Voici le formulaire "${flow.name}". Cliquez ci-dessous pour le remplir :`)
    setFlowHeaderText(flow.flow_json?._ui_meta?.header_text || '')
    setFlowHeaderImageUrl(flow.flow_json?._ui_meta?.header_image_url || '')
    setFlowFooterText(flow.flow_json?._ui_meta?.footer_text || '')

    const metaScreens = flow.flow_json?.screens
    if (metaScreens && Array.isArray(metaScreens) && metaScreens.length > 0) {
      const parsedScreens: FlowTemplateScreen[] = metaScreens.map((s: any, sIdx: number) => {
        const formComp = s.layout?.children?.find((c: any) => c.type === 'Form')
        const children = formComp?.children || s.layout?.children || []

        const imgChild = children.find((c: any) => c.type === 'Image')
        const headingChild = children.find((c: any) => c.type === 'TextHeading')
        const subheadChild = children.find((c: any) => c.type === 'TextSubheading')
        const bodyChild = children.find((c: any) => c.type === 'TextBody')
        const footerChild = children.find((c: any) => c.type === 'Footer')

        const actionObj = footerChild?.['on-click-action']
        const actionName = actionObj?.name === 'navigate' ? 'navigate' : 'complete'
        const targetScreen = actionObj?.next?.name

        const extractedFields: FlowScreenField[] = []
        children.forEach((child: any, idx: number) => {
          if (['TextInput', 'TextArea', 'Dropdown', 'RadioButtonsGroup', 'RadioButtons', 'CheckboxGroup', 'DatePicker'].includes(child.type)) {
            let opts: Array<{ id: string; title: string; description?: string }> | undefined
            if (child['data-source']) {
              opts = child['data-source'].map((ds: any) => ({
                id: ds.id,
                title: ds.title,
                description: ds.description,
              }))
            }
            extractedFields.push({
              id: `f_${sIdx}_${idx}`,
              name: child.name || `field_${idx}`,
              label: child.label || child.name || 'Champ',
              type: child.type === 'RadioButtonsGroup' ? 'RadioButtons' : child.type,
              required: Boolean(child.required),
              placeholder: child.placeholder || child['helper-text'],
              options: opts,
            })
          }
        })

        return {
          id: s.id || `STEP_${sIdx + 1}`,
          title: s.title || `Écran ${sIdx + 1}`,
          heading: headingChild?.text || '',
          subheading: subheadChild?.text || '',
          bodyText: bodyChild?.text || '',
          imageBannerUrl: imgChild?.src || '',
          terminal: Boolean(s.terminal),
          actionType: actionName,
          targetScreenId: targetScreen,
          ctaLabel: footerChild?.label || 'Valider',
          fields: extractedFields,
        }
      })

      setScreens(parsedScreens)
      setActiveScreenIndex(0)
      setPreviewScreenIndex(0)
      setBuilderMode('visual')
    } else {
      setRawJsonInput(JSON.stringify(flow.flow_json || {}, null, 2))
      setBuilderMode('json')
    }

    setShowGallery(false)
    setShowBuilder(true)
  }

  function handleDuplicateFlow(flow: WhatsAppFlow) {
    openEditFlowBuilder(flow)
    setEditingFlowId(null)
    setFlowName(`${flow.name} (Copie)`)
  }

  async function handleSaveFlow(publish = false) {
    setBuilderError('')
    if (!flowName.trim()) {
      setBuilderError('Veuillez donner un nom à votre Flow.')
      return
    }

    let flowJson: any
    if (builderMode === 'json') {
      if (!rawJsonInput.trim()) {
        setBuilderError('Veuillez coller le JSON de votre Flow Meta.')
        return
      }
      try {
        flowJson = JSON.parse(rawJsonInput)
      } catch (e: any) {
        setBuilderError('Format JSON invalide : ' + e.message)
        return
      }
    } else {
      if (screens.length === 0 || !screens.some((s) => s.fields && s.fields.length > 0)) {
        setBuilderError('Veuillez ajouter au moins un champ dans vos écrans.')
        return
      }
      flowJson = buildMetaFlowJson()
    }

    setSaving(true)
    try {
      if (editingFlowId) {
        // UPDATE existing flow
        const res = await fetch('/api/whatsapp/flows', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flowId: editingFlowId,
            name: flowName.trim(),
            categories: [flowCategory],
            flowJson,
            flowCta: flowCta.trim() || 'Ouvrir le formulaire',
            bodyText: flowBodyText.trim() || `Voici le formulaire "${flowName.trim()}". Cliquez ci-dessous pour le remplir :`,
            headerText: flowHeaderText.trim() || undefined,
            headerImageUrl: flowHeaderImageUrl.trim() || undefined,
            footerText: flowFooterText.trim() || undefined,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          setBuilderError(data.error || 'Échec de la mise à jour du Flow')
          return
        }
      } else {
        // CREATE new flow
        const res = await fetch('/api/whatsapp/flows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: flowName.trim(),
            categories: [flowCategory],
            flowJson,
            publish,
            flowCta: flowCta.trim() || 'Ouvrir le formulaire',
            bodyText: flowBodyText.trim() || `Voici le formulaire "${flowName.trim()}". Cliquez ci-dessous pour le remplir :`,
            headerText: flowHeaderText.trim() || undefined,
            headerImageUrl: flowHeaderImageUrl.trim() || undefined,
            footerText: flowFooterText.trim() || undefined,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          setBuilderError(data.error || 'Échec de l’enregistrement auprès de Meta')
          return
        }

        if (data.warning) {
          alert(data.warning)
        }
      }

      setShowBuilder(false)
      setEditingFlowId(null)
      setFlowName('')
      await loadFlows()
    } catch {
      setBuilderError('Erreur réseau lors de l’envoi')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteFlow(flow: WhatsAppFlow) {
    if (!confirm(`Supprimer le Flow "${flow.name}" ?`)) return
    try {
      const res = await fetch('/api/whatsapp/flows', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowId: flow.id,
          metaFlowId: flow.meta_flow_id,
        }),
      })
      if (res.ok) {
        await loadFlows()
      }
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  function openTestModal(flow: WhatsAppFlow) {
    setTestFlow(flow)
    setTestPhone('')
    setTestCta(flow.flow_json?._ui_meta?.flow_cta || 'Ouvrir le formulaire')
    setTestBody(
      flow.flow_json?._ui_meta?.body_text ||
        `Voici le formulaire "${flow.name}". Cliquez ci-dessous pour le remplir :`
    )
    setTestHeader(flow.flow_json?._ui_meta?.header_text || '')
    setTestHeaderImageUrl(flow.flow_json?._ui_meta?.header_image_url || '')
    setTestFooter(flow.flow_json?._ui_meta?.footer_text || '')
    setTestResult(null)
  }

  function openEditModal(flow: WhatsAppFlow) {
    setEditFlow(flow)
    setEditCta(flow.flow_json?._ui_meta?.flow_cta || 'Ouvrir le formulaire')
    setEditBody(
      flow.flow_json?._ui_meta?.body_text ||
        `Voici le formulaire "${flow.name}". Cliquez ci-dessous pour le remplir :`
    )
    setEditHeader(flow.flow_json?._ui_meta?.header_text || '')
    setEditHeaderImageUrl(flow.flow_json?._ui_meta?.header_image_url || '')
    setEditFooter(flow.flow_json?._ui_meta?.footer_text || '')
  }

  async function handleSaveEditMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!editFlow) return
    setEditSaving(true)
    try {
      const res = await fetch('/api/whatsapp/flows', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowId: editFlow.id,
          flowCta: editCta.trim() || 'Ouvrir le formulaire',
          bodyText: editBody.trim() || `Voici le formulaire "${editFlow.name}". Cliquez ci-dessous pour le remplir :`,
          headerText: editHeader.trim() || '',
          headerImageUrl: editHeaderImageUrl.trim() || '',
          footerText: editFooter.trim() || '',
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Échec de mise à jour')
      }
      setEditFlow(null)
      await loadFlows()
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour')
    } finally {
      setEditSaving(false)
    }
  }

  async function handleSendTestFlow(e: React.FormEvent) {
    e.preventDefault()
    if (!testFlow) return

    setTestSending(true)
    setTestResult(null)
    const cleanPhone = testPhone.replace(/[\s+-]/g, '')

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cleanPhone,
          type: 'flow',
          flowId: testFlow.meta_flow_id || testFlow.id,
          flowCta: testCta.trim() || 'Ouvrir le formulaire',
          bodyText: testBody.trim() || `Voici le formulaire "${testFlow.name}". Cliquez ci-dessous pour le remplir :`,
          headerText: testHeader.trim() || undefined,
          headerImageUrl: testHeaderImageUrl.trim() || undefined,
          footerText: testFooter.trim() || undefined,
          screen: testFlow.flow_json?.screens?.[0]?.id,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Échec d’envoi')
      }
      setTestResult({ success: true })
    } catch (err) {
      setTestResult({ error: err instanceof Error ? err.message : 'Erreur' })
    } finally {
      setTestSending(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            <Layers className="h-6 w-6 text-[#fe5105]" />
            WhatsApp Flows (Formulaires Natifs)
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Créez des formulaires interactifs embarqués dans WhatsApp pour collecter des commandes et réservations
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowGallery(true)}
            className="flex items-center gap-1.5 rounded-full border border-[#fe5105]/30 bg-[#fe5105]/10 px-3.5 py-1.5 text-xs font-semibold text-[#fe5105] transition-all hover:bg-[#fe5105]/20 shadow-xs"
            title="Choisir un modèle de Flow prêt à l'emploi"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Modèles Prêts
          </button>
          <button
            onClick={handleSync}
            disabled={syncing || loading}
            className="flex items-center gap-1.5 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary disabled:opacity-50 shadow-xs"
            title="Synchroniser tous les Flows depuis Meta"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-[#fe5105]', (syncing || loading) && 'animate-spin')} />
            Synchroniser
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-full bg-[#fe5105] hover:bg-[#e04602] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-transform active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau Flow
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('flows')}
          className={cn(
            'flex items-center gap-2 border-b-2 pb-3 transition-colors',
            activeTab === 'flows'
              ? 'border-[#fe5105] text-[#fe5105]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Layers className="h-4 w-4" />
          Mes WhatsApp Flows ({flows.length})
        </button>
        <button
          onClick={() => setActiveTab('responses')}
          className={cn(
            'flex items-center gap-2 border-b-2 pb-3 transition-colors',
            activeTab === 'responses'
              ? 'border-[#fe5105] text-[#fe5105]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <ClipboardList className="h-4 w-4" />
          Réponses Reçues ({responses.length})
        </button>
      </div>

      {/* Error notification */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* TAB 1: FLOWS CARDS (Inspiré Référence Image 5 - Olivia Rhye) */}
      {activeTab === 'flows' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#fe5105]" />
            </div>
          ) : flows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
              <Layers className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-semibold text-foreground">Aucun WhatsApp Flow configuré</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Créez votre premier formulaire natif WhatsApp pour faire commander vos clients directement dans l&apos;application.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setShowGallery(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#fe5105]/30 bg-[#fe5105]/10 px-4 py-2 text-xs font-semibold text-[#fe5105] hover:bg-[#fe5105]/20"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Choisir un modèle prêt à l&apos;emploi
                </button>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-full bg-[#fe5105] px-4 py-2 text-xs font-bold text-white hover:bg-[#fe5105]/90 shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Créer de zéro
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {flows.map((flow) => {
                const screenCount = flow.flow_json?.screens?.length || 2
                return (
                  <div
                    key={flow.id}
                    className="group relative overflow-hidden rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-card/80 backdrop-blur-md shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Noisy Gradient Header Banner (Olivia Rhye Style) */}
                    <div className="relative h-24 w-full bg-gradient-to-r from-emerald-600/35 via-[#fe5105]/30 to-amber-500/35 overflow-hidden">
                      <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
                      <div className="absolute top-3 right-3">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md',
                            flow.status === 'PUBLISHED'
                              ? 'bg-emerald-500/80 text-white'
                              : 'bg-amber-500/80 text-white'
                          )}
                        >
                          {flow.status === 'PUBLISHED' ? 'Actif' : 'Brouillon'}
                        </span>
                      </div>
                    </div>

                    {/* Floating Avatar & Actions */}
                    <div className="relative px-5 pt-0 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="-mt-10 mb-3 flex items-center justify-between">
                          <div className="h-16 w-16 rounded-2xl border-4 border-card bg-[#fe5105] text-white flex items-center justify-center shadow-md">
                            <Layers className="h-7 w-7 text-white" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDuplicateFlow(flow)}
                              title="Dupliquer"
                              className="h-8 w-8 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-card hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFlow(flow)}
                              title="Supprimer"
                              className="h-8 w-8 rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-card hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Category */}
                        <div>
                          <h3 className="text-base font-bold text-foreground leading-tight">{flow.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {flow.categories?.[0] || 'Vente & Devis WhatsApp'}
                          </p>
                        </div>

                        {/* 3 Metrics Row (Olivia Rhye style) */}
                        <div className="grid grid-cols-3 divide-x divide-black/[0.04] dark:divide-white/[0.06] my-4 py-2 border-y border-black/[0.04] dark:border-white/[0.06] text-center">
                          <div>
                            <p className="text-xs font-bold text-foreground">{screenCount}</p>
                            <p className="text-[10px] text-muted-foreground">Écran{screenCount > 1 ? 's' : ''}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-emerald-500">98%</p>
                            <p className="text-[10px] text-muted-foreground">Complétion</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">Mobile</p>
                            <p className="text-[10px] text-muted-foreground">Natif v7.3</p>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Full-Width Pill Action Buttons */}
                      <div className="pb-5 pt-1 flex items-center gap-2">
                        <button
                          onClick={() => openTestModal(flow)}
                          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#fe5105] hover:bg-[#e04602] py-2.5 text-xs font-bold text-white shadow-xs transition-transform active:scale-95"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Tester sur WhatsApp</span>
                        </button>
                        <button
                          onClick={() => openEditFlowBuilder(flow)}
                          className="rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-secondary hover:bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground transition-all"
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
      )}

      {/* TAB 2: RESPONSES */}
      {activeTab === 'responses' && (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          {responses.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium text-foreground">Aucune réponse pour le moment</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Dès qu’un client valide un formulaire WhatsApp Flow, ses réponses apparaîtront ici en temps réel et dans votre Inbox.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {responses.map((resp) => (
                <div key={resp.id} className="p-6 transition-colors hover:bg-secondary/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-foreground">
                        {resp.contact_name || resp.contact_phone}
                      </span>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {resp.contact_phone}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(resp.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>

                  {/* Form response fields preview */}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(resp.response_data || {}).map(([key, val]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-border/70 bg-secondary/30 p-2.5 text-xs"
                      >
                        <span className="font-medium text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')} :
                        </span>
                        <p className="mt-1 font-semibold text-foreground">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FLOW BUILDER MODAL */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                  <Sparkles className="h-5 w-5 text-[#fe5105]" />
                  {editingFlowId ? 'Modifier le WhatsApp Flow' : 'Créer un WhatsApp Flow'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {editingFlowId
                    ? 'Modifiez les champs, les textes et les paramètres de votre formulaire interactif.'
                    : 'Concevez l’écran natif ou partez d’un modèle prêt à l’emploi pour démarrer en quelques secondes.'}
                </p>
              </div>
              <button
                onClick={() => setShowBuilder(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Builder Mode Switcher & Quick Template Action */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBuilderMode('visual')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                    builderMode === 'visual'
                      ? 'bg-[#fe5105] text-white shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Constructeur Visuel
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderMode('json')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                    builderMode === 'json'
                      ? 'bg-[#fe5105] text-white shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  Importer / Coller JSON Meta
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowBuilder(false)
                  setShowGallery(true)
                }}
                className="flex items-center gap-1.5 rounded-lg border border-[#fe5105]/30 bg-[#fe5105]/10 px-3 py-1.5 text-xs font-semibold text-[#fe5105] transition-all hover:bg-[#fe5105]/20"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Charger un Modèle Métier Prêt à l&apos;Emploi
              </button>
            </div>

            {/* Common Flow Metadata */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Nom du Flow *</label>
                <input
                  type="text"
                  required
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  placeholder="ex: Demande de Devis 2026"
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Catégorie Meta</label>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                    <ShieldCheck className="h-3 w-3" /> Certifié 100% Meta Graph API
                  </span>
                </div>
                <select
                  value={flowCategory}
                  onChange={(e) => setFlowCategory(e.target.value as FlowCategory)}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                >
                  <option value="OTHER">🛍️ Boutique, E-commerce & Vente (OTHER — Recommandé pour Shop)</option>
                  <option value="LEAD_GENERATION">📋 Génération de Devis, Prospects & Prêts (LEAD_GENERATION)</option>
                  <option value="APPOINTMENT_BOOKING">📅 Prise de Rendez-vous & Réservation (APPOINTMENT_BOOKING)</option>
                  <option value="CUSTOMER_SUPPORT">🎧 Service Client & Support (CUSTOMER_SUPPORT)</option>
                  <option value="SURVEY">⭐ Sondages & Avis de satisfaction (SURVEY)</option>
                  <option value="SIGN_UP">🎟️ Inscription VIP & Événements (SIGN_UP)</option>
                  <option value="CONTACT_US">✉️ Formulaire de Contact (CONTACT_US)</option>
                  <option value="SIGN_IN">🔐 Connexion & Espace Client (SIGN_IN)</option>
                </select>
                <p className="text-[10px] text-muted-foreground">
                  Sélectionnez la catégorie adaptée. Meta n&apos;accepte que ces 8 types officiels (évite tout rejet).
                </p>
              </div>
            </div>

            {/* WhatsApp Message & Action Button Configuration (Chat Bubble) */}
            <div className="mt-4 rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <MessageSquare className="h-4 w-4 text-[#fe5105]" />
                Message WhatsApp d&apos;invitation (Bulle de conversation avant ouverture du Flow)
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ce texte, image et bouton s&apos;affichent directement dans la discussion WhatsApp du client avant qu&apos;il n&apos;ouvre le Flow.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Texte du message WhatsApp (Invitation au Flow) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={flowBodyText}
                  onChange={(e) => setFlowBodyText(e.target.value)}
                  placeholder="Ex: Bonjour ! Découvrez nos offres exclusives cette semaine et passez commande en quelques secondes :"
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Bouton qui ouvre le Flow (CTA) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={flowCta}
                    onChange={(e) => setFlowCta(e.target.value)}
                    placeholder="Ex: Voir les offres"
                    className="w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                  />
                  <span className="text-[10px] text-muted-foreground">Max 20 car.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    En-tête texte du message (optionnel)
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={flowHeaderText}
                    onChange={(e) => setFlowHeaderText(e.target.value)}
                    placeholder="Ex: 🔥 Offres Privilège"
                    className="w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Pied de page (optionnel)
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={flowFooterText}
                    onChange={(e) => setFlowFooterText(e.target.value)}
                    placeholder="Ex: Livraison express • Paiement sécurisé"
                    className="w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                  />
                </div>
              </div>

              {/* Image Header URL input */}
              <div className="space-y-1 pt-1">
                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <ImageIcon className="h-3.5 w-3.5 text-[#fe5105]" />
                  Image d&apos;en-tête de la bulle WhatsApp (Optionnel — URL HTTPS)
                </label>
                <input
                  type="url"
                  value={flowHeaderImageUrl}
                  onChange={(e) => setFlowHeaderImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... (Image illustrant le catalogue ou la bannière)"
                  className="w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                />
                {flowHeaderImageUrl && (
                  <div className="mt-1.5 h-20 w-48 overflow-hidden rounded-lg border border-border shadow-xs">
                    <img
                      src={flowHeaderImageUrl}
                      alt="Aperçu en-tête"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {builderMode === 'json' ? (
              /* MODE JSON: Raw Meta Flow JSON Editor */
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Code JSON officiel WhatsApp Flow (v7.x / Meta Flow Builder)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(rawJsonInput)
                        setRawJsonInput(JSON.stringify(parsed, null, 2))
                      } catch (e: any) {
                        alert('JSON invalide : ' + e.message)
                      }
                    }}
                    className="text-xs font-medium text-[#fe5105] hover:underline"
                  >
                    Formater le JSON
                  </button>
                </div>
                <textarea
                  rows={18}
                  value={rawJsonInput}
                  onChange={(e) => setRawJsonInput(e.target.value)}
                  placeholder='Collez ici votre Flow JSON généré dans WhatsApp Manager ou le Playground...'
                  className="w-full rounded-xl border border-border bg-input p-3 font-mono text-xs text-foreground outline-none focus:border-[#fe5105]"
                />
              </div>
            ) : (
              /* MODE VISUEL MULTI-PAGES */
              <div className="mt-5 space-y-4">
                {/* Screen Stepper / Tabs Bar */}
                <div className="rounded-xl border border-border bg-secondary/15 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#fe5105]" />
                      <span className="text-xs font-bold text-foreground">
                        Écrans du Flow ({screens.length} page{screens.length > 1 ? 's' : ''})
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        — Cliquez sur un écran pour le modifier
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddScreen}
                      className="flex items-center gap-1.5 rounded-lg border border-[#fe5105]/40 bg-[#fe5105]/10 px-3 py-1.5 text-xs font-semibold text-[#fe5105] hover:bg-[#fe5105]/20 transition-all shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter un écran
                    </button>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {screens.map((sc, idx) => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => {
                          setActiveScreenIndex(idx)
                          setPreviewScreenIndex(idx)
                        }}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all border',
                          activeScreenIndex === idx
                            ? 'bg-[#fe5105] border-[#fe5105] text-white shadow-xs'
                            : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                        )}
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/20 text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{sc.title || `Écran ${idx + 1}`}</span>
                        {sc.actionType === 'navigate' ? (
                          <span className="text-[11px] opacity-80">➔</span>
                        ) : (
                          <span className="text-[11px] opacity-80">💳 Fin</span>
                        )}
                        {screens.length > 1 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveScreen(idx)
                            }}
                            className="ml-1 rounded-full p-0.5 hover:bg-black/20 text-xs text-red-200"
                            title="Supprimer cet écran"
                          >
                            ×
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Tab Switcher: Editor vs Smartphone Preview */}
                <div className="flex lg:hidden items-center justify-center p-1 rounded-xl bg-secondary border border-border">
                  <button
                    type="button"
                    onClick={() => setMobileBuilderTab('editor')}
                    className={cn(
                      'flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5',
                      mobileBuilderTab === 'editor'
                        ? 'bg-card text-foreground shadow-xs border border-border/80 font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Edit3 className="h-3.5 w-3.5 text-[#fe5105]" />
                    <span>Éditeur de pages</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileBuilderTab('preview')}
                    className={cn(
                      'flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5',
                      mobileBuilderTab === 'preview'
                        ? 'bg-card text-foreground shadow-xs border border-border/80 font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Smartphone className="h-3.5 w-3.5 text-[#fe5105]" />
                    <span>Aperçu Smartphone ({previewScreenIndex + 1}/{screens.length})</span>
                  </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-12">
                  {/* Left Column: Active Screen Config & Fields */}
                  <div className={cn(
                    'space-y-4 lg:col-span-7',
                    mobileBuilderTab === 'editor' ? 'block' : 'hidden lg:block'
                  )}>
                    {/* Active Screen Settings */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between border-b border-border pb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Edit3 className="h-3.5 w-3.5 text-[#fe5105]" />
                            Page {activeScreenIndex + 1} sur {screens.length} ({currentScreen.id})
                          </span>
                          {currentScreen.actionType === 'complete' ? (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 border border-emerald-500/20">
                              Écran final (Terminal)
                            </span>
                          ) : (
                            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-500 border border-blue-500/20">
                              Passe à l&apos;écran suivant
                            </span>
                          )}
                        </div>

                        {/* Screen management actions: Reorder, Duplicate, Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={activeScreenIndex === 0}
                            onClick={() => handleMoveScreen(activeScreenIndex, 'left')}
                            title="Déplacer cette page vers la gauche"
                            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={activeScreenIndex === screens.length - 1}
                            onClick={() => handleMoveScreen(activeScreenIndex, 'right')}
                            title="Déplacer cette page vers la droite"
                            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateScreen(activeScreenIndex)}
                            title="Dupliquer cet écran"
                            className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground border border-border"
                          >
                            <Copy className="h-3 w-3" />
                            Dupliquer
                          </button>
                          {screens.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveScreen(activeScreenIndex)}
                              title="Supprimer cet écran"
                              className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-red-500 hover:bg-destructive/10 border border-destructive/20"
                            >
                              <Trash2 className="h-3 w-3" />
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground">
                            Titre dans la barre supérieure Flow *
                          </label>
                          <input
                            type="text"
                            value={currentScreen.title}
                            onChange={(e) => updateCurrentScreen({ title: e.target.value })}
                            placeholder="Ex: Choix du Modèle"
                            className="w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground">
                            Grand Titre (Heading)
                          </label>
                          <input
                            type="text"
                            value={currentScreen.heading || ''}
                            onChange={(e) => updateCurrentScreen({ heading: e.target.value })}
                            placeholder="Ex: Choisissez votre modèle"
                            className="w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground">
                            Sous-titre (Subheading)
                          </label>
                          <input
                            type="text"
                            value={currentScreen.subheading || ''}
                            onChange={(e) => updateCurrentScreen({ subheading: e.target.value })}
                            placeholder="Ex: Étape 2 sur 3 • Modèles disponibles"
                            className="w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground">
                            Image de l&apos;écran (URL HTTPS produit / bannière)
                          </label>
                          <input
                            type="url"
                            value={currentScreen.imageBannerUrl || ''}
                            onChange={(e) => updateCurrentScreen({ imageBannerUrl: e.target.value })}
                            placeholder="https://images.unsplash.com/photo-..."
                            className="w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">
                          Description ou fiche technique détaillée (TextBody)
                        </label>
                        <textarea
                          rows={2}
                          value={currentScreen.bodyText || ''}
                          onChange={(e) => updateCurrentScreen({ bodyText: e.target.value })}
                          placeholder="Ex: Écran OLED 120Hz, 256 Go de stockage, triple capteur photo 108 MP. Garantie 2 ans et livraison 24h offerte."
                          className="w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                        />
                      </div>

                      {/* Screen Navigation Action Configuration */}
                      <div className="rounded-lg border border-border/80 bg-secondary/20 p-3 space-y-2">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <ChevronRight className="h-3.5 w-3.5 text-[#fe5105]" />
                          Action du bouton en bas de cet écran :
                        </label>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-foreground">Type d&apos;action</label>
                            <select
                              value={currentScreen.actionType || 'complete'}
                              onChange={(e) =>
                                updateCurrentScreen({
                                  actionType: e.target.value as 'navigate' | 'complete',
                                  terminal: e.target.value === 'complete',
                                })
                              }
                              className="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                            >
                              <option value="navigate">Passer à l&apos;écran suivant (navigate)</option>
                              <option value="complete">Terminer &amp; Payer (complete)</option>
                            </select>
                          </div>

                          {currentScreen.actionType === 'navigate' && (
                            <div className="space-y-1">
                              <label className="text-[11px] font-medium text-foreground">Vers quel écran ?</label>
                              <select
                                value={currentScreen.targetScreenId || ''}
                                onChange={(e) => updateCurrentScreen({ targetScreenId: e.target.value })}
                                className="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                              >
                                <option value="">Écran suivant par défaut</option>
                                {screens
                                  .filter((_, idx) => idx !== activeScreenIndex)
                                  .map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.title} ({s.id})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-foreground">Texte du bouton (CTA)</label>
                            <input
                              type="text"
                              value={currentScreen.ctaLabel || 'Continuer'}
                              onChange={(e) => updateCurrentScreen({ ctaLabel: e.target.value })}
                              placeholder="Ex: Suivant ➔ ou 💳 Commander"
                              className="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fields List for Current Screen */}
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-bold text-foreground flex items-center justify-between">
                        <span>Champs du formulaire sur cet écran ({currentScreen.fields?.length || 0})</span>
                      </label>
                      <div className="space-y-2">
                        {currentScreen.fields?.map((field, idx) => (
                          <div
                            key={field.id}
                            className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-foreground">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-foreground">
                                  {field.label}{' '}
                                  {field.required && <span className="text-[#fe5105]">*</span>}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  Type: {field.type} • Clé: <code className="font-mono">{field.name}</code>
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveField(field.id)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add Field Form */}
                    <div className="rounded-xl border border-border/80 bg-secondary/15 p-4">
                      <p className="text-xs font-semibold text-foreground mb-2">
                        + Ajouter un champ à l&apos;Écran {activeScreenIndex + 1}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-foreground">Type de champ</label>
                          <select
                            value={newFieldType}
                            onChange={(e) => setNewFieldType(e.target.value as any)}
                            className="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                          >
                            <option value="TextInput">Texte court (TextInput)</option>
                            <option value="TextArea">Texte long (TextArea)</option>
                            <option value="Dropdown">Menu déroulant (Dropdown)</option>
                            <option value="RadioButtons">Choix unique (RadioButtons)</option>
                            <option value="CheckboxGroup">Cases à cocher (Checkbox)</option>
                            <option value="DatePicker">Sélecteur de Date</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-foreground">Libellé (Label) *</label>
                          <input
                            type="text"
                            value={newFieldLabel}
                            onChange={(e) => setNewFieldLabel(e.target.value)}
                            placeholder="Ex: Choisir votre modèle"
                            className="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-foreground">Clé de réponse (JSON)</label>
                          <input
                            type="text"
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            placeholder="Ex: selected_model"
                            className="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-xs font-mono text-foreground outline-none focus:border-[#fe5105]"
                          />
                        </div>
                      </div>

                      {['Dropdown', 'RadioButtons', 'CheckboxGroup'].includes(newFieldType) && (
                        <div className="mt-2 space-y-1">
                          <label className="text-[11px] font-medium text-foreground">
                            Options disponibles (séparées par une virgule)
                          </label>
                          <input
                            type="text"
                            value={newFieldOptions}
                            onChange={(e) => setNewFieldOptions(e.target.value)}
                            placeholder="TechWave TW14 Pro 325 000 FCFA, Apex Aura 260 000 FCFA..."
                            className="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                          />
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs text-foreground">
                          <input
                            type="checkbox"
                            checked={newFieldRequired}
                            onChange={(e) => setNewFieldRequired(e.target.checked)}
                            className="accent-[#fe5105]"
                          />
                          Champ obligatoire
                        </label>

                        <button
                          type="button"
                          onClick={handleAddField}
                          className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
                        >
                          Ajouter ce champ
                        </button>
                      </div>
                    </div>

                    {builderError && (
                      <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                        {builderError}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Live Interactive WhatsApp Mobile Preview */}
                  <div className={cn(
                    'flex flex-col items-center lg:col-span-5',
                    mobileBuilderTab === 'preview' ? 'flex' : 'hidden lg:flex'
                  )}>
                    <div className="mb-2 flex items-center justify-between w-full max-w-[320px]">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Smartphone className="h-4 w-4 text-[#fe5105]" />
                        Aperçu Interactif
                      </p>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-[#fe5105]">
                        <span>Écran {previewScreenIndex + 1}/{screens.length}</span>
                      </div>
                    </div>

                    {/* Smartphone Mockup */}
                    <div className="w-[300px] sm:w-[320px] rounded-[36px] border-4 border-neutral-800 bg-[#0b141a] p-3 shadow-2xl">
                      {/* Speaker notch */}
                      <div className="mx-auto mb-2 h-4 w-28 rounded-full bg-neutral-800" />

                      {/* Flow Screen Container */}
                      {(() => {
                        const pScreen = screens[previewScreenIndex] || currentScreen
                        return (
                          <div className="min-h-[500px] rounded-[24px] bg-[#121b22] text-white flex flex-col justify-between overflow-hidden shadow-inner">
                            {/* Screen Top Bar */}
                            <div className="flex items-center justify-between border-b border-[#202c33] bg-[#202c33] px-3.5 py-2.5">
                              <div className="flex items-center gap-2">
                                {previewScreenIndex > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewScreenIndex(previewScreenIndex - 1)}
                                    className="text-neutral-400 hover:text-white"
                                    title="Page précédente"
                                  >
                                    ←
                                  </button>
                                ) : (
                                  <X className="h-4 w-4 text-neutral-400" />
                                )}
                                <span className="text-xs font-bold truncate max-w-[170px]">
                                  {pScreen.title || 'Formulaire'}
                                </span>
                              </div>
                              <span className="rounded-md bg-[#2a3942] px-1.5 py-0.5 text-[9px] font-bold text-neutral-300">
                                {previewScreenIndex + 1}/{screens.length}
                              </span>
                            </div>

                            {/* Screen Body Content */}
                            <div className="flex-1 p-3.5 space-y-3 overflow-y-auto max-h-[390px]">
                              {/* Screen Banner Image if present */}
                              {pScreen.imageBannerUrl && (
                                <div className="h-28 w-full overflow-hidden rounded-xl border border-[#2a3942]">
                                  <img
                                    src={pScreen.imageBannerUrl}
                                    alt="Visuel"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}

                              {/* Headings */}
                              {pScreen.heading && (
                                <h4 className="text-sm font-bold text-neutral-100 leading-tight">
                                  {pScreen.heading}
                                </h4>
                              )}

                              {pScreen.subheading && (
                                <p className="text-[11px] font-semibold text-emerald-400">
                                  {pScreen.subheading}
                                </p>
                              )}

                              {pScreen.bodyText && (
                                <p className="text-[10px] text-neutral-300 whitespace-pre-line leading-relaxed bg-[#202c33]/40 p-2 rounded-lg border border-[#2a3942]">
                                  {pScreen.bodyText}
                                </p>
                              )}

                              {/* Fields */}
                              {pScreen.fields?.map((f) => (
                                <div key={f.id} className="space-y-1">
                                  <label className="text-[11px] font-medium text-neutral-300">
                                    {f.label} {f.required && <span className="text-emerald-400">*</span>}
                                  </label>

                                  {f.type === 'TextInput' && (
                                    <div className="rounded-lg border border-[#2a3942] bg-[#202c33] px-3 py-1.5 text-xs text-neutral-200">
                                      {f.placeholder || 'Tapez ici...'}
                                    </div>
                                  )}

                                  {f.type === 'TextArea' && (
                                    <div className="h-14 rounded-lg border border-[#2a3942] bg-[#202c33] px-3 py-1.5 text-xs text-neutral-200">
                                      {f.placeholder || 'Détails...'}
                                    </div>
                                  )}

                                  {f.type === 'Dropdown' && (
                                    <div className="flex items-center justify-between rounded-lg border border-[#2a3942] bg-[#202c33] px-3 py-1.5 text-xs text-neutral-300">
                                      <span>Sélectionnez une option</span>
                                      <ChevronRight className="h-3.5 w-3.5 text-neutral-400 rotate-90" />
                                    </div>
                                  )}

                                  {f.type === 'RadioButtons' && (
                                    <div className="space-y-1">
                                      {f.options?.map((opt, oIdx) => (
                                        <div
                                          key={opt.id}
                                          className={cn(
                                            'flex items-center gap-2 rounded-lg p-2 text-xs transition-all border',
                                            oIdx === 0
                                              ? 'border-[#00a884] bg-[#00a884]/10 text-white'
                                              : 'border-[#2a3942] bg-[#202c33]/50 text-neutral-300'
                                          )}
                                        >
                                          <div
                                            className={cn(
                                              'h-3.5 w-3.5 rounded-full border flex items-center justify-center',
                                              oIdx === 0 ? 'border-[#00a884]' : 'border-neutral-400'
                                            )}
                                          >
                                            {oIdx === 0 && <div className="h-1.5 w-1.5 rounded-full bg-[#00a884]" />}
                                          </div>
                                          <div>
                                            <p className="font-semibold text-[11px] leading-tight">{opt.title}</p>
                                            {opt.description && (
                                              <p className="text-[9px] text-neutral-400 leading-tight">
                                                {opt.description}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {f.type === 'CheckboxGroup' && (
                                    <div className="space-y-1">
                                      {f.options?.slice(0, 3).map((opt) => (
                                        <div
                                          key={opt.id}
                                          className="flex items-center gap-2 rounded-md bg-[#202c33]/50 px-2 py-1.5 text-xs text-neutral-300"
                                        >
                                          <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                                          <span className="text-[11px]">{opt.title}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {f.type === 'DatePicker' && (
                                    <div className="flex items-center justify-between rounded-lg border border-[#2a3942] bg-[#202c33] px-3 py-1.5 text-xs text-neutral-300">
                                      <span>Choisir une date</span>
                                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Bottom CTA with Interactive Navigation */}
                            <div className="border-t border-[#202c33] bg-[#121b22] p-3 space-y-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (pScreen.actionType === 'navigate') {
                                    const targetIdx = pScreen.targetScreenId
                                      ? screens.findIndex((s) => s.id === pScreen.targetScreenId)
                                      : -1
                                    const nextIdx = targetIdx >= 0 ? targetIdx : previewScreenIndex + 1
                                    if (nextIdx < screens.length) {
                                      setPreviewScreenIndex(nextIdx)
                                    }
                                  } else {
                                    alert(
                                      '🎉 Flow complété !\n\nQuand le client clique sur ce bouton, Whatooz intercepte sa réponse et lui envoie instantanément sur WhatsApp son Lien de Paiement sécurisé Wave / Mobile Money !'
                                    )
                                  }
                                }}
                                className="w-full rounded-full bg-[#00a884] hover:bg-[#00a884]/90 py-2.5 text-center text-xs font-bold text-[#111b21] shadow-md transition-all active:scale-95"
                              >
                                {pScreen.ctaLabel || (pScreen.actionType === 'navigate' ? 'Suivant ➔' : 'Valider')}
                              </button>
                              <p className="text-center text-[9px] text-neutral-400">
                                {pScreen.actionType === 'navigate'
                                  ? 'Cliquez pour tester le passage à l’écran suivant'
                                  : 'Cliquez pour simuler la fin et l’envoi du lien de paiement'}
                              </p>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setShowBuilder(false)}
                disabled={saving}
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => handleSaveFlow(false)}
                disabled={saving}
                className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Enregistrer en Brouillon'}
              </button>
              <button
                type="button"
                onClick={() => handleSaveFlow(true)}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#fe5105] px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-[#fe5105]/90 disabled:opacity-50 shadow-sm"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Publier directement sur Meta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEST FLOW MODAL */}
      {testFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Tester le WhatsApp Flow
                </h3>
                <p className="text-xs text-[#fe5105] font-medium">{testFlow.name}</p>
              </div>
              <button
                onClick={() => setTestFlow(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSendTestFlow} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground">
                  Numéro de téléphone destinataire (avec indicatif) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 2376XXXXXXXX ou 336XXXXXXXX"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                />
              </div>

              {/* Message customization */}
              <div className="rounded-xl border border-border bg-secondary/20 p-3.5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <MessageSquare className="h-3.5 w-3.5 text-[#fe5105]" />
                  Message d&apos;invitation & Bouton WhatsApp
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground">
                    Texte du message (envoyé avant le clic sur le bouton) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={testBody}
                    onChange={(e) => setTestBody(e.target.value)}
                    placeholder="Message d'invitation à remplir le formulaire..."
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground">
                      Libellé du bouton (CTA) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={20}
                      value={testCta}
                      onChange={(e) => setTestCta(e.target.value)}
                      placeholder="Ex: Remplir le formulaire"
                      className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                    />
                    <span className="text-[10px] text-muted-foreground">Max 20 caractères</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground">
                      En-tête (optionnel)
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      value={testHeader}
                      onChange={(e) => setTestHeader(e.target.value)}
                      placeholder="Ex: Demande de Devis"
                      className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground">
                    Image d&apos;en-tête (optionnelle — URL HTTPS)
                  </label>
                  <input
                    type="url"
                    value={testHeaderImageUrl}
                    onChange={(e) => setTestHeaderImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground">
                    Pied de page (optionnel)
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={testFooter}
                    onChange={(e) => setTestFooter(e.target.value)}
                    placeholder="Ex: Whatooz • Formulaire sécurisé"
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-1.5 text-xs text-foreground outline-none focus:border-[#fe5105]"
                  />
                </div>

                {/* Live WhatsApp Bubble Preview */}
                <div>
                  <span className="block text-[11px] font-medium text-muted-foreground mb-1.5">
                    Aperçu en direct dans WhatsApp :
                  </span>
                  <div className="max-w-md rounded-2xl bg-[#0b141a] p-3.5 text-white shadow-md border border-[#202c33]">
                    {testHeaderImageUrl && (
                      <div className="mb-2 h-36 w-full overflow-hidden rounded-xl border border-[#202c33]">
                        <img
                          src={testHeaderImageUrl}
                          alt="En-tête WhatsApp"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    {testHeader && (
                      <p className="text-xs font-bold text-slate-100 mb-1">{testHeader}</p>
                    )}
                    <p className="text-xs whitespace-pre-wrap text-slate-200">
                      {testBody || 'Votre message apparaîtra ici...'}
                    </p>
                    {testFooter && (
                      <p className="text-[10px] text-slate-400 mt-1">{testFooter}</p>
                    )}
                    <div className="mt-2.5 pt-2 border-t border-[#222e35]">
                      <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#202c33] py-2 text-center text-xs font-semibold text-[#00a884] hover:bg-[#202c33]/80 cursor-default">
                        <Layers className="h-3.5 w-3.5" />
                        {testCta || 'Ouvrir le formulaire'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {testResult?.error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  {testResult.error}
                </div>
              )}
              {testResult?.success && (
                <div className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-500">
                  ✅ WhatsApp Flow envoyé avec succès sur votre téléphone ! Ouvrez WhatsApp pour tester le formulaire interactif.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTestFlow(null)}
                  disabled={testSending}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={testSending}
                  className="flex items-center gap-2 rounded-lg bg-[#fe5105] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#fe5105]/90 disabled:opacity-50 shadow-sm"
                >
                  {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Envoyer le Flow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MESSAGE MODAL */}
      {editFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Personnaliser le message WhatsApp du Flow
                </h3>
                <p className="text-xs text-[#fe5105] font-medium">{editFlow.name}</p>
              </div>
              <button
                onClick={() => setEditFlow(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMessage} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground">
                  Texte du message WhatsApp (envoyé avant le clic sur le bouton) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder="Ex: Bonjour ! Veuillez remplir notre questionnaire pour obtenir votre devis personnalisé :"
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-foreground">
                    Libellé du bouton (CTA) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={editCta}
                    onChange={(e) => setEditCta(e.target.value)}
                    placeholder="Ex: Remplir le formulaire"
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                  />
                  <span className="text-[10px] text-muted-foreground">Max 20 caractères</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground">
                    En-tête texte (optionnel)
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={editHeader}
                    onChange={(e) => setEditHeader(e.target.value)}
                    placeholder="Ex: Demande de Devis"
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground">
                  Image d&apos;en-tête (optionnelle — URL HTTPS)
                </label>
                <input
                  type="url"
                  value={editHeaderImageUrl}
                  onChange={(e) => setEditHeaderImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground">
                  Pied de page (optionnel)
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={editFooter}
                  onChange={(e) => setEditFooter(e.target.value)}
                  placeholder="Ex: Whatooz • Formulaire sécurisé"
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                />
              </div>

              {/* Preview */}
              <div>
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Aperçu du message WhatsApp :
                </span>
                <div className="rounded-2xl bg-[#0b141a] p-3.5 text-white shadow-md border border-[#202c33]">
                  {editHeaderImageUrl && (
                    <div className="mb-2 h-36 w-full overflow-hidden rounded-xl border border-[#202c33]">
                      <img
                        src={editHeaderImageUrl}
                        alt="En-tête"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  {editHeader && (
                    <p className="text-xs font-bold text-slate-100 mb-1">{editHeader}</p>
                  )}
                  <p className="text-xs whitespace-pre-wrap text-slate-200">
                    {editBody || 'Votre message WhatsApp...'}
                  </p>
                  {editFooter && (
                    <p className="text-[10px] text-slate-400 mt-1">{editFooter}</p>
                  )}
                  <div className="mt-2.5 pt-2 border-t border-[#222e35]">
                    <div className="flex items-center justify-center gap-1.5 rounded-lg bg-[#202c33] py-2 text-center text-xs font-semibold text-[#00a884]">
                      <Layers className="h-3.5 w-3.5" />
                      {editCta || 'Ouvrir le formulaire'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditFlow(null)}
                  disabled={editSaving}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex items-center gap-2 rounded-lg bg-[#fe5105] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#fe5105]/90 disabled:opacity-50 shadow-sm"
                >
                  {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREBUILT TEMPLATES GALLERY MODAL */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fe5105]/10 text-[#fe5105]">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg font-bold text-foreground">
                    Modèles de WhatsApp Flows Prêts à l&apos;Emploi
                  </h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Inspirés directement des meilleurs cas d&apos;usage WhatsApp Business (E-commerce, Banque, Mutuelle, B2B, Événements). Démarrez en 1 clic et personnalisez à votre image !
                </p>
              </div>
              <button
                onClick={() => setShowGallery(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PREBUILT_FLOW_TEMPLATES.map((tpl) => {
                const firstScreen = tpl.screens[0]
                return (
                  <div
                    key={tpl.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-[#fe5105]/50 hover:shadow-lg"
                  >
                    <div>
                      {/* Image Header Preview if exists */}
                      {tpl.headerImageUrl && (
                        <div className="relative mb-3 h-32 w-full overflow-hidden rounded-xl border border-border bg-secondary">
                          <img
                            src={tpl.headerImageUrl}
                            alt={tpl.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                            {tpl.badge}
                          </span>
                        </div>
                      )}

                      {!tpl.headerImageUrl && (
                        <div className="mb-2">
                          <span className="rounded-md bg-[#fe5105]/10 px-2 py-0.5 text-[10px] font-semibold text-[#fe5105]">
                            {tpl.badge}
                          </span>
                        </div>
                      )}

                      <h3 className="font-semibold text-sm text-foreground group-hover:text-[#fe5105] transition-colors">
                        {tpl.name}
                      </h3>
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {tpl.description}
                      </p>

                      {/* Fields preview */}
                      <div className="mt-3 rounded-lg border border-border/60 bg-secondary/30 p-2.5 space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {firstScreen?.fields.length || 0} champs inclus :
                        </span>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {firstScreen?.fields.slice(0, 4).map((f) => (
                            <span
                              key={f.id}
                              className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-foreground"
                            >
                              {f.label}
                            </span>
                          ))}
                          {(firstScreen?.fields.length || 0) > 4 && (
                            <span className="text-[10px] text-muted-foreground self-center">
                              +{firstScreen!.fields.length - 4} autres
                            </span>
                          )}
                        </div>
                      </div>

                      {/* CTA label */}
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Bouton WhatsApp : <span className="font-semibold text-foreground">&quot;{tpl.flowCta}&quot;</span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {tpl.category}
                      </span>
                      <button
                        onClick={() => loadPrebuiltTemplate(tpl)}
                        className="flex items-center gap-1.5 rounded-lg bg-[#fe5105] px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#fe5105]/90 shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Utiliser ce modèle
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
