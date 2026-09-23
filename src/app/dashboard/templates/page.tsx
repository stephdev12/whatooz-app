'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Search, Copy, Trash2, Edit, RefreshCcw, Send } from 'lucide-react'
import { useOrganization } from '@/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Skeleton } from '../../../components/ui/skeleton'

export default function TemplatesPage() {
  const { activeOrganization } = useOrganization()
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [testTemplate, setTestTemplate] = useState<any>(null)
  const [testPhone, setTestPhone] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const supabase = createClient()

  async function fetchTemplates() {
    if (!activeOrganization) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .eq('organization_id', activeOrganization.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setTemplates(data)
    } catch (err) {
      console.error("Erreur chargement templates", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [activeOrganization, supabase])

  const handleSync = async () => {
    if (!activeOrganization) return
    setLoading(true)
    try {
      await fetch('/api/templates/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: activeOrganization.id })
      })
      await fetchTemplates()
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
      case 'REJECTED': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400'
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return
    try {
      const { error } = await supabase.from('whatsapp_templates').delete().eq('id', id)
      if (error) throw error
      setTemplates(templates.filter(t => t.id !== id))
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la suppression")
    }
  }

  const handleSendTest = async () => {
    if (!testPhone || !testTemplate) return
    setTestLoading(true)
    try {
      let components: any[] | undefined = undefined;

      const metaComponents = testTemplate.compiled_payload;
      const isMetaCarousel = metaComponents && Array.isArray(metaComponents) && metaComponents.some((c: any) => c.type === 'CAROUSEL');

      if (isMetaCarousel) {
        const carouselComponent = metaComponents.find((c: any) => c.type === 'CAROUSEL');
        components = [
          {
            type: 'carousel',
            cards: carouselComponent.cards.map((card: any, i: number) => {
              const cardComps: any[] = [];
              const headerComp = card.components?.find((c: any) => c.type === 'HEADER');
              if (headerComp?.format && ['IMAGE', 'VIDEO'].includes(headerComp.format)) {
                const mediaType = headerComp.format.toLowerCase()
                cardComps.push({
                  type: 'header',
                  parameters: [
                    {
                      type: mediaType,
                      [mediaType]: { link: mediaType === 'video' ? 'https://www.w3schools.com/html/mov_bbb.mp4' : 'https://www.w3schools.com/w3images/lights.jpg' }
                    }
                  ]
                })
              }
              const buttonsComp = card.components?.find((c: any) => c.type === 'BUTTONS');
              const buttonComps = buttonsComp?.buttons?.map((btn: any, btnIdx: number) => {
                if (btn.type === 'URL' && btn.example?.length) {
                  return {
                    type: 'button',
                    sub_type: 'url',
                    index: String(btnIdx),
                    parameters: btn.example[0]?.map(() => ({ type: 'text', text: 'Test' })) || [{ type: 'text', text: 'Test' }]
                  }
                }
                return null
              }).filter(Boolean)

              if (buttonComps?.length) {
                cardComps.push(...buttonComps)
              }

              return {
                card_index: i,
                components: cardComps
              }
            })
          }
        ]
      } else if (testTemplate.type === 'MEDIA_CAROUSEL' && testTemplate.carousel?.cards) {
        components = [
          {
            type: 'carousel',
            cards: testTemplate.carousel.cards.map((card: any, i: number) => {
              const cardComps: any[] = [];
              if (card.media?.type) {
                const mediaType = card.media.type.toLowerCase()
                cardComps.push({
                  type: 'header',
                  parameters: [
                    {
                      type: mediaType,
                      [mediaType]: { link: mediaType === 'video' ? 'https://www.w3schools.com/html/mov_bbb.mp4' : 'https://www.w3schools.com/w3images/lights.jpg' }
                    }
                  ]
                })
              }
              // Add button variables if needed (e.g. COPY_CODE)
              const buttonComps = card.buttons?.map((btn: any, btnIdx: number) => {
                if (btn.type === 'URL' && btn.variables?.length) {
                  return {
                    type: 'button',
                    sub_type: 'url',
                    index: String(btnIdx),
                    parameters: btn.variables.map((v: any) => ({ type: 'text', text: v.example || 'Test' }))
                  }
                }
                return null
              }).filter(Boolean)

              if (buttonComps?.length) {
                cardComps.push(...buttonComps)
              }

              return {
                card_index: i,
                components: cardComps
              }
            })
          }
        ]
      } else {
        // Standard Template
        components = [];
        if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(testTemplate.header?.type?.toUpperCase() || '')) {
          const mediaType = testTemplate.header!.type.toLowerCase();
          components.push({
            type: 'header',
            parameters: [
              {
                type: mediaType,
                [mediaType]: { link: mediaType === 'video' ? 'https://www.w3schools.com/html/mov_bbb.mp4' : 'https://www.w3schools.com/w3images/lights.jpg' }
              }
            ]
          })
        } else if (testTemplate.header?.type?.toUpperCase() === 'TEXT' && testTemplate.header?.variables?.length) {
          components.push({
            type: 'header',
            parameters: testTemplate.header.variables.map((v: any) => ({
              type: 'text',
              text: v.example || 'Test'
            }))
          })
        } else if (testTemplate.header?.type?.toUpperCase() === 'TEXT' && testTemplate.header.text?.includes('{{1}}')) {
          // Fallback if variables array is not well defined but text has variables
          const match = testTemplate.header.text.match(/\{\{(\d+)\}\}/g);
          if (match && match.length > 0) {
             components.push({
               type: 'header',
               parameters: match.map(() => ({ type: 'text', text: 'Test' }))
             })
          }
        }
        
        if (testTemplate.body?.variables?.length) {
          components.push({
            type: 'body',
            parameters: testTemplate.body.variables.map((v: any) => ({
              type: 'text',
              text: v.example || 'Test'
            }))
          })
        }
        
        // Buttons
        if (testTemplate.buttons?.length) {
          testTemplate.buttons.forEach((btn: any, i: number) => {
            if (btn.type === 'COPY_CODE') {
              components!.push({
                type: 'button',
                sub_type: 'copy_code',
                index: String(i),
                parameters: [{ type: 'coupon_code', coupon_code: btn.example || 'CODE123' }]
              })
            } else if (btn.type === 'URL' && btn.variables?.length) {
              components!.push({
                type: 'button',
                sub_type: 'url',
                index: String(i),
                parameters: btn.variables.map((v: any) => ({ type: 'text', text: v.example || 'Test' }))
              })
            }
          })
        }

        if (components.length === 0) {
          // Fallback to metaComponents for standard templates synced from Meta
          if (metaComponents && Array.isArray(metaComponents)) {
            const headerComp = metaComponents.find((c: any) => c.type === 'HEADER');
            if (headerComp?.format && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerComp.format)) {
              const mediaType = headerComp.format.toLowerCase();
              components.push({
                type: 'header',
                parameters: [
                  {
                    type: mediaType,
                    [mediaType]: { link: mediaType === 'video' ? 'https://www.w3schools.com/html/mov_bbb.mp4' : 'https://www.w3schools.com/w3images/lights.jpg' }
                  }
                ]
              })
            } else if (headerComp?.format === 'TEXT' && headerComp.example?.header_text?.length) {
              components.push({
                type: 'header',
                parameters: headerComp.example.header_text.map(() => ({ type: 'text', text: 'Test' }))
              })
            }
            
            const bodyComp = metaComponents.find((c: any) => c.type === 'BODY');
            if (bodyComp?.example?.body_text?.length && Array.isArray(bodyComp.example.body_text[0])) {
               components.push({
                 type: 'body',
                 parameters: bodyComp.example.body_text[0].map(() => ({ type: 'text', text: 'Test' }))
               })
            }
          }
        }

        if (components.length === 0) components = undefined;
      }

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization?.id || ''
        },
        body: JSON.stringify({
          to: testPhone,
          type: 'template',
          templateName: testTemplate.name,
          languageCode: testTemplate.language,
          components: components,
          // Fallback if needed for old route logic
          bodyVariables: testTemplate.body?.variables?.map((v: any) => v.example || 'Test') || [],
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'envoi')
      alert('Message envoyé avec succès !')
      setTestTemplate(null)
      setTestPhone('')
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Erreur lors de l'envoi")
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Modèles de Message</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez vos templates WhatsApp pour l'envoi de notifications.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleSync} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Synchroniser
          </Button>
          <Link href="/dashboard/templates/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Créer un modèle
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-border flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un modèle..." 
              className="pl-9" 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Nom</th>
                <th className="px-6 py-3 font-medium">Catégorie</th>
                <th className="px-6 py-3 font-medium">Langue</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                  </tr>
                ))
              ) : filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Aucun modèle trouvé
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {template.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {template.category}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground uppercase">
                      {template.language}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(template.status)}`}>
                        {template.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary hover:text-primary/80"
                          onClick={() => setTestTemplate(template)}
                          title="Tester l'envoi"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Link href={`/dashboard/templates/create?duplicate=${template.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Dupliquer">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </Link>
                        {template.status === 'DRAFT' && (
                           <Link href={`/dashboard/templates/create?edit=${template.id}`}>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                               <Edit className="h-4 w-4" />
                             </Button>
                           </Link>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de test d'envoi */}
      {testTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border shadow-lg rounded-xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Tester le template</h3>
            <p className="text-sm text-muted-foreground">
              Envoyer le modèle <strong>{testTemplate.name}</strong> à :
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium">Numéro de téléphone (avec indicatif, ex: 33612345678)</label>
              <Input 
                placeholder="ex: 33612345678"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>
            <div className="flex items-center justify-end gap-2 mt-2">
              <Button variant="ghost" onClick={() => setTestTemplate(null)}>
                Annuler
              </Button>
              <Button onClick={handleSendTest} disabled={!testPhone || testLoading}>
                {testLoading ? 'Envoi...' : 'Envoyer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
