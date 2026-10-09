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
                Pour les petits commerçants et entrepreneurs.
              </p>
              <div className="stage-plan-price">
                5 000 <span>FCFA / mois</span>
              </div>
              <ul>
                <li>1 numéro WhatsApp & 2 utilisateurs</li>
                <li>2 agents IA</li>
                <li>10 automatisations actives</li>
                <li>Inbox, contacts et assignations simples</li>
                <li>Catalogue, produits et commandes</li>
                <li>Templates personnalisés avec variables</li>
                <li>Campagnes marketing de base</li>
                <li>Connexion d&apos;un Google Sheet</li>
                <li>Wallet et demandes de retrait</li>
              </ul>
            </div>
            <div className="mt-8">
              <button
                type="button"
                className="button button-neutral w-full"
                onClick={() => onSelectPlan('starter')}
              >
                <span>Commencer l&apos;essai de 30 jours</span>
              </button>
            </div>
          </div>

          {/* Card 2: Growth (Highlighted) */}
          <div className="stage-price-card highlight">
            <div>
              <div className="stage-plan-name">
                <h3>Growth</h3>
              </div>
              <p className="stage-plan-positioning">
                Pour les entreprises qui automatisent leurs ventes.
              </p>
              <div className="stage-plan-price">
                15 000 <span>FCFA / mois</span>
              </div>
              <ul>
                <li>Jusqu&apos;à 3 numéros WhatsApp</li>
                <li>5 utilisateurs & 5 agents IA</li>
                <li>50 automatisations actives</li>
                <li>Segments et campagnes personnalisées</li>
                <li>Automatisations marketing programmées</li>
                <li>IA avec outils et connexions externes</li>
                <li>Google Sheets, Docs et Telegram</li>
                <li>Commerce, commandes, paiements et notifications</li>
                <li>Statistiques commerciales avancées</li>
                <li>Historique et logs d&apos;automatisation</li>
              </ul>
            </div>
            <div className="mt-8">
              <button
                type="button"
                className="button button-primary w-full"
                onClick={() => onSelectPlan('growth')}
              >
                <span>Commencer l&apos;essai de 30 jours</span>
              </button>
            </div>
          </div>

          {/* Card 3: Business */}
          <div className="stage-price-card">
            <div>
              <div className="stage-plan-name">
                <h3>Business</h3>
              </div>
              <p className="stage-plan-positioning">
                Pour les PME et les équipes commerciales.
              </p>
              <div className="stage-plan-price">
                35 000 <span>FCFA / mois</span>
              </div>
              <ul>
                <li>Jusqu&apos;à 10 numéros WhatsApp</li>
                <li>15 utilisateurs & 10 agents IA</li>
                <li>Automatisations avancées</li>
                <li>Permissions par agent et par outil</li>
                <li>Gestion avancée des équipes et assignations</li>
                <li>Campagnes, audiences et rapports</li>
                <li>Intégrations externes multiples</li>
                <li>Routage IA entre fournisseurs et modèles</li>
                <li>Analyses des ventes et des performances IA</li>
                <li>Support prioritaire</li>
              </ul>
            </div>
            <div className="mt-8">
              <button
                type="button"
                className="button button-neutral w-full"
                onClick={() => onSelectPlan('business')}
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
