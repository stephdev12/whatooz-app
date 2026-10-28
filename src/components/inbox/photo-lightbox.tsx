'use client'

import { useState } from 'react'
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  X,
  Maximize2,
} from 'lucide-react'
import { Dialog, DialogPopup, DialogClose } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface PhotoLightboxProps {
  src: string
  alt?: string
  caption?: string
  className?: string
}

export function PhotoLightbox({ src, alt = 'Photo WhatsApp', caption, className }: PhotoLightboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation()
    setScale((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation()
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    const a = document.createElement('a')
    a.href = src
    a.download = `photo-whatsapp-${Date.now()}.jpg`
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const resetTransform = () => {
    setScale(1)
    setRotation(0)
  }

  return (
    <>
      {/* Inline Preview Thumbnail */}
      <div
        onClick={() => {
          resetTransform()
          setIsOpen(true)
        }}
        className={cn(
          'relative rounded-2xl overflow-hidden cursor-zoom-in group max-w-sm border border-border/50 bg-black/5',
          className
        )}
      >
        <img
          src={src}
          alt={alt}
          className="w-full max-h-72 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="size-9 rounded-full bg-black/60 backdrop-blur-xs text-white flex items-center justify-center shadow-lg">
            <Maximize2 className="size-4" />
          </div>
        </div>
        {caption && (
          <p className="p-2 text-xs text-foreground bg-card/60 backdrop-blur-xs border-t border-border/50 leading-relaxed">
            {caption}
          </p>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) resetTransform()
        }}
      >
        <DialogPopup
          showCloseButton={false}
          className="max-w-[95vw] md:max-w-4xl p-0 bg-black/95 border-none shadow-2xl rounded-3xl overflow-hidden flex flex-col"
        >
          {/* Top toolbar */}
          <div className="flex items-center justify-between p-3 sm:p-4 bg-black/50 backdrop-blur-md border-b border-white/10 z-10 text-white">
            <div className="text-xs text-zinc-300 font-medium truncate max-w-[50%]">
              {caption || alt}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Zoomer"
              >
                <ZoomIn className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Dézoomer"
              >
                <ZoomOut className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Pivoter de 90°"
              >
                <RotateCw className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Télécharger"
              >
                <Download className="size-4" />
              </button>
              <DialogClose
                render={
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors ml-2"
                    title="Fermer"
                  />
                }
              >
                <X className="size-4" />
              </DialogClose>
            </div>
          </div>

          {/* Main viewport */}
          <div className="relative flex-1 min-h-[60vh] max-h-[75vh] flex items-center justify-center p-4 overflow-hidden select-none">
            <img
              src={src}
              alt={alt}
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-out',
              }}
              className="max-h-full max-w-full object-contain rounded-lg"
              draggable={false}
            />
          </div>

          {/* Caption footer if provided */}
          {caption && (
            <div className="p-4 bg-black/60 backdrop-blur-md border-t border-white/10 text-center text-xs sm:text-sm text-zinc-200">
              {caption}
            </div>
          )}
        </DialogPopup>
      </Dialog>
    </>
  )
}
