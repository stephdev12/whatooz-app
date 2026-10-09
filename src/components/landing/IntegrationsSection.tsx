'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Wallet,
  FileSpreadsheet,
  Send,
  Zap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Globe,
  Database,
  Link2,
} from 'lucide-react'

export function IntegrationsSection() {
  const tools = [
    {
      name: 'WhatsApp Cloud API',
      category: 'Messagerie Officielle',
      desc: 'API certifiée Meta. Zéro risque de bannissement de numéro de téléphone.',
      badge: 'Meta Officiel',
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      icon: MessageSquare,
    },
    {
      name: 'SasPay Mobile Money',
      category: 'Passerelle Paiement',
      desc: 'Encaissez via Wave, Orange Money, MTN, Moov et cartes bancaires en FCFA.',
      badge: 'Instantané',
      color: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
      icon: Wallet,
    },
    {
      name: 'Google Sheets',
      category: 'Tableurs & Données',
      desc: 'Synchronisation automatique de chaque commande et consolidation comptable.',
      badge: 'Temps réel',
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      icon: FileSpreadsheet,
    },
    {
      name: 'Telegram & Slack',
      category: 'Alertes Équipes',
      desc: 'Récapitulatifs des ventes, alertes de rupture de stock et rapports quotidiens.',
      badge: 'Automations',
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      icon: Send,
    },
    {
      name: 'Webhooks & REST API',
      category: 'Développeurs',
      desc: 'Branchez votre ERP, Shopify, WooCommerce ou base de données interne en quelques minutes.',
      badge: 'Sur mesure',
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      icon: Database,
    },
    {
      name: 'Catalogues Interactifs',
      category: 'Commerce Natif',
      desc: 'Synchronisation des fiches produits, prix, variantes et stocks directement dans WhatsApp.',
      badge: 'Catalogue Meta',
      color: 'bg-[#fe5105]/10 text-[#fe5105] border-[#fe5105]/20',
      icon: Zap,
    },
  ]

  return (
    <section id="tools" className="relative py-28 sm:py-36 bg-white text-zinc-900 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-semibold tracking-wider uppercase border border-zinc-200">
            04 • Écosystème Connecté
          </div>
          <h3 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-950">
            Connectez Whatooz à tout votre écosystème.
          </h3>
          <p className="text-base sm:text-lg text-zinc-600">
            Vos agents ne travaillent pas en vase clos. Ils interrogent vos outils, alimentent vos feuilles de calcul et alertent vos collaborateurs au bon moment.
          </p>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, idx) => {
            const Icon = tool.icon
            return (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="p-1.5 rounded-[1.8rem] bg-zinc-100/70 border border-zinc-200/80 hover:border-zinc-300 transition-all duration-300 group"
              >
                <div className="h-full p-6 rounded-[1.4rem] bg-white border border-zinc-200/60 flex flex-col justify-between space-y-4 shadow-xs group-hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800 group-hover:scale-105 transition-transform">
                      <Icon size={20} />
                    </div>
                    <span
                      className={`text-[10px] font-medium font-mono px-2.5 py-0.5 rounded-full border ${tool.color}`}
                    >
                      {tool.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider block">
                      {tool.category}
                    </span>
                    <h4 className="text-base font-semibold text-zinc-900 mt-0.5">
                      {tool.name}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* ── High-Contrast Dark Bento Box (WhatsApp Meta & SasPay Native Experience) ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="relative rounded-[2.2rem] bg-[#07080d] border border-white/10 p-2 sm:p-3 overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.4)]"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#fe5105]/15 blur-[120px] pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />

          <div className="relative rounded-[1.8rem] bg-white/[0.02] border border-white/8 p-6 sm:p-10 lg:p-12 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-zinc-300 text-[11px] font-semibold tracking-wider uppercase border border-white/15">
                  Conformité & Vitesse Meta
                </span>
                <h4 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white leading-tight">
                  Encaissez directement dans WhatsApp grâce à SasPay.
                </h4>
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl">
                  Ne perdez plus 70% de vos clients qui abandonnent parce qu&apos;ils doivent quitter WhatsApp pour payer. L&apos;agent génère le lien de paiement Mobile Money en 1 seconde, vérifie la réception des fonds et confirme la commande automatiquement.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/8">
                    <span className="text-zinc-500 text-[10px] block">Délivrabilité</span>
                    <span className="text-base font-bold text-white font-mono mt-0.5 block">99.8%</span>
                    <span className="text-emerald-400 text-[10px]">Meta Cloud API</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/8">
                    <span className="text-zinc-500 text-[10px] block">Règlement moyen</span>
                    <span className="text-base font-bold text-white font-mono mt-0.5 block">12 sec</span>
                    <span className="text-sky-400 text-[10px]">Wave & Orange Money</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/8 col-span-2 sm:col-span-1">
                    <span className="text-zinc-500 text-[10px] block">Disponibilité</span>
                    <span className="text-base font-bold text-white font-mono mt-0.5 block">24h / 7j</span>
                    <span className="text-purple-400 text-[10px]">Zéro coupure</span>
                  </div>
                </div>
              </div>

              {/* Right Visual: Mobile Money Payment Snippet */}
              <div className="lg:col-span-5">
                <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/15 shadow-2xl space-y-3 font-sans">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                    <span className="font-semibold text-zinc-300">SasPay Mobile Checkout</span>
                    <span className="text-emerald-400 font-mono text-[11px]">Encaissé ✓</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/8 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-zinc-400">Montant total</p>
                      <p className="text-lg font-bold text-white font-mono">21 500 FCFA</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-400">
                        Wave Côte d&apos;Ivoire
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-zinc-400 space-y-1 pt-1">
                    <div className="flex justify-between">
                      <span>Client</span>
                      <span className="text-zinc-200">Mireille Kouassi (+225 07...)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Articles</span>
                      <span className="text-zinc-200">2x Sérum Éclat Nuit</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Réf. Transaction</span>
                      <span className="text-zinc-300 font-mono">SAS-88421-CI</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="w-full py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center text-xs font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={13} />
                      Fonds crédités sur le Wallet Whatooz
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
