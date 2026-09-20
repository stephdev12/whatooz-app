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
  Sparkles,
  ExternalLink,
} from 'lucide-react'

const navItems = [
  {
    label: 'Tableau de bord',
    href: '/dashboard',
    exact: true,
    icon: LayoutDashboard,
  },
  {
    label: 'Discussions',
    href: '/dashboard/inbox',
    icon: MessageSquare,
  },
  {
    label: 'Flows WhatsApp',
    href: '/dashboard/flows',
    icon: Layers,
  },
  {
    label: 'Scénarios & Nœuds',
    href: '/dashboard/automations',
    icon: Zap,
  },
  {
    label: 'Modèles Meta',
    href: '/dashboard/templates',
    icon: FileText,
  },
  {
    label: 'Paramètres',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-black/[0.06] dark:border-white/[0.08] bg-card/70 backdrop-blur-xl shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-black/[0.04] dark:border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center">
          <WhatoozLogo size="md" showText={true} />
        </Link>
      </div>

      {/* Navigation items (Quixotic style pill list) */}
      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
        <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Menu Principal
        </p>

        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150',
                isActive
                  ? 'bg-[#fe5105] text-white shadow-xs font-bold'
                  : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 transition-transform duration-150 group-hover:scale-110 shrink-0',
                  isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer / Meta Status Box */}
      <div className="p-4 border-t border-black/[0.04] dark:border-white/[0.06]">
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-secondary/40 p-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-foreground">WhatsApp Cloud API</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            API Officielle Meta connectée. Webhooks opérationnels.
          </p>
        </div>
      </div>
    </aside>
  )
}
