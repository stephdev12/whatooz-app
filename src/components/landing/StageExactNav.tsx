'use client'

import React from 'react'

interface StageExactNavProps {
  isAuthenticated: boolean
  onOpenApp: () => void
}

export function StageExactNav({ isAuthenticated, onOpenApp }: StageExactNavProps) {
  return (
    <header className="stage-navigation" id="navigation">
      <div className="stage-nav-row">
        <a className="stage-nav-brand" href="#top" aria-label="Whatooz accueil">
          <span className="w-2.5 h-2.5 rounded-full bg-[#fe5105] inline-block" />
          <span>Whatooz</span>
        </a>

        <a className="stage-nav-link" href="#features">
          Fonctionnalités
        </a>
        <a className="stage-nav-link" href="#pricing">
          Tarifs
        </a>
        <a className="stage-nav-link" href="#faq">
          FAQ
        </a>

        <span className="stage-nav-spacer" />

        <button
          type="button"
          className="stage-nav-login bg-transparent border-0 cursor-pointer"
          onClick={onOpenApp}
        >
          {isAuthenticated ? 'Tableau de bord' : 'Connexion'}
        </button>

        <button
          type="button"
          className="stage-nav-cta border-0 cursor-pointer"
          onClick={onOpenApp}
        >
          <span>{isAuthenticated ? 'Ouvrir l\'app' : 'Essai 30 jours'}</span>
        </button>
      </div>
    </header>
  )
}
