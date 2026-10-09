'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  ArrowLeft, 
  Send, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Tag as TagIcon, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Repeat, 
  Eye, 
  Info, 
  ChevronRight, 
  Plus, 
  Trash2, 
  FileText 
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { usePlanAccess } from '@/hooks/use-plan-access'
import { cn } from '@/lib/utils'

interface ContactItem {
  id: string
  name: string | null
  phone: string
  tag_ids: string[]
}

interface TagItem {
  id: string
  name: string
  color: string
}

interface TemplateComponent {
  type: string
  format?: string
  text?: string
  example?: any
  buttons?: any[]
}

interface WhatsAppTemplate {
  id: string
  name: string
  language: string
  status: string
  category?: string
  components: TemplateComponent[]
}

const WEEKDAYS = [
  { id: 'monday', label: 'Lundi', short: 'Lun' },
  { id: 'tuesday', label: 'Mardi', short: 'Mar' },
  { id: 'wednesday', label: 'Mercredi', short: 'Mer' },
  { id: 'thursday', label: 'Jeudi', short: 'Jeu' },
  { id: 'friday', label: 'Vendredi', short: 'Ven' },
  { id: 'saturday', label: 'Samedi', short: 'Sam' },
  { id: 'sunday', label: 'Dimanche', short: 'Dim' },
]

