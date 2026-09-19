'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowRight, Repeat2 } from 'lucide-react'

export default function CardFlip({
  title = 'Design Systems',
  subtitle = 'Explore the fundamentals',
  description = 'Dive deep into the world of modern UI/UX design.',
  features = ['UI/UX', 'Modern Design', 'Tailwind CSS', 'Kokonut UI'],
  buttonText = 'Démarrer maintenant',
  onAction = () => {},
  autoFlipOnScroll = true,
  theme = 'dark',
}: {
  title?: string
  subtitle?: string
  description?: string
  features?: string[]
  buttonText?: string
  onAction?: () => void
  autoFlipOnScroll?: boolean
  theme?: string
}) {
  const [isFlipped, setIsFlipped] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)

  // Auto-flip on mobile when scrolled into view
  useEffect(() => {
    if (!autoFlipOnScroll || typeof window === 'undefined') return

    const el = cardRef.current
    if (!el) return

    let timeoutId: ReturnType<typeof setTimeout>
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isMobile = window.innerWidth <= 768
        if (!isMobile) return

        if (entry.isIntersecting) {
          timeoutId = setTimeout(() => {
            setIsFlipped(true)
          }, 350)
        } else {
          clearTimeout(timeoutId)
          setIsFlipped(false)
        }
      },
      {
        threshold: 0.5,
        rootMargin: '0px 0px -10% 0px',
      }
    )

    observer.observe(el)

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [autoFlipOnScroll])

  return (
    <div
      ref={cardRef}
      className="kokonut-card-flip-wrapper group"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => setIsFlipped((prev) => !prev)}
      role="region"
      aria-label={title}
    >
      <div className={`kokonut-card-flip-inner ${isFlipped ? 'is-flipped' : ''}`}>
        {/* FRONT OF CARD */}
        <div className="kokonut-card-flip-face kokonut-card-flip-front">
          {/* Animated Background Area with Pulse Orbs */}
          <div className="kokonut-card-front-bg">
            <div aria-hidden="true" className="kokonut-card-orb-container">
              <div className="kokonut-card-orb-box">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="kokonut-orb-circle card-flip-pulse-orb"
                    style={{
                      animationDelay: `${i * 0.35}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Card Footer Info */}
          <div className="kokonut-card-front-footer">
            <div className="kokonut-card-front-text">
              <h3 className="kokonut-card-front-title">{title}</h3>
              <p className="kokonut-card-front-subtitle">{subtitle}</p>
            </div>
            <div className="kokonut-flip-icon-badge" title="Retourner la carte">
              <Repeat2 size={18} />
            </div>
          </div>
        </div>

        {/* BACK OF CARD */}
        <div className="kokonut-card-flip-face kokonut-card-flip-back">
          <div className="kokonut-card-back-body">
            <h3 className="kokonut-card-back-title">{title}</h3>
            <p className="kokonut-card-back-desc">{description}</p>

            <div className="kokonut-card-features-list">
              {features.map((feature, index) => (
                <div
                  key={feature}
                  className="kokonut-card-feature-item"
                  style={{
                    transform: isFlipped ? 'translateX(0)' : 'translateX(-10px)',
                    opacity: isFlipped ? 1 : 0,
                    transitionDelay: `${index * 60 + 120}ms`,
                  }}
                >
                  <ArrowRight size={14} className="kokonut-feature-arrow" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="kokonut-card-back-action-wrap">
            <button
              type="button"
              className="kokonut-card-action-btn"
              onClick={(e) => {
                e.stopPropagation()
                onAction()
              }}
            >
              <span>{buttonText}</span>
              <ArrowRight size={15} className="kokonut-btn-arrow" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
