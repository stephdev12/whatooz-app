'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { WhatoozLogo } from '@/components/ui/whatooz-logo'
import {
  Sparkles,
  Bot,
  Wrench,
  MessageSquare,
  Users,
  Box,
  ShoppingCart,
  Workflow,
  Zap,
  FileText,
  CreditCard,
  Settings,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Inbox,
  ShieldCheck,
} from 'lucide-react'
import { useOrganization } from '@/hooks/use-organization'
import { useUnreadCount } from '@/hooks/use-unread-count'
import { useAuth } from '@/hooks/use-auth'
import { isPlatformAdmin } from '@/lib/admin'

export interface NavChildItem {
  label: string
  href: string
  exact?: boolean
  badge?: string | number
  badgeVariant?: 'orange' | 'green' | 'default'
}

export interface NavTreeItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  exact?: boolean
  badge?: string | number
  badgeVariant?: 'orange' | 'green' | 'default'
  children?: NavChildItem[]
}

export const navTree: NavTreeItem[] = [
  {
    id: 'chat',
    label: 'Chat',
    href: '/dashboard',
    exact: true,
    icon: Sparkles,
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: Bot,
    children: [
      {
        label: 'Agents Spécialisés',
        href: '/dashboard/agents',
        exact: true,
      },
      {
        label: 'Outils & Permissions',
        href: '/dashboard/agents/tools',
      },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageSquare,
    children: [
      {
        label: 'Inbox',
        href: '/dashboard/inbox',
      },
      {
        label: 'Flows',
        href: '/dashboard/flows',
      },
      {
        label: 'Templates',
        href: '/dashboard/templates',
      },
      {
        label: 'Campagnes',
        href: '/dashboard/campaigns',
      },
      {
        label: 'Automations',
        href: '/dashboard/automations',
      },
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    icon: ShoppingCart,
    children: [
      {
        label: 'Commandes',
        href: '/dashboard/orders',
      },
      {
        label: 'Produits',
        href: '/dashboard/products',
      },
      {
        label: 'Catalogue',
        href: '/dashboard/catalog',
      },
    ],
  },
  {
    id: 'contacts',
    label: 'Contacts',
    href: '/dashboard/contacts',
    icon: Users,
  },
  {
    id: 'wallet',
    label: 'Portefeuille',
    href: '/dashboard/wallet',
    icon: CreditCard,
  },
  {
    id: 'organization',
    label: 'Organisation',
    icon: Settings,
    children: [
      {
        label: 'Équipe & Rôles',
        href: '/dashboard/team',
      },
      {
        label: 'Paramètres',
        href: '/dashboard/settings',
      },
    ],
  },
]

// Keep legacy export for any references (e.g. mobile drawer in header)
export const navItems = navTree.flatMap((item) => {
  if (item.children && item.children.length > 0) {
    return item.children.map((child) => ({
      label: child.label,
      href: child.href,
      icon: item.icon,
      exact: child.exact,
      section: item.label,
    }))
  }
  return [
    {
      label: item.label,
      href: item.href || '/dashboard',
      icon: item.icon,
      exact: item.exact,
      section: 'Général',
    },
  ]
})

export const navSections = [
  {
    title: 'MENU',
    items: navItems,
  },
]

export function getEffectiveNavTree(isAdmin: boolean): NavTreeItem[] {
  if (!isAdmin) return navTree
  return [
    ...navTree,
    {
      id: 'admin',
      label: 'Administration',
      href: '/dashboard/admin',
      exact: true,
      icon: ShieldCheck,
      badge: 'Admin',
      badgeVariant: 'orange',
    },
  ]
}

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const isAdmin = isPlatformAdmin(user?.email)
  const effectiveNavTree = React.useMemo(() => getEffectiveNavTree(isAdmin), [isAdmin])

  const { activeOrganization, organizations, setActiveOrganization } = useOrganization()
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const unreadCount = useUnreadCount()

  // Track expanded tree branches
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({
    agents: true,
    whatsapp: true,
    commerce: false,
    organization: false,
  })

  // Auto-expand tree branch if current pathname is inside it
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
    <aside
      className={cn(
        'hidden lg:flex flex-col shrink-0 select-none transition-all duration-300 relative bg-transparent',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground shadow-xs z-50 transition-transform"
        title={isCollapsed ? 'Développer la barre' : 'Réduire la barre'}
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Brand & Organization Switcher */}
      <div
        className={cn(
          'flex flex-col border-b border-black/[0.04] dark:border-white/[0.06] py-4 space-y-4',
          isCollapsed ? 'px-2 items-center' : 'px-4'
        )}
      >
        <Link href="/dashboard" className="flex items-center min-h-[32px]">
          <WhatoozLogo size="sm" showText={!isCollapsed} />
        </Link>

        {/* Minimalist Switcher */}
        <div className="relative w-full">
          <button
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className={cn(
              'flex w-full items-center justify-between rounded-xl border border-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
              isCollapsed ? 'p-2 justify-center' : 'p-2 text-left'
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fe5105]/10 text-[#fe5105]">
                <Building2 className="h-4 w-4" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-xs font-semibold leading-none text-foreground">
                    {activeOrganization?.name || 'Chargement...'}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1">Espace de travail</span>
                </div>
              )}
            </div>
            {!isCollapsed && <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          </button>

          {isSwitcherOpen && !isCollapsed && (
            <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-xl border border-border bg-popover p-1 shadow-lg backdrop-blur-md">
              {organizations.map((org) => (
                <button
                  key={org.organization_id}
                  onClick={() => {
                    setActiveOrganization(org.organization_id)
                    setIsSwitcherOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors hover:bg-muted',
                    org.organization_id === activeOrganization?.id
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground'
                  )}
                >
                  <span className="truncate">{org.organization.name}</span>
                  {org.organization_id === activeOrganization?.id && (
                    <Check className="h-3.5 w-3.5 text-[#fe5105]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Tree Navigation ─── */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {effectiveNavTree.map((item) => {
          const Icon = item.icon
          const isTreeBranch = Boolean(item.children && item.children.length > 0)
          const isExpanded = Boolean(expandedBranches[item.id])

          // Check if parent or any child is active
          const isDirectActive = item.href
            ? item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)
            : false

          const hasActiveChild = item.children
            ? item.children.some((c) => (c.exact ? pathname === c.href : pathname.startsWith(c.href)))
            : false

          // In collapsed mode: render icon-only button
          if (isCollapsed) {
            const destinationHref = item.href || (item.children ? item.children[0].href : '/dashboard')
            const isActive = isDirectActive || hasActiveChild

            return (
              <Link
                key={item.id}
                href={destinationHref}
                title={item.label}
                className={cn(
                  'flex items-center justify-center size-10 rounded-xl my-1 transition-all',
                  isActive
                    ? 'bg-white dark:bg-zinc-900 text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                <Icon className="size-4.5" />
              </Link>
            )
          }

          // Direct Item (no tree children, e.g. Chat, Contacts, Wallet, Administration)
          if (!isTreeBranch) {
            return (
              <Link
                key={item.id}
                href={item.href || '#'}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all',
                  isDirectActive
                    ? 'bg-white dark:bg-zinc-900 text-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-black/[0.04] dark:border-white/[0.06]'
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

          // Tree Branch with Children (e.g. Agents, WhatsApp, Commerce, Organisation)
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
                  {/* Vertical Tree Connector Guideline */}
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
                          className={cn(
                            'flex items-center justify-between px-3 py-1.5 rounded-xl text-[12.5px] transition-all',
                            isChildActive
                              ? 'bg-white dark:bg-zinc-900 text-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-black/[0.04] dark:border-white/[0.06]'
                              : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'
                          )}
                        >
                          <span className="truncate">{child.label}</span>

                          {/* Dynamic Badges */}
                          {showUnread && (
                            <span className="ml-auto inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 text-[10px] font-bold rounded-full bg-[#fe5105]/15 text-[#fe5105]">
                              {unreadCount}
                            </span>
                          )}
                          {child.badge && !showUnread && (
                            <span
                              className={cn(
                                'ml-auto inline-flex items-center justify-center min-w-4.5 h-4.5 px-1.5 text-[10px] font-bold rounded-full',
                                child.badgeVariant === 'orange'
                                  ? 'bg-[#fe5105]/15 text-[#fe5105]'
                                  : child.badgeVariant === 'green'
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-muted text-muted-foreground'
                              )}
                            >
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
    </aside>
  )
}
