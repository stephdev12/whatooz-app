'use client'

import React from 'react'

export function StageExactFaq() {
  return (
    <section className="stage-light-section" id="faq">
      <div className="stage-section-shell">
        <div className="stage-faq">
          <div className="stage-faq-heading">
            <h2>Questions fréquentes</h2>
          </div>

          <div className="stage-faq-list">
            <details open>
              <summary>
                <span>Comment fonctionne l&apos;essai gratuit de 30 jours ?</span>
                <span className="icon">↓</span>
              </summary>
              <p>
                Vous bénéficiez d&apos;un accès complet à toutes les fonctionnalités pendant 30 jours. Aucune carte bancaire n&apos;est demandée lors de votre inscription. Vous êtes libre de continuer ou d&apos;arrêter à tout moment.
              </p>
            </details>

            <details>
              <summary>
                <span>Mes numéros risquent-ils d&apos;être bannis par WhatsApp ?</span>
                <span className="icon">↓</span>
              </summary>
              <p>
                Non. Whatooz utilise exclusivement l&apos;API officielle WhatsApp Cloud de Meta. Votre numéro respecte scrupuleusement les politiques de Meta, garantissant une délivrabilité maximale sans risque de blocage.
              </p>
            </details>

            <details>
              <summary>
                <span>Dois-je savoir coder pour utiliser Whatooz ?</span>
                <span className="icon">↓</span>
              </summary>
              <p>
                Non, aucune compétence technique n&apos;est nécessaire. La configuration de vos flux, de vos catalogues et de vos messages se fait entièrement depuis une interface intuitive.
              </p>
            </details>

            <details>
              <summary>
                <span>Puis-je attribuer des conversations à des membres de mon équipe ?</span>
                <span className="icon">↓</span>
              </summary>
              <p>
                Oui. Whatooz intègre une boîte de réception partagée qui permet à plusieurs collaborateurs de répondre en direct, avec un suivi clair de qui traite chaque message.
              </p>
            </details>
          </div>
        </div>
      </div>
    </section>
  )
}
