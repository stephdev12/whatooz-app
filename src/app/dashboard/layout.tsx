'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
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

  return (
    <div className="flex h-screen overflow-hidden bg-noisy-canvas">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Unified Header */}
        <Header />

        {/* Scrollable Dashboard View */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>

        {/* Mobile Floating Bottom Nav (Single clean mobile navigation) */}
        <BottomNav />
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
      <DashboardShellInner>{children}</DashboardShellInner>
    </AuthProvider>
  )
}
