import React, { useState, useEffect } from 'react'
import { X, Key, Server, Loader2, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface EndpointSettingsModalProps {
  flowId: string
  isOpen: boolean
  onClose: () => void
}

export default function EndpointSettingsModal({ flowId, isOpen, onClose }: EndpointSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [config, setConfig] = useState<{ active: boolean; publicKey: string | null } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchConfig()
    }
  }, [isOpen, flowId])

  const fetchConfig = async () => {
    setIsLoading(true)
    try {
      const { data: organization } = await createClient().from('organizations').select('id').single()
      if (!organization) return

      const res = await fetch(`/api/whatsapp/flows/${flowId}/endpoint-config`, {
        headers: {
          'x-organization-id': organization.id
        }
      })
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch endpoint config', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const { data: organization } = await createClient().from('organizations').select('id').single()
      if (!organization) return

      const res = await fetch(`/api/whatsapp/flows/${flowId}/endpoint-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': organization.id
        },
        body: JSON.stringify({ action: 'generate' })
      })
      
      if (res.ok) {
        const data = await res.json()
        setConfig({ active: true, publicKey: data.publicKey })
      } else {
        alert('Erreur lors de la génération des clés.')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (config?.publicKey) {
      navigator.clipboard.writeText(config.publicKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-semibold">
            <Server className="w-5 h-5 text-emerald-500" />
            Configuration Endpoint (Dynamic Flow)
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                L'Endpoint permet à ce formulaire de requêter votre serveur Whatooz en temps réel (ex: pour remplir un menu déroulant depuis votre base de données).<br/><br/>
                Meta exige que cette communication soit chiffrée de bout en bout. 
              </div>

              {config?.publicKey ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                    <Check className="w-4 h-4" />
                    Endpoint actif et sécurisé
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Clé Publique (PEM)</label>
                    <div className="relative">
                      <pre className="text-[10px] bg-slate-900 text-slate-300 p-4 rounded-lg overflow-x-auto border border-slate-800">
                        {config.publicKey}
                      </pre>
                      <button 
                        onClick={handleCopy}
                        className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Cette clé a été générée et enregistrée côté serveur.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <Key className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Aucun Endpoint configuré</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Générez une paire de clés RSA pour activer l'Endpoint sécurisé. Whatooz mettra automatiquement à jour l'URL chez Meta.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-emerald-500 text-white hover:bg-emerald-600 h-9 px-4 py-2 mt-2"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                    Générer les clés
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
