'use client'

import React, { useEffect, useRef } from 'react'

interface StageExactHeroProps {
  onStartTrial: () => void
}

export function StageExactHero({ onStartTrial }: StageExactHeroProps) {
  const farRef = useRef<HTMLDivElement>(null)
  const midRef = useRef<HTMLDivElement>(null)
  const dashboardRef = useRef<HTMLElement>(null)
  const frontRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      // On mobile screens, disable parallax translation so layout stays rock-solid
      if (window.innerWidth <= 640) {
        if (farRef.current) farRef.current.style.transform = 'none'
        if (midRef.current) midRef.current.style.transform = 'none'
        if (dashboardRef.current) dashboardRef.current.style.transform = 'none'
        if (frontRef.current) frontRef.current.style.transform = 'none'
        return
      }

      const y = window.scrollY
      const farOffset = y * 0.20
      const midOffset = y * 0.10
      const dashboardOffset = Math.min(y * 0.08, 24)

      if (farRef.current) {
        farRef.current.style.transform = `translate3d(0, ${farOffset}px, 0)`
      }
      if (midRef.current) {
        midRef.current.style.transform = `translate3d(0, ${midOffset}px, 0)`
      }
      if (dashboardRef.current) {
        dashboardRef.current.style.transform = `translate3d(0, ${dashboardOffset}px, 0)`
      }
      // Landscape front stays grounded at the bottom as on getstage.co
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="hero hero-landscape" id="top" aria-label="Whatooz pour WhatsApp">
      {/* Sky Background */}
      <div className="hero-sky" aria-hidden="true" />

      {/* Far Landscape Layer (parallax) */}
      <div
        ref={farRef}
        className="landscape-layer landscape-far"
        aria-hidden="true"
      >
        <img
          src="/images/stage-landscape-far.webp"
          alt=""
          width={1944}
          height={809}
        />
      </div>

      {/* Mid Landscape Layer (parallax) */}
      <div
        ref={midRef}
        className="landscape-layer landscape-mid"
        aria-hidden="true"
      >
        <img
          src="/images/stage-landscape-mid.webp"
          alt=""
          width={1862}
          height={845}
        />
      </div>

      {/* Hero Heading (Centered, clean, responsive) */}
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

      {/* Floating Dashboard Card (App image moves down on scroll) */}
      <figure
        ref={dashboardRef}
        className="hero-dashboard"
      >
        <div className="hero-dashboard-screen">
          <img
            src="/images/dashboard-preview.png"
            alt="Tableau de bord Whatooz"
            width={1024}
            height={455}
            className="w-full h-auto object-cover"
            fetchPriority="high"
          />
        </div>
      </figure>

      {/* Front Landscape Layer (Foreground image rises slightly on scroll) */}
      <div
        ref={frontRef}
        className="landscape-layer landscape-front"
        aria-hidden="true"
      >
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
