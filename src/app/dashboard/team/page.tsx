'use client'

import React, { useState, useEffect } from 'react'
import { useOrganization } from '@/hooks/use-organization'
import { Plus, Loader2, Trash2, Shield, User as UserIcon, Mail, Lock } from 'lucide-react'

type Member = {
  member_id: string
  user_id: string
  role: string
  joined_at: string
  full_name: string
  email: string
  avatar_url: string | null
}

export default function TeamPage() {
  const { activeOrganization } = useOrganization()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  // Form state
  const [formMethod, setFormMethod] = useState<'invite' | 'manual'>('invite')
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState('AGENT')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (activeOrganization) {
      fetchMembers()
    }
  }, [activeOrganization])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/organization/members', {
        headers: {
          'x-organization-id': activeOrganization!.id
        }
      })
      const data = await res.json()
      if (res.ok) {
        setMembers(data.members || [])
      } else {
        console.error('Failed to fetch members:', data.error)
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
          'x-organization-id': activeOrganization!.id
        },
        body: JSON.stringify({
          fullName: formName,
          email: formEmail,
          password: formMethod === 'manual' ? formPassword : undefined,
          role: formRole,
          method: formMethod
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'ajout')
      
      setIsAddModalOpen(false)
      setFormName('')
      setFormEmail('')
      setFormPassword('')
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
          'x-organization-id': activeOrganization!.id
        },
        body: JSON.stringify({ targetUserId: userId })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      
      await fetchMembers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-black/[0.01] dark:bg-card/[0.01]">
      <div className="max-w-6xl mx-auto p-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Équipe</h1>
            <p className="text-muted-foreground mt-1">Gérez les agents et administrateurs de votre organisation.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-black dark:bg-card text-white dark:text-black px-4 py-2 text-sm font-medium hover:bg-black/90 dark:hover:bg-card/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un membre
          </button>
        </div>

        {/* List */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Aucun membre trouvé.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium border-b border-border">
                <tr>
                  <th className="px-6 py-4">Utilisateur</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4">Ajouté le</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((member) => (
                  <tr key={member.member_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs shrink-0">
                          {member.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{member.full_name}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-foreground">
                        {member.role === 'OWNER' || member.role === 'ADMIN' ? (
                          <Shield className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <UserIcon className="w-3.5 h-3.5" />
                        )}
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteMember(member.user_id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-2"
                        title="Retirer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-1">Nouveau membre</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Ajoutez un agent à {activeOrganization?.name}.
              </p>

              {/* Tabs */}
              <div className="flex p-1 bg-muted rounded-lg mb-6">
                <button
                  type="button"
                  onClick={() => setFormMethod('invite')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                    formMethod === 'invite' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Invitation Email
                </button>
                <button
                  type="button"
                  onClick={() => setFormMethod('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                    formMethod === 'manual' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Mot de passe
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom complet</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Jean Dupont"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Adresse Email</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="jean@example.com"
                  />
                </div>

                {formMethod === 'manual' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mot de passe provisoire</label>
                    <input
                      type="password"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rôle</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="AGENT">Agent (Peut répondre aux messages)</option>
                    <option value="MANAGER">Manager (Peut gérer les flows/templates)</option>
                    <option value="ADMIN">Admin (Accès total)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-black dark:bg-card text-white dark:text-black px-4 py-2 text-sm font-medium hover:bg-black/90 dark:hover:bg-card/90 transition-colors disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {formMethod === 'invite' ? 'Envoyer l\'invitation' : 'Créer le compte'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
