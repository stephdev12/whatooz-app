'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Image as ImageIcon,
  Video,
  FileText,
  Mic,
  X,
  Send,
  Loader2,
  Paperclip,
  Check,
  Phone,
} from 'lucide-react'
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useOrganization } from '@/hooks/use-organization'

interface MediaSenderModalProps {
  conversationId: string
  contactPhone: string
  currentPhoneNumberId?: string | null
  replyToMessageId?: string | null
  onMediaSent: (newMsg?: any) => void
  disabled?: boolean
}

export function MediaSenderModal({
  conversationId,
  contactPhone,
  currentPhoneNumberId,
  replyToMessageId,
  onMediaSent,
  disabled,
}: MediaSenderModalProps) {
  const { activeOrganization } = useOrganization()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [mediaKind, setMediaKind] = useState<'image' | 'video' | 'audio' | 'document'>('image')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setError(null)

    // Detect media kind
    if (file.type.startsWith('image/')) {
      setMediaKind('image')
      setPreviewUrl(URL.createObjectURL(file))
    } else if (file.type.startsWith('video/')) {
      setMediaKind('video')
      setPreviewUrl(URL.createObjectURL(file))
    } else if (file.type.startsWith('audio/')) {
      setMediaKind('audio')
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setMediaKind('document')
      setPreviewUrl(null)
    }
  }

  const resetState = () => {
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setCaption('')
    setError(null)
    setUploading(false)
  }

  const handleSend = async () => {
    if (!selectedFile || !activeOrganization) return
    setUploading(true)
    setError(null)

    try {
      // 1. Upload to WhatsApp media endpoint
      const formData = new FormData()
      formData.append('file', selectedFile)

      const uploadRes = await fetch('/api/whatsapp/upload-message-media', {
        method: 'POST',
        headers: {
          'x-organization-id': activeOrganization.id,
        },
        body: formData,
      })

      const uploadData = await uploadRes.json().catch(() => ({}))
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Échec du téléchargement du fichier sur WhatsApp')
      }

      const { mediaId } = uploadData

      // 2. Send media message via API
      const sendRes = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization.id,
        },
        body: JSON.stringify({
          conversationId,
          to: contactPhone,
          type: mediaKind,
          mediaId,
          caption: caption.trim() || undefined,
          phoneNumberId: currentPhoneNumberId || undefined,
          replyToMessageId: replyToMessageId || undefined,
        }),
      })

      const sendData = await sendRes.json().catch(() => ({}))
      if (!sendRes.ok) {
        throw new Error(sendData.error || "Échec de l'envoi du message média")
      }

      onMediaSent(sendData.message)
      setIsOpen(false)
      resetState()
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi du fichier")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) resetState()
      }}
    >
      <DialogTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            title="Envoyer un fichier ou média"
          />
        }
      >
        <Paperclip className="size-4 sm:size-5" />
      </DialogTrigger>

      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Envoyer un média</DialogTitle>
          <DialogDescription>
            Envoyez une photo, vidéo, document ou note vocale directement sur WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="flex flex-col gap-4 py-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />

          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-border rounded-2xl hover:border-[#fe5105]/50 bg-muted/10 hover:bg-muted/30 cursor-pointer transition-all"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-[#fe5105]/10 text-[#fe5105]">
                <Paperclip className="size-6" />
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm font-semibold text-foreground">
                  Cliquez pour choisir un fichier
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Images, Vidéos (MP4), Audios, Documents (PDF, Word)
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Preview card */}
              <div className="relative rounded-2xl border border-border bg-card overflow-hidden flex flex-col items-center justify-center min-h-[140px] max-h-56">
                {mediaKind === 'image' && previewUrl && (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain max-h-56" />
                )}
                {mediaKind === 'video' && previewUrl && (
                  <video src={previewUrl} controls className="w-full max-h-56 object-contain" />
                )}
                {mediaKind === 'audio' && previewUrl && (
                  <audio src={previewUrl} controls className="w-full p-4" />
                )}
                {mediaKind === 'document' && (
                  <div className="flex items-center gap-3 p-6 text-foreground">
                    <FileText className="size-8 text-[#fe5105]" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={resetState}
                  className="absolute top-2 right-2 size-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  title="Supprimer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Caption input (for images, videos, documents) */}
              {mediaKind !== 'audio' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Légende (Optionnelle)
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Ajouter une légende au fichier..."
                    className="w-full rounded-xl border border-border bg-input px-3 py-2 text-xs text-foreground outline-none focus:border-[#fe5105]"
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-xl">
              {error}
            </div>
          )}
        </DialogPanel>

        <DialogFooter>
          <DialogClose render={<button type="button" className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted" />}>
            Annuler
          </DialogClose>
          <button
            type="button"
            onClick={handleSend}
            disabled={!selectedFile || uploading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#fe5105] hover:bg-[#e04602] px-4 py-2 text-xs font-bold text-white shadow-xs transition-transform active:scale-95 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            {uploading ? 'Envoi...' : 'Envoyer'}
          </button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
