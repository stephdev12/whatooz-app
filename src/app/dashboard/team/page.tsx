'use client'

import React, { useState, useEffect } from 'react'
import { useOrganization } from '@/hooks/use-organization'
import { usePermissions } from '@/hooks/use-permissions'
import {
  Plus,
  Loader2,
  Trash2,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Mail,
  Copy,
  Check,
  RefreshCw,
  Link as LinkIcon,
  HelpCircle,
  Eye,
  Key,
  MessageSquare,
  Sparkles,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Member = {
  member_id: string
  user_id: string
  role: string
  joined_at: string
  full_name: string
  email: string
  avatar_url: string | null
}

const ROLES_INFO = [
  {
    role: 'ADMIN',
    title: 'Administrateur',
    color: 'text-red-500 bg-red-500/10 border-red-500/20',
    description: 'Contrôle complet de l’espace',
    canDo: [
      'Gérer les clés d\'API WhatsApp et intégrations',
      'Effectuer des retraits financiers du portefeuille',
      'Inviter, promouvoir et supprimer des membres',
      'Configurer et activer les agents IA et scénarios',
    ],
    cannotDo: [],
  },
  {
    role: 'MANAGER',
    title: 'Manager Opérations',
    color: 'text-[#fe5105] bg-[#fe5105]/10 border-[#fe5105]/20',
    description: 'Gestion du commerce, des agents et campagnes',
    canDo: [
      'Créer et modifier les agents IA et prompts',
      'Gérer le catalogue produits et les prix',
      'Programmer des diffusions de messages WhatsApp',
      'Traiter les commandes et consulter l’inbox',
    ],
    cannotDo: [
      'Retirer des fonds du portefeuille financier',
      'Modifier les clés WhatsApp ou supprimer l\'entreprise',
    ],
  },
  {
    role: 'AGENT',
    title: 'Opérateur Inbox',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    description: 'Traitement des conversations WhatsApp',
    canDo: [
      'Répondre aux messages dans l’Inbox WhatsApp',
      'Assigner des conversations et ajouter des contacts',
      'Prendre le relais sur l’IA en cas de réclamation',
    ],
    cannotDo: [
      'Modifier les scénarios et règles de l’IA',
      'Modifier les prix du catalogue ou voir les soldes financiers',
    ],
  },
  {
    role: 'VIEWER',
    title: 'Lecteur / Observateur',
    color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
    description: 'Consultation seule sans modification',
    canDo: [
      'Consulter les statistiques et rapports',
      'Visualiser l\'historique des conversations et commandes',
    ],
    cannotDo: [
      'Envoyer des messages WhatsApp ou modifier des données',
    ],
  },
]

export default function TeamPage() {
  const { activeOrganization } = useOrganization()
  const { isAdmin } = usePermissions()

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [accessCode, setAccessCode] = useState<string>('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [showRoleMatrix, setShowRoleMatrix] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState('AGENT')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (activeOrganization) {
      fetchMembers()
      fetchAccessCode()
    }
  }, [activeOrganization])

  const fetchAccessCode = async () => {
    try {
      const res = await fetch('/api/organization/access-code', {
        headers: { 'x-organization-id': activeOrganization!.id },
      })
      const data = await res.json()
      if (res.ok && data.access_code) {
        setAccessCode(data.access_code)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRegenerateCode = async () => {
    if (!confirm('Régénérer le code d\'accès ? Les personnes utilisant l\'ancien code ne pourront plus rejoindre.')) return
    setCodeLoading(true)
    try {
      const res = await fetch('/api/organization/access-code', {
        method: 'POST',
        headers: { 'x-organization-id': activeOrganization!.id },
      })
      const data = await res.json()
      if (res.ok && data.access_code) {
        setAccessCode(data.access_code)
      }
    } catch (err) {
      alert('Erreur lors de la régénération du code.')
    } finally {
      setCodeLoading(false)
    }
  }

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/organization/members', {
        headers: { 'x-organization-id': activeOrganization!.id },
      })
      const data = await res.json()
      if (res.ok) {
        setMembers(data.members || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/organization/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization!.id,
        },
        body: JSON.stringify({
          fullName: formName,
          email: formEmail,
          role: formRole,
          method: 'invite',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'invitation")

      setIsAddModalOpen(false)
      setFormName('')
      setFormEmail('')
      await fetchMembers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMember = async (userId: string) => {
    if (!confirm('Voulez-vous vraiment retirer ce membre de l\'organisation ?')) return

    try {
      const res = await fetch('/api/organization/members', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization!.id,
        },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        await fetchMembers()
      } else {
        const d = await res.json()
        alert(d.error || 'Erreur lors de la suppression')
      }
    } catch {
      alert('Erreur réseau')
    }
  }

  const copyCode = () => {
    if (!accessCode) return
    navigator.clipboard.writeText(accessCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const copyInviteLink = () => {
    if (!accessCode) return
    const url = `${window.location.origin}/join?code=${accessCode}`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Équipe & Gouvernance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez les collaborateurs, codes d'invitation et permissions d'accès à{' '}
            <span className="font-medium text-foreground">{activeOrganization?.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRoleMatrix(!showRoleMatrix)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-[#fe5105]" />
            <span>Matrice des Rôles</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fe5105] hover:bg-[#e04500] text-white text-xs font-semibold transition-all shadow-xs active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Inviter un membre</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Access Code & Instant Join Card ─── */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <Key className="w-3.5 h-3.5" />
              <span>Accès direct & Sécurisé</span>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Code d'accès de votre organisation
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Transmettez ce code unique à 8 caractères à vos collaborateurs. Ils pourront rejoindre instantanément votre espace de travail via la page de connexion ou le lien direct.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* The Code Badge */}
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-2xl bg-muted/60 border border-border font-mono text-base font-bold tracking-widest text-foreground">
              <span>{accessCode || 'CHARGEMENT'}</span>
              <button
                onClick={copyCode}
                title="Copier le code"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={copyInviteLink}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <LinkIcon className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Lien copié !' : 'Copier le lien d’accès'}</span>
              </button>

              {isAdmin && (
                <button
                  onClick={handleRegenerateCode}
                  disabled={codeLoading}
                  title="Régénérer le code"
                  className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn('w-4 h-4', codeLoading && 'animate-spin text-[#fe5105]')} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Role Permissions Matrix (Collapsible or Shown) ─── */}
      {showRoleMatrix && (
        <div className="rounded-3xl border border-border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Gouvernance et droits dans l'organisation
              </h3>
              <p className="text-xs text-muted-foreground">
                Ce que chaque rôle peut voir, exécuter et modifier.
              </p>
            </div>
            <button
              onClick={() => setShowRoleMatrix(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Fermer
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES_INFO.map((info) => (
              <div
                key={info.role}
                className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full border', info.color)}>
                      {info.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {info.description}
                  </p>

                  <div className="pt-2 border-t border-border/40 space-y-1.5">
                    <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">Autorisé :</p>
                    {info.canDo.map((item, i) => (
                      <p key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{item}</span>
                      </p>
                    ))}
                  </div>

                  {info.cannotDo.length > 0 && (
                    <div className="pt-2 border-t border-border/40 space-y-1.5">
                      <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">Restreint :</p>
                      {info.cannotDo.map((item, i) => (
                        <p key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                          <span className="text-red-500 font-bold">✕</span>
                          <span>{item}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Members List ─── */}
      <div className="rounded-3xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-muted/20">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Membres actifs ({members.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Personnes ayant accès aux outils et conversations de cette organisation.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#fe5105]" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-xs">
            Aucun membre trouvé.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {members.map((member) => {
              const roleMeta = ROLES_INFO.find((r) => r.role === member.role) || ROLES_INFO[2]

              return (
                <div
                  key={member.member_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#fe5105]/10 text-[#fe5105] flex items-center justify-center font-bold text-sm shrink-0">
                      {member.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-foreground">{member.full_name || 'Collaborateur'}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span
                      className={cn(
                        'text-xs font-semibold px-2.5 py-1 rounded-full border',
                        roleMeta.color
                      )}
                    >
                      {roleMeta.title}
                    </span>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteMember(member.user_id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Retirer le membre"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Modal : Inviter un membre ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-foreground font-heading">
                Inviter un collaborateur
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Envoyez une invitation par e-mail avec un rôle attribué.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Nom complet</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex : Moussa Diop"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:border-[#fe5105]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Adresse e-mail</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="moussa@entreprise.com"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:border-[#fe5105]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Rôle attribué</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-hidden focus:border-[#fe5105]"
                >
                  <option value="AGENT">Opérateur Inbox (Recommandé)</option>
                  <option value="MANAGER">Manager Opérations</option>
                  <option value="VIEWER">Lecteur (Lecture seule)</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-medium text-foreground transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fe5105] hover:bg-[#e04500] text-white text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Envoyer l'invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
