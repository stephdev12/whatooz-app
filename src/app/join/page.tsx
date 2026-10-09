'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { WhatoozLogo } from '@/components/ui/whatooz-logo'
import { LabelInput } from '@/components/ui/bencho/LabelInput'
import { useAuth } from '@/hooks/use-auth'
import { useOrganization } from '@/hooks/use-organization'
import { ShieldCheck, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

function JoinContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { refreshOrganizations, setActiveOrganization } = useOrganization()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const codeParam = searchParams.get('code')
    if (codeParam) {
      setCode(codeParam.toUpperCase())
    }
  }, [searchParams])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Veuillez entrer un code d\'accès.')
      return
    }

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/join?code=${code}`)}`)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/organization/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_code: code.trim().toUpperCase() }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Impossible de rejoindre l\'organisation.')
      }

      setSuccess(data.message || 'Succès !')
      if (data.organization?.id) {
        await refreshOrganizations()
        setActiveOrganization(data.organization.id)
      }

      setTimeout(() => {
        router.push('/dashboard')
      }, 1200)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background text-foreground">
      <div className="w-full max-w-md space-y-8 p-8 rounded-3xl border border-border bg-card shadow-lg">
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <WhatoozLogo size="md" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fe5105]/10 text-[#fe5105] text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Rejoindre un espace d'entreprise</span>
          </div>
          <h1 className="text-xl font-bold font-heading">
            Entrez votre code d'accès
          </h1>
          <p className="text-xs text-muted-foreground max-w-sm">
            Votre administrateur Whatooz vous a transmis un code d'invitation à 8 caractères pour accéder à l'organisation.
          </p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success} Redirection vers le QG...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleJoin} className="space-y-6">
          <div className="flex justify-center">
            <LabelInput
              field="Code d'accès"
              label="CODE D'ACCÈS"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              corner={16}
              width={320}
              autoComplete="off"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || authLoading || !code.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#fe5105] hover:bg-[#e04500] text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Vérification...</span>
              </>
            ) : (
              <>
                <span>Rejoindre l'organisation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Vous n'avez pas de code ?{' '}
            <Link href="/dashboard" className="text-[#fe5105] font-semibold hover:underline">
              Retour au tableau de bord
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-6 h-6 animate-spin text-[#fe5105]" />
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  )
}
