'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  src: string
  isOutbound?: boolean
  duration?: number
  className?: string
}

export function AudioPlayer({ src, isOutbound, duration: initialDuration, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(initialDuration || 0)
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [src])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(console.error)
      setIsPlaying(true)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return
    const newTime = parseFloat(e.target.value)
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const toggleSpeed = () => {
    if (!audioRef.current) return
    const speeds: (1 | 1.5 | 2)[] = [1, 1.5, 2]
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length
    const nextSpeed = speeds[nextIndex]
    audioRef.current.playbackRate = nextSpeed
    setPlaybackRate(nextSpeed)
  }

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00'
    const minutes = Math.floor(secs / 60)
    const seconds = Math.floor(secs % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 sm:gap-3 rounded-2xl p-2.5 min-w-[240px] sm:min-w-[280px] max-w-full select-none',
        isOutbound
          ? 'bg-black/5 dark:bg-white/5 text-foreground'
          : 'bg-muted/40 text-foreground',
        className
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        disabled={isLoading}
        className={cn(
          'flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 disabled:opacity-50 shadow-xs cursor-pointer',
          isOutbound
            ? 'bg-[#fe5105] text-white hover:bg-[#e04602]'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
        aria-label={isPlaying ? 'Pause' : 'Lecture'}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="size-4 fill-current" />
        ) : (
          <Play className="size-4 fill-current translate-x-0.5" />
        )}
      </button>

      {/* Waveform / Slider Container */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="relative flex items-center h-4 w-full">
          {/* Custom Track Background */}
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className={cn(
                'h-full transition-all',
                isOutbound ? 'bg-[#fe5105]' : 'bg-primary'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Native Range Input over track */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Position audio"
          />
        </div>

        {/* Time display */}
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground leading-none">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Speed multiplier toggle */}
      <button
        type="button"
        onClick={toggleSpeed}
        className="shrink-0 px-2 py-1 rounded-lg bg-background/60 hover:bg-background border border-border text-[11px] font-bold font-mono transition-colors"
        title="Vitesse de lecture"
      >
        {playbackRate}x
      </button>
    </div>
  )
}
