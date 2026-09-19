'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Layers,
  Zap,
  Settings,
  X,
} from 'lucide-react'

const navItems = [
  {
    label: 'Tableau de bord',
    href: '/dashboard',
    exact: true,
    icon: LayoutDashboard,
  },
  {
    label: 'Messagerie (Inbox)',
    href: '/dashboard/inbox',
    icon: MessageSquare,
  },
  {
    label: 'WhatsApp Flows',
    href: '/dashboard/flows',
    icon: Layers,
  },
  {
    label: 'Automatisations',
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

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/dashboard/inbox" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fe5105]">
              <span className="text-sm font-bold text-white">W</span>
            </div>
            <span className="text-lg font-bold text-foreground">
              <span className="text-[#fe5105]">What</span>ooz
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className={cn('h-4 w-4', isActive && 'text-[#fe5105]')} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Whatooz • par Onlice
          </p>
        </div>
      </aside>
    </>
  )
}
