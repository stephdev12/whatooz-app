'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react'
import { MetaEmbeddedSignupButton } from '@/components/whatsapp/meta-embedded-signup-button'
import { WhatoozLogo } from '@/components/ui/whatooz-logo'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Create profile row
    if (data.user) {
      await supabase.from('profiles').insert({
        user_id: data.user.id,
        full_name: fullName,
        email,
      })
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-noisy-canvas px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <Link href="/">
            <WhatoozLogo size="lg" showText={true} />
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">
            Création de compte Marchand WhatsApp Business
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-card/80 p-8 shadow-xl backdrop-blur-md">
          <h2 className="mb-6 text-xl font-bold text-foreground">
            Inscription
          </h2>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-card-foreground"
              >
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jean Dupont"
                  required
                  className="w-full rounded-lg border border-border bg-input py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[#fe5105] focus:ring-1 focus:ring-[#fe5105]"
                />
              </div>
            </div>

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
                  minLength={6}
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
                  Créer mon compte
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

          {/* Meta 1-Click WhatsApp Registration */}
          <div className="space-y-2">
            <MetaEmbeddedSignupButton
              label="S'inscrire avec Meta WhatsApp"
              redirectAfterSuccess="/dashboard/inbox"
            />
            <p className="text-center text-[11px] text-muted-foreground">
              Inscription instantanée et liaison automatique de votre compte WhatsApp
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link
              href="/login"
              className="font-medium text-[#fe5105] hover:underline"
            >
              Se connecter
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
