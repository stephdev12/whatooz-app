'use client'

import React, { useRef } from 'react'
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'

interface WordProps {
  children: string
  progress: MotionValue<number>
  range: [number, number]
  isHighlight?: boolean
}

function ReadingWord({ children, progress, range, isHighlight = false }: WordProps) {
  const opacity = useTransform(progress, range, [0.25, 1])
  const color = useTransform(
    progress,
    range,
    isHighlight ? ['#66301a', '#fe5105'] : ['#525252', '#fafafa']
  )

  return (
    <motion.span
      style={{ opacity, color }}
      className={`inline-block mr-[0.28em] font-normal transition-colors select-none ${
        isHighlight ? 'font-semibold' : ''
      }`}
    >
      {children}
    </motion.span>
  )
}

interface SentenceProps {
  text: string
  progress: MotionValue<number>
  range: [number, number]
  highlightWord?: string
}

function ReadingSentence({ text, progress, range, highlightWord }: SentenceProps) {
  const words = text.split(' ')
  const total = words.length
  const step = (range[1] - range[0]) / total

  return (
    <div className="problem-paragraph-wrapper">
      {words.map((word, i) => {
        const start = range[0] + i * step
        const end = start + step * 0.9
        const isHighlight = highlightWord ? word.toLowerCase().includes(highlightWord.toLowerCase()) : false
        return (
          <ReadingWord
            key={i}
            progress={progress}
            range={[start, end]}
            isHighlight={isHighlight}
          >
            {word}
          </ReadingWord>
        )
      })}
    </div>
  )
}

export function StageExactStory() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.85', 'end 0.35'],
  })

  return (
    <section ref={containerRef} className="problem-story" id="shift">
      <div className="problem-inner">
        <div className="problem-copy space-y-8">
          {/* Paragraph 1: Problem */}
          <ReadingSentence
            text="Vos clients vous contactent sur WhatsApp à toute heure. Mais répondre manuellement prend un temps infini, et chaque minute d'attente fait perdre des commandes précieuses."
            progress={scrollYProgress}
            range={[0, 0.42]}
          />

          {/* Paragraph 2: What's missing */}
          <ReadingSentence
            text="Ce qui manque souvent, c'est un système autonome qui qualifie chaque contact, présente vos produits et relance vos prospects sans interruption."
            progress={scrollYProgress}
            range={[0.38, 0.72]}
          />

          {/* Paragraph 3: The Whatooz solution */}
          <ReadingSentence
            text="Whatooz automatise vos échanges WhatsApp avec des agents intelligents opérationnels pour faire tourner votre entreprise 24h/24."
            progress={scrollYProgress}
            range={[0.68, 1]}
            highlightWord="Whatooz"
          />
        </div>
      </div>
    </section>
  )
}
