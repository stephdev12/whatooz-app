/**
 * Administration Platform Configuration & Privileges
 *
 * Le compte stephaneboyce@gmail.com est le Super Administrateur de la plateforme Whatooz.
 * Il ne doit avoir AUCUNE restriction d'abonnements (accès illimité).
 * Seul ce compte a accès à la page d'administration globale (/dashboard/admin).
 */

export const SUPER_ADMIN_EMAIL = 'stephaneboyce@gmail.com'

/**
 * Vérifie si un email correspond au Super Admin de la plateforme.
 */
export function isPlatformAdmin(email?: string | null): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
}
