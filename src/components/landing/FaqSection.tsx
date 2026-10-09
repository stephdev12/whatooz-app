'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      q: 'Comment fonctionne l\'essai gratuit de 30 jours ?',
      a: 'Dès votre inscription, vous disposez d\'un accès complet à 100% des fonctionnalités de Whatooz pendant 30 jours. Aucune carte bancaire n\'est requise. Vous pouvez configurer votre agent principal, connecter votre numéro WhatsApp et encaisser vos premières commandes réelles sans aucun frais.',
    },
    {
      q: 'Mes données d\'entreprise et mes conversations sont-elles protégées ?',
      a: 'La sécurité est au cœur de Whatooz. Toutes vos communications et vos tokens d\'accès sont chiffrés. De plus, notre architecture isole strictement chaque outil : vos agents commerciaux ne peuvent en aucun cas exécuter de retraits sur votre SasPay Wallet sans validation humaine explicite.',
    },
    {
      q: 'Faut-il savoir coder pour créer et gérer des agents ?',
      a: 'Absolument pas. Vous donnez des instructions à vos agents en français naturel, exactement comme vous le feriez avec un collaborateur en chair et en os. Notre interface intuitive vous permet d\'activer ou désactiver des outils (WhatsApp, Google Sheets, SasPay, Telegram) en un simple clic.',
    },
    {
      q: 'Puis-je connecter mon numéro WhatsApp existant sans risque ?',
      a: 'Oui. Whatooz s\'appuie exclusivement sur la Meta Cloud API officielle de WhatsApp. Contrairement aux robots de scraping non officiels qui risquent de faire bannir votre numéro, vous bénéficiez d\'une infrastructure certifiée et conforme aux normes de Meta.',
    },
    {
      q: 'Comment mes clients paient-ils via WhatsApp avec SasPay ?',
      a: 'Lors d\'une commande, l\'agent génère un lien de paiement SasPay sécurisé adapté au pays du client : Wave, Orange Money, MTN Mobile Money, Moov ou carte bancaire. Le client valide en quelques secondes sur son téléphone, et la commande est immédiatement validée dans Whatooz.',
    },
    {
      q: 'Puis-je synchroniser mes données avec Google Sheets et Telegram ?',
      a: 'Oui, ce sont des outils natifs. Vous pouvez par exemple ordonner à votre agent : « Chaque soir à 20h, ajoute les ventes du jour dans mon Google Sheet et envoie la synthèse sur notre groupe Telegram ». Tout s\'exécute automatiquement.',
    },
  ]

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <section id="faq" className="relative py-28 sm:py-36 bg-white text-zinc-900 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-semibold tracking-wider uppercase border border-zinc-200">
            Questions Fréquentes
          </div>
          <h3 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-950">
            Tout ce que vous devez savoir.
          </h3>
          <p className="text-base text-zinc-600 max-w-xl mx-auto">
            Une question sur les agents, l&apos;essai gratuit de 30 jours ou les intégrations ? Nous répondons en toute transparence.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 transition-all duration-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-zinc-900 select-none hover:text-[#fe5105] transition-colors"
                >
                  <span>{item.q}</span>
                  <div
                    className={`w-7 h-7 rounded-full bg-zinc-200/70 flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-[#fe5105]/10 text-[#fe5105]' : 'text-zinc-600'
                    }`}
                  >
                    <ChevronDown size={14} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-200/50 pt-3">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
