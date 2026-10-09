'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { WhatoozLogo } from '@/components/ui/whatooz-logo'
import { LogOut, Moon, Sun, Settings, Menu, X, ChevronDown } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navTree, getEffectiveNavTree } from './sidebar'
import { isPlatformAdmin } from '@/lib/admin'
import { cn } from '@/lib/utils'
import { useOrganization } from '@/hooks/use-organization'
import { useUnreadCount } from '@/hooks/use-unread-count'

export function Header() {
  const { user, signOut } = useAuth()
  const { activeOrganization } = useOrganization()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const unreadCount = useUnreadCount()

  const isAdmin = isPlatformAdmin(user?.email)
  const effectiveNavTree = React.useMemo(() => getEffectiveNavTree(isAdmin), [isAdmin])

  // Track expanded tree branches in mobile drawer
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({
    agents: true,
    whatsapp: true,
    commerce: false,
    organization: false,
  })

  // Auto-expand active tree branch
  useEffect(() => {
    effectiveNavTree.forEach((branch) => {
      if (branch.children) {
        const hasActiveChild = branch.children.some((child) =>
          child.exact ? pathname === child.href : pathname.startsWith(child.href)
        )
        if (hasActiveChild) {
          setExpandedBranches((prev) => ({ ...prev, [branch.id]: true }))
        }
      }
    })
  }, [pathname, effectiveNavTree])

  const toggleBranch = (id: string) => {
    setExpandedBranches((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-6 z-30">
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

      {/* Mobile Tree Navigation Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-[285px] max-w-[85vw] bg-card h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <WhatoozLogo size="sm" showText={true} />
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Workspace Label */}
            <div className="px-4 py-3 border-b border-border bg-muted/20">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Espace de travail</p>
              <p className="text-xs font-semibold text-foreground truncate mt-0.5">{activeOrganization?.name || 'Mon Espace'}</p>
            </div>

            {/* Tree Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {effectiveNavTree.map((item) => {
                const Icon = item.icon
                const isTreeBranch = Boolean(item.children && item.children.length > 0)
                const isExpanded = Boolean(expandedBranches[item.id])

                const isDirectActive = item.href
                  ? item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href)
                  : false

                const hasActiveChild = item.children
                  ? item.children.some((c) => (c.exact ? pathname === c.href : pathname.startsWith(c.href)))
                  : false

                // Direct Item (Chat, Contacts, Wallet, Administration)
                if (!isTreeBranch) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href || '#'}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all',
                        isDirectActive
                          ? 'bg-white dark:bg-zinc-900 text-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-black/[0.04] dark:border-white/[0.06]'
                          : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
                      )}
                    >
                      <Icon className={cn('size-4 shrink-0', isDirectActive ? 'text-foreground' : 'text-muted-foreground')} />
                      <span className="truncate">{item.label}</span>
                      {item.id === 'whatsapp' && unreadCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold rounded-full bg-[#fe5105]/15 text-[#fe5105]">
                          {unreadCount}
                        </span>
                      )}
                      {item.badge && (
                        <span
                          className={cn(
                            'ml-auto inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full',
                            item.badgeVariant === 'orange'
                              ? 'bg-[#fe5105]/15 text-[#fe5105]'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                }

                // Tree Branch with Children (Agents, WhatsApp, Commerce, Organisation)
                return (
                  <div key={item.id} className="space-y-0.5 pt-0.5">
                    {/* Branch Header Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleBranch(item.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-colors',
                        hasActiveChild
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
                      )}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <Icon className={cn('size-4 shrink-0', hasActiveChild ? 'text-foreground' : 'text-muted-foreground')} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          'size-3.5 text-muted-foreground shrink-0 transition-transform duration-200',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </button>

                    {/* Branch Children with connecting Tree Lines */}
                    {isExpanded && item.children && (
                      <div className="relative ml-5 pl-4 py-0.5 space-y-0.5">
                        {/* Vertical Tree Connector Line */}
                        <div
                          className="absolute left-0 top-0 bottom-3 w-px bg-zinc-200 dark:bg-zinc-800 pointer-events-none"
                          aria-hidden="true"
                        />

                        {item.children.map((child) => {
                          const isChildActive = child.exact
                            ? pathname === child.href
                            : pathname.startsWith(child.href)

                          const isInboxChild = child.href === '/dashboard/inbox'
                          const showUnread = isInboxChild && unreadCount > 0

                          return (
                            <div key={child.href} className="relative">
                              {/* Curved Branch Hook connecting line */}
                              <svg
                                className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-200 dark:text-zinc-800 pointer-events-none"
                                viewBox="0 0 16 16"
                                fill="none"
                                aria-hidden="true"
                              >
                                <path
                                  d="M 0 0 V 8 C 0 12 4 16 8 16 H 16"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                />
                              </svg>

                              {/* Child Link Button */}
                              <Link
                                href={child.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                  'flex items-center justify-between px-3 py-1.5 rounded-xl text-[12.5px] transition-all',
                                  isChildActive
                                    ? 'bg-white dark:bg-zinc-900 text-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-black/[0.04] dark:border-white/[0.06]'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
                                )}
                              >
                                <span className="truncate">{child.label}</span>

                                {/* Unread count or custom badge */}
                                {showUnread && (
                                  <span className="ml-auto inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 text-[10px] font-bold rounded-full bg-[#fe5105]/15 text-[#fe5105]">
                                    {unreadCount}
                                  </span>
                                )}
                                {child.badge && !showUnread && (
                                  <span className="ml-auto inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 text-[10px] font-bold rounded-full bg-[#fe5105]/15 text-[#fe5105]">
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
