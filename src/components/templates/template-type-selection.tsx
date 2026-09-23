'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TEMPLATE_TYPE_REGISTRY } from '@/lib/templates/registry'
import { TemplateType } from '@/lib/templates/types'

interface TemplateTypeSelectionProps {
  onSelect: (type: TemplateType) => void
}

export function TemplateTypeSelection({ onSelect }: TemplateTypeSelectionProps) {
  const types = Object.values(TEMPLATE_TYPE_REGISTRY)

  return (
    <div className="w-full max-w-[1200px] mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Quel type de message souhaitez-vous créer ?</h1>
        <p className="text-muted-foreground text-lg">
          Choisissez le modèle qui correspond le mieux à votre objectif de communication.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {types.map((t) => (
          <Card 
            key={t.type} 
            className="cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
            onClick={() => onSelect(t.type)}
          >
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="font-semibold leading-none tracking-tight text-xl group-hover:text-primary transition-colors">
                {t.label}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {t.description}
              </p>
            </div>
            <CardContent>
              <div className="flex gap-2 text-xs font-medium text-muted-foreground mt-4">
                <span className="bg-secondary px-2 py-1 rounded-md">
                  {t.allowedCategories[0]}
                </span>
                {t.allowedComponents.includes('CAROUSEL') && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
                    CAROUSEL
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
