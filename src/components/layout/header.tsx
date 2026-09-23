'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { WhatoozLogo } from '@/components/ui/whatooz-logo'
import { LogOut, Moon, Sun, Settings, Menu, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navItems } from './sidebar'
import { cn } from '@/lib/utils'
import { useOrganization } from '@/hooks/use-organization'

export function Header() {
  const { user, signOut } = useAuth()
  const { activeOrganization } = useOrganization()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Group nav items by section for the mobile menu
  const itemsBySection = navItems.reduce((acc, item) => {
    const section = item.section || 'Général'
    if (!acc[section]) acc[section] = []
    acc[section].push(item)
    return acc
  }, {} as Record<string, typeof navItems>)

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 sm:px-6 z-30">
        {/* Mobile Brand */}
        <div className="flex items-center gap-3 lg:hidden">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-black/[0.06] dark:border-white/[0.08] bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link href="/dashboard" className="flex items-center">
            <WhatoozLogo size="sm" showText={false} />
          </Link>
        </div>

        {/* Desktop — empty left side */}
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
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-[280px] max-w-[80vw] bg-card h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <WhatoozLogo size="sm" showText={true} />
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Espace de travail</p>
              <p className="text-sm font-semibold text-foreground truncate">{activeOrganization?.name || 'Chargement...'}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {Object.entries(itemsBySection).map(([section, items]) => (
                <div key={section}>
                  {section !== 'Général' && (
                    <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {section}
                    </h4>
                  )}
                  <div className="space-y-1">
                    {items.map((item) => {
                      const isActive = item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                            isActive 
                              ? 'bg-primary/10 text-primary' 
                              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                          )}
                        >
                          <item.icon className={cn("w-5 h-5", isActive ? 'text-primary' : 'text-muted-foreground')} />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
