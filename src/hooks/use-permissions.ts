'use client'

import { useOrganization } from './use-organization'

export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'AGENT' | 'VIEWER'

export function usePermissions() {
  const { activeRole, activeOrganization, loading } = useOrganization()

  const role = (activeRole as Role) || 'VIEWER'

  const isAdmin = role === 'OWNER' || role === 'ADMIN'
  const isManager = isAdmin || role === 'MANAGER'
  const isOperator = isManager || role === 'AGENT'
  const isViewer = role === 'VIEWER'

  return {
    role,
    loading,
    activeOrganization,
    isAdmin,
    isManager,
    isOperator,
    isViewer,

    // Specific capability flags
    canManageTeam: isAdmin,
    canConfigureIntegrations: isAdmin,
    canWithdrawWallet: isAdmin, // Strict rule: only Admin/Owner can withdraw funds
    canEditAgents: isManager,
    canEditCatalog: isManager,
    canSendBroadcasts: isManager,
    canOperateInbox: isOperator,
    canViewAnalytics: true,
  }
}
