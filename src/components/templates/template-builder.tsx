'use client'

import React, { useState, useEffect } from 'react'
import { WhatoozTemplate, TemplateVariable, TemplateButton } from '@/lib/templates/types'
import { TEMPLATE_CATEGORIES, TEMPLATE_LANGUAGES, HEADER_TYPES, BUTTON_TYPES, TEMPLATE_TYPE_REGISTRY } from '@/lib/templates/registry'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, Plus, Info, Loader2 } from 'lucide-react'
import { MediaCarouselBuilder } from './media-carousel-builder'
import { ProductCarouselBuilder } from './product-carousel-builder'
interface TemplateBuilderProps {
  initialData?: Partial<WhatoozTemplate>
  onChange: (data: WhatoozTemplate) => void
  errors?: Record<string, string>
}

export function TemplateBuilder({ initialData, onChange, errors = {} }: TemplateBuilderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [template, setTemplate] = useState<WhatoozTemplate>({
    id: initialData?.id || '',
    organization_id: initialData?.organization_id || '',
    name: initialData?.name || '',
    type: initialData?.type as any, // Cast as it will be provided by parent
    language: initialData?.language || 'fr',
    category: initialData?.category || 'MARKETING',
    status: initialData?.status || 'DRAFT',
    header: initialData?.header || { type: 'NONE' },
    body: initialData?.body || { text: '', parameterFormat: 'POSITIONAL', variables: [] },
    footer: initialData?.footer,
    buttons: initialData?.buttons || [],
    created_at: initialData?.created_at || new Date().toISOString(),
    updated_at: initialData?.updated_at || new Date().toISOString(),
  })

  // Emit changes
  useEffect(() => {
    onChange(template)
  }, [template, onChange])

  const updateTemplate = (updates: Partial<WhatoozTemplate>) => {
    setTemplate(prev => ({ ...prev, ...updates }))
  }

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    // Extrait les variables positionnelles {{1}}, {{2}}...
    const matches = text.match(/\{\{(\d+)\}\}/g) || []
    const uniquePositions = Array.from(new Set(matches.map(m => parseInt(m.replace(/[{}]/g, '')))))
      .sort((a, b) => a - b)

    // Preserve existing examples
    const oldVariables = template.body.variables || []
    const newVariables: TemplateVariable[] = uniquePositions.map(pos => {
      const existing = oldVariables.find(v => v.position === pos)
      return existing || { id: `var_${pos}`, position: pos, name: `variable_${pos}`, example: '' }
    })

    updateTemplate({
      body: {
        ...template.body,
        text,
        variables: newVariables
      }
    })
  }

  const handleVariableExampleChange = (index: number, example: string) => {
    const vars = [...(template.body.variables || [])]
    vars[index].example = example
    updateTemplate({ body: { ...template.body, variables: vars } })
  }

  const addButton = () => {
    if ((template.buttons?.length || 0) >= 10) return
    const newBtns = [...(template.buttons || []), { type: 'QUICK_REPLY', text: '' } as TemplateButton]
    updateTemplate({ buttons: newBtns })
  }

  const removeButton = (index: number) => {
    const newBtns = [...(template.buttons || [])]
    newBtns.splice(index, 1)
    updateTemplate({ buttons: newBtns })
  }

  const updateButton = (index: number, updates: Partial<TemplateButton>) => {
    const newBtns = [...(template.buttons || [])]
    newBtns[index] = { ...newBtns[index], ...updates } as TemplateButton
    updateTemplate({ buttons: newBtns })
  }

  const registryEntry = template.type ? TEMPLATE_TYPE_REGISTRY[template.type] : null
  let allowedComponents = registryEntry?.allowedComponents || []
  const allowedCategories = registryEntry?.allowedCategories || TEMPLATE_CATEGORIES.map(c => c.value)

  if (template.category === 'AUTHENTICATION') {
    allowedComponents = allowedComponents.filter(c => c !== 'HEADER' && c !== 'FOOTER')
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl w-full">
      {/* 1. Configuration de base */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-lg font-medium">1. Configuration</h3>
          {registryEntry && (
            <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase">
              {registryEntry.label}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom du modèle *</Label>
            <Input 
              placeholder="ex: promo_rentree_2024"
              value={template.name}
              onChange={e => updateTemplate({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
            />
            {errors['name'] && <p className="text-xs text-destructive">{errors['name']}</p>}
            <p className="text-[10px] text-muted-foreground">Lettres minuscules, chiffres et underscores uniquement.</p>
          </div>

          <div className="space-y-2">
            <Label>Langue *</Label>
            <Select value={template.language} onValueChange={(v: string) => updateTemplate({ language: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_LANGUAGES.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors['language'] && <p className="text-xs text-destructive">{errors['language']}</p>}
          </div>

          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select value={template.category} onValueChange={(v: string) => updateTemplate({ category: v as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.filter(c => allowedCategories.includes(c.value)).map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors['category'] && <p className="text-xs text-destructive">{errors['category']}</p>}
          </div>
        </div>
      </section>

      {/* 2. En-tête */}
      {allowedComponents.includes('HEADER') && (
      <section className="flex flex-col gap-4">
        <h3 className="text-lg font-medium border-b pb-2">2. En-tête (Optionnel)</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Type d'en-tête</Label>
            <Select 
              value={template.header?.type || 'NONE'} 
              onValueChange={(v: string) => updateTemplate({ header: { type: v as any, text: '' } })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HEADER_TYPES.map(h => (
                  <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {template.header?.type === 'TEXT' && (
            <div className="space-y-2">
              <Label>Texte de l'en-tête</Label>
              <Input 
                maxLength={60}
                placeholder="Texte court..."
                value={template.header.text || ''}
                onChange={e => updateTemplate({ header: { ...template.header, type: 'TEXT', text: e.target.value } })}
              />
              {errors['header.text'] && <p className="text-xs text-destructive">{errors['header.text']}</p>}
            </div>
          )}

          {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(template.header?.type || '') && (
            <div className="space-y-2">
              <Label>Fichier média</Label>
              <div className="flex gap-2 items-center">
                <Input 
                  type="file"
                  accept={template.header?.type === 'IMAGE' ? 'image/*' : template.header?.type === 'VIDEO' ? 'video/*' : '*/*'}
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setIsUploading(true)
                      try {
                        const formData = new FormData()
                        formData.append('file', file)
                        formData.append('organization_id', template.organization_id)
                        
                        const res = await fetch('/api/whatsapp/media', {
                          method: 'POST',
                          body: formData
                        })
                        const data = await res.json()
                        if (data.handle) {
                          updateTemplate({ header: { ...template.header, type: template.header!.type as any, mediaHandle: data.handle, mediaFilename: file.name } as any })
                        } else {
                          alert(data.error || "Erreur lors de l'upload")
                        }
                      } catch (err) {
                        alert("Erreur lors de l'upload")
                      } finally {
                        setIsUploading(false)
                      }
                    }
                  }}
                  className="flex-1 cursor-pointer"
                  disabled={isUploading}
                />
                {isUploading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
              {(template.header as any).mediaFilename && (
                <p className="text-xs text-muted-foreground mt-1">
                  Média sélectionné : <strong>{(template.header as any).mediaFilename}</strong>
                </p>
              )}
              {!(template.header as any).mediaFilename && (template.header as any).mediaHandle && (
                <p className="text-xs text-muted-foreground mt-1">
                  Média sélectionné : <strong>{(template.header as any).mediaHandle.replace('local:', '')}</strong>
                </p>
              )}
            </div>
          )}
        </div>
      </section>
      )}

      {/* 3. Corps du message */}
      {allowedComponents.includes('BODY') && (
      <section className="flex flex-col gap-4">
        <h3 className="text-lg font-medium border-b pb-2">3. Corps du message *</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Texte</Label>
            <Textarea 
              className="min-h-[120px] font-sans"
              placeholder="Bonjour {{1}}, votre commande numéro {{2}} est confirmée."
              value={template.body.text}
              onChange={handleBodyChange}
            />
            {errors['body.text'] && <p className="text-xs text-destructive">{errors['body.text']}</p>}
            <p className="text-xs text-muted-foreground">Utilisez <code className="bg-muted px-1 rounded">{"{{1}}"}</code>, <code className="bg-muted px-1 rounded">{"{{2}}"}</code> etc. pour ajouter des variables.</p>
          </div>

          {template.body.variables && template.body.variables.length > 0 && (
            <div className="bg-muted/30 p-4 rounded-lg space-y-3 border">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Exemples de variables (Requis pour l'approbation Meta)</span>
              </div>
              {template.body.variables.map((v, i) => (
                <div key={v.position} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm font-mono bg-background px-2 py-1 rounded border min-w-[50px] text-center">{"{{"}{v.position}{"}}"}</span>
                  <Input 
                    placeholder="Valeur d'exemple (ex: Jean)" 
                    value={v.example || ''}
                    onChange={e => handleVariableExampleChange(i, e.target.value)}
                    className="flex-1 bg-background"
                  />
                </div>
              ))}
              {errors['body.variables'] && <p className="text-xs text-destructive">{errors['body.variables']}</p>}
            </div>
          )}
        </div>
      </section>
      )}

      {/* 4. Carrousel (Requis pour ces types) */}
      {allowedComponents.includes('CAROUSEL') && (
        <section className="flex flex-col gap-4">
          <h3 className="text-lg font-medium border-b pb-2">4. Carrousel *</h3>
          {template.type === 'MEDIA_CAROUSEL' && (
            <MediaCarouselBuilder 
              cards={template.carousel?.type === 'MEDIA' ? template.carousel.cards : []}
              onChange={(cards) => updateTemplate({ carousel: { type: 'MEDIA', cards } })}
              errors={errors}
              organizationId={template.organization_id}
            />
          )}
          {template.type === 'PRODUCT_CAROUSEL' && (
            <ProductCarouselBuilder 
              cards={template.carousel?.type === 'PRODUCT' ? template.carousel.cards : []}
              onChange={(cards) => updateTemplate({ carousel: { type: 'PRODUCT', cards } })}
              errors={errors}
            />
          )}
        </section>
      )}

      {/* 5. Bas de page */}
      {allowedComponents.includes('FOOTER') && (
      <section className="flex flex-col gap-4">
        <h3 className="text-lg font-medium border-b pb-2">5. Bas de page (Optionnel)</h3>
        
        <div className="space-y-2">
          <Label>Texte grisé en bas du message</Label>
          <Input 
            maxLength={60}
            placeholder="Ne pas répondre à ce message"
            value={template.footer?.text || ''}
            onChange={e => updateTemplate({ footer: { text: e.target.value } })}
          />
          {errors['footer.text'] && <p className="text-xs text-destructive">{errors['footer.text']}</p>}
        </div>
      </section>
      )}

      {/* 6. Boutons */}
      {allowedComponents.includes('BUTTONS') && (
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-medium">6. Boutons (Optionnel)</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addButton}
            disabled={(template.buttons?.length || 0) >= 10}
          >
            <Plus className="h-4 w-4 mr-2" /> Ajouter
          </Button>
        </div>

        {errors['buttons'] && <p className="text-xs text-destructive">{errors['buttons']}</p>}
        
        {template.buttons && template.buttons.length > 0 ? (
          <div className="space-y-3">
            {template.buttons.map((btn, i) => (
              <Card key={i} className="bg-card">
                <CardContent className="p-4 flex flex-col gap-4 relative group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => removeButton(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type de bouton</Label>
                      <Select 
                        value={btn.type} 
                        onValueChange={(v: string) => updateButton(i, { type: v as any, text: '', url: '', phoneNumber: '' })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BUTTON_TYPES.filter(b => template.category === 'AUTHENTICATION' ? b.value === 'COPY_CODE' : true).map(b => (
                            <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Texte du bouton</Label>
                      <Input 
                        maxLength={25}
                        placeholder="Texte (25 max)"
                        value={btn.text || ''}
                        onChange={e => updateButton(i, { text: e.target.value })}
                      />
                      {errors[`buttons[${i}]`] && <p className="text-xs text-destructive">{errors[`buttons[${i}]`]}</p>}
                    </div>

                    {btn.type === 'URL' && (
                      <div className="space-y-2 sm:col-span-2">
                        <Label>URL</Label>
                        <Input 
                          placeholder="https://example.com"
                          value={btn.url || ''}
                          onChange={e => updateButton(i, { url: e.target.value })}
                        />
                      </div>
                    )}

                    {btn.type === 'PHONE_NUMBER' && (
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Numéro de téléphone</Label>
                        <Input 
                          placeholder="+33612345678"
                          value={(btn as any).phoneNumber || ''}
                          onChange={e => updateButton(i, { phoneNumber: e.target.value } as any)}
                        />
                      </div>
                    )}

                    {btn.type === 'COPY_CODE' && (
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Exemple de code</Label>
                        <Input 
                          placeholder="Ex: 123456"
                          value={(btn as any).example || ''}
                          onChange={e => updateButton(i, { example: e.target.value } as any)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">L'exemple est requis pour l'approbation Meta.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg text-center">
            Aucun bouton ajouté
          </div>
        )}
      </section>
      )}
    </div>
  )
}
