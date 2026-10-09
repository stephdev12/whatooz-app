'use client'

import React from 'react'
import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="relative bg-[#07080d] border-t border-white/8 text-zinc-400 text-xs py-16 sm:py-20 select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 pb-14 border-b border-white/8">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/15 bg-black/60 p-0.5">
                <img
                  src="/images/whatooz_emblem.jpg"
                  alt="Whatooz"
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              <span className="font-semibold text-base tracking-tight text-white">
                Whatooz
              </span>
            </div>

            <p className="text-zinc-400 text-xs leading-relaxed max-w-sm">
              L&apos;agent opérationnel de votre entreprise. Unifiez WhatsApp, vos catalogues de produits, vos paiements SasPay et vos agents intelligents au sein d&apos;un écosystème autonome.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/8 text-[11px] text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tous les systèmes opérationnels • 99.98% Uptime</span>
            </div>
          </div>

          {/* Column 1: Produit */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="font-semibold text-xs text-white uppercase tracking-wider">
              Produit
            </h5>
            <ul className="space-y-2 text-zinc-400 text-xs">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  AI Space (QG)
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Agents Dédiés
                </a>
              </li>
              <li>
                <a href="#tools" className="hover:text-white transition-colors">
                  WhatsApp Flows
                </a>
              </li>
              <li>
                <a href="#tools" className="hover:text-white transition-colors">
                  SasPay Wallet
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Tarification
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Intégrations */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="font-semibold text-xs text-white uppercase tracking-wider">
              Écosystème
            </h5>
            <ul className="space-y-2 text-zinc-400 text-xs">
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  Meta Cloud API
                </span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  SasPay (Wave, Orange Money)
                </span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  Google Workspace
                </span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  Telegram & Slack
                </span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  Webhooks & REST API
                </span>
              </li>
            </ul>
          </div>

          {/* Column 3: Légal & Contact */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="font-semibold text-xs text-white uppercase tracking-wider">
              Légal
            </h5>
            <ul className="space-y-2 text-zinc-400 text-xs">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  Sécurité des données
                </span>
              </li>
              <li>
                <span className="hover:text-white cursor-pointer transition-colors">
                  Contactez-nous
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>© {new Date().getFullYear()} Whatooz par Onlice. Tous droits réservés.</p>
          <p className="text-zinc-600">
            Whatooz s&apos;appuie sur l&apos;API officielle WhatsApp Cloud de Meta. WhatsApp® est une marque déposée de Meta Platforms, Inc.
          </p>
        </div>
      </div>
    </footer>
  )
}
