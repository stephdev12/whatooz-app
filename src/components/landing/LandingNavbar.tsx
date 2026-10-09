'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Menu, X } from 'lucide-react'
import { WhatoozLogo } from '@/components/ui/whatooz-logo'

interface LandingNavbarProps {
  isAuthenticated: boolean
  onOpenApp: () => void
}

export function LandingNavbar({ isAuthenticated, onOpenApp }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 sm:px-6 pt-4 sm:pt-6 pointer-events-none transition-all duration-300">
      <nav
        className={`pointer-events-auto w-full max-w-5xl rounded-full px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? 'bg-[#090b10]/85 border border-white/12 shadow-[0_15px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl'
            : 'bg-white/[0.04] border border-white/8 backdrop-blur-md'
        }`}
      >
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2 select-none group">
          <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/15 bg-black/60 p-0.5">
            <img
              src="/images/whatooz_emblem.jpg"
              alt="Whatooz Logo"
              className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform"
            />
          </div>
          <span className="font-semibold text-sm sm:text-base tracking-tight text-white">
            Whatooz
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-300">
          <a href="#features" className="hover:text-white transition-colors">
            Fonctionnalités
          </a>
          <a href="#tools" className="hover:text-white transition-colors">
            Outils & Connexions
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Tarifs
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            FAQ
          </a>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenApp}
            className="text-xs font-medium text-zinc-300 hover:text-white hidden sm:block px-2 py-1 transition-colors"
          >
            {isAuthenticated ? 'Mon Espace' : 'Se connecter'}
          </button>

          <button
            onClick={onOpenApp}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-zinc-950 font-semibold text-xs hover:bg-zinc-100 transition-all duration-200 shadow-sm active:scale-[0.98]"
          >
            <span>{isAuthenticated ? 'Tableau de bord' : 'Essai 30 jours'}</span>
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-zinc-300 hover:text-white p-1 rounded-md"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto md:hidden fixed inset-x-4 top-20 rounded-2xl bg-[#090b10] border border-white/15 p-5 shadow-2xl backdrop-blur-2xl text-white space-y-4">
          <div className="flex flex-col space-y-3 text-sm font-medium text-zinc-300">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Fonctionnalités
            </a>
            <a
              href="#tools"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Outils & Connexions
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Tarifs
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              FAQ
            </a>
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                onOpenApp()
              }}
              className="w-full py-2.5 rounded-full bg-white text-zinc-950 font-semibold text-xs text-center"
            >
              {isAuthenticated ? 'Tableau de bord' : 'Commencer l\'essai de 30 jours'}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
