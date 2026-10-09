'use client'

import React, { useEffect, useRef } from 'react'

interface StageExactHeroProps {
  onStartTrial: () => void
}

export function StageExactHero({ onStartTrial }: StageExactHeroProps) {
  const farRef = useRef<HTMLDivElement>(null)
  const midRef = useRef<HTMLDivElement>(null)
  const dashboardRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      if (farRef.current) {
        farRef.current.style.transform = `translate3d(0, ${y * 0.31}px, 0)`
      }
      if (midRef.current) {
        midRef.current.style.transform = `translate3d(0, ${y * 0.17}px, 0)`
      }
      if (dashboardRef.current) {
        dashboardRef.current.style.transform = `translate3d(0, ${y * -0.14}px, 0)`
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="hero hero-landscape" id="top" aria-label="Whatooz pour WhatsApp">
      {/* Sky Background */}
      <div className="hero-sky" aria-hidden="true" />

      {/* Far Landscape Layer (parallax: 0.31) */}
      <div
        ref={farRef}
        className="landscape-layer landscape-far"
        data-parallax="0.31"
        aria-hidden="true"
      >
        <img
          src="/images/stage-landscape-far.webp"
          alt=""
          width={1944}
          height={809}
        />
      </div>

      {/* Mid Landscape Layer (parallax: 0.17) */}
      <div
        ref={midRef}
        className="landscape-layer landscape-mid"
        data-parallax="0.17"
        aria-hidden="true"
      >
        <img
          src="/images/stage-landscape-mid.webp"
          alt=""
          width={1862}
          height={845}
        />
      </div>

      {/* Hero Heading (Centered, clean, no badges) */}
      <div className="hero-heading">
        <h1 aria-label="Votre WhatsApp vend. Vos agents automatisent.">
          Votre WhatsApp vend.<br />
          <span>Vos agents automatisent.</span>
        </h1>

        <p className="hero-description">
          La plateforme tout-en-un pour automatiser vos conversations, présenter vos catalogues et convertir vos prospects sur WhatsApp 24h/24.
        </p>

        {/* Hero Actions: Only single primary CTA button */}
        <div className="hero-actions">
          <button
            type="button"
            className="button button-primary hero-cta"
            onClick={onStartTrial}
          >
            <span>Commencer gratuitement</span>
          </button>
        </div>

        <p className="cta-caption">Comprend 30 jours d&apos;essai gratuit</p>
      </div>

      {/* Floating Dashboard Card (parallax: -0.14) */}
      <figure
        ref={dashboardRef}
        className="hero-dashboard"
        data-parallax="0.20"
      >
        <div className="hero-dashboard-screen">
          <img
            src="/images/stage-dashboard-hover.webp"
            alt="Tableau de bord Whatooz"
            width={2880}
            height={2628}
            fetchPriority="high"
          />
        </div>
      </figure>

      {/* Front Landscape Layer (in front of the dashboard) */}
      <div className="landscape-layer landscape-front" aria-hidden="true">
        <img
          src="/images/stage-landscape-front.webp"
          alt=""
          width={2038}
          height={771}
        />
      </div>

      {/* Ground Gradient Transition */}
      <div className="hero-ground" aria-hidden="true" />
    </section>
  )
}
