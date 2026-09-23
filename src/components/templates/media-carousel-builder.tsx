'use client'

import React, { useState } from 'react'
import { MediaCarouselCard, TemplateButton } from '@/lib/templates/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, Plus, Image as ImageIcon, Video, Loader2 } from 'lucide-react'
import { BUTTON_TYPES } from '@/lib/templates/registry'

interface MediaCarouselBuilderProps {
  cards: MediaCarouselCard[]
  onChange: (cards: MediaCarouselCard[]) => void
  errors?: Record<string, string>
  organizationId: string
}

export function MediaCarouselBuilder({ cards, onChange, errors = {}, organizationId }: MediaCarouselBuilderProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const addCard = () => {
    if (cards.length >= 10) return
    const newCards = [...cards, { index: cards.length, media: { type: 'IMAGE' }, body: '', buttons: [] } as MediaCarouselCard]
    onChange(newCards)
  }

  const removeCard = (index: number) => {
    if (cards.length <= 2) return // min 2
    const newCards = [...cards]
    newCards.splice(index, 1)
    onChange(newCards)
  }

  const updateCard = (index: number, updates: Partial<MediaCarouselCard>) => {
    const newCards = [...cards]
    newCards[index] = { ...newCards[index], ...updates }
    onChange(newCards)
  }

  const addButton = (cardIndex: number) => {
    const card = cards[cardIndex]
    if (card.buttons.length >= 2) return
    const newButtons = [...card.buttons, { type: 'QUICK_REPLY', text: '' } as TemplateButton]
    updateCard(cardIndex, { buttons: newButtons })
  }

  const removeButton = (cardIndex: number, btnIndex: number) => {
    const card = cards[cardIndex]
    const newButtons = [...card.buttons]
    newButtons.splice(btnIndex, 1)
    updateCard(cardIndex, { buttons: newButtons })
  }

  const updateButton = (cardIndex: number, btnIndex: number, updates: Partial<TemplateButton>) => {
    const card = cards[cardIndex]
    const newButtons = [...card.buttons]
    newButtons[btnIndex] = { ...newButtons[btnIndex], ...updates } as TemplateButton
    updateCard(cardIndex, { buttons: newButtons })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Les carrousels multimédia requièrent de 2 à 10 cartes.</p>
        <Button variant="outline" size="sm" onClick={addCard} disabled={cards.length >= 10}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter une carte
        </Button>
      </div>

      <div className="grid gap-6">
        {cards.map((card, index) => (
          <Card key={index} className="bg-muted/30">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium text-sm">Carte {index + 1}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeCard(index)}
                  disabled={cards.length <= 2}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Media Type */}
              <div className="space-y-2">
                <Label>Média de l'en-tête</Label>
                <div className="flex gap-2">
                  <Button 
                    variant={card.media.type === 'IMAGE' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => updateCard(index, { media: { type: 'IMAGE' } })}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" /> Image
                  </Button>
                  <Button 
                    variant={card.media.type === 'VIDEO' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => updateCard(index, { media: { type: 'VIDEO' } })}
                  >
                    <Video className="h-4 w-4 mr-2" /> Vidéo
                  </Button>
                </div>
                <div className="mt-2 flex gap-2 items-center">
                  <Input 
                    type="file"
                    accept={card.media.type === 'IMAGE' ? 'image/*' : 'video/*'}
                    onChange={async e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setUploadingIndex(index)
                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                          formData.append('organization_id', organizationId)
                          
                          const res = await fetch('/api/whatsapp/media', {
                            method: 'POST',
                            body: formData
                          })
                          const data = await res.json()
                          if (data.handle) {
                            updateCard(index, { media: { type: card.media.type, mediaHandle: data.handle, mediaFilename: file.name } })
                          } else {
                            alert(data.error || "Erreur lors de l'upload")
                          }
                        } catch (err) {
                          alert("Erreur lors de l'upload")
                        } finally {
                          setUploadingIndex(null)
                        }
                      }
                    }}
                    className="text-sm cursor-pointer flex-1"
                    disabled={uploadingIndex === index}
                  />
                  {uploadingIndex === index && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                {card.media.mediaFilename && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Média sélectionné : <strong>{card.media.mediaFilename}</strong>
                  </p>
                )}
                {!card.media.mediaFilename && card.media.mediaHandle && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Média sélectionné : <strong>{card.media.mediaHandle.replace('local:', '')}</strong>
                  </p>
                )}
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label>Texte de la carte (Optionnel)</Label>
                <Input 
                  placeholder="Description..." 
                  maxLength={160}
                  value={card.body || ''}
                  onChange={e => updateCard(index, { body: e.target.value })}
                />
              </div>

              {/* Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <Label>Boutons ({card.buttons.length}/2)</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => addButton(index)}
                    disabled={card.buttons.length >= 2}
                    className="h-8 text-xs"
                  >
                    + Ajouter bouton
                  </Button>
                </div>

                {card.buttons.map((btn, btnIdx) => (
                  <div key={btnIdx} className="flex gap-2 items-start bg-background p-3 rounded border">
                    <div className="flex-1 space-y-3">
                      <Select 
                        value={btn.type} 
                        onValueChange={(v: any) => updateButton(index, btnIdx, { type: v, text: '' })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BUTTON_TYPES.filter(b => ['QUICK_REPLY', 'URL', 'PHONE_NUMBER'].includes(b.value)).map(b => (
                            <SelectItem key={b.value} value={b.value} className="text-xs">{b.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input 
                        placeholder="Texte du bouton..." 
                        value={btn.text}
                        onChange={e => updateButton(index, btnIdx, { text: e.target.value })}
                        className="h-8 text-xs"
                        maxLength={25}
                      />

                      {btn.type === 'URL' && (
                        <Input 
                          placeholder="https://..." 
                          value={(btn as any).url || ''}
                          onChange={e => updateButton(index, btnIdx, { url: e.target.value } as any)}
                          className="h-8 text-xs"
                        />
                      )}
                      
                      {btn.type === 'PHONE_NUMBER' && (
                        <Input 
                          placeholder="+33600000000" 
                          value={(btn as any).phoneNumber || ''}
                          onChange={e => updateButton(index, btnIdx, { phoneNumber: e.target.value } as any)}
                          className="h-8 text-xs"
                        />
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeButton(index, btnIdx)}
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
