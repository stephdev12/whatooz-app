'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, User, Phone, ArrowRight, Loader2, ArrowLeft } from 'lucide-react'
import { MetaEmbeddedSignupButton } from '@/components/whatsapp/meta-embedded-signup-button'
import { WhatoozLogo } from '@/components/ui/whatooz-logo'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'details' | 'otp'>('details')
  const [otpCode, setOtpCode] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSend2FA(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Optional basic validation could go here
    if (!whatsapp.startsWith('+')) {
      setError('Le numéro doit commencer par + (ex: +33...)')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/send-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: whatsapp })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi du code')
      }

      setStep('otp')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyAndRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1. Verify OTP
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: whatsapp, code: otpCode })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Code invalide')
      }

      // 2. SignUp via Supabase
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })

      if (signUpError) {
        throw new Error(signUpError.message)
      }

      // Create profile row and default organization
      if (authData.user) {
        await supabase.from('profiles').insert({
          user_id: authData.user.id,
          full_name: fullName,
          email,
          whatsapp_number: whatsapp, // Sauvegarde du numéro
          platform_role: 'USER'
        })

        const slug = `espace-${fullName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 8)}`
        const { data: orgData } = await supabase.from('organizations').insert({
          name: `Entreprise de ${fullName}`,
          slug
        }).select().single()

        if (orgData) {
          await supabase.from('organization_members').insert({
            organization_id: orgData.id,
            user_id: authData.user.id,
            role: 'OWNER'
          })
        }
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background p-0 lg:p-8">
      
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
      <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 lg:p-12 relative">
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
              Créer un compte
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Inscription pour accéder à la plateforme Whatooz.
            </p>
          </div>

          <form onSubmit={step === 'details' ? handleSend2FA : handleVerifyAndRegister} className="space-y-4">
            
            {step === 'details' ? (
              <>
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

              {/* WhatsApp Number */}
              <div className="space-y-2">
                <label
                  htmlFor="whatsapp"
                  className="text-sm font-medium text-card-foreground"
                >
                  Numéro WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+33612345678"
                    required
                    className="w-full rounded-lg border border-border bg-input py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[#fe5105] focus:ring-1 focus:ring-[#fe5105]"
                  />
                </div>
              </div>
            </>
            ) : (
              <>
                {/* OTP Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="otpCode"
                    className="text-sm font-medium text-card-foreground"
                  >
                    Code de vérification WhatsApp
                  </label>
                  <p className="text-xs text-muted-foreground mb-4">Un code à 4 chiffres a été envoyé à {whatsapp}</p>
                  <div className="relative">
                    <input
                      id="otpCode"
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      required
                      className="w-full rounded-lg border border-border bg-input py-3 px-4 text-center text-xl tracking-[0.5em] font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[#fe5105] focus:ring-1 focus:ring-[#fe5105]"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setStep('details')}
                    className="text-xs text-muted-foreground hover:text-foreground mt-2 block w-full text-center"
                  >
                    Changer de numéro
                  </button>
                </div>
              </>
            )}

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
                  {step === 'details' ? 'Suivant' : 'Créer mon compte'}
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

        <p className="text-center text-xs text-muted-foreground mt-8">
          Par Onlice • whatooz.space
        </p>
      </div>
    </div>
  )
}
