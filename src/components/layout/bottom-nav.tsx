'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  Layers,
  Zap,
  Settings,
  FileText,
} from 'lucide-react'
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
    label: 'Modèles',
    href: '/dashboard/templates',
    icon: FileText,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-3 inset-x-0 z-40 flex justify-center px-4 pointer-events-none lg:hidden">
      <nav className="pointer-events-auto flex items-center justify-around gap-1 w-full max-w-sm rounded-full border border-black/10 dark:border-white/10 bg-card/90 backdrop-blur-xl shadow-2xl p-1.5">
        {bottomNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex flex-1 flex-col items-center justify-center py-1.5 px-2 rounded-full text-[10px] font-semibold transition-all duration-300 active:scale-90',
                isActive
                  ? 'bg-[#fe5105] text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn(
                'h-4 w-4 transition-all duration-300 ease-out group-active:-translate-y-1.5 group-active:scale-110', 
                isActive ? 'text-white' : 'text-muted-foreground'
              )} />
              <span className="mt-0.5 leading-tight">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
