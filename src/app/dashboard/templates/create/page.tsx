'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { WhatoozTemplate, ValidationResult } from '@/lib/templates/types'
import { useOrganization } from '@/hooks/use-organization'
import { TemplateBuilder } from '@/components/templates/template-builder'
import { TemplatePreview } from '@/components/templates/template-preview'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Send, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { TEMPLATE_TYPE_REGISTRY } from '@/lib/templates/registry'
import { TemplateTypeSelection } from '@/components/templates/template-type-selection'

function CreateTemplateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeOrganization } = useOrganization()
  
  const [template, setTemplate] = useState<WhatoozTemplate | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const editId = searchParams.get('edit')
  const duplicateId = searchParams.get('duplicate')

  useEffect(() => {
    async function loadTemplate() {
      const idToLoad = editId || duplicateId
      if (!idToLoad) {
        // Init empty
        setTemplate({
          id: '',
          organization_id: activeOrganization?.id || '',
          name: '',
          category: 'MARKETING', // Default, will be updated by selection
          type: undefined, // Force selection
          language: 'fr',
          status: 'DRAFT',
          header: { type: 'NONE' },
          body: { text: '', parameterFormat: 'POSITIONAL', variables: [] },
          buttons: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as unknown as WhatoozTemplate)
        return
      }

      try {
        const res = await fetch(`/api/templates/${idToLoad}`)
        if (!res.ok) throw new Error('Template introuvable')
        const data = await res.json()
        
        if (duplicateId) {
          // Reset ID and append _copy
          setTemplate({
            ...data.definition_json,
            id: '',
            name: `${data.name}_copy`,
            status: 'DRAFT'
          })
        } else {
          setTemplate(data.definition_json)
        }
      } catch (err) {
        console.error(err)
        alert("Erreur lors du chargement du template")
        router.push('/dashboard/templates')
      }
    }
    
    if (activeOrganization) {
      loadTemplate()
    }
  }, [editId, duplicateId, activeOrganization, router])

  const handleValidate = async (data: WhatoozTemplate) => {
    try {
      const res = await fetch(`/api/templates/${data.id || 'new'}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result: ValidationResult = await res.json()
      setValidation(result)
      return result
    } catch (err) {
      console.error(err)
      return null
    }
  }

  const handleSave = async (submitToMeta = false) => {
    if (!template) return
    if (!activeOrganization) {
      alert("Aucune organisation active")
      return
    }

    const tpl = { ...template, organization_id: activeOrganization.id }

    // Always validate first
    const valResult = await handleValidate(tpl)
    if (submitToMeta && valResult && !valResult.valid) {
      alert("Le template contient des erreurs, veuillez les corriger avant de le soumettre à Meta.")
      return
    }

    try {
      if (submitToMeta) setIsSubmitting(true)
      else setIsSaving(true)

      let res
      if (!tpl.id) {
        // CREATE
        res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tpl)
        })
      } else {
        // UPDATE
        res = await fetch(`/api/templates/${tpl.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tpl)
        })
      }

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Erreur lors de la sauvegarde')
      }

      const savedRecord = await res.json()
      setTemplate(savedRecord.definition_json)

      if (submitToMeta) {
        // SUBMIT
        const submitRes = await fetch(`/api/templates/${savedRecord.id}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        if (!submitRes.ok) {
          const submitErr = await submitRes.json()
          throw new Error(submitErr.error || 'Erreur lors de la soumission Meta')
        }
        alert("Template soumis à Meta avec succès !")
        router.push('/dashboard/templates')
      } else {
         // Replace URL with edit ID if it was a create
         if (!tpl.id) {
            router.replace(`/dashboard/templates/create?edit=${savedRecord.id}`)
         }
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message)
    } finally {
      setIsSaving(false)
      setIsSubmitting(false)
    }
  }

  const handleTemplateChange = (updatedTemplate: WhatoozTemplate) => {
    setTemplate(updatedTemplate)
    // Optional: Debounce validation here
  }

  // Convert validation array to object for field-level errors
  const errorMap = (validation?.errors || []).reduce((acc, curr) => {
    if (curr.path) {
      acc[curr.path] = curr.message
    }
    return acc
  }, {} as Record<string, string>)

  if (!template) {
    return <div className="p-8">Chargement du studio...</div>
  }

  if (!template.type) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto h-[calc(100vh-6rem)] relative">
        <div className="flex items-center gap-4 mt-6 px-4">
          <Link href="/dashboard/templates">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Nouveau Template</h1>
          </div>
        </div>
        <TemplateTypeSelection 
          onSelect={(type) => {
            setTemplate({
              ...template,
              type,
              category: TEMPLATE_TYPE_REGISTRY[type].allowedCategories[0]
            })
          }} 
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto h-[calc(100vh-6rem)] relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/templates">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Studio de Templates</h1>
            <p className="text-sm text-muted-foreground mt-1">Concevez et soumettez vos modèles Meta.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving || isSubmitting}>
            {isSaving ? "Sauvegarde..." : "Sauvegarder brouillon"}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isSaving || isSubmitting || template.status !== 'DRAFT'} className="gap-2">
            <Send className="h-4 w-4" />
            {isSubmitting ? "Soumission..." : "Soumettre à Meta"}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-y-auto lg:overflow-hidden">
        
        {/* Left: Builder */}
        <div className="lg:col-span-8 lg:overflow-y-auto pr-2 pb-12 rounded-xl">
           
           {validation && validation.warnings && validation.warnings.length > 0 && (
             <div className="mb-6 space-y-2">
               {validation.warnings.map((w, i) => (
                 <Alert key={i} variant="default" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Avertissement : {w.path}</AlertTitle>
                    <AlertDescription>{w.message}</AlertDescription>
                 </Alert>
               ))}
             </div>
           )}

           <TemplateBuilder 
             initialData={template} 
             onChange={handleTemplateChange}
             errors={errorMap}
           />
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-4 lg:h-full flex flex-col pt-4 pb-12 lg:pb-0">
           <div className="lg:sticky top-0 w-full h-full pb-12 flex justify-center">
             <TemplatePreview template={template} />
           </div>
        </div>

      </div>
    </div>
  )
}

export default function CreateTemplatePage() {
  return (
    <Suspense fallback={<div className="p-8">Chargement...</div>}>
      <CreateTemplateContent />
    </Suspense>
  )
}
