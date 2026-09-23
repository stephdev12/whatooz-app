'use client'

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Loader2,
  Settings,
  Smartphone,
  Code,
  Layout,
  Plus,
  Server
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { VisualScreen, VisualComponent, FlowValidator } from '@/lib/whatsapp/flows/validator'
import { FlowVersion, ComponentType, SUPPORTED_VERSIONS } from '@/lib/whatsapp/flows/registry'
import { FlowJsonSerializer } from '@/lib/whatsapp/flows/parser'
import { useOrganization } from '@/hooks/use-organization'

import FlowCanvas from '@/components/automations/flow-builder/canvas'
import PropertiesPanel from '@/components/automations/flow-builder/properties-panel'
import JsonEditor from '@/components/automations/flow-builder/json-editor'
import EndpointSettingsModal from '@/components/automations/flow-builder/endpoint-modal'

export default function FlowBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  // React 19 unwrapping params
  const { id } = use(params)
  const { activeOrganization } = useOrganization()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const [flowName, setFlowName] = useState('Nouveau Flux')
  const [flowStatus, setFlowStatus] = useState('DRAFT')
  const [flowVersion, setFlowVersion] = useState<FlowVersion>('6.0')
  
  // App state
  const [screens, setScreens] = useState<VisualScreen[]>([
    { id: 'MAIN_SCREEN', title: 'Nouvel Écran', terminal: true, components: [] }
  ])
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null)
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  
  const [showJsonEditor, setShowJsonEditor] = useState(false)
  const [showEndpointSettings, setShowEndpointSettings] = useState(false)

  useEffect(() => {
    loadFlow()
  }, [id])

  const loadFlow = async () => {
    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('whatsapp_flows')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      
      setFlowName(data.name)
      setFlowStatus(data.status)
      
      if (data.flow_json && Object.keys(data.flow_json).length > 0) {
         if (data.flow_json.version) {
           setFlowVersion(data.flow_json.version as FlowVersion)
         }
         const loadedScreens = FlowJsonSerializer.deserialize(data.flow_json)
         if (loadedScreens && loadedScreens.length > 0) {
            setScreens(loadedScreens)
         }
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Erreur lors du chargement.')
    } finally {
      setIsLoading(false)
    }
  }

  const saveFlow = async () => {
    // 1. Validation
    const result = FlowValidator.validate(screens, flowVersion)
    if (!result.isValid) {
      setValidationErrors(result.errors)
      return // Bloque la sauvegarde si invalide selon les règles strictes
    }
    
    setValidationErrors([])
    setIsSaving(true)
    
    try {
      if (!activeOrganization) throw new Error("Organisation introuvable.")

      // 2. Serialization to strict Meta JSON
      const flowJson = FlowJsonSerializer.serialize(screens, flowVersion)

      const response = await fetch('/api/whatsapp/flows', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': activeOrganization.id
        },
        body: JSON.stringify({
          flowId: id,
          name: flowName,
          flowJson,
          publish: true
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde avec Meta API.')
      }

      alert("Flux sauvegardé et synchronisé avec Meta avec succès.")
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Erreur lors de la sauvegarde.')
    } finally {
      setIsSaving(false)
    }
  }

  // --- Handlers ---
  const handleAddScreen = () => {
    const newId = `SCREEN_${screens.length + 1}`
    setScreens([...screens, { id: newId, title: 'Nouvel Écran', terminal: false, components: [] }])
    setSelectedScreenId(newId)
    setSelectedComponentId(null)
  }

  const handleAddComponent = (type: ComponentType) => {
    if (!selectedScreenId) {
       alert("Sélectionnez d'abord un écran.")
       return
    }
    
    const newComponent: VisualComponent = {
      id: `comp_${Date.now()}`,
      type,
      label: 'Nouveau Composant',
      name: `field_${Date.now()}`
    }

    setScreens(screens.map(s => {
      if (s.id === selectedScreenId) {
        return { ...s, components: [...s.components, newComponent] }
      }
      return s
    }))
    
    setSelectedComponentId(newComponent.id)
  }

  const handleUpdateScreen = (updates: Partial<VisualScreen>) => {
    if (!selectedScreenId) return
    setScreens(screens.map(s => s.id === selectedScreenId ? { ...s, ...updates } : s))
  }

  const handleUpdateComponent = (updates: Partial<VisualComponent>) => {
    if (!selectedComponentId || !selectedScreenId) return
    setScreens(screens.map(s => {
      if (s.id === selectedScreenId) {
         return {
           ...s,
           components: s.components.map(c => c.id === selectedComponentId ? { ...c, ...updates } : c)
         }
      }
      return s
    }))
  }

  // Find active selections for Properties Panel
  const activeScreen = screens.find(s => s.id === selectedScreenId) || null
  const activeComponent = activeScreen?.components.find(c => c.id === selectedComponentId) || null

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-sm">
      <EndpointSettingsModal 
        flowId={id} 
        isOpen={showEndpointSettings} 
        onClose={() => setShowEndpointSettings(false)} 
      />

      {/* Navbar */}
      <header className="min-h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between px-2 sm:px-4 py-2 sm:py-0 gap-2 flex-shrink-0 z-10 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => router.push('/dashboard/flows')}
            className="p-1 sm:p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="bg-transparent text-sm sm:text-lg font-medium text-slate-800 dark:text-white border-none focus:ring-0 w-32 sm:w-64 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded outline-none"
          />
          
          <span
            className={cn(
              'text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ml-1 sm:ml-2 border',
              flowStatus === 'PUBLISHED'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
            )}
          >
            {flowStatus === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
          </span>
          
          <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 sm:mx-2" />
          
          <select 
             value={flowVersion} 
             onChange={(e) => setFlowVersion(e.target.value as FlowVersion)}
             className="bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 rounded px-1 sm:px-2 py-1 text-[10px] sm:text-xs focus:outline-none focus:border-emerald-500"
          >
             {SUPPORTED_VERSIONS.map(v => (
                <option key={v} value={v}>Meta Version {v}</option>
             ))}
          </select>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <button
            onClick={() => setShowEndpointSettings(true)}
            className="flex items-center gap-1 sm:gap-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 px-2 sm:px-3 py-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors border border-indigo-200 dark:border-indigo-800/30 text-xs sm:text-sm"
          >
            <Server className="w-3 h-3 sm:w-4 sm:h-4" />
            Endpoint
          </button>

          <button
            onClick={() => setShowJsonEditor(true)}
            className="hidden sm:flex items-center gap-2 text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
          >
            <Code className="w-4 h-4" />
            JSON
          </button>

          <button
            onClick={saveFlow}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-md text-xs sm:text-sm font-medium transition-colors bg-emerald-500 text-white hover:bg-emerald-600 h-8 sm:h-9 px-3 sm:px-4 py-1.5 sm:py-2"
          >
            {isSaving ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" /> : <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />}
            Valider
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        
        {/* Component Palette (Left) */}
        <div className="w-full md:w-64 h-48 md:h-full bg-white dark:bg-slate-950 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col z-10 shrink-0">
           <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
             <h3 className="text-slate-800 dark:text-white font-medium flex items-center gap-2">
                <Layout className="w-4 h-4 text-emerald-500" />
                Éléments
             </h3>
           </div>
           <div className="p-4 flex-1 overflow-y-auto space-y-6">
              
              <div>
                 <button 
                    onClick={handleAddScreen}
                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white py-2 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm transition-colors font-medium"
                 >
                    <Plus className="w-4 h-4" /> Nouvel Écran
                 </button>
              </div>

              <div>
                <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Champs de Formulaire</h4>
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => handleAddComponent('TextInput')} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2 rounded-md text-slate-600 dark:text-slate-400 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs text-left transition-colors">Text Input</button>
                   <button onClick={() => handleAddComponent('TextArea')} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2 rounded-md text-slate-600 dark:text-slate-400 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs text-left transition-colors">Text Area</button>
                   <button onClick={() => handleAddComponent('Dropdown')} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2 rounded-md text-slate-600 dark:text-slate-400 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs text-left transition-colors">Dropdown</button>
                   <button onClick={() => handleAddComponent('CheckboxGroup')} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2 rounded-md text-slate-600 dark:text-slate-400 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs text-left transition-colors">Checkbox</button>
                   <button onClick={() => handleAddComponent('RadioButtons')} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2 rounded-md text-slate-600 dark:text-slate-400 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs text-left transition-colors">Radio</button>
                   <button onClick={() => handleAddComponent('DatePicker')} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2 rounded-md text-slate-600 dark:text-slate-400 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs text-left transition-colors">Date Picker</button>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Média & Layout</h4>
                <div className="grid grid-cols-2 gap-2">
                   <button onClick={() => handleAddComponent('TextHeading')} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2 rounded-md text-slate-600 dark:text-slate-400 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs text-left transition-colors">Heading</button>
                   <button onClick={() => handleAddComponent('TextBody')} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2 rounded-md text-slate-600 dark:text-slate-400 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs text-left transition-colors">Text Body</button>
                   <button onClick={() => handleAddComponent('PhotoPicker')} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2 rounded-md text-slate-600 dark:text-slate-400 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs text-left transition-colors">Photo Picker</button>
                   <button onClick={() => handleAddComponent('DocumentPicker')} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-2 rounded-md text-slate-600 dark:text-slate-400 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs text-left transition-colors">Doc Picker</button>
                </div>
              </div>
              
              <div>
                <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Actions</h4>
                <div className="grid grid-cols-1 gap-2">
                   <button onClick={() => handleAddComponent('Footer')} className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-500/30 p-2 rounded-md text-emerald-600 dark:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs text-left flex items-center gap-2 transition-colors">
                      <Settings className="w-3.5 h-3.5" /> Footer Button
                   </button>
                </div>
              </div>
           </div>
        </div>

        {/* Canvas Area (Center) */}
        <div className="flex-1 relative bg-slate-50 dark:bg-slate-950 h-full">
           
           {/* Validation Errors Overlay */}
           {validationErrors.length > 0 && (
             <div className="absolute top-4 left-4 right-4 z-20 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg shadow-lg">
               <h4 className="font-medium mb-2">Erreurs de validation (Meta Strict Mode) :</h4>
               <ul className="list-disc pl-5 space-y-1 text-xs">
                 {validationErrors.map((err, idx) => (
                   <li key={idx}>{err}</li>
                 ))}
               </ul>
             </div>
           )}

           <FlowCanvas 
              screens={screens} 
              onScreensChange={setScreens}
              selectedScreenId={selectedScreenId}
              onSelectScreen={(id) => { setSelectedScreenId(id); setSelectedComponentId(null); }}
              selectedComponentId={selectedComponentId}
              onSelectComponent={(id) => {
                 setSelectedComponentId(id);
                 // If user clicks a component in a screen, we select that screen too
                 const screen = screens.find(s => s.components.some(c => c.id === id));
                 if (screen) setSelectedScreenId(screen.id);
              }}
           />
        </div>


        {/* Properties Panel (Right) */}
        <div className="z-10">
          <PropertiesPanel 
             version={flowVersion}
             screen={activeComponent ? null : activeScreen}
             component={activeComponent}
             onUpdateScreen={handleUpdateScreen}
             onUpdateComponent={handleUpdateComponent}
             onClose={() => { setSelectedScreenId(null); setSelectedComponentId(null); }}
          />
        </div>
        
      </div>

      {showJsonEditor && (
         <JsonEditor 
            screens={screens}
            version={flowVersion}
            onApplyJson={setScreens}
            onClose={() => setShowJsonEditor(false)}
         />
      )}
    </div>
  )
}
