'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Check,
  ArrowRight,
  ShoppingBag,
  Layers,
  Clock,
  Phone,
  TrendingUp,
  MessageSquare,
  ChevronDown,
  Sun,
  Moon,
  Star,
  Zap,
  Shield,
} from 'lucide-react'
import { GradientBackground } from './ui/noisy-gradient-backgrounds'
import TestimonialsSection from './ui/testimonial-v2'
import CardFlip from './ui/card-flip'
import '@/styles/landing.css'

export default function LandingPage({
  isAuthenticated = false,
}: {
  isAuthenticated?: boolean
}) {
  const router = useRouter()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly')
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleOpenApp = () => {
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  const isDark = theme === 'dark'

  return (
    <div className={`whatooz-landing-root ${isDark ? 'theme-dark' : 'theme-light'}`}>
      {/* 1. Dynamic Background with Noise & Brand Colors */}
      <GradientBackground
        enableNoise={true}
        noisePatternAlpha={28}
        noiseIntensity={0.45}
        noisePatternRefreshInterval={2}
        colors={
          isDark
            ? [
                { color: 'rgba(254, 81, 5, 0.16)', stop: '0%' },
                { color: 'rgba(245, 120, 20, 0.08)', stop: '25%' },
                { color: 'rgba(15, 15, 19, 0.92)', stop: '70%' },
                { color: 'rgba(13, 13, 17, 1)', stop: '100%' },
              ]
            : [
                { color: 'rgba(254, 81, 5, 0.10)', stop: '0%' },
                { color: 'rgba(255, 160, 80, 0.05)', stop: '25%' },
                { color: 'rgba(248, 248, 250, 0.95)', stop: '70%' },
                { color: 'rgba(255, 255, 255, 1)', stop: '100%' },
              ]
        }
      />

      {/* 2. Floating Minimalist Pill Navbar */}
      <header className={`landing-floating-navbar-wrapper ${scrolled ? 'is-scrolled' : ''}`}>
        <nav className="landing-floating-navbar clean-pill-nav">
          <a
            href="#"
            className="landing-nav-logo"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <img
              src={isDark ? '/logo_noir.png' : '/logo_white.png'}
              alt="Whatooz"
              className="landing-logo-img"
            />
          </a>

          <div className="landing-nav-menu">
            <a href="#features" className="landing-nav-link">
              Fonctionnalités
            </a>
            <a href="#tools" className="landing-nav-link">
              Outils
            </a>
            <a href="#pricing" className="landing-nav-link">
              Tarifs
            </a>
            <a href="#testimonials" className="landing-nav-link">
              Témoignages
            </a>
            <a href="#faq" className="landing-nav-link">
              FAQ
            </a>
          </div>

          <div className="landing-nav-actions">
            <button
              className="landing-theme-toggle-btn"
              onClick={handleToggleTheme}
              title="Changer de thème"
              aria-label="Basculer le thème"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button className="landing-btn-pill-primary" onClick={handleOpenApp}>
              <span>{isAuthenticated ? 'Tableau de bord' : 'Se connecter'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </nav>
      </header>

      {/* 3. Main Content */}
      <main className="landing-main-content" style={{ position: 'relative', zIndex: 10 }}>
        {/* HERO SECTION */}
        <section className="landing-hero-section">
          <div className="landing-container landing-hero-container">
            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="landing-hero-headline"
              style={{ marginTop: '20px' }}
            >
              Votre WhatsApp vend <br />
              <span className="landing-highlight-pill">à votre place</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="landing-hero-subtitle"
            >
              Automatisez vos échanges clients, diffusez vos catalogues interactifs et encaissez vos commandes en pilote automatique. Actif 24h/24, 7j/7 avec l&apos;API officielle WhatsApp de Meta.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.65, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="landing-hero-actions-row"
            >
              <button className="landing-btn-hero-cta" onClick={handleOpenApp}>
                <span>Démarrer Gratuitement</span>
                <ArrowRight size={16} />
              </button>

              <a href="#features" className="landing-btn-hero-secondary">
                <span>Découvrir les Fonctions</span>
              </a>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.65, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="landing-hero-trust-row"
            >
              <div className="landing-avatar-cluster">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Utilisateur Whatooz"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Utilisateur Whatooz"
                />
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
                  alt="Utilisateur Whatooz"
                />
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                  alt="Utilisateur Whatooz"
                />
                <div className="landing-avatar-counter">+4k</div>
              </div>
              <div className="landing-trust-text">
                <div className="landing-stars-row">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />
                  ))}
                  <span className="font-semibold" style={{ marginLeft: '4px' }}>
                    4.9 / 5
                  </span>
                </div>
                <span>Adopté par plus de 4 000 commerçants et marques</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3 FLIP CARDS SECTION */}
        <section id="features" className="landing-flip-cards-section" style={{ padding: '40px 0 70px' }}>
          <div className="landing-container">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="landing-section-header text-center"
              style={{ marginBottom: '46px' }}
            >
              <h2 className="landing-section-title">Tout pour vendre en automatique sur WhatsApp</h2>
              <p className="landing-section-desc">
                Trois piliers conçus pour les commerçants, agences et créateurs de marques modernes.
              </p>
            </motion.div>

            <div className="landing-flip-cards-grid">
              <motion.div
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.7, delay: 0, ease: [0.16, 1, 0.3, 1] }}
              >
                <CardFlip
                  theme={theme}
                  title="WhatsApp Flows v7.3"
                  subtitle="Boutique & Mini-Apps Natives"
                  description="Offrez une véritable application d'achat dans WhatsApp : filtres de produits, fiches photos et commande en 3 écrans sans quitter l'app."
                  features={[
                    'Flows multi-écrans natifs Meta',
                    'Sélection dynamique de modèles',
                    'Formulaire de livraison intégré',
                    'Zéro risque de blocage ou ban',
                  ]}
                  buttonText="Découvrir les Flows"
                  onAction={handleOpenApp}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                <CardFlip
                  theme={theme}
                  title="Réponses 24h/24"
                  subtitle="Moteur Conversationnel & Scénarios"
                  description="Comprend les demandes de vos clients et répond en quelques millisecondes avec des templates certifiés Meta et boutons interactifs."
                  features={[
                    'Scénarios par mots-clés automatiques',
                    'Réponses instantanées certifiées',
                    'Disponible 24h/24 et 7j/7',
                    'Prise de relais manuelle dans Inbox',
                  ]}
                  buttonText="Activer l'assistant"
                  onAction={handleOpenApp}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              >
                <CardFlip
                  theme={theme}
                  title="Encaissement Direct"
                  subtitle="Wave, Orange Money, MoMo & Carte"
                  description="Générez automatiquement un lien de règlement sécurisé dès qu'un client passe commande dans votre boutique WhatsApp."
                  features={[
                    'Liens de paiement sécurisés',
                    'Confirmation automatique instantanée',
                    'Routage vers vos livreurs',
                    'Historique financier en direct',
                  ]}
                  buttonText="Tester les paiements"
                  onAction={handleOpenApp}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* 9 TOOLS GRID */}
        <section id="tools" className="landing-tools-grid-section">
          <div className="landing-container">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="landing-section-header text-center"
            >
              <h2 className="landing-section-title">Une suite complète sans compromis</h2>
              <p className="landing-section-desc">
                Tous les leviers indispensables pour piloter votre activité commerciale WhatsApp.
              </p>
            </motion.div>

            <div className="landing-tools-grid">
              {[
                {
                  icon: ShoppingBag,
                  color: 'emerald',
                  title: 'WhatsApp Flows E-commerce',
                  desc: 'Mini-applications natives Meta intégrées directement dans vos conversations WhatsApp.',
                },
                {
                  icon: MessageSquare,
                  color: 'purple',
                  title: 'Messagerie & Inbox Live',
                  desc: 'Un fil de discussion unifié pour répondre à vos clients en temps réel avec vos collaborateurs.',
                },
                {
                  icon: Clock,
                  color: 'blue',
                  title: 'Relances Automatiques',
                  desc: 'Relancez avec tact les prospects qui ont commencé un formulaire ou un achat sans finaliser.',
                },
                {
                  icon: Zap,
                  color: 'amber',
                  title: "Boutons d'Action Rapide",
                  desc: 'Proposez des boutons cliquables certifiés Meta pour éliminer toute friction de saisie.',
                },
                {
                  icon: Layers,
                  color: 'emerald',
                  title: 'API Officielle Meta Cloud',
                  desc: 'Stabilité garantie à 99.9%, zéro déconnexion inopinée et zéro risque de blocage.',
                },
                {
                  icon: TrendingUp,
                  color: 'purple',
                  title: 'Analytique & Ventes',
                  desc: 'Visualisez en direct vos messages, commandes générées et chiffres d’affaires en FCFA.',
                },
                {
                  icon: Shield,
                  color: 'blue',
                  title: 'Chiffrement AES-256',
                  desc: 'Sécurisation maximale de vos clés d’API et de vos données clients conformément au RGPD.',
                },
                {
                  icon: Phone,
                  color: 'amber',
                  title: 'Embedded Signup Meta',
                  desc: 'Connectez votre numéro WhatsApp Business en 2 clics avec la validation officielle Facebook.',
                },
                {
                  icon: Check,
                  color: 'emerald',
                  title: 'Mises à Jour en Direct',
                  desc: 'Vos modifications de flows et de messages s’appliquent immédiatement sans interruption.',
                },
              ].map((tool, idx) => {
                const IconComponent = tool.icon
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ duration: 0.55, delay: (idx % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="landing-tool-item clean-card"
                  >
                    <div className={`tool-icon-box bg-${tool.color}-light`}>
                      <IconComponent size={20} className={`text-${tool.color}`} />
                    </div>
                    <h4>{tool.title}</h4>
                    <p>{tool.desc}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="landing-pricing-section">
          <div className="landing-container">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="landing-section-header text-center"
            >
              <h2 className="landing-section-title">Des forfaits conçus pour accélérer votre croissance</h2>
              <p className="landing-section-desc">
                Choisissez le forfait qui s&apos;adapte à votre volume. Évoluez à tout moment sans engagement.
              </p>

              {/* Billing Toggle Switch */}
              <div className="landing-billing-toggle-wrapper">
                <div className="landing-billing-toggle-pill clean-panel">
                  <button
                    type="button"
                    className={`toggle-option ${billingPeriod === 'monthly' ? 'is-selected' : ''}`}
                    onClick={() => setBillingPeriod('monthly')}
                  >
                    Mensuel
                  </button>
                  <button
                    type="button"
                    className={`toggle-option ${billingPeriod === 'annually' ? 'is-selected' : ''}`}
                    onClick={() => setBillingPeriod('annually')}
                  >
                    <span>Annuel (-15%)</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Pricing Cards Grid */}
            <div className="landing-pricing-cards-grid">
              {/* Starter Plan */}
              <motion.div
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.7, delay: 0, ease: [0.16, 1, 0.3, 1] }}
                className="landing-price-card clean-card"
              >
                <div className="price-card-header">
                  <h3 className="price-plan-name">Starter</h3>
                  <div className="price-amount-row">
                    <span className="price-number">
                      {billingPeriod === 'monthly' ? '5 000' : '4 250'}
                    </span>
                    <span className="price-currency">FCFA</span>
                    <span className="price-period">/mois</span>
                  </div>
                  <p className="price-plan-desc">Pour démarrer avec un premier numéro WhatsApp automatisé.</p>
                </div>

                <button className="landing-btn-price-action" onClick={handleOpenApp}>
                  <span>Commencer</span>
                  <ArrowRight size={14} />
                </button>

                <div className="price-features-divider" />

                <ul className="price-features-list">
                  <li>
                    <Check size={14} className="text-emerald" /> <strong>1</strong> Numéro WhatsApp officiel connecté
                  </li>
                  <li>
                    <Check size={14} className="text-emerald" /> <strong>1 000</strong> Conversations / mois
                  </li>
                  <li>
                    <Check size={14} className="text-emerald" /> Inbox live temps réel
                  </li>
                  <li>
                    <Check size={14} className="text-emerald" /> <strong>1</strong> WhatsApp Flow interactif
                  </li>
                  <li className="feature-disabled">
                    <Check size={14} /> Relances avancées illimitées
                  </li>
                </ul>
              </motion.div>

              {/* Pro Plan (Featured) */}
              <motion.div
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="landing-price-card clean-card featured-pro-card"
              >
                <div className="price-card-header">
                  <h3 className="price-plan-name" style={{ color: '#fe5105' }}>
                    Pro Business
                  </h3>
                  <div className="price-amount-row">
                    <span className="price-number" style={{ color: '#fe5105' }}>
                      {billingPeriod === 'monthly' ? '15 000' : '12 750'}
                    </span>
                    <span className="price-currency">FCFA</span>
                    <span className="price-period">/mois</span>
                  </div>
                  <p className="price-plan-desc">La solution complète pour les marchands et marques en croissance.</p>
                </div>

                <button
                  className="landing-btn-price-action featured-btn"
                  style={{
                    background: '#fe5105',
                    boxShadow: '0 6px 20px -2px rgba(254, 81, 5, 0.4)',
                  }}
                  onClick={handleOpenApp}
                >
                  <span>Choisir ce forfait</span>
                  <ArrowRight size={14} />
                </button>

                <div className="price-features-divider" />

                <ul className="price-features-list">
                  <li>
                    <Check size={14} className="text-emerald" /> <strong>WhatsApp Flows v7.3</strong> illimités
                  </li>
                  <li>
                    <Check size={14} className="text-emerald" /> <strong>Boutique e-commerce</strong> 3 écrans
                  </li>
                  <li>
                    <Check size={14} className="text-emerald" /> Encaissement Wave / Orange / MoMo
                  </li>
                  <li>
                    <Check size={14} className="text-emerald" /> Templates certifiés Meta illimités
                  </li>
                  <li>
                    <Check size={14} className="text-emerald" /> Relances automatiques de panier
                  </li>
                  <li>
                    <Check size={14} className="text-emerald" /> Support prioritaire WhatsApp
                  </li>
                </ul>
              </motion.div>

              {/* Enterprise Plan */}
              <motion.div
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="landing-price-card clean-card"
              >
                <div className="price-card-header">
                  <h3 className="price-plan-name">Premium Illimité</h3>
                  <div className="price-amount-row">
                    <span className="price-number">
                      {billingPeriod === 'monthly' ? '35 000' : '29 750'}
                    </span>
                    <span className="price-currency">FCFA</span>
                    <span className="price-period">/mois</span>
                  </div>
                  <p className="price-plan-desc">Pour les entreprises et agences gérant de gros volumes de vente.</p>
                </div>

                <button className="landing-btn-price-action" onClick={handleOpenApp}>
                  <span>Passer à l&apos;Échelle</span>
                  <ArrowRight size={14} />
                </button>

                <div className="price-features-divider" />

                <ul className="price-features-list">
                  <li>
                    <Check size={14} className="text-emerald" /> <strong>Multi-numéros</strong> & Multi-utilisateurs
                  </li>
                  <li>
                    <Check size={14} className="text-emerald" /> <strong>Tout Illimité</strong> (Flows, Automations, Templates)
                  </li>
                  <li>
                    <Check size={14} className="text-emerald" /> Tunnel de commande & Livraisons personnalisées
                  </li>
                  <li>
                    <Check size={14} className="text-emerald" /> Webhooks & Intégrations API personnalisées
                  </li>
                  <li>
                    <Check size={14} className="text-emerald" /> Gestionnaire de compte dédié 7j/7
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* Bottom Consultation Card */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="landing-consultation-banner clean-panel"
            >
              <div className="consultation-avatar-box">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Consultant Whatooz"
                />
                <span className="consultation-online-beacon" />
              </div>
              <div className="consultation-text-box">
                <h4>Vous hésitez sur le plan idéal pour votre activité ?</h4>
                <p>
                  Échangez gratuitement avec un expert pour configurer la stratégie WhatsApp la plus rentable pour votre boutique.
                </p>
              </div>
              <button className="landing-btn-consultation" onClick={handleOpenApp}>
                <span>Réserver une Démo</span>
                <ArrowRight size={14} />
              </button>
            </motion.div>
          </div>
        </section>

        {/* 5. USER TESTIMONIALS */}
        <TestimonialsSection />

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="landing-faq-section">
          <div className="landing-container landing-faq-container">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="landing-section-header text-center"
            >
              <h2 className="landing-section-title">Tout ce que vous devez savoir</h2>
            </motion.div>

            <div className="landing-faq-accordion">
              {[
                {
                  q: "Qu'est-ce que l'API officielle WhatsApp Cloud de Meta ?",
                  a: "C'est la solution officielle conçue par Meta pour les entreprises. Contrairement aux solutions non-officielles qui risquent le bannissement de numéro et subissent des déconnexions, l'API officielle garantit 99.9% de disponibilité, la conformité légale et permet d'utiliser les WhatsApp Flows interactifs.",
                },
                {
                  q: 'Comment fonctionnent les WhatsApp Flows v7.3 pour le e-commerce ?',
                  a: 'Un WhatsApp Flow est une véritable mini-application interactive qui s’ouvre instantanément dans WhatsApp. Le client choisit ses critères (ex: catégorie, budget), visualise les modèles avec photos, prix et fiches techniques, puis remplit ses coordonnées de livraison. Un lien de paiement automatique lui est ensuite envoyé.',
                },
                {
                  q: 'Quels moyens de paiement sont pris en charge ?',
                  a: 'Whatooz est spécialement pensé pour le marché africain et international : Wave, Orange Money, MTN MoMo, Moov Money et cartes bancaires (Visa, Mastercard) avec validation automatique des commandes.',
                },
                {
                  q: 'Puis-je modifier mes produits, flux et messages à tout moment ?',
                  a: 'Oui ! Depuis votre éditeur visuel multi-pages Whatooz, chaque modification de texte, d’image ou de produit est instantanément synchronisée sur votre WhatsApp.',
                },
                {
                  q: 'Mes données clients sont-elles protégées ?',
                  a: 'Absolument. Vos identifiants et tokens Meta sont chiffrés avec la norme militaire AES-256-GCM. Vos bases de données clients restent strictement votre propriété conformément au RGPD.',
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className={`landing-faq-item clean-card ${activeFaq === idx ? 'is-open' : ''}`}
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                >
                  <div className="faq-item-question">
                    <span>{item.q}</span>
                    <ChevronDown size={18} className={`faq-chevron ${activeFaq === idx ? 'rotated' : ''}`} />
                  </div>
                  {activeFaq === idx && (
                    <div className="faq-item-answer">
                      <p>{item.a}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="landing-footer" style={{ position: 'relative', zIndex: 10 }}>
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div className="footer-brand-col">
              <img
                src={isDark ? '/logo_noir.png' : '/logo_white.png'}
                alt="Whatooz"
                className="footer-logo-img"
              />
              <p className="footer-brand-desc">
                L&apos;infrastructure d&apos;automatisation et de vente WhatsApp par excellence pour les commerçants et marques modernes.
              </p>
            </div>

            <div className="footer-links-col">
              <h5>Produit</h5>
              <ul>
                <li>
                  <a href="#features">WhatsApp Flows v7.3</a>
                </li>
                <li>
                  <a href="#features">Boutique E-commerce</a>
                </li>
                <li>
                  <a href="#tools">Boîte à outils</a>
                </li>
                <li>
                  <a href="#pricing">Tarifs & Forfaits</a>
                </li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h5>Ressources</h5>
              <ul>
                <li>
                  <a href="#faq">Centre d&apos;aide & FAQ</a>
                </li>
                <li>
                  <a href="#testimonials">Témoignages commerçants</a>
                </li>
                <li>
                  <button className="footer-link-btn" onClick={handleOpenApp}>
                    Accès Dashboard
                  </button>
                </li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h5>Légal</h5>
              <ul>
                <li>
                  <Link href="/privacy">Politique de Confidentialité</Link>
                </li>
                <li>
                  <Link href="/privacy#terms">Conditions d&apos;Utilisation</Link>
                </li>
                <li>
                  <Link href="/privacy#security">Sécurité & Données RGPD</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="landing-footer-bottom">
            <div>© 2026 Whatooz. Tous droits réservés. Construit par onlice.</div>
            <div className="flex items-center gap-4">
              <span>Made with ❤️ for modern WhatsApp commerce</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
