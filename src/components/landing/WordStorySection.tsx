'use client'

import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Play, Sparkles, Check, ArrowRight } from 'lucide-react'

export function WordStorySection() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.3'],
  })

  // Highlights progression for 3 distinct paragraphs
  const opacityP1 = useTransform(scrollYProgress, [0.1, 0.35], [0.35, 1])
  const opacityP2 = useTransform(scrollYProgress, [0.3, 0.6], [0.35, 1])
  const opacityP3 = useTransform(scrollYProgress, [0.55, 0.85], [0.35, 1])

  return (
    <section
      ref={containerRef}
      className="relative z-20 py-28 sm:py-36 bg-[#07080d] text-white overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#fe5105]/5 blur-[160px] pointer-events-none rounded-full" />

      <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
        {/* Story Paragraphs with Scroll Highlight */}
        <div className="space-y-8 sm:space-y-10 text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight leading-[1.35]">
          <motion.p style={{ opacity: opacityP1 }} className="transition-opacity duration-200">
            Vos équipes perdent un temps précieux à jongler entre WhatsApp, les tableurs Excel et les relances manuelles.
          </motion.p>

          <motion.p style={{ opacity: opacityP2 }} className="text-zinc-400 transition-opacity duration-200">
            Pendant ce temps, vos clients attendent des réponses, des ventes sont perdues et votre croissance commerciale stagne.
          </motion.p>

          <motion.p style={{ opacity: opacityP3 }} className="text-white transition-opacity duration-200">
            <span className="text-[#fe5105] font-semibold">Whatooz</span> unifie vos données et vos canaux dans un système autonome piloté par des agents IA qui exécutent vos opérations 24/7.
          </motion.p>
        </div>

        {/* Interactive Video / Showcase Card (Apple/Stage Aesthetic) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 sm:mt-20 relative rounded-3xl overflow-hidden p-1.5 sm:p-2 bg-white/[0.04] border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.8)]"
        >
          <div className="relative rounded-[1.35rem] overflow-hidden aspect-video bg-zinc-950 flex items-center justify-center group cursor-pointer border border-white/5">
            {/* Background Image / Ambient Frame */}
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&auto=format&fit=crop&q=80"
              alt="Workspace Overview"
              className="absolute inset-0 w-full h-full object-cover opacity-35 filter brightness-75 group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Centered Play Button */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                <Play size={24} className="text-white fill-white ml-1" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-zinc-300 tracking-wide uppercase">
                Voir la démonstration en 2 minutes
              </span>
            </div>

            {/* Bottom Tag Bar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] text-zinc-400 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Démonstration en conditions réelles
              </span>
              <span className="font-mono text-zinc-500">02:14 HD</span>
            </div>
          </div>
        </motion.div>

        {/* Transition Quote */}
        <p className="mt-12 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto font-normal">
          Conçu pour les commerçants et marques ambitieuses qui veulent accélérer sans embaucher 50 personnes pour gérer les opérations.
        </p>

        {/* Glowing Whatooz Prism Emblem Separator */}
        <div className="mt-16 flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-[#fe5105]/20 rounded-full blur-xl group-hover:bg-[#fe5105]/35 transition-all duration-500" />
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.8)] bg-zinc-950 p-1">
              <img
                src="/images/whatooz_emblem.jpg"
                alt="Whatooz Prism Mark"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
