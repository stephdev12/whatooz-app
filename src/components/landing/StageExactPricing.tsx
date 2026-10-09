'use client'

import React from 'react'

interface StageExactPricingProps {
  onSelectPlan: (plan: string) => void
}

export function StageExactPricing({ onSelectPlan }: StageExactPricingProps) {
  return (
    <section className="stage-light-section" id="pricing">
      <div className="stage-pricing">
        <div className="stage-pricing-heading">
          <h2>Tarification simple et transparente.</h2>
          <p>
            Commencez avec 30 jours d&apos;essai gratuit sans engagement. Aucune carte bancaire requise.
          </p>
        </div>

        <div className="stage-pricing-grid">
          {/* Card 1: Starter */}
          <div className="stage-price-card">
            <div>
              <div className="stage-plan-name">
                <h3>Starter</h3>
              </div>
              <p className="stage-plan-positioning">
                Pour automatiser vos premières conversations et gérer vos ventes sur WhatsApp.
              </p>
              <div className="stage-plan-price">
                29 000 <span>FCFA / mois</span>
              </div>
              <ul>
                <li>Jusqu&apos;à 1 000 conversations / mois</li>
                <li>Catalogue jusqu&apos;à 50 produits</li>
                <li>Réponses automatisées 24h/24</li>
                <li>Prise de commande en direct</li>
                <li>Support par WhatsApp et email</li>
                <li>30 jours d&apos;essai gratuit sans engagement</li>
              </ul>
            </div>
            <div>
              <button
                type="button"
                className="button button-neutral"
                onClick={() => onSelectPlan('starter')}
              >
                <span>Commencer l&apos;essai de 30 jours</span>
              </button>
            </div>
          </div>

          {/* Card 2: Pro */}
          <div className="stage-price-card highlight">
            <div>
              <div className="stage-plan-name">
                <h3>Pro</h3>
              </div>
              <p className="stage-plan-positioning">
                Pour les entreprises en croissance qui ont besoin de volumes élevés et de campagnes.
              </p>
              <div className="stage-plan-price">
                69 000 <span>FCFA / mois</span>
              </div>
              <ul>
                <li>Conversations illimitées</li>
                <li>Catalogue produits illimité</li>
                <li>Diffusion de campagnes & templates Meta</li>
                <li>Boîte de réception multi-opérateurs</li>
                <li>Scénarios personnalisés et règles avancées</li>
                <li>Support prioritaire 7j/7</li>
                <li>30 jours d&apos;essai gratuit sans engagement</li>
              </ul>
            </div>
            <div>
              <button
                type="button"
                className="button button-primary"
                onClick={() => onSelectPlan('pro')}
              >
                <span>Commencer l&apos;essai de 30 jours</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
