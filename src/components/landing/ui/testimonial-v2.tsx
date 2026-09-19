'use client'

import React from 'react'
import { motion } from 'framer-motion'

// --- Testimonial Data ---
const testimonials = [
  {
    text: "Whatooz a transformé notre gestion de commandes. Nos clients consultent nos catalogues sur WhatsApp et commandent en deux clics sans qu'on ait besoin de taper un mot.",
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    name: 'Aminata Diallo',
    role: 'Fondatrice, Mode & Beauté Dakar',
  },
  {
    text: "Le taux de réponse immédiat 24h/24 a fait bondir nos ventes de 45%. Les clients adorent avoir les fiches produits détaillées instantanément sur leur téléphone.",
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    name: 'Julien Mercier',
    role: 'Responsable E-commerce Abidjan',
  },
  {
    text: "L'appairage par numéro sans scan QR est super pratique. Nos 4 assistants tournent en tâche de fond sans jamais déconnecter. C'est du solide.",
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    name: 'Saran Camara',
    role: "Directrice d'Agence Digitale",
  },
  {
    text: 'La validation automatique des commandes avec confirmation immédiate rassure énormément nos acheteurs. On a réduit les abandons de panier de moitié.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    name: 'Mamadou Koné',
    role: 'Gérant, Tech Store Bamako',
  },
  {
    text: "L'interface est d'une simplicité déconcertante. On a créé nos formulaires de livraison et nos menus interactifs en moins de 15 minutes chrono.",
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    name: 'Fatou Ndiaye',
    role: 'Propriétaire Boutique Gourmande',
  },
  {
    text: 'Gérer 8 numéros de boutique simultanément sur le même tableau de bord Whatooz nous fait gagner plus de 4 heures de travail par jour.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    name: 'Thomas Dubois',
    role: 'Consultant Growth & Vente',
  },
  {
    text: 'Les relances automatiques programmées ont récupéré des dizaines de commandes qui seraient passées à la trappe. Un retour sur investissement incroyable.',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    name: 'Aïcha Traoré',
    role: 'Co-fondatrice Parfumerie Bio',
  },
  {
    text: "Nos clients pensent qu'on a une équipe de 10 personnes dédiée au support client de nuit ! Whatooz gère tout en autonomie avec une fluidité bluffante.",
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    name: 'Koffi Mensah',
    role: 'Directeur des Opérations Lomé',
  },
  {
    text: 'Le meilleur outil commercial pour WhatsApp en Afrique. Les fiches produits avec boutons cliquables sont incomparablement plus efficaces que des PDF.',
    image: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    name: 'Inès Bamba',
    role: 'Responsable Ventes & Acquisition',
  },
]

const firstColumn = testimonials.slice(0, 3)
const secondColumn = testimonials.slice(3, 6)
const thirdColumn = testimonials.slice(6, 9)

const TestimonialsColumn = ({
  className = '',
  testimonials,
  duration = 15,
}: {
  className?: string
  testimonials: typeof firstColumn
  duration?: number
}) => {
  return (
    <div className={`testimonials-col ${className}`} style={{ width: '100%', maxWidth: '340px' }}>
      <motion.ul
        animate={{
          translateY: '-50%',
        }}
        transition={{
          duration: duration || 10,
          repeat: Infinity,
          ease: 'linear',
          repeatType: 'loop',
        }}
        className="flex flex-col gap-6 pb-6 bg-transparent transition-colors duration-300 list-none m-0 p-0"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          paddingBottom: '24px',
          margin: 0,
          padding: 0,
          listStyle: 'none',
        }}
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {testimonials.map(({ text, image, name, role }, i) => (
                <motion.li
                  key={`${index}-${i}`}
                  aria-hidden={index === 1 ? 'true' : 'false'}
                  tabIndex={index === 1 ? -1 : 0}
                  whileHover={{
                    scale: 1.02,
                    y: -6,
                    boxShadow: '0 20px 45px -10px rgba(254, 81, 5, 0.15), 0 0 0 1px rgba(254, 81, 5, 0.25)',
                    transition: { type: 'spring', stiffness: 400, damping: 17 },
                  }}
                  whileFocus={{
                    scale: 1.02,
                    y: -6,
                    boxShadow: '0 20px 45px -10px rgba(254, 81, 5, 0.15), 0 0 0 1px rgba(254, 81, 5, 0.25)',
                    transition: { type: 'spring', stiffness: 400, damping: 17 },
                  }}
                  className="testimonial-card-item clean-card"
                  style={{
                    padding: '26px 22px',
                    borderRadius: '18px',
                    width: '100%',
                    background: 'var(--landing-card-bg)',
                    border: '1px solid var(--landing-card-border)',
                    boxShadow: 'var(--landing-card-shadow)',
                    cursor: 'default',
                    userSelect: 'none',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <blockquote style={{ margin: 0, padding: 0 }}>
                    <p
                      style={{
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: 'var(--landing-text-muted, #a1a1aa)',
                        margin: 0,
                        fontWeight: 400,
                      }}
                    >
                      « {text} »
                    </p>
                    <footer style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                      <img
                        width={42}
                        height={42}
                        src={image}
                        alt={`Avatar de ${name}`}
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid rgba(254, 81, 5, 0.3)',
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <cite
                          style={{
                            fontWeight: 700,
                            fontStyle: 'normal',
                            fontSize: '14px',
                            color: 'var(--landing-text, #ffffff)',
                            lineHeight: '1.3',
                          }}
                        >
                          {name}
                        </cite>
                        <span
                          style={{
                            fontSize: '11.5px',
                            color: 'var(--landing-text-subtle, #71717a)',
                            marginTop: '2px',
                          }}
                        >
                          {role}
                        </span>
                      </div>
                    </footer>
                  </blockquote>
                </motion.li>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.ul>
    </div>
  )
}

export default function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="landing-testimonials-section relative overflow-hidden"
      style={{ padding: '100px 0', position: 'relative', overflow: 'hidden' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.15 }}
        transition={{
          duration: 1.0,
          ease: [0.16, 1, 0.3, 1],
          opacity: { duration: 0.8 },
        }}
        className="landing-container"
      >
        <div
          className="landing-section-header text-center"
          style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 40px' }}
        >
          <h2 id="testimonials-heading" className="landing-section-title">
            Ce que disent nos commerçants
          </h2>
          <p className="landing-section-desc" style={{ marginTop: '12px' }}>
            Découvrez comment des milliers de commerçants et marques développent leurs ventes sur WhatsApp avec Whatooz.
          </p>
        </div>

        <div
          className="scrolling-testimonials-container"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginTop: '30px',
            maxHeight: '680px',
            overflow: 'hidden',
            maskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
          }}
          role="region"
          aria-label="Témoignages en défilement"
        >
          <TestimonialsColumn testimonials={firstColumn} duration={16} />
          <TestimonialsColumn testimonials={secondColumn} className="testimonials-col-2" duration={20} />
          <TestimonialsColumn testimonials={thirdColumn} className="testimonials-col-3" duration={18} />
        </div>
      </motion.div>
    </section>
  )
}