export default function NewCampaignPage() {
  const router = useRouter()
  const { activeOrganization } = useOrganization()
  const { canAccess, plan } = usePlanAccess()
  const supabase = createClient()

  // Step 1: Campagne details
  const [name, setName] = useState('')
  const [campaignMode, setCampaignMode] = useState<'direct' | 'scheduled'>('direct')

  // Step 2: Scheduling options (if scheduled)
  const [scheduleType, setScheduleType] = useState<'recurring' | 'once'>('recurring')
  const [scheduledAt, setScheduledAt] = useState('')
  const [selectedDays, setSelectedDays] = useState<string[]>(['monday', 'wednesday', 'friday'])
  const [timesPerDay, setTimesPerDay] = useState<string[]>(['09:00', '18:00'])
  const [frequencyPerDay, setFrequencyPerDay] = useState<number>(2)

  // Step 3: Audience
  const [targetType, setTargetType] = useState<'all' | 'tags'>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [availableTags, setAvailableTags] = useState<TagItem[]>([])
  const [loadingAudience, setLoadingAudience] = useState(true)

  // Step 4: Templates & Variables
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [selectedTemplateName, setSelectedTemplateName] = useState('')
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [variableMappings, setVariableMappings] = useState<Record<string, { source: string; customText?: string; fallback?: string }>>({})

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Load Contacts, Tags and Templates
  useEffect(() => {
    if (!activeOrganization) return

    async function loadData() {
      setLoadingAudience(true)
      try {
        // Load tags
        const { data: tagsData } = await supabase
          .from('tags')
          .select('id, name, color')
          .eq('organization_id', activeOrganization!.id)
        
        if (tagsData) setAvailableTags(tagsData)

        // Load contacts with their tags
        const { data: contactsData } = await supabase
          .from('contacts')
          .select('id, name, phone, contact_tags(tag_id)')
          .eq('organization_id', activeOrganization!.id)

        if (contactsData) {
          const mappedContacts: ContactItem[] = contactsData.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            tag_ids: (c.contact_tags || []).map((ct: any) => ct.tag_id).filter(Boolean),
          }))
          setContacts(mappedContacts)
        }
      } catch (e) {
        console.error('Error loading audience data:', e)
      } finally {
        setLoadingAudience(false)
      }

      // Load Templates
      setLoadingTemplates(true)
      try {
        // Try Meta API
        const metaRes = await fetch('/api/whatsapp/templates', {
          headers: { 'x-organization-id': activeOrganization!.id }
        })

        if (metaRes.ok) {
          const { templates: tList } = await metaRes.json()
          const approved = (tList || []).filter((t: any) => t.status === 'APPROVED' || t.status === 'APPROVED_UPDATE_REQUESTED')
          if (approved.length > 0) {
            setTemplates(approved)
            setSelectedTemplateName(approved[0].name)
          }
        } else {
          // Fallback to local DB templates
          const { data: localTemplates } = await supabase
            .from('whatsapp_templates')
            .select('*')
            .eq('organization_id', activeOrganization!.id)

          if (localTemplates && localTemplates.length > 0) {
            const mapped = localTemplates.map((lt: any) => ({
              id: lt.id,
              name: lt.name,
              language: lt.language || 'fr',
              status: lt.status || 'APPROVED',
              category: lt.category,
              components: lt.compiled_payload || [
                { type: 'BODY', text: lt.body?.text || lt.text || 'Bonjour {{1}}, voici votre message spécial.' }
              ]
            }))
            setTemplates(mapped)
            setSelectedTemplateName(mapped[0].name)
          }
        }
      } catch (e) {
        console.error('Error loading templates:', e)
      } finally {
        setLoadingTemplates(false)
      }
    }

    loadData()
  }, [activeOrganization, supabase])

  // Selected template object
  const selectedTemplate = useMemo(() => {
    return templates.find(t => t.name === selectedTemplateName)
  }, [templates, selectedTemplateName])

  // Extract template body text
  const templateBodyComponent = useMemo(() => {
    return selectedTemplate?.components?.find((c: any) => c.type === 'BODY')
  }, [selectedTemplate])

  const templateBodyText = templateBodyComponent?.text || ''

  // Detect placeholders like {{1}}, {{2}}, {{name}}, {{prenom}} in the body
  const detectedVariables = useMemo(() => {
    if (!templateBodyText) return []
    const matches = templateBodyText.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g)
    if (!matches) return []
    return Array.from(new Set(matches))
  }, [templateBodyText])

  // Initialize variable mappings whenever detected variables change
  useEffect(() => {
    if (detectedVariables.length === 0) return

    setVariableMappings(prev => {
      const next = { ...prev }
      detectedVariables.forEach((v, index) => {
        if (!next[v]) {
          // Default: first variable maps to first name or full name
          next[v] = {
            source: index === 0 ? 'contact_first_name' : 'contact_name',
            customText: '',
            fallback: 'Cher client',
          }
        }
      })
      return next
    })
  }, [detectedVariables])

  // Calculate target contacts
  const targetAudienceContacts = useMemo(() => {
    if (targetType === 'all') {
      return contacts
    }
    if (selectedTags.length === 0) {
      return []
    }
    // Filter contacts that have at least one of the selected tags
    return contacts.filter(contact => 
      selectedTags.some(tagId => contact.tag_ids.includes(tagId))
    )
  }, [contacts, targetType, selectedTags])

  // Update frequency times
  const handleFrequencyChange = (freq: number) => {
    setFrequencyPerDay(freq)
    const defaults = ['09:00', '14:00', '18:00', '21:00']
    const newTimes = Array.from({ length: freq }).map((_, i) => timesPerDay[i] || defaults[i] || '12:00')
    setTimesPerDay(newTimes)
  }

  const handleTimeChange = (index: number, val: string) => {
    setTimesPerDay(prev => {
      const next = [...prev]
      next[index] = val
      return next
    })
  }

  const toggleDay = (dayId: string) => {
    setSelectedDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    )
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    )
  }



  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Veuillez renseigner un nom pour cette campagne.')
      return
    }
    if (!selectedTemplateName) {
      setErrorMsg('Veuillez sélectionner un modèle WhatsApp approuvé.')
      return
    }
    if (targetType === 'tags' && selectedTags.length === 0) {
      setErrorMsg('Veuillez sélectionner au moins un tag pour le ciblage par tags.')
      return
    }
    if (targetAudienceContacts.length === 0) {
      setErrorMsg('Aucun contact trouvé pour cette audience. Veuillez ajouter des contacts ou modifier vos filtres.')
      return
    }
    if (campaignMode === 'scheduled' && scheduleType === 'recurring' && selectedDays.length === 0) {
      setErrorMsg('Veuillez sélectionner au moins un jour pour la diffusion récurrente.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)

    try {
      const schedulingPayload = campaignMode === 'direct' ? {
        mode: 'direct',
      } : scheduleType === 'recurring' ? {
        mode: 'recurring',
        days: selectedDays,
        times: timesPerDay,
        frequencyPerDay,
      } : {
        mode: 'once',
        scheduledAt,
      }

      const payload = {
        organizationId: activeOrganization?.id,
        name: name.trim(),
        campaign_mode: campaignMode,
        target_type: targetType,
        target_tags: targetType === 'tags' ? selectedTags : [],
        target_contacts: targetAudienceContacts.map(c => c.id),
        message_type: 'template',
        message_payload: {
          templateId: selectedTemplateName,
          templateName: selectedTemplateName,
          templateLanguage: selectedTemplate?.language || 'fr_FR',
          templateVariablesMapping: variableMappings,
          scheduling: schedulingPayload,
        },
        scheduled_at: campaignMode === 'scheduled' && scheduleType === 'once' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        recurrence: campaignMode === 'scheduled' && scheduleType === 'recurring' ? 'recurring' : 'once',
      }

      const res = await fetch('/api/whatsapp/broadcasts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization?.id || ''
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la campagne')
      }

      router.push('/dashboard/campaigns')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || "Une erreur s'est produite lors de la création.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <Link 
          href="/dashboard/campaigns" 
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Retour aux campagnes"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Créer une Campagne WhatsApp
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Configurez vos messages personnalisés, votre audience cible et la récurrence automatique.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Informations Générales & Mode */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
            <h2 className="text-base font-semibold text-foreground">Type & Paramètres de la Campagne</h2>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Nom de la campagne</label>
            <input 
              type="text" 
              required
              placeholder="Ex: Relance Paniers VIP - Octobre 2026"
              className="w-full px-3.5 py-2.5 border border-input bg-background rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-foreground">Mode d'exécution</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label 
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                  campaignMode === 'direct' ? "border-[#fe5105] bg-[#fe5105]/5 shadow-xs" : "border-border hover:bg-muted/40"
                )}
              >
                <input 
                  type="radio" 
                  name="campaignMode" 
                  className="mt-1 accent-[#fe5105]" 
                  checked={campaignMode === 'direct'} 
                  onChange={() => setCampaignMode('direct')} 
                />
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
                    <Send className="w-4 h-4 text-[#fe5105]" />
                    <span>Campagne Directe</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Envoi immédiat en masse à l'ensemble des destinataires éligibles dès validation.
                  </p>
                </div>
              </label>

              <label 
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                  campaignMode === 'scheduled' ? "border-[#fe5105] bg-[#fe5105]/5 shadow-xs" : "border-border hover:bg-muted/40"
                )}
              >
                <input 
                  type="radio" 
                  name="campaignMode" 
                  className="mt-1 accent-[#fe5105]" 
                  checked={campaignMode === 'scheduled'} 
                  onChange={() => setCampaignMode('scheduled')} 
                />
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
                    <CalendarIcon className="w-4 h-4 text-blue-500" />
                    <span>Campagne Programmée</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Planification récurrente (ex: tous les lundis & jeudis) ou envoi unique à date précise.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 2: Planification et Récurrence (si mode programmé) */}
        {campaignMode === 'scheduled' && (
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-bold">2</span>
              <h2 className="text-base font-semibold text-foreground">Planification & Fréquence Quotidienne</h2>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input 
                  type="radio" 
                  name="scheduleType" 
                  checked={scheduleType === 'recurring'} 
                  onChange={() => setScheduleType('recurring')} 
                  className="accent-[#fe5105]"
                />
                <span>Diffusion récurrente par jour</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input 
                  type="radio" 
                  name="scheduleType" 
                  checked={scheduleType === 'once'} 
                  onChange={() => setScheduleType('once')} 
                  className="accent-[#fe5105]"
                />
                <span>Envoi unique à date précise</span>
              </label>
            </div>

            {scheduleType === 'recurring' ? (
              <div className="space-y-4 pt-2">
                {/* Multi-day selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    Jours de diffusion dans la semaine
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {WEEKDAYS.map(day => {
                      const isSelected = selectedDays.includes(day.id)
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => toggleDay(day.id)}
                          className={cn(
                            "py-2 px-1 text-xs font-semibold rounded-xl border transition-all text-center",
                            isSelected 
                              ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                              : "bg-background text-muted-foreground border-border hover:bg-muted"
                          )}
                        >
                          <span className="block sm:hidden">{day.short}</span>
                          <span className="hidden sm:block">{day.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Frequency selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    Fréquence d'envoi par jour
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map(freq => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => handleFrequencyChange(freq)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all",
                          frequencyPerDay === freq 
                            ? "bg-foreground text-background border-foreground shadow-xs" 
                            : "bg-background border-border text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {freq} fois / jour
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hours for each execution */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    Horaires de passage ({frequencyPerDay} heure{frequencyPerDay > 1 ? 's' : ''})
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {timesPerDay.map((time, idx) => (
                      <div key={idx} className="flex flex-col gap-1 p-2.5 rounded-xl border border-border bg-background">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          Diffusion #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <input 
                            type="time" 
                            required
                            value={time}
                            onChange={e => handleTimeChange(idx, e.target.value)}
                            className="w-full bg-transparent text-sm font-mono outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-medium text-foreground">Date et heure précise d'envoi</label>
                <div className="relative max-w-sm">
                  <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="datetime-local" 
                    required={scheduleType === 'once'}
                    className="w-full pl-9 pr-3 py-2 border border-input bg-background rounded-xl text-sm outline-none focus:border-primary"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: Ciblage de l'Audience */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-bold">3</span>
              <h2 className="text-base font-semibold text-foreground">Ciblage de l'Audience</h2>
            </div>
            
            {/* Live Count Pill */}
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{targetAudienceContacts.length} destinataire{targetAudienceContacts.length > 1 ? 's' : ''} ciblé{targetAudienceContacts.length > 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input 
                  type="radio" 
                  name="targetType" 
                  checked={targetType === 'all'} 
                  onChange={() => setTargetType('all')} 
                  className="accent-[#fe5105]"
                />
                <span>Tous les contacts ({contacts.length})</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input 
                  type="radio" 
                  name="targetType" 
                  checked={targetType === 'tags'} 
                  onChange={() => setTargetType('tags')} 
                  className="accent-[#fe5105]"
                />
                <span>Cibler par tags enregistrés</span>
              </label>
            </div>

            {targetType === 'tags' && (
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                <label className="text-xs font-medium text-foreground block">
                  Sélectionnez les tags CRM des contacts à cibler :
                </label>
                {availableTags.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Aucun tag enregistré dans le CRM. Rendez-vous dans l'inbox pour créer des tags.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => {
                      const isSelected = selectedTags.includes(tag.id)
                      const contactsWithThisTag = contacts.filter(c => c.tag_ids.includes(tag.id)).length

                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          style={{
                            backgroundColor: isSelected ? tag.color : 'transparent',
                            borderColor: tag.color,
                            color: isSelected ? '#ffffff' : tag.color,
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5",
                            isSelected ? "shadow-xs" : "hover:bg-muted"
                          )}
                        >
                          <TagIcon className="w-3 h-3" />
                          <span>{tag.name}</span>
                          <span className={cn(
                            "px-1.5 py-0.2 rounded-full text-[10px]",
                            isSelected ? "bg-black/20 text-white" : "bg-muted text-muted-foreground"
                          )}>
                            {contactsWithThisTag}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: Template WhatsApp & Personnalisation des Variables */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <span className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center text-xs font-bold">4</span>
            <div>
              <h2 className="text-base font-semibold text-foreground">Modèle Meta & Variables Personnalisées</h2>
              <p className="text-xs text-muted-foreground">
                Assignez les variables de votre message au nom ou données de chaque contact.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-foreground">Sélectionnez le modèle approuvé</label>
            {loadingTemplates ? (
              <div className="text-xs text-muted-foreground py-2">Chargement des modèles WhatsApp...</div>
            ) : templates.length === 0 ? (
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs">
                Aucun modèle WhatsApp approuvé n'est disponible. Créez un modèle dans l'onglet "Templates" au préalable.
              </div>
            ) : (
              <select
                required
                value={selectedTemplateName}
                onChange={e => setSelectedTemplateName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-input bg-background rounded-xl text-sm outline-none focus:border-primary"
              >
                {templates.map(t => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.language || 'fr'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Variables Mapping Grid */}
          {detectedVariables.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>Personnalisation dynamique des variables ({detectedVariables.length})</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Chaque message sera adapté aux informations du destinataire
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {detectedVariables.map((variable) => {
                  const mapping = variableMappings[variable] || { source: 'contact_first_name', fallback: 'Client' }
                  return (
                    <div key={variable} className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                          {variable}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Source de données</span>
                      </div>

                      <select
                        value={mapping.source}
                        onChange={e => {
                          const newSource = e.target.value
                          setVariableMappings(prev => ({
                            ...prev,
                            [variable]: { ...prev[variable], source: newSource }
                          }))
                        }}
                        className="w-full px-2.5 py-1.5 border border-input bg-background rounded-lg text-xs outline-none focus:border-primary"
                      >
                        <option value="contact_first_name">👤 Prénom uniquement (ex: Jean)</option>
                        <option value="contact_name">👤 Nom complet du contact (ex: Jean Dupont)</option>
                        <option value="contact_phone">📱 Numéro WhatsApp du contact</option>
                        <option value="organization_name">🏢 Nom de votre entreprise</option>
                        <option value="custom">✏️ Texte statique personnalisé</option>
                      </select>

                      {mapping.source === 'custom' && (
                        <input
                          type="text"
                          placeholder="Valeur personnalisée pour tous..."
                          className="w-full px-2.5 py-1.5 border border-input bg-background rounded-lg text-xs outline-none"
                          value={mapping.customText || ''}
                          onChange={e => {
                            const val = e.target.value
                            setVariableMappings(prev => ({
                              ...prev,
                              [variable]: { ...prev[variable], customText: val }
                            }))
                          }}
                        />
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-muted-foreground shrink-0">Secours (si vide) :</span>
                        <input
                          type="text"
                          placeholder="Ex: Cher client"
                          className="flex-1 px-2 py-1 border border-input bg-background rounded-md text-[11px] outline-none"
                          value={mapping.fallback || ''}
                          onChange={e => {
                            const val = e.target.value
                            setVariableMappings(prev => ({
                              ...prev,
                              [variable]: { ...prev[variable], fallback: val }
                            }))
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>



        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border">
          <Link 
            href="/dashboard/campaigns"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted text-center transition-colors"
          >
            Annuler
          </Link>
          
          <button
            type="submit"
            disabled={submitting || !name.trim() || !selectedTemplateName}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {submitting ? (
              <span>Création en cours...</span>
            ) : campaignMode === 'direct' ? (
              <>
                <Send className="w-4 h-4" />
                <span>Diffuser immédiatement ({targetAudienceContacts.length} contacts)</span>
              </>
            ) : (
              <>
                <CalendarIcon className="w-4 h-4" />
                <span>Programmer la campagne</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
