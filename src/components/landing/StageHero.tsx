'use client'

import React, { useRef } from 'react'
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import { ArrowRight, Sparkles, Play, Shield, Check } from 'lucide-react'
import { AgentDashboardMockup } from './AgentDashboardMockup'

interface StageHeroProps {
  onStartTrial: () => void
  onBookDemo: () => void
}

export function StageHero({ onStartTrial, onBookDemo }: StageHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll parallax progress for the hero section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  // Smooth scroll transformations
  const textY = useTransform(scrollYProgress, [0, 0.45], [0, -60])
  const textOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0])
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -100])
  const cardRotateX = useTransform(scrollYProgress, [0, 0.6], [12, 0])
  const cardScale = useTransform(scrollYProgress, [0, 0.6], [0.96, 1.02])
  const dunesParallaxY = useTransform(scrollYProgress, [0, 1], [0, 60])

  // Interactive 3D mouse tilt
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 120, damping: 25 })
  const springY = useSpring(mouseY, { stiffness: 120, damping: 25 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top
    const xPct = (clientX / width - 0.5) * 12
    const yPct = (clientY / height - 0.5) * -10
    mouseX.set(xPct)
    mouseY.set(yPct)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[105dvh] lg:min-h-[115dvh] pt-32 pb-24 flex flex-col items-center justify-start overflow-hidden bg-[#07080d]"
    >
      {/* 1. Deep Cosmic Ambience & Stars Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Soft radial atmospheric aura */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-[#fe5105]/15 via-[#6366f1]/10 to-transparent blur-[120px] rounded-full opacity-70" />
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[1200px] h-[400px] bg-gradient-to-t from-[#0a0d18]/80 to-transparent blur-[80px]" />

        {/* Dune scenery layer with gentle parallax */}
        <motion.div
          style={{ y: dunesParallaxY }}
          className="absolute inset-0 bg-cover bg-bottom opacity-40 mix-blend-luminosity"
        >
          <img
            src="/images/stage_hero_dunes.jpg"
            alt="Dunes background"
            className="w-full h-full object-cover object-bottom"
          />
        </motion.div>

        {/* Ambient subtle vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#07080d]/80 via-transparent to-[#07080d]" />
      </div>

      {/* 2. Hero Typography & CTAs (Fades & shifts slightly on scroll) */}
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center"
      >
        {/* Eyebrow Pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md text-[11px] font-medium text-zinc-300 tracking-wide uppercase mb-6 shadow-[0_2px_15px_rgba(0,0,0,0.5)]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#fe5105] shadow-[0_0_8px_#fe5105]" />
          <span>L&apos;Agent Opérationnel de votre Entreprise</span>
        </motion.div>

        {/* Main Headline (Stage-Style Multi-Line Typography) */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.03em] text-white leading-[1.08] max-w-3xl"
        >
          Whatooz gère les opérations.{' '}
          <span className="block mt-1 sm:mt-2 text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-400">
            Vos agents font tourner le business.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed font-normal"
        >
          Le système tout-en-un qui unifie WhatsApp, vos produits, vos paiements
          SasPay et vos agents intelligents pour piloter votre entreprise sans friction.
        </motion.p>

        {/* CTA Buttons Row (STRICTLY NO Apple logo, 30 days trial) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9 flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 w-full sm:w-auto"
        >
          {/* Primary CTA (Button-in-Button Pattern) */}
          <button
            onClick={onStartTrial}
            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-full bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-all duration-300 shadow-[0_10px_35px_rgba(255,255,255,0.18)] active:scale-[0.98]"
          >
            <span>Commencer gratuitement</span>
            <div className="w-7 h-7 rounded-full bg-zinc-950/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
              <ArrowRight size={14} className="text-zinc-900" />
            </div>
          </button>

          {/* Secondary Glass CTA */}
          <button
            onClick={onBookDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/12 text-zinc-200 font-medium text-sm transition-all duration-300 backdrop-blur-md active:scale-[0.98]"
          >
            <Play size={13} className="text-[#fe5105] fill-[#fe5105]/30" />
            <span>Réserver une démo</span>
          </button>
        </motion.div>

        {/* Reassurance Badge (Strictly 30 days) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.32 }}
          className="mt-4 flex items-center gap-2 text-xs text-zinc-500"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Comprend 30 jours d&apos;essai gratuit sans engagement</span>
        </motion.div>
      </motion.div>

      {/* 3. Floating Interactive 3D Perspective Dashboard Preview (Stage Parallax Signature) */}
      <div
        className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 mt-14 sm:mt-18"
        style={{ perspective: 1400 }}
      >
        <motion.div
          style={{
            y: cardY,
            rotateX: cardRotateX,
            scale: cardScale,
            rotateY: springX,
            transformStyle: 'preserve-3d',
          }}
          className="relative transition-transform duration-100 ease-out"
        >
          {/* Subtle Outer Machine Bezel Glow */}
          <div className="absolute -inset-1 rounded-[2.2rem] bg-gradient-to-b from-white/15 via-[#fe5105]/10 to-transparent opacity-60 blur-md pointer-events-none" />

          {/* Double-Bezel Architecture */}
          <div className="relative p-1.5 sm:p-2 rounded-[2rem] bg-white/[0.05] border border-white/10 backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.9)]">
            <AgentDashboardMockup />
          </div>
        </motion.div>
      </div>

      {/* 4. Foreground Dune Silhouette Overlay (Creates the physical depth of Stage) */}
      <div className="relative z-30 w-full -mt-24 sm:-mt-36 pointer-events-none">
        <svg
          viewBox="0 0 1440 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto text-[#07080d] block"
          preserveAspectRatio="none"
        >
          <path
            d="M0 160C240 110 520 200 780 140C1040 80 1260 170 1440 130V280H0V160Z"
            fill="currentColor"
            fillOpacity="0.85"
          />
          <path
            d="M0 190C320 150 640 240 960 170C1200 120 1360 190 1440 180V280H0V190Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  )
}
