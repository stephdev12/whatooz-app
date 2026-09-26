'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Send, Calendar as CalendarIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/hooks/use-organization'

export default function NewBroadcastPage() {
  const router = useRouter()
  const { activeOrganization } = useOrganization()
  
  const [name, setName] = useState('')
  const [targetType, setTargetType] = useState('all')
  const [targetTags, setTargetTags] = useState('') // comma separated for now
  
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [templateVariables, setTemplateVariables] = useState<any>({})
  
  const [scheduleType, setScheduleType] = useState('immediate') // immediate, scheduled
  const [scheduledAt, setScheduledAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (activeOrganization) {
      fetchTemplates()
    }
  }, [activeOrganization])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/whatsapp/templates', {
        headers: { 'x-organization-id': activeOrganization?.id || '' }
      })
      if (res.ok) {
        const { templates } = await res.json()
        setTemplates(templates.filter((t: any) => t.status === 'APPROVED' || t.status === 'APPROVED_UPDATE_REQUESTED'))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const selectedTemplate = templates.find(t => t.name === selectedTemplateId)
  const templateBody = selectedTemplate?.components?.find((c: any) => c.type === 'BODY')
  const hasVariables = templateBody?.text?.includes('{{1}}')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !selectedTemplateId) return
    setSubmitting(true)

    try {
      const payload = {
        organizationId: activeOrganization?.id,
        name,
        target_type: targetType,
        target_tags: targetType === 'tags' ? targetTags.split(',').map(t => t.trim()) : [],
        target_contacts: [],
        message_type: 'template',
        message_payload: {
          templateId: selectedTemplateId,
          templateVariablesMapping: templateVariables
        },
        scheduled_at: scheduleType === 'scheduled' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        recurrence: 'once'
      }

      const res = await fetch('/api/whatsapp/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Erreur lors de la création de la diffusion')
      
      router.push('/dashboard/broadcasts')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Une erreur s'est produite")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-4xl">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/dashboard/broadcasts" className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">Nouvelle diffusion</h2>
          <p className="text-muted-foreground">Configurez et planifiez votre campagne de messages</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Paramètres Généraux */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h3 className="text-lg font-medium text-foreground">1. Paramètres généraux</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nom de la diffusion</label>
            <input 
              type="text" 
              required
              placeholder="Ex: Promo Saint-Valentin 2026"
              className="w-full px-3 py-2 border border-input bg-transparent rounded-md"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Ciblage</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input type="radio" checked={targetType === 'all'} onChange={() => setTargetType('all')} />
                <span className="text-sm">Tous les contacts</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" checked={targetType === 'tags'} onChange={() => setTargetType('tags')} />
                <span className="text-sm">Par Tags</span>
              </label>
            </div>
            
            {targetType === 'tags' && (
              <div className="pt-2">
                <input 
                  type="text" 
                  placeholder="Ex: VIP, Nouveaux (séparés par des virgules)"
                  className="w-full px-3 py-2 border border-input bg-transparent rounded-md"
                  value={targetTags}
                  onChange={e => setTargetTags(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h3 className="text-lg font-medium text-foreground">2. Message (Template Meta)</h3>
          <p className="text-sm text-muted-foreground">Pour contacter des personnes en dehors de la fenêtre de 24h, vous devez utiliser un template approuvé par Meta.</p>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Sélectionner un template</label>
            <select 
              required
              className="w-full px-3 py-2 border border-input bg-transparent rounded-md"
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
            >
              <option value="">-- Choisir un template --</option>
              {templates.map(t => (
                <option key={t.id} value={t.name}>{t.name} ({t.language})</option>
              ))}
            </select>
          </div>

          {hasVariables && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-4">
              <h4 className="text-sm font-medium">Variables du template</h4>
              <p className="text-xs text-muted-foreground">Vous pouvez utiliser des variables dynamiques comme {'{{contact.name}}'}</p>
              
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => {
                  const varName = `{{${i + 1}}}`
                  if (!templateBody?.text?.includes(varName)) return null
                  return (
                    <div key={i} className="flex flex-col space-y-1">
                      <label className="text-xs font-medium">Variable {varName}</label>
                      <input 
                        type="text" 
                        placeholder={`Valeur pour ${varName}`}
                        className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                        value={templateVariables[varName] || ''}
                        onChange={(e) => setTemplateVariables({...templateVariables, [varName]: e.target.value})}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Planification */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h3 className="text-lg font-medium text-foreground">3. Planification</h3>
          
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input type="radio" checked={scheduleType === 'immediate'} onChange={() => setScheduleType('immediate')} />
              <span className="text-sm">Envoyer immédiatement</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="radio" checked={scheduleType === 'scheduled'} onChange={() => setScheduleType('scheduled')} />
              <span className="text-sm">Programmer</span>
            </label>
          </div>

          {scheduleType === 'scheduled' && (
            <div className="pt-2 flex items-center space-x-4">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium text-foreground">Date et heure d'envoi</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="datetime-local" 
                    className="w-full pl-9 pr-3 py-2 border border-input bg-transparent rounded-md"
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-border">
          <Link href="/dashboard/broadcasts" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors">
            Annuler
          </Link>
          <button 
            type="submit" 
            disabled={submitting || !selectedTemplateId || !name}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 disabled:opacity-50"
          >
            {submitting ? 'Enregistrement...' : scheduleType === 'immediate' ? (
              <><Send className="w-4 h-4 mr-2"/> Diffuser maintenant</>
            ) : (
              <><Save className="w-4 h-4 mr-2"/> Programmer la diffusion</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
