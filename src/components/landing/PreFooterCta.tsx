'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Shield, Play } from 'lucide-react'

interface PreFooterCtaProps {
  onStartTrial: () => void
  onBookDemo: () => void
}

export function PreFooterCta({ onStartTrial, onBookDemo }: PreFooterCtaProps) {
  return (
    <section className="relative py-28 sm:py-36 bg-[#07080d] text-white overflow-hidden text-center">
      {/* Ambient background lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-b from-[#fe5105]/20 via-[#6366f1]/10 to-transparent blur-[140px] pointer-events-none rounded-full" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center">
        {/* Glowing Titanium Prism Emblem */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative group mb-8"
        >
          <div className="absolute -inset-4 bg-[#fe5105]/25 rounded-full blur-2xl group-hover:bg-[#fe5105]/40 transition-all duration-500" />
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.9)] bg-zinc-950 p-1.5">
            <img
              src="/images/whatooz_emblem.jpg"
              alt="Whatooz Emblem"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h3
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white leading-tight max-w-2xl"
        >
          Prêt à faire tourner votre business avec l&apos;IA ?
        </motion.h3>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-5 text-sm sm:text-base md:text-lg text-zinc-400 max-w-xl leading-relaxed"
        >
          Rejoignez les commerçants et marques ambitieuses qui délèguent leurs ventes et leurs rapports à Whatooz.
        </motion.p>

        {/* CTAs Row (Strictly NO Apple logo, 30-day trial) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-9 flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 w-full sm:w-auto"
        >
          {/* Primary Button */}
          <button
            onClick={onStartTrial}
            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-full bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-100 transition-all duration-300 shadow-[0_10px_35px_rgba(255,255,255,0.2)] active:scale-[0.98]"
          >
            <span>Commencer l&apos;essai de 30 jours</span>
            <div className="w-6 h-6 rounded-full bg-zinc-950/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
              <ArrowRight size={13} className="text-zinc-900" />
            </div>
          </button>

          {/* Secondary Button */}
          <button
            onClick={onBookDemo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/12 text-zinc-200 font-medium text-sm transition-all duration-300 backdrop-blur-md active:scale-[0.98]"
          >
            <Play size={13} className="text-[#fe5105] fill-[#fe5105]/30" />
            <span>Réserver une démo</span>
          </button>
        </motion.div>

        {/* Reassurance (Strictly 30 days) */}
        <div className="mt-5 text-xs text-zinc-500 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Comprend 30 jours d&apos;essai gratuit • Aucune carte bancaire requise</span>
        </div>
      </div>
    </section>
  )
}
