'use client'

import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { WhatoozLogo } from '@/components/ui/whatooz-logo'
import { LogOut, Bell, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-card/60 backdrop-blur-md px-4 sm:px-6 z-30">
      {/* Mobile Brand (Replaces redundant hamburger menu) */}
      <div className="flex items-center gap-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center">
          <WhatoozLogo size="sm" showText={true} />
        </Link>
      </div>

      {/* Desktop Left status indicator */}
      <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-foreground font-semibold">Meta WhatsApp Cloud v7.3</span>
        <span className="text-muted-foreground">• API Officielle connectée</span>
      </div>

      {/* Right side: Account & actions */}
      <div className="flex items-center gap-3">
        {/* Connection status badge on mobile */}
        <div className="flex sm:hidden items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Actif</span>
        </div>

        {/* User email badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-secondary/80 border border-black/[0.04] dark:border-white/[0.06] px-3 py-1 text-xs text-foreground">
          <div className="h-5 w-5 rounded-full bg-[#fe5105]/20 text-[#fe5105] flex items-center justify-center font-bold text-[10px]">
            {user?.email?.charAt(0).toUpperCase() || 'W'}
          </div>
          <span className="truncate max-w-[160px] font-medium">{user?.email}</span>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          title="Se déconnecter"
          className="flex h-9 w-9 sm:h-auto sm:w-auto items-center justify-center gap-2 rounded-xl sm:px-3 sm:py-1.5 text-xs text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline font-medium">Déconnexion</span>
        </button>
      </div>
    </header>
  )
}
