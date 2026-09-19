'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Layers, Zap, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const bottomNavItems = [
  {
    label: 'Accueil',
    href: '/dashboard',
    exact: true,
    icon: LayoutDashboard,
  },
  {
    label: 'Inbox',
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
    label: 'Réglages',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background/95 backdrop-blur-md px-2 lg:hidden">
      {bottomNavItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors',
              isActive
                ? 'text-[#fe5105]'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className={cn('h-5 w-5', isActive && 'text-[#fe5105]')} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
