'use client'

import React from 'react'
import { WhatoozTemplate } from '@/lib/templates/types'
import { ExternalLink, Phone, Copy, Image as ImageIcon, Video, ShoppingBag } from 'lucide-react'

interface TemplatePreviewProps {
  template: WhatoozTemplate
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const getBodyText = () => {
    let text = template.body.text || ''
    // Remplace les variables par leurs exemples ou des placeholders
    if (template.body.variables) {
      template.body.variables.forEach(v => {
        text = text.replace(`{{${v.position}}}`, v.example || `{{${v.position}}}`)
      })
    }
    return text
  }

  return (
    <div className="bg-[#EFEAE2] dark:bg-[#0B141A] rounded-3xl p-4 sm:p-6 shadow-inner border max-w-sm w-full mx-auto relative overflow-hidden flex flex-col h-full min-h-[500px]">
      {/* WhatsApp Header Mockup */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-[#008069] dark:bg-[#202C33] flex items-center px-4 text-white z-10">
        <div className="w-8 h-8 rounded-full bg-white/20 mr-3 shrink-0 flex items-center justify-center font-bold text-xs">
          W
        </div>
        <div className="font-medium truncate">Aperçu WhatsApp</div>
      </div>

      <div className="mt-14 flex-1 flex flex-col gap-2 overflow-y-auto pt-4 pb-4">
        {/* Message Bubble */}
        <div className="bg-white dark:bg-[#202C33] rounded-lg rounded-tl-none p-2 sm:p-3 shadow-sm self-start max-w-[90%] flex flex-col gap-2 text-[15px] leading-relaxed relative">
          
          {/* Header */}
          {template.header?.type !== 'NONE' && (
            <div className="font-semibold mb-1">
              {template.header?.type === 'TEXT' ? (
                <span>{template.header.text}</span>
              ) : (
                <div className="h-32 w-full bg-muted rounded flex items-center justify-center text-muted-foreground text-sm flex-col">
                  {/* Media placeholder */}
                  {template.header?.type === 'IMAGE' && <span>🖼️ Image</span>}
                  {template.header?.type === 'VIDEO' && <span>🎥 Vidéo</span>}
                  {template.header?.type === 'DOCUMENT' && <span>📄 Document</span>}
                </div>
              )}
            </div>
          )}

          {/* Body */}
          <div className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100">
            {getBodyText() || <span className="text-muted-foreground italic">Le contenu du message apparaîtra ici...</span>}
          </div>

          {/* Footer */}
          {template.footer?.text && (
            <div className="text-[11px] text-gray-500 mt-1 uppercase">
              {template.footer.text}
            </div>
          )}

          {/* Time & Read receipt mockup */}
          <div className="text-[10px] text-gray-400 self-end mt-1 absolute bottom-2 right-3">
            14:30
          </div>
        </div>

        {/* Buttons for STANDARD */}
        {template.type === 'STANDARD' && template.buttons && template.buttons.length > 0 && (
          <div className="flex flex-col gap-1 w-[90%]">
            {template.buttons.map((btn, i) => (
              <div 
                key={i} 
                className="bg-white dark:bg-[#202C33] rounded-lg py-2.5 px-3 flex items-center justify-center gap-2 text-[#00A884] shadow-sm text-sm font-medium border border-transparent hover:bg-gray-50 cursor-default transition-colors text-center"
              >
                {btn.type === 'URL' && <ExternalLink className="h-4 w-4 shrink-0" />}
                {btn.type === 'PHONE_NUMBER' && <Phone className="h-4 w-4 shrink-0" />}
                {btn.type === 'COPY_CODE' && <Copy className="h-4 w-4 shrink-0" />}
                <span className="truncate">{btn.text || 'Bouton'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Carousel Content */}
        {(template.type === 'MEDIA_CAROUSEL' || template.type === 'PRODUCT_CAROUSEL') && template.carousel && (
          <div className="flex overflow-x-auto gap-2 pb-2 mt-1 snap-x no-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {template.type === 'MEDIA_CAROUSEL' && template.carousel.type === 'MEDIA' && template.carousel.cards.map((card, idx) => (
              <div key={idx} className="bg-white dark:bg-[#202C33] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 min-w-[200px] w-[200px] flex-shrink-0 flex flex-col overflow-hidden snap-start">
                <div className="h-28 bg-muted flex items-center justify-center text-muted-foreground flex-col gap-1">
                  {card.media.type === 'VIDEO' ? <Video className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
                  <span className="text-xs">Média {idx + 1}</span>
                </div>
                {card.body && (
                  <div className="p-2 text-sm text-gray-800 dark:text-gray-100 line-clamp-3">
                    {card.body}
                  </div>
                )}
                <div className="mt-auto border-t border-gray-100 dark:border-gray-700 flex flex-col">
                  {card.buttons.map((btn, i) => (
                    <div key={i} className="py-2 px-2 text-center text-[#00A884] text-xs font-medium border-b last:border-0 border-gray-100 dark:border-gray-700 truncate">
                      {btn.text || 'Bouton'}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {template.type === 'PRODUCT_CAROUSEL' && template.carousel.type === 'PRODUCT' && [1, 2, 3].map((placeholder, idx) => (
              <div key={idx} className="bg-white dark:bg-[#202C33] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 min-w-[200px] w-[200px] flex-shrink-0 flex flex-col overflow-hidden snap-start">
                <div className="h-28 bg-muted flex items-center justify-center text-muted-foreground flex-col gap-1">
                  <ShoppingBag className="h-6 w-6" />
                  <span className="text-xs">Produit {idx + 1}</span>
                </div>
                <div className="p-2 text-sm text-gray-800 dark:text-gray-100">
                  <div className="font-semibold text-xs">Nom du produit</div>
                  <div className="text-xs text-muted-foreground">19,99 €</div>
                </div>
                <div className="mt-auto border-t border-gray-100 dark:border-gray-700 flex flex-col">
                  {/* Fallback array to avoid ts errors if carousel is empty */}
                  {(template.carousel?.type === 'PRODUCT' ? (template.carousel.cards[0]?.buttons || []) : []).map((btn, i) => (
                    <div key={i} className="py-2 px-2 text-center text-[#00A884] text-xs font-medium border-b last:border-0 border-gray-100 dark:border-gray-700 truncate">
                      {btn.text || 'Bouton'}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
