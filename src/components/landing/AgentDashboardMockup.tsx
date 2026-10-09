'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Bot,
  MessageSquare,
  ShoppingBag,
  Wallet,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  Send,
  Zap,
  ShieldCheck,
  Search,
} from 'lucide-react'

export function AgentDashboardMockup() {
  return (
    <div className="relative w-full rounded-2xl bg-[#090b10]/95 border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-2xl overflow-hidden select-none text-left font-sans">
      {/* Top OS Window Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-3 text-[11px] font-medium tracking-wide text-zinc-400">
            Whatooz • Agent Workspace
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Agent Principal Actif
          </span>
          <span className="hidden sm:inline-block text-[11px] text-zinc-500">
            Onlice Store Pro
          </span>
        </div>
      </div>

      {/* Main Window Grid */}
      <div className="grid grid-cols-12 min-h-[480px]">
        {/* Left Sidebar */}
        <div className="hidden md:flex md:col-span-3 flex-col justify-between border-r border-white/8 bg-black/40 p-3 text-[12px]">
          <div className="space-y-4">
            {/* Workspace Selector */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/8 text-zinc-200">
              <div className="w-6 h-6 rounded-md bg-[#fe5105]/20 text-[#fe5105] flex items-center justify-center font-bold text-xs">
                W
              </div>
              <div className="flex-1 truncate">
                <p className="font-semibold text-xs leading-none">Onlice Space</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Plan Pro • 3 Agents</p>
              </div>
            </div>

            {/* Nav Links */}
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Espace Opérationnel
              </div>

              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#fe5105]/15 text-white font-medium border border-[#fe5105]/30">
                <span className="flex items-center gap-2">
                  <Bot size={14} className="text-[#fe5105]" />
                  <span>AI Space (QG)</span>
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#fe5105]" />
              </div>

              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  <Sparkles size={14} />
                  <span>Agents Dédiés</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                  3
                </span>
              </div>

              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  <MessageSquare size={14} />
                  <span>WhatsApp Inbox</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-medium">
                  +12
                </span>
              </div>

              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  <ShoppingBag size={14} />
                  <span>Commandes</span>
                </span>
                <span className="text-[10px] text-zinc-400">86</span>
              </div>

              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors">
                <span className="flex items-center gap-2">
                  <Wallet size={14} />
                  <span>SasPay Wallet</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">FCFA</span>
              </div>
            </div>

            {/* Tools Connected */}
            <div className="space-y-1 pt-2">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Outils Connectés
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-zinc-400 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>WhatsApp Cloud API</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-zinc-400 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>SasPay Mobile Money</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-zinc-400 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>Google Sheets</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-zinc-400 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span>Telegram Bot</span>
              </div>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 mt-4">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>Solde SasPay</span>
              <span className="text-emerald-400 font-medium">Auto</span>
            </div>
            <p className="text-sm font-semibold text-white mt-0.5 font-mono">
              2 450 000 FCFA
            </p>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="col-span-12 md:col-span-9 p-4 sm:p-5 flex flex-col justify-between bg-gradient-to-b from-white/[0.02] to-transparent">
          {/* Header & KPI Summary */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/8">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  Bonjour Stéphane <span className="inline-block animate-wave">👋</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Votre agent principal synchronise vos canaux en temps réel.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-[#fe5105]" />
                  Mode Opérationnel
                </span>
              </div>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/8">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  Ventes du mois
                </span>
                <span className="text-sm sm:text-base font-bold text-white font-mono mt-0.5 block">
                  1 840 000 F
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
                  <TrendingUp size={10} /> +24.8% vs M-1
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/8">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  Commandes IA
                </span>
                <span className="text-sm sm:text-base font-bold text-white font-mono mt-0.5 block">
                  86
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
                  <CheckCircle2 size={10} /> 100% traitées
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/8">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  Paiement SasPay
                </span>
                <span className="text-sm sm:text-base font-bold text-white font-mono mt-0.5 block">
                  12 sec
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  Moyenne Wave/OM
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/8">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  Taux Conversion
                </span>
                <span className="text-sm sm:text-base font-bold text-white font-mono mt-0.5 block">
                  68.4%
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
                  <TrendingUp size={10} /> +14.2%
                </span>
              </div>
            </div>

            {/* Conversation Execution Stream */}
            <div className="mt-4 space-y-3">
              {/* User Command */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 text-[11px] font-semibold text-zinc-200">
                  S
                </div>
                <div className="flex-1 bg-white/[0.04] border border-white/8 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs text-zinc-200">
                  <p className="font-medium">
                    « Combien ai-je vendu ce mois-ci ? Ajoute le résumé dans mon Google Sheet et envoie la synthèse à l&apos;équipe sur Telegram. »
                  </p>
                </div>
              </div>

              {/* Agent Orchestration & Tool Execution */}
              <div className="flex items-start gap-2.5 pl-2 sm:pl-3">
                <div className="w-7 h-7 rounded-full bg-[#fe5105] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(254,81,5,0.4)]">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="flex-1 space-y-2">
                  {/* Tool Call Sequence */}
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-mono">
                      <CheckCircle2 size={10} className="text-emerald-400" />
                      query_orders(period=&quot;current_month&quot;)
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-mono">
                      <CheckCircle2 size={10} className="text-emerald-400" />
                      calculate_revenue()
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-mono">
                      <CheckCircle2 size={10} className="text-emerald-400" />
                      gsheets.append_row(&quot;Rapports Octobre&quot;)
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono">
                      <CheckCircle2 size={10} className="text-emerald-400" />
                      telegram.send_digest(&quot;Groupe Direction&quot;)
                    </span>
                  </div>

                  {/* Agent Response Card */}
                  <div className="bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 rounded-2xl rounded-tl-sm p-3.5 text-xs text-zinc-200 space-y-2.5">
                    <p className="text-zinc-200 leading-relaxed">
                      C&apos;est fait Stéphane ! J&apos;ai analysé vos 86 commandes et synchronisé les flux :
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px]">
                      <div>
                        <span className="text-zinc-400 text-[10px]">Chiffre d&apos;affaires</span>
                        <p className="text-white font-bold font-mono">1 840 000 FCFA</p>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px]">Panier moyen</span>
                        <p className="text-white font-bold font-mono">21 395 FCFA</p>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px]">Top Produit</span>
                        <p className="text-emerald-400 font-semibold truncate">Pack Prestige (34)</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-1">
                      <FileSpreadsheet size={13} className="text-emerald-400 shrink-0" />
                      <span className="truncate">
                        Feuille &quot;Rapports Commerciaux 2026&quot; mise à jour • Notification Telegram transmise à 4 membres.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Interactive Prompt Input */}
          <div className="mt-4 pt-3 border-t border-white/8">
            <div className="flex items-center gap-2 p-1.5 pl-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-zinc-400 focus-within:border-[#fe5105]/50 transition-colors">
              <Search size={14} className="text-zinc-500" />
              <input
                type="text"
                readOnly
                value="Demander à l'agent : « Lance une relance panier pour les 14 contacts en attente »"
                className="w-full bg-transparent text-xs text-zinc-300 placeholder-zinc-500 outline-none cursor-default truncate"
              />
              <button
                type="button"
                className="w-7 h-7 rounded-lg bg-[#fe5105] text-white flex items-center justify-center shrink-0 hover:bg-[#e04500] transition-colors"
                aria-label="Envoyer"
              >
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
