'use client'

import React from 'react'

interface StageExactFooterProps {
  onStartTrial: () => void
}

export function StageExactFooter({ onStartTrial }: StageExactFooterProps) {
  return (
    <>
      {/* Exact Stage Closing CTA */}
      <section className="stage-closing">
        <div className="w-12 h-12 rounded-xl bg-[#171717] mx-auto mb-6 flex items-center justify-center text-white font-bold text-lg">
          W
        </div>

        <h2>Prêt à automatiser votre WhatsApp ?</h2>

        <p>
          Rejoignez les entreprises qui gagnent du temps et augmentent leurs ventes chaque jour avec Whatooz.
        </p>

        <div className="hero-actions">
          <button
            type="button"
            className="button button-primary hero-cta"
            onClick={onStartTrial}
          >
            <span>Commencer l&apos;essai de 30 jours</span>
          </button>
        </div>

        <p className="cta-caption">Comprend 30 jours d&apos;essai gratuit</p>
      </section>

      {/* Exact Stage Footer */}
      <footer className="stage-footer">
        <div className="stage-footer-main">
          <div className="stage-footer-brand">
            <h4>Whatooz</h4>
            <p>
              La plateforme d&apos;automatisation WhatsApp pour les commerces et marques modernes. Connectée à l&apos;API officielle WhatsApp Cloud de Meta.
            </p>
          </div>

          <div className="stage-footer-column">
            <span className="title">Produit</span>
            <a href="#features">Automatisations</a>
            <a href="#features">Catalogue</a>
            <a href="#features">Templates</a>
            <a href="#pricing">Tarification</a>
          </div>

          <div className="stage-footer-column">
            <span className="title">Légal</span>
            <a href="/terms">Conditions d&apos;utilisation</a>
            <a href="/privacy">Confidentialité</a>
            <a href="/contact">Support</a>
          </div>
        </div>

        <div className="stage-footer-bottom">
          <span>© {new Date().getFullYear()} Whatooz. Tous droits réservés.</span>
          <span>Conforme Meta Cloud API</span>
        </div>
      </footer>
    </>
  )
}
