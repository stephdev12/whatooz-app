'use client'

import React, { useEffect } from 'react'
import { ProductCarouselCard, TemplateButton } from '@/lib/templates/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Info, Plus, Trash2 } from 'lucide-react'
import { BUTTON_TYPES } from '@/lib/templates/registry'

interface ProductCarouselBuilderProps {
  cards: ProductCarouselCard[]
  onChange: (cards: ProductCarouselCard[]) => void
  errors?: Record<string, string>
}

export function ProductCarouselBuilder({ cards, onChange, errors = {} }: ProductCarouselBuilderProps) {
  // Ensure exactly 2 structural cards exist for Product Carousel
  useEffect(() => {
    if (cards.length !== 2) {
      onChange([
        { index: 0, buttons: [] },
        { index: 1, buttons: [] }
      ])
    }
  }, [cards.length, onChange])

  // We only edit the first card's buttons and sync to the second card automatically,
  // since they are just defining the structure of all injected products.
  const templateCard = cards[0] || { index: 0, buttons: [] }

  const updateButtons = (newButtons: TemplateButton[]) => {
    onChange([
      { index: 0, buttons: newButtons },
      { index: 1, buttons: newButtons }
    ])
  }

  const addButton = () => {
    if (templateCard.buttons.length >= 2) return
    const newButtons = [...templateCard.buttons, { type: 'URL', text: 'Voir l\'article' } as TemplateButton]
    updateButtons(newButtons)
  }

  const removeButton = (btnIndex: number) => {
    const newButtons = [...templateCard.buttons]
    newButtons.splice(btnIndex, 1)
    updateButtons(newButtons)
  }

  const updateButton = (btnIndex: number, updates: Partial<TemplateButton>) => {
    const newButtons = [...templateCard.buttons]
    newButtons[btnIndex] = { ...newButtons[btnIndex], ...updates } as TemplateButton
    updateButtons(newButtons)
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex gap-3 text-sm text-blue-800">
        <Info className="h-5 w-5 shrink-0 text-blue-600" />
        <div>
          <p className="font-medium mb-1">Carrousel de Produits Dynamique</p>
          <p>La sélection des produits se fera automatiquement lors de l'envoi depuis votre catalogue Meta (jusqu'à 10 produits). Ici, vous définissez uniquement la structure des boutons qui s'afficheront sous chaque produit.</p>
        </div>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <Label className="text-base">Boutons d'interaction (Max 2)</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addButton}
              disabled={templateCard.buttons.length >= 2}
            >
              <Plus className="h-4 w-4 mr-2" /> Ajouter un bouton
            </Button>
          </div>

          <div className="space-y-3 pt-2">
            {templateCard.buttons.length === 0 && (
              <p className="text-sm text-muted-foreground italic text-center py-4">Aucun bouton configuré. Un bouton est recommandé.</p>
            )}

            {templateCard.buttons.map((btn, btnIdx) => (
              <div key={btnIdx} className="flex gap-2 items-start bg-background p-3 rounded border">
                <div className="flex-1 space-y-3">
                  <Select 
                    value={btn.type} 
                    onValueChange={(v: any) => updateButton(btnIdx, { type: v, text: '' })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUTTON_TYPES.filter(b => ['URL', 'QUICK_REPLY'].includes(b.value)).map(b => (
                        <SelectItem key={b.value} value={b.value} className="text-xs">{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input 
                    placeholder="Texte du bouton (ex: Acheter)..." 
                    value={btn.text}
                    onChange={e => updateButton(btnIdx, { text: e.target.value })}
                    className="h-8 text-xs"
                    maxLength={25}
                  />

                  {btn.type === 'URL' && (
                    <Input 
                      placeholder="https://votre-boutique.com/produit/..." 
                      value={(btn as any).url || ''}
                      onChange={e => updateButton(btnIdx, { url: e.target.value } as any)}
                      className="h-8 text-xs"
                    />
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeButton(btnIdx)}
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
