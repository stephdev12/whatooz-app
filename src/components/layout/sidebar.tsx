'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { WhatoozLogo } from '@/components/ui/whatooz-logo'
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Layers,
  Zap,
  Settings,
  Users,
  ShoppingCart,
  Box,
  CreditCard,
  BarChart,
  Building2,
  Check,
  ChevronDown,
  LogOut,
  Workflow,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useOrganization } from '@/hooks/use-organization'

export const navItems = [
  { label: 'Accueil', href: '/dashboard', exact: true, icon: LayoutDashboard },
  { label: 'Inbox', href: '/dashboard/inbox', icon: MessageSquare },
  {
    label: 'Automatisations',
    href: '/dashboard/automations',
    icon: Workflow,
  },
  {
    label: 'Flux WhatsApp',
    href: '/dashboard/flows',
    icon: Layers,
  },
  { label: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { label: 'Produits', href: '/dashboard/products', icon: Box, section: 'E-commerce' },
  { label: 'Catalogue', href: '/dashboard/catalog', icon: Layers, section: 'E-commerce' },
  { label: 'Commandes', href: '/dashboard/orders', icon: ShoppingCart, section: 'E-commerce' },
  { label: 'Portefeuille', href: '/dashboard/wallet', icon: CreditCard, section: 'E-commerce' },
  { label: 'Équipe', href: '/dashboard/team', icon: Users },
  { label: 'Templates', href: '/dashboard/templates', icon: FileText },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart },
  { label: 'Paramètres', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { activeOrganization, organizations, setActiveOrganization } = useOrganization()
  const [isSwitcherOpen, setIsSwitcherOpen] = React.useState(false)
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  return (
    <aside 
      className={cn(
        "hidden lg:flex flex-col shrink-0 select-none transition-all duration-300 relative bg-transparent",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground shadow-sm z-50 transition-transform"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Brand & Organization Switcher */}
      <div className={cn("flex flex-col border-b border-black/[0.04] dark:border-white/[0.06] py-4 space-y-4", isCollapsed ? "px-2 items-center" : "px-4")}>
        <Link href="/dashboard" className="flex items-center justify-center min-h-[32px]">
          <WhatoozLogo size="sm" showText={false} />
        </Link>

        {/* Minimalist Switcher */}
        <div className="relative w-full">
          <button 
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border border-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
              isCollapsed ? "p-2 justify-center" : "p-2 text-left"
            )}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium leading-none text-foreground">
                    {activeOrganization?.name || 'Chargement...'}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-1">Espace de travail</span>
                </div>
              )}
            </div>
            {!isCollapsed && <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
          </button>
          
          {isSwitcherOpen && !isCollapsed && (
            <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border border-black/[0.06] dark:border-white/[0.08] bg-popover p-1 shadow-lg backdrop-blur-md">
              {organizations.map((org) => (
                <button
                  key={org.organization_id}
                  onClick={() => {
                    setActiveOrganization(org.organization_id)
                    setIsSwitcherOpen(false)
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                    org.organization_id === activeOrganization?.id ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  <span className="truncate">{org.organization.name}</span>
                  {org.organization_id === activeOrganization?.id && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                'group flex items-center rounded-xl py-2 font-medium transition-all duration-150',
                isCollapsed ? 'justify-center px-0' : 'gap-3 px-3 text-[13px]',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-sidebar-accent-foreground' : 'text-sidebar-foreground group-hover:text-foreground'
                )}
              />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
