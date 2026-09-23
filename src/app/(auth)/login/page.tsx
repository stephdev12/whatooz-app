'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, ArrowRight, Loader2, ArrowLeft } from 'lucide-react'
import { MetaEmbeddedSignupButton } from '@/components/whatsapp/meta-embedded-signup-button'

import { WhatoozLogo } from '@/components/ui/whatooz-logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      
      {/* Left side: Branding / Marketing (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between rounded-[32px] bg-gradient-to-br from-[#fe5105]/10 via-[#fe5105]/5 to-transparent p-12 relative overflow-hidden">
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <WhatoozLogo size="sm" showText={true} />
        </Link>
        
        <div className="relative z-10 max-w-lg mb-12">
          <p className="text-sm font-medium text-[#fe5105] mb-4">Gérez votre activité facilement</p>
          <h1 className="text-4xl font-display font-bold text-foreground leading-[1.1]">
            Accédez à votre hub personnel pour plus de clarté et de productivité.
          </h1>
        </div>

        {/* Decorative subtle background blur/shapes can go here if needed */}
      </div>

      {/* Right side: Auth Form */}
      <div className="flex flex-1 items-center justify-center p-4 lg:p-12 relative">
        <Link 
          href="/"
          className="absolute top-4 left-4 lg:hidden flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-card px-3 py-1.5 rounded-full border border-border"
        >
          <ArrowLeft className="h-4 w-4" />
          Accueil
        </Link>

        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <WhatoozLogo size="sm" showText={true} />
          </div>

          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              Connectez-vous
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Accédez à vos flux, commandes et clients en un seul endroit.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-card-foreground"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  required
                  className="w-full rounded-lg border border-border bg-input py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[#fe5105] focus:ring-1 focus:ring-[#fe5105]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-card-foreground"
              >
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-border bg-input py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[#fe5105] focus:ring-1 focus:ring-[#fe5105]"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#fe5105] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#e04602] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ou
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Meta 1-Click WhatsApp Onboarding */}
          <div className="space-y-2">
            <MetaEmbeddedSignupButton
              label="Continuer avec Meta WhatsApp"
              redirectAfterSuccess="/dashboard/inbox"
            />
            <p className="text-center text-[11px] text-muted-foreground">
              Connexion instantanée via votre compte professionnel Meta
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <Link
              href="/register"
              className="font-medium text-[#fe5105] hover:underline"
            >
              Créer un compte
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Par Onlice • whatooz.space
        </p>
      </div>
    </div>
  )
}
