'use client'

import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  Loader2,
  X,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
  FileText,
  Video,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MediaUploadInputProps {
  value?: string
  onChange: (url: string) => void
  mediaType?: 'image' | 'video' | 'document' | 'auto'
  placeholder?: string
  label?: string
  helperText?: string
  className?: string
  disabled?: boolean
}

export function MediaUploadInput({
  value = '',
  onChange,
  mediaType = 'image',
  placeholder = 'Ex: https://...',
  label,
  helperText,
  className,
  disabled = false,
}: MediaUploadInputProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isImage =
    mediaType === 'image' ||
    (mediaType === 'auto' &&
      /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(value)) ||
    value.includes('files.catbox.moe') ||
    value.includes('scontent.whatsapp.net') ||
    value.includes('images.unsplash.com') ||
    value.includes('picsum.photos')

  const isVideo =
    mediaType === 'video' ||
    (mediaType === 'auto' && /\.(mp4|mov|webm)($|\?)/i.test(value))

  const isDocument =
    mediaType === 'document' ||
    (mediaType === 'auto' && /\.(pdf|docx?|xlsx?)($|\?)/i.test(value))

  const acceptTypes =
    mediaType === 'video'
      ? 'video/mp4,video/quicktime,video/webm'
      : mediaType === 'document'
      ? 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'image/jpeg,image/png,image/webp,image/gif'

  const handleUploadFile = async (file: File) => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(15)
    setError(null)

    // Smooth progress simulation while network request runs
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval)
          return 85
        }
        return prev + 15
      })
    }, 200)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(interval)

      const data = await res.json()

      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Erreur lors du téléversement')
      }

      setUploadProgress(100)
      setTimeout(() => {
        onChange(data.url)
        setIsUploading(false)
        setUploadProgress(0)
      }, 300)
    } catch (err: any) {
      clearInterval(interval)
      setIsUploading(false)
      setUploadProgress(0)
      setError(err.message || 'Impossible de téléverser le fichier')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUploadFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled || isUploading) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUploadFile(file)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-foreground">{label}</label>
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-[11px] text-primary hover:underline font-medium"
          >
            {showManualInput ? 'Masquer URL directe' : 'Saisir une URL'}
          </button>
        </div>
      )}

      {/* Uploading progress bar overlay */}
      {isUploading ? (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Téléversement vers Catbox...
            </span>
            <span className="font-mono font-bold text-primary">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-primary/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            Optimisation et génération du lien direct en cours...
          </p>
        </div>
      ) : value ? (
        /* Preview Card */
        <div className="p-3 rounded-xl border border-border bg-card/60 shadow-xs space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {isImage ? (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-border shrink-0 bg-muted/40">
                  <img
                    src={value}
                    alt="Aperçu"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback icon on error
                      ;(e.target as HTMLElement).style.display = 'none'
                    }}
                  />
                </div>
              ) : isVideo ? (
                <div className="w-14 h-14 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Video className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center shrink-0 border border-red-500/20">
                  <FileText className="w-6 h-6" />
                </div>
              )}

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">
                    Média hébergé avec succès
                  </span>
                </div>
                <p className="text-[11px] font-mono text-muted-foreground truncate max-w-[260px] sm:max-w-xs">
                  {value}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                title="Ouvrir dans un nouvel onglet"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                title="Remplacer par un autre fichier"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                disabled={disabled}
                title="Supprimer ce média"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Expanded Image Preview if image */}
          {isImage && (
            <div className="relative w-full max-h-48 rounded-lg overflow-hidden border border-border/60 bg-muted/20 flex items-center justify-center">
              <img
                src={value}
                alt="Aperçu grand format"
                className="w-full h-auto max-h-48 object-contain"
              />
            </div>
          )}
        </div>
      ) : (
        /* Dropzone / Upload Trigger */
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isUploading) {
              fileInputRef.current?.click()
            }
          }}
          className={cn(
            'group relative border-2 border-dashed rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all',
            dragOver
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-border/80 hover:border-primary/60 hover:bg-muted/30 bg-card/40',
            disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            {mediaType === 'video' ? (
              <Video className="w-5 h-5" />
            ) : mediaType === 'document' ? (
              <FileText className="w-5 h-5" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
          </div>

          <p className="text-xs font-semibold text-foreground">
            Cliquez pour téléverser{' '}
            {mediaType === 'video'
              ? 'une vidéo'
              : mediaType === 'document'
              ? 'un PDF'
              : 'une image'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            ou glissez-déposez le fichier ici (Génération de lien automatique)
          </p>
          <span className="text-[10px] text-muted-foreground/80 mt-1 font-mono">
            {mediaType === 'video'
              ? 'MP4, MOV, WEBM (max 20 Mo)'
              : mediaType === 'document'
              ? 'PDF, DOCX (max 20 Mo)'
              : 'PNG, JPG, WEBP, GIF (max 20 Mo)'}
          </span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 p-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Optional Manual URL input toggle */}
      {showManualInput && (
        <div className="space-y-1 pt-1 animate-in fade-in">
          <span className="text-[11px] text-muted-foreground font-medium">Lien direct :</span>
          <div className="flex gap-2">
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-1.5 border border-input bg-background rounded-lg text-xs outline-none focus:border-primary font-mono"
              disabled={disabled}
            />
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground border border-input rounded-lg"
              >
                Effacer
              </button>
            )}
          </div>
        </div>
      )}

      {helperText && !error && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">{helperText}</p>
      )}
    </div>
  )
}
