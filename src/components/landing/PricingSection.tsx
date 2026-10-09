'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ArrowRight, Sparkles } from 'lucide-react'

interface PricingSectionProps {
  onSelectPlan: (plan: string) => void
}

export function PricingSection({ onSelectPlan }: PricingSectionProps) {
  const [currency, setCurrency] = useState<'FCFA' | 'EUR'>('FCFA')

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      badge: 'Pour Démarrer',
      popular: false,
      priceFCFA: '29 000',
      priceEUR: '45',
      desc: 'Idéal pour automatiser votre boutique et commencer à vendre sur WhatsApp.',
      features: [
        '1 Agent Principal',
        '1 000 conversations WhatsApp / mois',
        'Gestion jusqu\'à 50 produits au catalogue',
        'Encaissement Mobile Money via SasPay',
        'Support standard par WhatsApp & Email',
        '30 jours d\'essai gratuit sans engagement',
      ],
      ctaText: 'Commencer l\'essai de 30 jours',
    },
    {
      id: 'pro',
      name: 'Pro',
      badge: 'Le Plus Populaire',
      popular: true,
      priceFCFA: '69 000',
      priceEUR: '105',
      desc: 'Pour les commerces en croissance ayant besoin d\'une équipe d\'agents complète.',
      features: [
        'Agents Illimités (Sales, Finance, Support)',
        '10 000 conversations WhatsApp / mois',
        'Catalogue produits illimité',
        'WhatsApp Flows & Formulaires certifiés Meta',
        'Connexions Google Sheets & Telegram',
        'Attribution des rôles et permissions fines',
        'Support prioritaire dédié 7j/7',
        '30 jours d\'essai gratuit sans engagement',
      ],
      ctaText: 'Commencer l\'essai de 30 jours',
    },
    {
      id: 'enterprise',
      name: 'Entreprise',
      badge: 'Sur Mesure',
      popular: false,
      priceFCFA: 'Sur devis',
      priceEUR: 'Sur devis',
      desc: 'Pour les grands réseaux, franchises et structures avec flux complexes.',
      features: [
        'Multi-numéros WhatsApp officiels',
        'Agents sur mesure & Fine-tuning métier',
        'Intégration API & Webhooks ERP sur mesure',
        'Volume de conversations sans limite',
        'Gestionnaire de compte dédié & SLA 99.9%',
        'Accompagnement au déploiement technique',
      ],
      ctaText: 'Contacter un spécialiste',
    },
  ]

  return (
    <section id="pricing" className="relative py-28 sm:py-36 bg-[#f4f5f8] text-zinc-900 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200/80 text-zinc-800 text-[11px] font-semibold tracking-wider uppercase">
            Tarification Transparente
          </div>
          <h3 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-950">
            Investissez dans vos opérations.
          </h3>
          <p className="text-base text-zinc-600">
            Tous nos forfaits incluent 30 jours d&apos;essai gratuit. Aucune carte bancaire requise à l&apos;inscription.
          </p>

          {/* Currency Toggle */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex items-center p-1 rounded-full bg-zinc-200/80 border border-zinc-300 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCurrency('FCFA')}
                className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                  currency === 'FCFA'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                FCFA (XOF / XAF)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('EUR')}
                className={`px-3.5 py-1.5 rounded-full transition-all duration-200 ${
                  currency === 'EUR'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Euros (€)
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => {
            const isPopular = plan.popular
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`relative p-2 rounded-[2.2rem] flex flex-col justify-between transition-all duration-300 ${
                  isPopular
                    ? 'bg-white border-2 border-[#fe5105] shadow-[0_25px_60px_rgba(254,81,5,0.12)]'
                    : 'bg-white border border-zinc-200/80 shadow-[0_15px_40px_rgba(0,0,0,0.04)]'
                }`}
              >
                {/* Popular Pill Tag */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#fe5105] text-white text-[11px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5">
                    <Sparkles size={11} />
                    <span>Recommandé</span>
                  </div>
                )}

                <div className="p-6 sm:p-7 space-y-6">
                  {/* Title & Badge */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold text-zinc-900">{plan.name}</h4>
                    <span className="text-[11px] font-medium text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-100">
                      {plan.badge}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="pb-4 border-b border-zinc-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 font-mono">
                        {currency === 'FCFA' ? plan.priceFCFA : plan.priceEUR}
                      </span>
                      {plan.id !== 'enterprise' && (
                        <span className="text-xs text-zinc-500 font-medium">
                          {currency === 'FCFA' ? 'FCFA / mois' : '€ / mois'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                      {plan.desc}
                    </p>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-3 text-xs text-zinc-700">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                      Inclus dans ce forfait :
                    </span>
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5">
                        <Check size={14} className="text-[#fe5105] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => onSelectPlan(plan.id)}
                    className={`w-full py-3.5 px-4 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] ${
                      isPopular
                        ? 'bg-[#fe5105] text-white hover:bg-[#e04500] shadow-[0_8px_20px_rgba(254,81,5,0.25)]'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight size={13} />
                  </button>
                  <p className="text-[10px] text-center text-zinc-400 mt-2">
                    30 jours d&apos;essai gratuit • Sans engagement
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Reassurance Banner (Strictly 30 days) */}
        <div className="text-center text-xs text-zinc-500 max-w-lg mx-auto">
          Besoin d&apos;un conseil pour choisir ? Nos experts vous accompagnent gratuitement pour configurer vos premiers agents et tester la solution pendant 30 jours.
        </div>
      </div>
    </section>
  )
}
