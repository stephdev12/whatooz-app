'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useOrganization } from '@/hooks/use-organization'

// Extend window interface for FB SDK
declare global {
  interface Window {
    fbAsyncInit?: () => void
    FB?: {
      init: (options: {
        appId: string
        autoLogAppEvents?: boolean
        cookie?: boolean
        xfbml?: boolean
        version: string
      }) => void
      login: (
        callback: (response: any) => void,
        options: Record<string, any>
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
  const [sdkFailed, setSdkFailed] = useState(false)
  const [success, setSuccess] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const router = useRouter()
  const { activeOrganization } = useOrganization()
  
  // Ref to store session info from postMessage
  const sessionInfoRef = useRef<{ wabaId?: string; phoneNumberId?: string }>({})

  const appId =
    process.env.NEXT_PUBLIC_META_APP_ID || '1638932931226462'
  const configId =
    process.env.NEXT_PUBLIC_META_CONFIG_ID || '1065810779669643'

  // Initialize Facebook SDK
  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.FB) {
      setSdkReady(true)
      console.log('[Whatooz] Facebook SDK already loaded')
      return
    }

    window.fbAsyncInit = function () {
      window.FB?.init({
        appId,
        autoLogAppEvents: true,
        cookie: true,
        xfbml: true,
        version: 'v26.0',
      })
      setSdkReady(true)
      setSdkFailed(false)
      console.log('[Whatooz] Facebook SDK initialized successfully')
    }

    // Load SDK script if not already present
    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script')
      js.id = 'facebook-jssdk'
      js.src = 'https://connect.facebook.net/fr_FR/sdk.js'
      js.async = true
      js.onerror = () => {
        console.error('[Whatooz] Failed to load Facebook SDK script')
        setSdkFailed(true)
      }
      document.body.appendChild(js)
    }

    // Timeout: if SDK doesn't load within 15 seconds, show warning
    const timeout = setTimeout(() => {
      if (!window.FB) {
        console.warn('[Whatooz] Facebook SDK did not load within 15s')
        setSdkFailed(true)
      }
    }, 15000)

    return () => clearTimeout(timeout)
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
          const eventData = data.data || {}
          console.log('[Whatooz] WA_EMBEDDED_SIGNUP event:', data.event, eventData)
          
          if (data.event === 'FINISH') {
            sessionInfoRef.current = {
              wabaId: eventData.waba_id || eventData.whatsapp_business_account_id,
              phoneNumberId: eventData.phone_number_id,
            }
            console.log('[Whatooz] Session info captured:', sessionInfoRef.current)
          } else if (data.event === 'CANCEL') {
            console.warn('[Whatooz] User cancelled the Embedded Signup')
          } else if (data.event === 'ERROR') {
            console.error('[Whatooz] Embedded Signup error event:', eventData)
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
    if (!activeOrganization?.id) {
      throw new Error('Organisation non sélectionnée')
    }

    setStatusMessage('Échange du code d\'autorisation...')

    const res = await fetch('/api/whatsapp/embedded-signup', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-organization-id': activeOrganization.id
      },
      body: JSON.stringify({
        code,
        phoneNumberId: phoneId,
        wabaId,
      }),
    })

    const data = await res.json()
    
    if (!res.ok) {
      console.error('[Whatooz] Backend sync failed:', data)
      throw new Error(data.error || 'Échec de liaison du compte WhatsApp')
    }

    console.log('[Whatooz] Backend sync successful:', data)
    setStatusMessage('WhatsApp connecté ✓')
    setSuccess(true)
    onSuccess?.()

    if (redirectAfterSuccess) {
      router.push(redirectAfterSuccess)
    }
  }

  function launchEmbeddedSignup() {
    if (!window.FB) {
      alert('Le SDK Facebook n\'est pas encore chargé. Vérifiez votre connexion internet et désactivez les bloqueurs de publicités, puis rechargez la page.')
      return
    }

    setLoading(true)
    setStatusMessage('Ouverture de la fenêtre Meta...')

    // Reset session info
    sessionInfoRef.current = {}

    try {
      window.FB.login(
        (response: any) => {
          console.log('[Whatooz] FB.login callback received:', {
            status: response.status,
            hasAuthResponse: !!response.authResponse,
            hasCode: !!response.authResponse?.code,
          })

          if (response.authResponse && response.authResponse.code) {
            setStatusMessage('Synchronisation du compte WhatsApp...')
            const { wabaId, phoneNumberId } = sessionInfoRef.current
            console.log('[Whatooz] Sending to backend:', { hasCode: true, wabaId, phoneNumberId })
            
            handleBackendSync(response.authResponse.code, phoneNumberId, wabaId)
              .then(() => {
                setLoading(false)
              })
              .catch((err) => {
                const msg = err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : 'Erreur de connexion')
                console.error('[Whatooz] Backend sync error:', err)
                setStatusMessage('')
                onError?.(msg)
                alert(`Erreur de synchronisation WhatsApp:\n${msg}`)
                setLoading(false)
              })
          } else {
            console.error('[Whatooz] FB.login failed or cancelled. Full response:', JSON.stringify(response))
            setStatusMessage('')
            alert('La connexion Meta a été annulée ou n\'a pas renvoyé de code d\'autorisation.')
            setLoading(false)
          }
        },
        {
          config_id: configId,
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            featureType: 'whatsapp_business_app_onboarding',
            sessionInfoVersion: '3',
            version: 'v4-public-preview',
          },
        }
      )
    } catch (err) {
      console.error('[Whatooz] FB.login threw error:', err)
      setStatusMessage('')
      setLoading(false)
      alert('Erreur lors de l\'ouverture de la fenêtre Meta. Rechargez la page et réessayez.')
    }
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
    <div className="space-y-2">
      <button
        type="button"
        onClick={launchEmbeddedSignup}
        disabled={loading || (!sdkReady && !sdkFailed)}
        className={`group relative flex w-full items-center justify-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
          variant === 'primary'
            ? 'bg-[#1877F2] text-white hover:bg-[#166fe5] shadow-sm hover:shadow-md'
            : variant === 'card'
            ? 'border border-[#1877F2]/30 bg-[#1877F2]/5 hover:bg-[#1877F2]/10 text-foreground'
            : 'border border-border bg-card hover:bg-accent text-foreground'
        }`}
      >
        {loading || (!sdkReady && !sdkFailed) ? (
          <Loader2 className="h-5 w-5 animate-spin text-current" />
        ) : (
          <div className="flex items-center gap-1.5">
            <svg className="h-5 w-5 fill-current text-white" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
        )}
        <span>
          {!sdkReady && !sdkFailed
            ? 'Chargement du SDK Facebook...'
            : loading
            ? 'Connexion en cours...'
            : label}
        </span>
      </button>

      {sdkFailed && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Le SDK Facebook n'a pas pu se charger. Vérifiez votre connexion internet et désactivez tout bloqueur de publicités, puis rechargez la page.
          </span>
        </div>
      )}

      {statusMessage && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">
          {statusMessage}
        </p>
      )}
    </div>
  )
}
