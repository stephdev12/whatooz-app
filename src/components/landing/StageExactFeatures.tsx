'use client'

import React from 'react'
import { PhoneMockup } from './PhoneMockup'

export function StageExactFeatures() {
  return (
    <section className="stage-light-section" id="features">
      <div className="stage-section-shell">
        {/* ── FEATURE 1: AUTOMATISATIONS ── */}
        <div className="stage-feature-grid">
          <div className="stage-section-copy">
            <div className="stage-section-label">
              <span>01</span>
              <span>•</span>
              <span>Automatisations</span>
            </div>
            <h2>Répondez et qualifiez en temps réel sur WhatsApp.</h2>
            <p>
              Vos prospects n&apos;attendent plus. Vos agents accueillent chaque contact, comprennent leurs besoins et les guident immédiatement vers le bon produit ou la bonne information.
            </p>
          </div>

          <div>
            <PhoneMockup
              chatContactName="Whatooz Assistant"
              chatStatus="en ligne 24h/24"
              messages={[
                {
                  type: 'incoming',
                  text: 'Bonjour, je cherche des informations sur vos disponibilités.',
                  time: '14:20',
                },
                {
                  type: 'outgoing',
                  text: 'Bonjour ! Bienvenue chez nous 👋 Quel type de produit recherchez-vous aujourd\'hui ?',
                  time: '14:20',
                },
                {
                  type: 'incoming',
                  text: 'Je souhaite voir vos formules disponibles ce mois-ci.',
                  time: '14:21',
                },
                {
                  type: 'outgoing',
                  text: 'Avec plaisir ! Voici notre sélection la plus demandée avec livraison express :',
                  time: '14:21',
                },
              ]}
            />
          </div>
        </div>

        {/* ── FEATURE 2: CATALOGUE & COMMANDES ── */}
        <div className="stage-feature-grid mt-28">
          <div className="order-2 md:order-1">
            <PhoneMockup
              chatContactName="Boutique Whatooz"
              chatStatus="catalogue certifié"
              messages={[
                {
                  type: 'outgoing',
                  text: 'Voici l\'article que vous avez sélectionné dans notre catalogue :',
                  time: '16:05',
                },
                {
                  type: 'catalog',
                  product: {
                    title: 'Pack Prestige Essentiel',
                    price: '25 000 FCFA',
                  },
                },
                {
                  type: 'incoming',
                  text: 'Parfait ! Je confirme ma commande avec livraison à Cocody.',
                  time: '16:06',
                },
                {
                  type: 'outgoing',
                  text: 'Commande bien enregistrée ! Vous recevrez la confirmation de départ par SMS.',
                  time: '16:06',
                },
              ]}
            />
          </div>

          <div className="stage-section-copy order-1 md:order-2">
            <div className="stage-section-label">
              <span>02</span>
              <span>•</span>
              <span>Commerce</span>
            </div>
            <h2>Diffusez vos produits et prenez des commandes en direct.</h2>
            <p>
              Connectez votre catalogue WhatsApp officiel. Vos clients explorent vos fiches produits, consultent vos prix et finalisent leurs achats directement dans le fil de discussion.
            </p>
          </div>
        </div>

        {/* ── FEATURE 3: TEMPLATES & CAMPAGNES META ── */}
        <div className="stage-feature-grid mt-28">
          <div className="stage-section-copy">
            <div className="stage-section-label">
              <span>03</span>
              <span>•</span>
              <span>Diffusion</span>
            </div>
            <h2>Envoyez des messages certifiés avec l&apos;API officielle Meta.</h2>
            <p>
              Créez, soumettez et diffusez vos modèles de messages directement depuis Whatooz. Zéro risque de blocage ou de bannissement de numéro grâce à la conformité Meta Cloud.
            </p>
          </div>

          <div>
            <PhoneMockup
              chatContactName="Notifications Whatooz"
              chatStatus="compte vérifié ✓"
              messages={[
                {
                  type: 'outgoing',
                  text: '📦 Bonjour Stéphane, votre commande #842 est confirmée ! Notre équipe prépare votre expédition.',
                  time: '10:15',
                },
                {
                  type: 'outgoing',
                  text: '🚚 Votre livreur a pris en charge votre colis. Arrivée estimée à votre adresse dans 25 minutes.',
                  time: '11:30',
                },
                {
                  type: 'incoming',
                  text: 'Merci beaucoup pour la rapidité !',
                  time: '11:32',
                },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
