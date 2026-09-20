'use client'

import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { WhatoozLogo } from '@/components/ui/whatooz-logo'
import { LogOut, Moon, Sun, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'

export function Header() {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <header className="flex h-14 items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] bg-card/60 backdrop-blur-md px-4 sm:px-6 z-30">
      {/* Mobile Brand */}
      <div className="flex items-center gap-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center">
          <WhatoozLogo size="sm" showText={false} />
        </Link>
      </div>

      {/* Desktop — empty left side (no technical jargon) */}
      <div className="hidden lg:block" />

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Settings button */}
        <Link
          href="/dashboard/settings"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          title="Paramètres"
        >
          <Settings className="h-4 w-4" />
        </Link>

        {/* Theme switcher */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.06] dark:border-white/[0.08] bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          title="Changer le thème"
        >
          <Sun className="h-3.5 w-3.5 hidden dark:block" />
          <Moon className="h-3.5 w-3.5 block dark:hidden" />
        </button>

        {/* User badge */}
        <div className="hidden sm:flex items-center gap-2 rounded-full bg-secondary/80 border border-black/[0.04] dark:border-white/[0.06] px-3 py-1 text-xs text-foreground">
          <div className="h-5 w-5 rounded-full bg-[#fe5105]/20 text-[#fe5105] flex items-center justify-center font-bold text-[10px]">
            {user?.email?.charAt(0).toUpperCase() || 'W'}
          </div>
          <span className="truncate max-w-[140px] font-medium">{user?.email}</span>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          title="Se déconnecter"
          className="flex h-8 w-8 sm:h-auto sm:w-auto items-center justify-center gap-1.5 rounded-full sm:px-3 sm:py-1.5 text-xs text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline font-medium">Quitter</span>
        </button>
      </div>
    </header>
  )
}
