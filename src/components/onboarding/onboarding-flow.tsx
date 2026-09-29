'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Building2, KeyRound, ArrowRight, CheckCircle2, Loader2, LogOut } from 'lucide-react'
import { useOrganization } from '@/hooks/use-organization'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

export function OnboardingFlow() {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
  const [orgName, setOrgName] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const supabase = createClientComponentClient()
  const { setActiveOrganization, refreshOrganizations } = useOrganization()
  const { signOut } = useAuth()
  const router = useRouter()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim()) return
    setLoading(true)
    setError('')

    try {
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000)
      
      const { data, error: insertError } = await supabase
        .from('organizations')
        .insert({ name: orgName, slug })
        .select()
        .single()
        
      if (insertError) throw insertError

      await refreshOrganizations()
      // Active org is automatically set by the hook if it's the first one
      window.location.reload() // Force reload to re-mount dashboard
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessCode.trim()) return
    setLoading(true)
    setError('')

    try {
      const { data, error: rpcError } = await supabase
        .rpc('join_organization_by_code', { p_access_code: accessCode.trim().toUpperCase() })

      if (rpcError) throw rpcError

      await refreshOrganizations()
      window.location.reload() // Force reload
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Code invalide ou erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-3xl border border-border shadow-xl">
        
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-heading">Bienvenue sur Whatooz</h2>
          <p className="text-muted-foreground mt-2">
            Pour commencer, vous devez créer un espace de travail ou en rejoindre un existant.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        {mode === 'select' && (
          <div className="space-y-4 pt-4">
            <button 
              onClick={() => setMode('create')}
              className="w-full flex items-center p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors text-left group"
            >
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0 mr-4">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Créer une organisation</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Je suis l'administrateur et je veux créer un nouvel espace.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            <button 
              onClick={() => setMode('join')}
              className="w-full flex items-center p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors text-left group"
            >
              <div className="w-10 h-10 bg-secondary text-secondary-foreground rounded-lg flex items-center justify-center shrink-0 mr-4">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Rejoindre une équipe</h3>
                <p className="text-xs text-muted-foreground mt-0.5">J'ai un code d'accès fourni par mon équipe.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            <div className="pt-6 text-center">
              <button onClick={() => signOut()} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center">
                <LogOut className="w-4 h-4 mr-2" /> Déconnexion
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom de l'organisation</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Ex: Mon Entreprise SA"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button 
                type="button" 
                onClick={() => setMode('select')}
                className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-muted transition-colors font-medium"
              >
                Retour
              </button>
              <button 
                type="submit"
                disabled={loading || !orgName.trim()}
                className="flex-[2] py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Créer mon espace'}
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Code d'accès</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none uppercase font-mono tracking-widest text-center text-lg"
                placeholder="ABCDEF12"
                value={accessCode}
                onChange={e => setAccessCode(e.target.value)}
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button 
                type="button" 
                onClick={() => setMode('select')}
                className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-muted transition-colors font-medium"
              >
                Retour
              </button>
              <button 
                type="submit"
                disabled={loading || !accessCode.trim()}
                className="flex-[2] py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Rejoindre'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
