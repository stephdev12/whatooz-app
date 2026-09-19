'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2 } from 'lucide-react'

// Extend window interface for FB SDK
declare global {
  interface Window {
    fbAsyncInit?: () => void
    FB?: {
      init: (options: {
        appId: string
        cookie?: boolean
        xfbml?: boolean
        version: string
      }) => void
      login: (
        callback: (response: {
          authResponse?: {
            code?: string
            accessToken?: string
            userID?: string
          }
          status?: string
        }) => void,
        options: {
          config_id: string
          response_type: string
          override_default_response_type: boolean
          extras: {
            featureType: string
            version: string
            sessionInfoVersion: string
          }
        }
      ) => void
    }
  }
}

interface MetaEmbeddedSignupButtonProps {
  label?: string
  variant?: 'primary' | 'secondary' | 'card'
  onSuccess?: () => void
  onError?: (err: string) => void
  redirectAfterSuccess?: string
}

export function MetaEmbeddedSignupButton({
  label = 'Connecter avec Meta WhatsApp',
  variant = 'primary',
  onSuccess,
  onError,
  redirectAfterSuccess,
}: MetaEmbeddedSignupButtonProps) {
  const [loading, setLoading] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const appId =
    process.env.NEXT_PUBLIC_META_APP_ID || '1638932931226462'
  const configId =
    process.env.NEXT_PUBLIC_META_CONFIG_ID || '1092674023546716'

  // Initialize Facebook SDK
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.FB) {
      setSdkReady(true)
      return
    }

    window.fbAsyncInit = function () {
      window.FB?.init({
        appId,
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      })
      setSdkReady(true)
    }

    // Load SDK script if not already present
    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script')
      js.id = 'facebook-jssdk'
      js.src = 'https://connect.facebook.net/fr_FR/sdk.js'
      js.async = true
      js.defer = true
      document.body.appendChild(js)
    }
  }, [appId])

  // Capture Embedded Signup event from Meta popup
  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
      ) {
        return
      }

      try {
        const data =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          // Meta session info payload
          const eventData = data.data || {}
          if (data.event === 'FINISH' || eventData.phone_number_id) {
            console.log('WA_EMBEDDED_SIGNUP success data:', eventData)
          }
        }
      } catch {
        // Not a JSON message or unrelated
      }
    },
    []
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  async function handleBackendSync(code: string, phoneId?: string, wabaId?: string) {
    const siteUrl = window.location.origin
    const redirectUri = `${siteUrl}/api/whatsapp/embedded-signup/callback`

    const res = await fetch('/api/whatsapp/embedded-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        phoneNumberId: phoneId,
        wabaId,
        redirectUri,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Échec de liaison du compte WhatsApp')
    }

    setSuccess(true)
    onSuccess?.()

    if (redirectAfterSuccess) {
      router.push(redirectAfterSuccess)
    }
  }

  function launchEmbeddedSignup() {
    setLoading(true)

    // Check if FB SDK is available
    if (window.FB) {
      try {
        window.FB.login(
          async (response) => {
            if (response.authResponse && response.authResponse.code) {
              try {
                await handleBackendSync(response.authResponse.code)
              } catch (err) {
                const msg = err instanceof Error ? err.message : 'Erreur de connexion'
                onError?.(msg)
                alert(msg)
              } finally {
                setLoading(false)
              }
            } else {
              setLoading(false)
            }
          },
          {
            config_id: configId,
            response_type: 'code',
            override_default_response_type: true,
            extras: {
              featureType: 'whatsapp_business_app_onboarding',
              version: 'v4',
              sessionInfoVersion: '3',
            },
          }
        )
        return
      } catch (err) {
        console.warn('FB.login error, fallback to direct redirect:', err)
      }
    }

    // Fallback: Direct onboard redirect
    const siteUrl = window.location.origin
    const redirectUri = `${siteUrl}/api/whatsapp/embedded-signup/callback`
    const extras = encodeURIComponent(
      JSON.stringify({
        version: 'v4',
        sessionInfoVersion: '3',
        featureType: 'whatsapp_business_app_onboarding',
      })
    )

    const onboardUrl = `https://business.facebook.com/messaging/whatsapp/onboard/?app_id=${appId}&config_id=${configId}&extras=${extras}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`

    window.location.href = onboardUrl
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <span>Compte WhatsApp connecté avec succès !</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={launchEmbeddedSignup}
      disabled={loading}
      className={`group relative flex w-full items-center justify-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
        variant === 'primary'
          ? 'bg-[#1877F2] text-white hover:bg-[#166fe5] shadow-sm hover:shadow-md'
          : variant === 'card'
          ? 'border border-[#1877F2]/30 bg-[#1877F2]/5 hover:bg-[#1877F2]/10 text-foreground'
          : 'border border-border bg-card hover:bg-accent text-foreground'
      }`}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-current" />
      ) : (
        /* Meta/Facebook & WhatsApp SVG Icons */
        <div className="flex items-center gap-1.5">
          <svg className="h-5 w-5 fill-current text-white" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </div>
      )}
      <span>{loading ? 'Connexion en cours...' : label}</span>
    </button>
  )
}
