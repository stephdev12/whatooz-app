'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { OrganizationProvider, useOrganization } from '@/hooks/use-organization'
import { PushNotificationsProvider } from '@/components/layout/push-notifications-provider'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { cn } from '@/lib/utils'

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { activeOrganization, loading: orgLoading } = useOrganization()
  const router = useRouter()
  const pathname = usePathname()

  // Full-screen mode for builders (Flow Builder & Automation Builder)
  // We check if the route is a specific flow (e.g. /dashboard/flows/[id]) or automation builder
  const isBuilderRoute = pathname?.includes('/automations/builder/') || (pathname?.includes('/flows/') && pathname !== '/dashboard/flows')

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
    return <OnboardingFlow />
  }

  const isInboxRoute = pathname?.includes('/dashboard/inbox')

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] overflow-hidden bg-noisy-canvas">
      {/* Desktop Sidebar (Floating on background) */}
      {!isBuilderRoute && <Sidebar />}

      {/* Main Content Area (The "Island") */}
      <div className={cn(
        "flex flex-1 flex-col overflow-hidden transition-all duration-300 min-w-0",
        !isBuilderRoute ? "bg-card md:my-3 md:mr-3 md:rounded-[32px] md:border md:border-border md:shadow-sm" : ""
      )}>
        {/* Unified Header */}
        {!isBuilderRoute && <Header />}

        {/* Scrollable Dashboard View */}
        <main className={cn(
           "flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative min-w-0",
           isBuilderRoute ? "p-0" : isInboxRoute ? "p-0 pb-16 lg:pb-0 inbox-main-content" : "p-3 sm:p-5 lg:p-8"
        )}>
          {children}
          {/* Explicit spacer to ensure content scrolls past the mobile bottom nav */}
          {!isBuilderRoute && !isInboxRoute && <div className="h-20 lg:hidden shrink-0 w-full" />}
        </main>

        {/* Mobile Floating Bottom Nav (Single clean mobile navigation) */}
        {!isBuilderRoute && <BottomNav className="mobile-bottom-nav" />}
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
        <PushNotificationsProvider>
          <DashboardShellInner>{children}</DashboardShellInner>
        </PushNotificationsProvider>
      </OrganizationProvider>
    </AuthProvider>
  )
}
