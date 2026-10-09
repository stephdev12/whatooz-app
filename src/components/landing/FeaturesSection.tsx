'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bot,
  Sparkles,
  ShoppingBag,
  Wallet,
  MessageSquare,
  FileSpreadsheet,
  Send,
  CheckCircle2,
  ShieldCheck,
  Lock,
  ArrowRight,
  TrendingUp,
  Cpu,
  Sliders,
  Layers,
} from 'lucide-react'

export function FeaturesSection() {
  const [activeTab, setActiveTab] = useState<'sales' | 'finance'>('sales')

  return (
    <section id="features" className="relative py-28 sm:py-36 bg-[#f4f5f8] text-zinc-900 overflow-hidden">
      {/* Background Soft Gradients */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#07080d] to-transparent pointer-events-none opacity-5" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-28 sm:space-y-36">
        {/* ── FEATURE 1: L'AGENT PRINCIPAL (Split Left Preview / Right Text) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Preview: Clean Apple-Style Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 order-2 lg:order-1"
          >
            <div className="p-2 rounded-[2rem] bg-white border border-zinc-200/80 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              <div className="rounded-[1.4rem] bg-zinc-50/70 border border-zinc-200/60 p-5 sm:p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#fe5105] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      <Bot size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 leading-tight">
                        Agent Principal
                      </h4>
                      <p className="text-[11px] text-zinc-500">Vue panoramique de l&apos;entreprise</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Connecté 24/7
                  </span>
                </div>

                {/* Natural Question */}
                <div className="p-3.5 rounded-xl bg-white border border-zinc-200/80 shadow-xs">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 block mb-1">
                    Question de l&apos;administrateur
                  </span>
                  <p className="text-xs sm:text-sm font-medium text-zinc-800">
                    « Quels sont mes 3 produits qui se vendent le mieux cette semaine et quel est le chiffre total ? »
                  </p>
                </div>

                {/* Agent Action Sequence */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5 text-[10px] text-zinc-500 font-mono">
                    <span className="px-2 py-0.5 rounded bg-zinc-200/70 text-zinc-700">
                      ✓ query_orders(range=&quot;7d&quot;)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-200/70 text-zinc-700">
                      ✓ aggregate_products()
                    </span>
                    <span className="px-2 py-0.5 rounded bg-zinc-200/70 text-zinc-700">
                      ✓ calculate_revenue()
                    </span>
                  </div>

                  {/* Structured Response Box */}
                  <div className="p-4 rounded-xl bg-white border border-zinc-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-100">
                      <span>Période : 7 derniers jours</span>
                      <span className="font-semibold text-zinc-900 font-mono">Total : 640 000 FCFA</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-700 font-medium">1. Pack Prestige Bio</span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">24 ventes</span>
                          <span className="font-semibold text-zinc-900 font-mono">360 000 F</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#fe5105] h-full rounded-full w-[75%]" />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-zinc-700 font-medium">2. Sérum Éclat Nuit</span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">18 ventes</span>
                          <span className="font-semibold text-zinc-900 font-mono">180 000 F</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-zinc-800 h-full rounded-full w-[45%]" />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-zinc-700 font-medium">3. Coffret Découverte</span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">10 ventes</span>
                          <span className="font-semibold text-zinc-900 font-mono">100 000 F</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-zinc-400 h-full rounded-full w-[25%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Narrative */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 order-1 lg:order-2 space-y-5"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200/80 text-zinc-800 text-[11px] font-semibold tracking-wider uppercase">
              01 • Cerveau Opérationnel
            </div>

            <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950 leading-tight">
              Un agent qui connaît vos chiffres sur le bout des doigts.
            </h3>

            <p className="text-base text-zinc-600 leading-relaxed">
              Fini les exports CSV à répétition. L&apos;agent principal est directement branché sur vos commandes, vos paiements SasPay et vos échanges WhatsApp. Il comprend les relations entre vos données et répond instantanément.
            </p>

            <ul className="space-y-3 pt-2 text-sm text-zinc-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-[#fe5105] shrink-0 mt-0.5" />
                <span>Interroge vos commandes et vos stocks en langage naturel</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-[#fe5105] shrink-0 mt-0.5" />
                <span>Calcule vos marges et compare vos périodes sans formule Excel</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 size={18} className="text-[#fe5105] shrink-0 mt-0.5" />
                <span>Supervise et coordonne l&apos;ensemble de vos agents spécialisés</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* ── FEATURE 2: LES SOUS-AGENTS (Centered Header + Dual Bento Cards) ── */}
        <div className="space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200/80 text-zinc-800 text-[11px] font-semibold tracking-wider uppercase">
              02 • Multi-Agents Spécialisés
            </div>
            <h3 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-950">
              Créez une équipe d&apos;agents pour chaque mission.
            </h3>
            <p className="text-base sm:text-lg text-zinc-600">
              Chaque agent dispose d&apos;instructions dédiées, d&apos;outils autorisés et de limites strictes pour exécuter ses tâches en toute autonomie.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1: Sales Agent */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
              className="p-2 rounded-[2rem] bg-white border border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col justify-between"
            >
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <ShoppingBag size={20} />
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                    WhatsApp & SasPay
                  </span>
                </div>

                <div>
                  <h4 className="text-xl font-semibold text-zinc-900">
                    Sales Agent (Ventes WhatsApp)
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Gère les prospects, recommande des articles et encaisse les paiements.
                  </p>
                </div>

                {/* WhatsApp Chat Simulation */}
                <div className="rounded-2xl bg-[#0b141a] p-4 text-xs space-y-3 font-sans text-white">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] text-zinc-400">
                    <span>WhatsApp Business Flow</span>
                    <span className="text-emerald-400">● En direct</span>
                  </div>

                  <div className="bg-[#202c33] rounded-xl rounded-tl-sm p-3 max-w-[85%] text-zinc-200">
                    <p className="text-[11px] font-semibold text-emerald-400 mb-0.5">Mireille K.</p>
                    <p>Bonjour, je veux commander 2 flacons du Sérum Éclat avec livraison à Cocody.</p>
                  </div>

                  <div className="bg-[#005c4b] ml-auto rounded-xl rounded-tr-sm p-3 max-w-[85%] text-white space-y-2">
                    <p>
                      Parfait Mireille ! Voici votre récapitulatif :
                      <br />• 2x Sérum Éclat : 20 000 FCFA
                      <br />• Livraison Cocody : 1 500 FCFA
                    </p>
                    <div className="p-2 rounded bg-black/30 border border-white/10 flex items-center justify-between">
                      <span className="font-bold font-mono">21 500 FCFA</span>
                      <span className="px-2 py-0.5 rounded bg-white text-zinc-900 font-bold text-[10px]">
                        Payer avec Wave / OM
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                    Outils autorisés :
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">✓ search_products</span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">✓ calculate_price</span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">✓ create_saspay_link</span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">✓ send_flow</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Reporting & Finance Agent */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="p-2 rounded-[2rem] bg-white border border-zinc-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col justify-between"
            >
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold">
                    <FileSpreadsheet size={20} />
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                    Sheets & Telegram
                  </span>
                </div>

                <div>
                  <h4 className="text-xl font-semibold text-zinc-900">
                    Finance & Reporting Agent
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Automatise la consolidation quotidienne et l&apos;envoi de synthèses.
                  </p>
                </div>

                {/* Automation Preview */}
                <div className="rounded-2xl bg-zinc-900 p-4 text-xs space-y-3 font-sans text-white">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] text-zinc-400">
                    <span>Routine quotidienne configurée</span>
                    <span className="text-sky-400 font-mono">20:00 UTC</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-medium">
                      <Send size={12} />
                      <span>Message envoyé sur Telegram @direction_whatooz</span>
                    </div>
                    <div className="text-zinc-300 text-[11px] leading-relaxed font-mono">
                      📊 Rapport de clôture du jour :
                      <br />• Ventes encaissées : 312 000 FCFA (14 cmds)
                      <br />• Taux conversion WhatsApp : 71%
                      <br />• Synchro Google Sheets : Terminée (Ligne #842)
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <span>Fréquence : Du lundi au samedi</span>
                    <span className="text-emerald-400">Statut : Actif</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                    Outils autorisés :
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">✓ query_revenue</span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">✓ google_sheets.append</span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">✓ telegram.send</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">✗ wallet.withdraw (Bloqué)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── FEATURE 3: PERMISSIONS & GOUVERNANCE (Split Text Left / Matrix Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Narrative */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 space-y-5"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200/80 text-zinc-800 text-[11px] font-semibold tracking-wider uppercase">
              03 • Gouvernance & Sécurité
            </div>

            <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950 leading-tight">
              Chaque agent a ses outils. Rien de plus, rien de moins.
            </h3>

            <p className="text-base text-zinc-600 leading-relaxed">
              La sécurité n&apos;est pas une option. Vous attribuez des permissions granulaires à chaque agent. Vos agents peuvent vendre et informer sans jamais compromettre votre trésorerie ou modifier vos tarifs sans accord.
            </p>

            <ul className="space-y-3 pt-2 text-sm text-zinc-700">
              <li className="flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-[#fe5105] shrink-0 mt-0.5" />
                <span>Interdiction absolue des retraits Wallet pour les agents publics</span>
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-[#fe5105] shrink-0 mt-0.5" />
                <span>Validation humaine obligatoire (Human-in-the-loop) pour les remboursements</span>
              </li>
              <li className="flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-[#fe5105] shrink-0 mt-0.5" />
                <span>Historique d&apos;audit complet de chaque action et outil exécuté</span>
              </li>
            </ul>
          </motion.div>

          {/* Right Permissions Matrix Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <div className="p-2 rounded-[2rem] bg-white border border-zinc-200/80 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              <div className="rounded-[1.4rem] bg-zinc-50 border border-zinc-200/60 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                  <div className="flex items-center gap-2">
                    <Sliders size={18} className="text-zinc-700" />
                    <span className="font-semibold text-sm text-zinc-900">
                      Matrice des Permissions & Rôles
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">Agent: Sales-01</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* WhatsApp Tool */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-zinc-200/80">
                    <div className="flex items-center gap-2.5">
                      <MessageSquare size={16} className="text-emerald-600" />
                      <div>
                        <span className="font-semibold text-zinc-900 block">WhatsApp Messages & Flows</span>
                        <span className="text-[11px] text-zinc-500">Lecture des messages, envoi de réponses</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Autorisé ✓
                    </span>
                  </div>

                  {/* Commerce Tool */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-zinc-200/80">
                    <div className="flex items-center gap-2.5">
                      <ShoppingBag size={16} className="text-[#fe5105]" />
                      <div>
                        <span className="font-semibold text-zinc-900 block">Catalogue & Commandes</span>
                        <span className="text-[11px] text-zinc-500">Création de paniers, consultation des prix</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Autorisé ✓
                    </span>
                  </div>

                  {/* SasPay Payment Tool */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-zinc-200/80">
                    <div className="flex items-center gap-2.5">
                      <Wallet size={16} className="text-sky-600" />
                      <div>
                        <span className="font-semibold text-zinc-900 block">Création de Liens SasPay</span>
                        <span className="text-[11px] text-zinc-500">Génération de liens Wave & Orange Money</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Autorisé ✓
                    </span>
                  </div>

                  {/* Wallet Withdraw Tool (Blocked) */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-200/80">
                    <div className="flex items-center gap-2.5">
                      <Lock size={16} className="text-rose-600" />
                      <div>
                        <span className="font-semibold text-rose-950 block">Retrait Trésorerie (Wallet)</span>
                        <span className="text-[11px] text-rose-700/80">Virement vers compte bancaire ou mobile</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                      Strictement Bloqué ✗
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
