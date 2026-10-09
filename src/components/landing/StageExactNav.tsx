'use client'

import React, { useState, useEffect } from 'react'
import { WhatoozLogo } from '@/components/ui/whatooz-logo'
import { cn } from '@/lib/utils'

interface StageExactNavProps {
  isAuthenticated: boolean
  onOpenApp: () => void
}

export function StageExactNav({ isAuthenticated, onOpenApp }: StageExactNavProps) {
  const [isScrolledToLight, setIsScrolledToLight] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Transition from dark to light navbar when scrolled past the hero section
      const y = window.scrollY
      setIsScrolledToLight(y > 600)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'stage-navigation transition-all duration-300',
        isScrolledToLight && 'stage-navigation-light'
      )}
      id="navigation"
    >
      <div className="stage-nav-row">
        {/* Brand with Real Whatooz Logo (Only logo mark, no text) */}
        <a className="stage-nav-brand shrink-0" href="#top" aria-label="Whatooz accueil">
          <WhatoozLogo
            size="md"
            showText={false}
            variant={isScrolledToLight ? 'light' : 'dark'}
          />
        </a>

        {/* Desktop Links (Hidden on small screens to prevent overflow) */}
        <a className="stage-nav-link hidden md:inline-flex" href="#features">
          Fonctionnalités
        </a>
        <a className="stage-nav-link hidden md:inline-flex" href="#pricing">
          Tarifs
        </a>
        <a className="stage-nav-link hidden lg:inline-flex" href="#faq">
          FAQ
        </a>

        <span className="stage-nav-spacer" />

        {/* Login Button */}
        <button
          type="button"
          className="stage-nav-login bg-transparent border-0 cursor-pointer hidden sm:inline-flex"
          onClick={onOpenApp}
        >
          {isAuthenticated ? 'Tableau de bord' : 'Connexion'}
        </button>

        {/* Primary CTA */}
        <button
          type="button"
          className="stage-nav-cta border-0 cursor-pointer shrink-0"
          onClick={onOpenApp}
        >
          <span>{isAuthenticated ? 'Ouvrir l\'app' : 'Essai 30 jours'}</span>
        </button>
      </div>
    </header>
  )
}
