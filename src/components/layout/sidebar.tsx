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
    label: 'Flows',
    href: '/dashboard/flows',
    icon: Layers,
  },
  {
    label: 'Scénarios',
    href: '/dashboard/automations',
    icon: Zap,
  },
  {
    label: 'Modèles',
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
    <aside className="hidden lg:flex w-60 flex-col border-r border-black/[0.06] dark:border-white/[0.08] bg-card/70 backdrop-blur-xl shrink-0 select-none">
      {/* Brand — Logo only, no extra text */}
      <div className="flex h-14 items-center px-5 border-b border-black/[0.04] dark:border-white/[0.06]">
        <Link href="/dashboard" className="flex items-center">
          <WhatoozLogo size="md" showText={false} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#fe5105] text-white shadow-xs'
                  : 'text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
