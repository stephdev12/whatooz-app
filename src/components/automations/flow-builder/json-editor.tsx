import React, { useState, useEffect } from 'react';
import { FlowJsonSerializer } from '@/lib/whatsapp/flows/parser';
import { VisualScreen } from '@/lib/whatsapp/flows/validator';
import { FlowVersion } from '@/lib/whatsapp/flows/registry';
import { Code, Check, AlertTriangle } from 'lucide-react';

interface JsonEditorProps {
  screens: VisualScreen[];
  version: FlowVersion;
  onApplyJson: (screens: VisualScreen[]) => void;
  onClose: () => void;
}

export default function JsonEditor({ screens, version, onApplyJson, onClose }: JsonEditorProps) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // On load, serialize current screens to JSON
    const flowJson = FlowJsonSerializer.serialize(screens, version);
    setJsonText(JSON.stringify(flowJson, null, 2));
  }, [screens, version]);

  const handleApply = () => {
    try {
      setError(null);
      const parsedJson = JSON.parse(jsonText);
      const newScreens = FlowJsonSerializer.deserialize(parsedJson);
      onApplyJson(newScreens);
      onClose();
    } catch (e: any) {
      setError(e.message || 'JSON invalide');
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col p-6">
      <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden max-w-5xl mx-auto w-full">
        
        {/* Header */}
        <div className="h-14 border-b border-slate-700 bg-slate-800 flex items-center justify-between px-6">
          <h2 className="text-white font-medium flex items-center gap-2">
            <Code className="w-5 h-5 text-emerald-500" />
            Éditeur JSON Meta
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-slate-400 hover:text-white px-3 py-1.5 rounded-md hover:bg-slate-700 transition-colors text-sm font-medium">
              Annuler
            </button>
            <button onClick={handleApply} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors">
              <Check className="w-4 h-4" />
              Appliquer au Canvas
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative">
          <textarea
            className="w-full h-full bg-slate-950 text-emerald-400 p-6 font-mono text-sm focus:outline-none resize-none"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Footer / Error */}
        {error && (
          <div className="bg-red-500/10 border-t border-red-500/20 p-3 flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
