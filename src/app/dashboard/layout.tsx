'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { OrganizationProvider, useOrganization } from '@/hooks/use-organization'
import { cn } from '@/lib/utils'

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { activeOrganization, loading: orgLoading } = useOrganization()
  const router = useRouter()
  const pathname = usePathname()

  // Full-screen mode for builders (Flow Builder & Automation Builder)
  // We check if the route is a specific flow (e.g. /dashboard/flows/[id]) or automation builder
  const isBuilderRoute = pathname.includes('/automations/builder/') || (pathname.includes('/flows/') && pathname !== '/dashboard/flows')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading || (user && orgLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-noisy-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#fe5105] border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Chargement de votre espace Whatooz...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (!activeOrganization && !orgLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-noisy-canvas p-4 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="text-xl font-semibold">Aucune organisation trouvée</h2>
          <p className="text-muted-foreground">
            Vous n&apos;êtes membre d&apos;aucune organisation. Veuillez contacter votre administrateur ou créer une nouvelle organisation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-noisy-canvas">
      {/* Desktop Sidebar (Floating on background) */}
      {!isBuilderRoute && <Sidebar />}

      {/* Main Content Area (The "Island") */}
      <div className={cn(
        "flex flex-1 flex-col overflow-hidden transition-all duration-300",
        !isBuilderRoute ? "bg-card md:my-3 md:mr-3 md:rounded-[32px] md:border md:border-border md:shadow-sm" : ""
      )}>
        {/* Unified Header */}
        {!isBuilderRoute && <Header />}

        {/* Scrollable Dashboard View */}
        <main className={cn(
           "flex-1 overflow-y-auto overflow-x-hidden",
           isBuilderRoute ? "p-0" : "p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8"
        )}>
          {children}
        </main>

        {/* Mobile Floating Bottom Nav (Single clean mobile navigation) */}
        {!isBuilderRoute && <BottomNav />}
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <DashboardShellInner>{children}</DashboardShellInner>
      </OrganizationProvider>
    </AuthProvider>
  )
}
