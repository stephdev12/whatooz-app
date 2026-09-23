'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './use-auth'

export type Organization = {
  id: string
  name: string
  slug: string
}

export type OrganizationMember = {
  organization_id: string
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'AGENT' | 'VIEWER'
  organization: Organization
}

interface OrganizationContextType {
  activeOrganization: Organization | null
  activeRole: string | null
  organizations: OrganizationMember[]
  loading: boolean
  setActiveOrganization: (orgId: string) => void
}

const OrganizationContext = createContext<OrganizationContextType>({
  activeOrganization: null,
  activeRole: null,
  organizations: [],
  loading: true,
  setActiveOrganization: () => {},
})

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<OrganizationMember[]>([])
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!user) {
      setOrganizations([])
      setActiveOrganizationId(null)
      setLoading(false)
      return
    }

    async function fetchOrganizations() {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          role,
          organization:organizations ( id, name, slug )
        `)
        .eq('user_id', user!.id)

      if (data && data.length > 0) {
        const formattedOrgs = data.map(item => ({
          ...item,
          organization: Array.isArray(item.organization) ? item.organization[0] : item.organization
        })) as unknown as OrganizationMember[]

        setOrganizations(formattedOrgs)
        
        // Retrieve last active from localStorage or pick the first one
        const saved = localStorage.getItem('whatooz_active_org')
        if (saved && formattedOrgs.some(o => o.organization_id === saved)) {
          setActiveOrganizationId(saved)
        } else {
          setActiveOrganizationId(formattedOrgs[0].organization_id)
        }
      }
      setLoading(false)
    }

    fetchOrganizations()
  }, [user?.id, supabase])

  const setActiveOrganization = useCallback((orgId: string) => {
    setActiveOrganizationId(orgId)
    localStorage.setItem('whatooz_active_org', orgId)
  }, [])

  const activeMember = organizations.find(o => o.organization_id === activeOrganizationId)

  return (
    <OrganizationContext.Provider
      value={{
        activeOrganization: activeMember?.organization || null,
        activeRole: activeMember?.role || null,
        organizations,
        loading,
        setActiveOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}
