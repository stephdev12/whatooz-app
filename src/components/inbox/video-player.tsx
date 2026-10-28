'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Maximize2, Volume2, VolumeX, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  src: string
  className?: string
  caption?: string
}

export function VideoPlayer({ src, className, caption }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      video.play().catch(console.error)
      setIsPlaying(true)
      setHasStarted(true)
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    if (video.requestFullscreen) {
      video.requestFullscreen()
    }
  }

  return (
    <div className={cn('relative rounded-2xl overflow-hidden max-w-sm sm:max-w-md bg-black/90 group', className)}>
      <video
        ref={videoRef}
        src={src}
        controls={hasStarted}
        playsInline
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full max-h-80 object-contain rounded-2xl cursor-pointer"
        onClick={togglePlay}
      />

      {!hasStarted && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-opacity group-hover:bg-black/40 cursor-pointer"
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-[#fe5105] text-white shadow-lg transition-transform group-hover:scale-110 active:scale-95">
            <Play className="size-6 fill-current translate-x-0.5" />
          </div>
        </div>
      )}

      {caption && (
        <div className="p-2.5 bg-black/70 backdrop-blur-xs text-white text-xs leading-relaxed">
          {caption}
        </div>
      )}
    </div>
  )
}
