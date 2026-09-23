import React from 'react';
import { VisualScreen, VisualComponent, VisualAction } from '@/lib/whatsapp/flows/validator';
import { COMPONENT_PROPERTIES, ComponentType, FlowVersion } from '@/lib/whatsapp/flows/registry';
import { Settings, X, Plus, Trash2 } from 'lucide-react';

interface PropertiesPanelProps {
  version: FlowVersion;
  screen: VisualScreen | null;
  component: VisualComponent | null;
  onUpdateScreen: (updates: Partial<VisualScreen>) => void;
  onUpdateComponent: (updates: Partial<VisualComponent>) => void;
  onClose: () => void;
}

export default function PropertiesPanel({ version, screen, component, onUpdateScreen, onUpdateComponent, onClose }: PropertiesPanelProps) {
  
  if (!screen && !component) {
    return (
      <div className="w-80 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 text-sm">
        Sélectionnez un élément pour éditer ses propriétés
      </div>
    );
  }

  // Editing a component
  if (component) {
    const properties = COMPONENT_PROPERTIES[component.type] || {};

    return (
      <div className="w-80 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-y-auto">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <h3 className="text-slate-800 dark:text-white font-medium flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-500" />
            Propriétés : {component.type}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Default Properties available on mostly all interactable fields */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">ID du composant (Nom de variable)</label>
            <input 
              type="text" 
              value={component.name || ''} 
              onChange={(e) => onUpdateComponent({ name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
              placeholder="ex: user_email"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Texte / Label</label>
            <input 
              type="text" 
              value={component.label || ''} 
              onChange={(e) => onUpdateComponent({ label: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-1.5 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {(component.type === 'TextInput' || component.type === 'Dropdown' || component.type === 'PhotoPicker') && (
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                id="required_cb"
                checked={component.required || false}
                onChange={(e) => onUpdateComponent({ required: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-500 focus:ring-emerald-500/50"
              />
              <label htmlFor="required_cb" className="text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">Champ requis</label>
            </div>
          )}

          {/* Dynamic Properties based on registry */}
          {Object.entries(properties).map(([propKey, schema]) => {
             // Skip ones we already handled above
             if (['name', 'label', 'required', 'data_source'].includes(propKey)) return null;

             if (schema.minVersion > version) return (
                <div key={propKey} className="text-[10px] text-amber-500/70 italic">
                   {propKey} (Requiert v{schema.minVersion}+)
                </div>
             );

             return (
               <div key={propKey} className="space-y-1">
                 <label className="text-xs text-slate-400 capitalize">{propKey.replace('_', ' ')}</label>
                 
                 {schema.type === 'string' && (
                    <input 
                      type="text" 
                      value={((component as any)[propKey] as string) || ''}
                      onChange={(e) => onUpdateComponent({ [propKey]: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                 )}
                 
                 {schema.type === 'number' && (
                    <input 
                      type="number" 
                      value={((component as any)[propKey] as number) || ''}
                      onChange={(e) => onUpdateComponent({ [propKey]: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                 )}
                 
                 {schema.type === 'boolean' && (
                   <div className="flex items-center gap-2 mt-1">
                     <input 
                       type="checkbox"
                       id={`prop_${propKey}`}
                       checked={((component as any)[propKey] as boolean) || false}
                       onChange={(e) => onUpdateComponent({ [propKey]: e.target.checked })}
                       className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                     />
                     <label htmlFor={`prop_${propKey}`} className="text-xs text-slate-400 cursor-pointer">Activer</label>
                   </div>
                 )}

                 {schema.type === 'enum' && (
                    <select 
                      value={((component as any)[propKey] as string) || ''}
                      onChange={(e) => onUpdateComponent({ [propKey]: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    >
                       <option value="">-- Sélectionner --</option>
                       {schema.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                       ))}
                    </select>
                 )}
               </div>
             );
          })}
          
          {/* Data Source Editor for Options */}
          {['Dropdown', 'CheckboxGroup', 'RadioButtons'].includes(component.type) && (
             <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
               <div className="flex items-center justify-between mb-3">
                 <h4 className="text-xs font-semibold text-slate-800 dark:text-white">Options de la liste</h4>
                 <button 
                   onClick={() => {
                     const newOptions = [...(component.options || []), { id: `opt_${Date.now()}`, title: 'Nouvelle option' }];
                     onUpdateComponent({ options: newOptions });
                   }}
                   className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-2 py-1.5 rounded-md transition-colors"
                 >
                   <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter
                 </button>
               </div>
               
               <div className="space-y-3">
                 {!component.options || component.options.length === 0 ? (
                   <div className="text-xs text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center border border-slate-200 dark:border-slate-800/50">Aucune option définie. Ajoutez une option pour commencer.</div>
                 ) : (
                   component.options.map((opt, idx) => (
                     <div key={idx} className="flex gap-2 items-start bg-slate-50 dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200 dark:border-slate-800 relative group transition-all hover:border-slate-300 dark:hover:border-slate-700">
                       <div className="flex-1 space-y-2.5">
                         <div className="space-y-1">
                           <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Identifiant (Valeur)</label>
                           <input 
                             type="text" 
                             placeholder="ex: opt_1"
                             value={opt.id}
                             onChange={(e) => {
                               const newOptions = [...component.options!];
                               newOptions[idx].id = e.target.value;
                               onUpdateComponent({ options: newOptions });
                             }}
                             className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 px-2 py-1.5 rounded-md transition-colors"
                           />
                         </div>
                         <div className="space-y-1">
                           <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Titre affiché</label>
                           <input 
                             type="text" 
                             placeholder="ex: Option 1"
                             value={opt.title}
                             onChange={(e) => {
                               const newOptions = [...component.options!];
                               newOptions[idx].title = e.target.value;
                               onUpdateComponent({ options: newOptions });
                             }}
                             className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/20 px-2 py-1.5 rounded-md transition-colors"
                           />
                         </div>
                         {['RadioButtons', 'CheckboxGroup'].includes(component.type) && (
                           <div className="space-y-1">
                             <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Description (Optionnel)</label>
                             <input 
                               type="text" 
                               placeholder="Description de l'option..."
                               value={opt.description || ''}
                               onChange={(e) => {
                                 const newOptions = [...component.options!];
                                 if (e.target.value) {
                                   newOptions[idx].description = e.target.value;
                                 } else {
                                   delete newOptions[idx].description;
                                 }
                                 onUpdateComponent({ options: newOptions });
                               }}
                               className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 text-xs text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 px-2 py-1.5 rounded-md transition-colors"
                             />
                           </div>
                         )}
                       </div>
                       <button 
                         onClick={() => {
                           const newOptions = component.options!.filter((_, i) => i !== idx);
                           onUpdateComponent({ options: newOptions });
                         }}
                         className="text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 absolute top-2 right-2"
                         title="Supprimer cette option"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                     </div>
                   ))
                 )}
               </div>
             </div>
          )}
        </div>
      </div>
    );
  }

  // Editing a screen
  if (screen) {
    return (
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-y-auto">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-500" />
            Écran : {screen.id}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Titre de l'écran</label>
            <input 
              type="text" 
              value={screen.title} 
              onChange={(e) => onUpdateScreen({ title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="terminal_cb"
              checked={screen.terminal || false}
              onChange={(e) => onUpdateScreen({ terminal: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
            />
            <label htmlFor="terminal_cb" className="text-xs text-slate-400 cursor-pointer">Écran Terminal (Fin du flux)</label>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-sm font-medium text-white mb-2">Composants</h4>
            <div className="space-y-2">
              {screen.components.map(comp => (
                <div key={comp.id} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-xs text-slate-300">{comp.label || comp.type}</span>
                  <button onClick={() => {
                     onUpdateScreen({
                       components: screen.components.filter(c => c.id !== comp.id)
                     });
                  }} className="text-slate-500 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
